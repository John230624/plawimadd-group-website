import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import QRCode from 'qrcode';
import { generateNormalizedInvoicePDF, type NormalizedInvoiceItem } from '@/lib/invoice-normalized';
import type { EmecefTaxGroup } from '@/lib/emecef';

// GET /api/admin/emecef/invoice-pdf?id=<normalizedInvoiceId>
// Renvoie le PDF de la facture normalisée (NIM/QR/ventilation).
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'orders.view');
  if (!auth.authorized) return auth.response!;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'id requis' }, { status: 400 });

  const inv = await prisma.normalizedInvoice.findUnique({ where: { id } });
  if (!inv) return NextResponse.json({ message: 'Facture normalisée introuvable' }, { status: 404 });
  if (inv.status !== 'CONFIRMED' && inv.status !== 'CANCELLED') {
    return NextResponse.json({ message: 'Facture non confirmée' }, { status: 409 });
  }

  const defaultGroup = 'B' as EmecefTaxGroup;

  // Récupère les articles + le client selon la source.
  let items: NormalizedInvoiceItem[] = [];
  let customerName: string | null = null;
  let customerIFU: string | null = null;
  let customerContact: string | null = null;
  let customerAddress: string | null = null;
  let date = inv.createdAt;
  let invoiceNumber = inv.ni || inv.id.slice(0, 8).toUpperCase();

  if (inv.source === 'ORDER' && inv.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: inv.orderId },
      include: {
        orderItems: { include: { product: { select: { name: true } } } },
        user: { select: { firstName: true, lastName: true, phoneNumber: true } },
      },
    });
    if (!order) return NextResponse.json({ message: 'Commande source introuvable' }, { status: 404 });
    items = order.orderItems.map((it) => ({
      name: it.product.name,
      quantity: it.quantity,
      unitPrice: Number(it.priceAtOrder),
      totalPrice: Number(it.priceAtOrder) * it.quantity,
      taxGroup: defaultGroup,
    }));
    customerName = order.user?.firstName && order.user?.lastName ? `${order.user.firstName} ${order.user.lastName}` : order.userEmail;
    customerContact = order.userPhoneNumber || order.user?.phoneNumber || order.userEmail;
    customerAddress = [order.shippingCity, order.shippingState, order.shippingCountry].filter(Boolean).join(', ');
    date = order.createdAt;
  } else if (inv.source === 'POS' && inv.posTransactionId) {
    const tx = await prisma.posTransaction.findUnique({
      where: { id: inv.posTransactionId },
      include: { items: { include: { product: { select: { name: true } } } } },
    });
    if (!tx) return NextResponse.json({ message: 'Transaction source introuvable' }, { status: 404 });
    items = tx.items.map((it) => ({
      name: it.product.name,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.totalPrice),
      taxGroup: defaultGroup,
    }));
    customerName = tx.customerName;
    customerIFU = tx.customerIFU;
    customerContact = tx.customerPhone || tx.customerEmail;
    customerAddress = tx.customerAddress;
    date = tx.createdAt;
    invoiceNumber = inv.ni || tx.invoiceNumber;
  }

  // Identité émetteur depuis les réglages (repli sur valeurs par défaut).
  const settingsRows = await prisma.siteSetting.findMany({
    where: { key: { in: ['company.name', 'company.rccm', 'company.address', 'company.contact'] } },
  });
  const s: Record<string, string> = {};
  for (const r of settingsRows) s[r.key] = r.value;

  // QR à partir du contenu renvoyé par e-MECeF.
  let qrDataUrl: string | null = null;
  if (inv.qrCode) {
    try {
      qrDataUrl = await QRCode.toDataURL(inv.qrCode, { margin: 1, width: 220 });
    } catch {
      qrDataUrl = null;
    }
  }

  const pdf = generateNormalizedInvoicePDF({
    invoiceNumber,
    date,
    currency: inv.currency,
    customerName,
    customerIFU,
    customerContact,
    customerAddress,
    items,
    total: Number(inv.totalTTC),
    seller: {
      name: s['company.name'] || 'PLAWIMADD GROUP',
      ifu: inv.ifu,
      rccm: s['company.rccm'] || 'RB/ABC/22 B 6030',
      address: s['company.address'] || "GODOMEY - ABOMEY CALAVI",
      contact: s['company.contact'] || '97918000 / 97747178',
    },
    normalization: {
      type: inv.type,
      nim: inv.nim,
      counters: inv.counters,
      ni: inv.ni,
      codeMecef: inv.codeMecef,
      emecefDate: inv.emecefDate,
      qrDataUrl,
      environment: inv.environment,
    },
  });

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="facture-normalisee-${invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  });
}
