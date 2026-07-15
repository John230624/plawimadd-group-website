import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * Erreur métier pour l'encaissement d'une tranche. Le `status` sert de code HTTP
 * quand elle est renvoyée depuis une route API.
 */
export class InstallmentError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'InstallmentError';
    this.status = status;
  }
}

export interface RecordPaymentInput {
  orderId: string;
  amount: number;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
  recordedById?: string | null;
}

export interface RecordPaymentResult {
  paymentId: string;
  totalAmount: number;
  totalPaid: number;
  remaining: number;
  isFullyPaid: boolean;
}

// Tolérance pour les arrondis Decimal (évite de bloquer un solde à 0,001 près).
const EPSILON = 0.5;

/**
 * Enregistre une tranche de paiement sur une commande (web ou POS).
 *
 * - crée un `OrderPayment`,
 * - recalcule le total payé et le reste,
 * - met à jour le statut de la commande (soldée => PAID_SUCCESS / COMPLETED),
 * - synchronise `PosTransaction.paidAmount` / `remainingBalance` pour les ventes
 *   au comptoir (id commençant par `POS-`).
 *
 * Le tout dans une transaction pour garantir la cohérence.
 */
export async function recordInstallmentPayment(
  input: RecordPaymentInput,
): Promise<RecordPaymentResult> {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new InstallmentError('Montant invalide.');
  }
  if (!input.paymentMethod) {
    throw new InstallmentError('Mode de paiement requis.');
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      select: { totalAmount: true },
    });
    if (!order) {
      throw new InstallmentError('Commande introuvable.', 404);
    }

    const totalAmount = Number(order.totalAmount);

    const aggregate = await tx.orderPayment.aggregate({
      where: { orderId: input.orderId },
      _sum: { amount: true },
    });
    const currentPaid = Number(aggregate._sum.amount || 0);
    const remainingBefore = totalAmount - currentPaid;

    if (remainingBefore <= EPSILON) {
      throw new InstallmentError('Cette commande est déjà entièrement payée.', 409);
    }
    if (amount - remainingBefore > EPSILON) {
      throw new InstallmentError(
        `Le montant dépasse le reste à payer (${Math.round(remainingBefore)}).`,
      );
    }

    const payment = await tx.orderPayment.create({
      data: {
        orderId: input.orderId,
        amount,
        paymentMethod: input.paymentMethod,
        reference: input.reference || null,
        notes: input.notes || null,
        recordedById: input.recordedById || null,
        paidAt: new Date(),
      },
    });

    const totalPaid = currentPaid + amount;
    const remaining = Math.max(0, totalAmount - totalPaid);
    const isFullyPaid = totalPaid >= totalAmount - EPSILON;

    await tx.order.update({
      where: { id: input.orderId },
      data: isFullyPaid
        ? { status: 'PAID_SUCCESS', paymentStatus: 'COMPLETED' }
        : { paymentStatus: 'PENDING' },
    });

    if (isFullyPaid) {
      await tx.payment.updateMany({
        where: { orderId: input.orderId },
        data: { status: 'COMPLETED', paymentDate: new Date() },
      });
    }

    // Synchronisation de la vente au comptoir associée.
    if (input.orderId.startsWith('POS-')) {
      const posTransactionId = input.orderId.replace(/^POS-/, '');
      await tx.posTransaction.updateMany({
        where: { id: posTransactionId },
        data: { paidAmount: totalPaid, remainingBalance: remaining },
      });
    }

    return {
      paymentId: payment.id,
      totalAmount,
      totalPaid,
      remaining,
      isFullyPaid,
    };
  });
}
