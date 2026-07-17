// lib/stock.ts
// Service de gestion des mouvements de stock : chaque variation de stock passe
// par ici pour être tracée (StockMovement) et appliquée de façon atomique.

import prisma from '@/lib/prisma';
import { Prisma, type StockMovementType, type StockMovement } from '@prisma/client';

export interface RecordMovementParams {
  productId: string;
  type: StockMovementType;
  quantity: number; // valeur signée : positive = entrée, négative = sortie
  variantId?: string | null;
  reason?: string | null;
  reference?: string | null;
  unitCost?: number | null;
  userId?: string | null;
  /** Exécuter dans une transaction existante (sinon une transaction est créée). */
  tx?: Prisma.TransactionClient;
}

async function apply(client: Prisma.TransactionClient, params: RecordMovementParams): Promise<StockMovement> {
  // Applique le delta de façon atomique et récupère le stock résultant.
  const updated = await client.product.update({
    where: { id: params.productId },
    data: { stock: { increment: params.quantity } },
    select: { stock: true },
  });
  const stockAfter = updated.stock;
  const stockBefore = stockAfter - params.quantity;

  return client.stockMovement.create({
    data: {
      productId: params.productId,
      variantId: params.variantId ?? null,
      type: params.type,
      quantity: params.quantity,
      stockBefore,
      stockAfter,
      reason: params.reason ?? null,
      reference: params.reference ?? null,
      unitCost: params.unitCost ?? null,
      userId: params.userId ?? null,
    },
  });
}

/**
 * Enregistre un mouvement de stock (delta signé) et met à jour le stock produit.
 * Si `tx` est fourni, s'exécute dans cette transaction ; sinon en crée une.
 */
export async function recordStockMovement(params: RecordMovementParams): Promise<StockMovement> {
  if (params.tx) return apply(params.tx, params);
  return prisma.$transaction((tx) => apply(tx, params));
}

/**
 * Fixe le stock à une valeur absolue (comptage d'inventaire) et trace l'écart.
 */
export async function setInventoryLevel(params: {
  productId: string;
  countedStock: number;
  reason?: string | null;
  userId?: string | null;
}): Promise<StockMovement> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.product.findUnique({
      where: { id: params.productId },
      select: { stock: true },
    });
    if (!current) throw new Error('Produit introuvable.');
    const before = current.stock;
    const delta = params.countedStock - before;

    await tx.product.update({
      where: { id: params.productId },
      data: { stock: params.countedStock },
    });

    return tx.stockMovement.create({
      data: {
        productId: params.productId,
        type: 'INVENTORY',
        quantity: delta,
        stockBefore: before,
        stockAfter: params.countedStock,
        reason: params.reason ?? "Comptage d'inventaire",
        userId: params.userId ?? null,
      },
    });
  });
}

/**
 * Sortie de stock pour une commande en ligne DÉJÀ PAYÉE : on ne peut pas refuser
 * la vente, donc on écrête au stock disponible et on trace l'écart éventuel.
 * Idempotence : ne refait rien si des mouvements OUT existent déjà pour cette commande.
 */
export async function recordOrderStockOut(
  tx: Prisma.TransactionClient,
  params: { orderId: string; items: { productId: string; quantity: number }[]; userId?: string | null },
): Promise<void> {
  const reference = `ORDER-${params.orderId}`;
  const already = await tx.stockMovement.count({ where: { reference, type: 'OUT' } });
  if (already > 0) return; // déjà traité (callback rejoué, double appel)

  for (const item of params.items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      select: { stock: true },
    });
    if (!product) continue;

    const removed = Math.min(Math.max(product.stock, 0), item.quantity);
    const shortfall = item.quantity - removed;

    await tx.product.update({
      where: { id: item.productId },
      data: {
        ...(removed > 0 ? { stock: { decrement: removed } } : {}),
        soldCount: { increment: item.quantity },
      },
    });

    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        type: 'OUT',
        quantity: -removed,
        stockBefore: product.stock,
        stockAfter: product.stock - removed,
        reason: shortfall > 0 ? `Vente en ligne (stock insuffisant, écart ${shortfall})` : 'Vente en ligne',
        reference,
        userId: params.userId ?? null,
      },
    });
  }
}

/**
 * Re-crédite le stock d'une commande dont le paiement, d'abord considéré réussi,
 * est finalement refusé. Se base sur les mouvements OUT réellement enregistrés.
 */
export async function restockOrder(
  tx: Prisma.TransactionClient,
  params: { orderId: string; userId?: string | null },
): Promise<void> {
  const reference = `ORDER-${params.orderId}`;
  const outs = await tx.stockMovement.findMany({ where: { reference, type: 'OUT' } });
  if (outs.length === 0) return;
  const alreadyRestocked = await tx.stockMovement.count({ where: { reference, type: 'IN' } });
  if (alreadyRestocked > 0) return;

  for (const out of outs) {
    const qty = Math.abs(out.quantity);
    if (qty === 0) continue;
    const updated = await tx.product.update({
      where: { id: out.productId },
      data: { stock: { increment: qty }, soldCount: { decrement: qty } },
      select: { stock: true },
    });
    await tx.stockMovement.create({
      data: {
        productId: out.productId,
        type: 'IN',
        quantity: qty,
        stockBefore: updated.stock - qty,
        stockAfter: updated.stock,
        reason: 'Annulation paiement (re-crédit)',
        reference,
        userId: params.userId ?? null,
      },
    });
  }
}

/**
 * Décrémente le stock pour une vente (sortie) en refusant de passer sous zéro,
 * puis trace le mouvement. Renvoie null si le stock est insuffisant.
 * À utiliser dans une transaction de vente.
 */
export async function recordSaleOut(
  tx: Prisma.TransactionClient,
  params: { productId: string; quantity: number; reference?: string | null; userId?: string | null; unitCost?: number | null },
): Promise<StockMovement | null> {
  const res = await tx.product.updateMany({
    where: { id: params.productId, stock: { gte: params.quantity } },
    data: { stock: { decrement: params.quantity } },
  });
  if (res.count === 0) return null; // stock insuffisant

  const product = await tx.product.findUnique({ where: { id: params.productId }, select: { stock: true } });
  const stockAfter = product?.stock ?? 0;

  return tx.stockMovement.create({
    data: {
      productId: params.productId,
      type: 'OUT',
      quantity: -Math.abs(params.quantity),
      stockBefore: stockAfter + params.quantity,
      stockAfter,
      reason: 'Vente',
      reference: params.reference ?? null,
      unitCost: params.unitCost ?? null,
      userId: params.userId ?? null,
    },
  });
}
