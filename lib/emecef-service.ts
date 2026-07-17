// lib/emecef-service.ts
// Couche service : orchestre la normalisation d'un document (commande e-commerce
// ou vente POS) via l'API e-MECeF, et persiste le résultat dans NormalizedInvoice.

import prisma from '@/lib/prisma';
import {
  getEmecefConfig,
  createAndConfirm,
  type EmecefConfig,
  type EmecefInvoiceInput,
  type EmecefInvoiceType,
  type EmecefItemInput,
  EmecefError,
} from '@/lib/emecef';
import type { NormalizedInvoice } from '@prisma/client';

export type NormalizeSource = 'ORDER' | 'POS';

interface BuiltDocument {
  input: Omit<EmecefInvoiceInput, 'type'>;
  totals: { taxable: number; ttc: number };
  currency: string;
}

/** Construit les données de facture e-MECeF à partir d'une commande e-commerce. */
async function buildFromOrder(config: EmecefConfig, orderId: string): Promise<BuiltDocument> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: { include: { product: { select: { name: true } } } },
      user: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } },
    },
  });
  if (!order) throw new EmecefError('Commande introuvable.', { code: 'NOT_FOUND' });

  const items: EmecefItemInput[] = order.orderItems.map((it) => ({
    name: it.product.name,
    price: Number(it.priceAtOrder),
    quantity: it.quantity,
    taxGroup: config.defaultTaxGroup,
  }));

  const clientName = order.user?.firstName && order.user?.lastName
    ? `${order.user.firstName} ${order.user.lastName}`
    : order.userEmail;

  const ttc = items.reduce((s, it) => s + it.price * it.quantity, 0);

  return {
    input: {
      operatorName: 'Vente en ligne',
      client: {
        name: clientName,
        contact: order.userPhoneNumber || order.user?.phoneNumber || order.userEmail,
        address: [order.shippingCity, order.shippingState, order.shippingCountry].filter(Boolean).join(', '),
      },
      items,
    },
    totals: { taxable: ttc, ttc },
    currency: order.currency || 'XOF',
  };
}

/** Construit les données de facture e-MECeF à partir d'une transaction POS. */
async function buildFromPos(config: EmecefConfig, posTransactionId: string): Promise<BuiltDocument> {
  const tx = await prisma.posTransaction.findUnique({
    where: { id: posTransactionId },
    include: {
      items: { include: { product: { select: { name: true } } } },
      user: { select: { firstName: true, lastName: true } },
    },
  });
  if (!tx) throw new EmecefError('Transaction POS introuvable.', { code: 'NOT_FOUND' });

  const items: EmecefItemInput[] = tx.items.map((it) => ({
    name: it.product.name,
    price: Number(it.unitPrice),
    quantity: it.quantity,
    taxGroup: config.defaultTaxGroup,
  }));

  const operatorName = tx.user?.firstName && tx.user?.lastName
    ? `${tx.user.firstName} ${tx.user.lastName}`
    : 'Vendeur';

  const ttc = Number(tx.finalAmount);

  return {
    input: {
      operatorName,
      client: {
        name: tx.customerName,
        ifu: tx.customerIFU,
        contact: tx.customerPhone || tx.customerEmail,
        address: tx.customerAddress,
      },
      items,
    },
    totals: { taxable: ttc, ttc },
    currency: 'XOF',
  };
}

export interface NormalizeParams {
  source: NormalizeSource;
  id: string; // orderId ou posTransactionId
  type?: EmecefInvoiceType; // défaut FV
  userId?: string | null;
}

/**
 * Normalise un document et persiste le résultat.
 * Idempotent au niveau du lien : ré-utilise la ligne NormalizedInvoice existante
 * (une par document) et la met à jour.
 */
export async function normalizeDocument(params: NormalizeParams): Promise<NormalizedInvoice> {
  const config = await getEmecefConfig();
  const type: EmecefInvoiceType = params.type || 'FV';

  const built = params.source === 'ORDER'
    ? await buildFromOrder(config, params.id)
    : await buildFromPos(config, params.id);

  const linkWhere = params.source === 'ORDER'
    ? { orderId: params.id }
    : { posTransactionId: params.id };

  // Refuse une double normalisation d'un document déjà confirmé.
  const existing = await prisma.normalizedInvoice.findFirst({ where: linkWhere });
  if (existing && existing.status === 'CONFIRMED') {
    throw new EmecefError('Ce document possède déjà une facture normalisée confirmée.', { code: 'ALREADY_NORMALIZED' });
  }

  const invoiceInput: EmecefInvoiceInput = { ...built.input, type };

  const baseData = {
    source: params.source as NormalizeSource,
    type,
    ifu: config.ifu,
    aib: config.aib,
    environment: config.environment,
    totalTaxable: built.totals.taxable,
    totalTax: 0,
    totalTTC: built.totals.ttc,
    currency: built.currency,
    createdById: params.userId ?? null,
    ...(params.source === 'ORDER' ? { orderId: params.id } : { posTransactionId: params.id }),
  };

  try {
    const { confirm, requestPayload, draftRaw } = await createAndConfirm(config, invoiceInput);

    const data = {
      ...baseData,
      status: 'CONFIRMED' as const,
      emecefUid: confirm.uid,
      nim: confirm.nim,
      counters: confirm.counters,
      ni: confirm.ni,
      codeMecef: confirm.codeMecef,
      qrCode: confirm.qrCode,
      emecefDate: confirm.dateTime ? new Date(confirm.dateTime) : new Date(),
      rawRequest: JSON.stringify(requestPayload),
      rawResponse: JSON.stringify({ draft: draftRaw, confirm: confirm.raw }),
      errorCode: null,
      errorDesc: null,
      confirmedAt: new Date(),
    };

    if (existing) {
      return await prisma.normalizedInvoice.update({ where: { id: existing.id }, data });
    }
    return await prisma.normalizedInvoice.create({ data });
  } catch (err) {
    const e = err as EmecefError;
    const data = {
      ...baseData,
      status: 'ERROR' as const,
      rawRequest: JSON.stringify(invoiceInput),
      errorCode: e.code || 'ERROR',
      errorDesc: e.message,
    };
    if (existing) {
      await prisma.normalizedInvoice.update({ where: { id: existing.id }, data });
    } else {
      await prisma.normalizedInvoice.create({ data });
    }
    throw err;
  }
}

/**
 * Annule une facture normalisée en émettant un avoir (FA) auprès d'e-MECeF.
 * L'avoir (NIM/QR propres) est conservé dans rawResponse.cancellation.
 */
export async function cancelNormalized(normalizedInvoiceId: string, userId?: string | null): Promise<NormalizedInvoice> {
  const config = await getEmecefConfig();
  const inv = await prisma.normalizedInvoice.findUnique({ where: { id: normalizedInvoiceId } });
  if (!inv) throw new EmecefError('Facture normalisée introuvable.', { code: 'NOT_FOUND' });
  if (inv.status !== 'CONFIRMED') {
    throw new EmecefError('Seule une facture confirmée peut être annulée par un avoir.', { code: 'NOT_CONFIRMED' });
  }

  const built = inv.source === 'ORDER'
    ? await buildFromOrder(config, inv.orderId!)
    : await buildFromPos(config, inv.posTransactionId!);

  // FA = avoir d'une FV ; EA = avoir d'une EV.
  const avoirType: EmecefInvoiceType = inv.type === 'EV' ? 'EA' : 'FA';
  const invoiceInput: EmecefInvoiceInput = {
    ...built.input,
    type: avoirType,
    reference: inv.emecefUid || inv.nim || undefined,
  };

  const { confirm, requestPayload, draftRaw } = await createAndConfirm(config, invoiceInput);

  const prevRaw = inv.rawResponse ? safeParse(inv.rawResponse) : {};
  return await prisma.normalizedInvoice.update({
    where: { id: inv.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      createdById: userId ?? inv.createdById,
      rawResponse: JSON.stringify({
        ...(typeof prevRaw === 'object' && prevRaw ? prevRaw : {}),
        cancellation: {
          type: avoirType,
          request: requestPayload,
          draft: draftRaw,
          confirm: confirm.raw,
          nim: confirm.nim,
          counters: confirm.counters,
          qrCode: confirm.qrCode,
        },
      }),
    },
  });
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
