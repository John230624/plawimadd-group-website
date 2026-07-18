import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import QRCode from 'qrcode';
import { generateTicketPDF, type TicketWidth } from '@/lib/ticket';

// GET /api/pos/ticket?transactionId=...&width=80|58
// Ticket de caisse thermique (inclut le bloc e-MECeF si la vente est normalisée).
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'pos.view-transactions');
  if (!auth.authorized) return auth.response!;
  const userId = auth.userId!;
  const isAdmin = auth.userRole === 'ADMIN';

  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get('transactionId');
  const width: TicketWidth = searchParams.get('width') === '58' ? 58 : 80;
  if (!transactionId) return NextResponse.json({ message: 'transactionId requis' }, { status: 400 });

  const transaction = await prisma.posTransaction.findUnique({
    where: { id: transactionId },
    include: {
      items: { include: { product: { select: { name: true } } } },
      user: { select: { firstName: true, lastName: true } },
      normalizedInvoice: true,
    },
  });
  if (!transaction) return NextResponse.json({ message: 'Transaction introuvable' }, { status: 404 });
  if (!isAdmin && transaction.userId !== userId) {
    return NextResponse.json({ message: 'Accès interdit' }, { status: 403 });
  }

  // Identité société depuis les réglages (repli valeurs actuelles).
  const settingsRows = await prisma.siteSetting.findMany({
    where: { key: { in: ['company.name', 'company.address', 'company.contact', 'emecef.ifu'] } },
  });
  const s: Record<string, string> = {};
  for (const r of settingsRows) s[r.key] = r.value;

  // Bloc normalisation si la facture est confirmée.
  let normalization = null;
  const inv = transaction.normalizedInvoice;
  if (inv && (inv.status === 'CONFIRMED' || inv.status === 'CANCELLED')) {
    let qrDataUrl: string | null = null;
    if (inv.qrCode) {
      try {
        qrDataUrl = await QRCode.toDataURL(inv.qrCode, { margin: 0, width: 180 });
      } catch {
        qrDataUrl = null;
      }
    }
    normalization = {
      nim: inv.nim,
      counters: inv.counters,
      ni: inv.ni,
      codeMecef: inv.codeMecef,
      qrDataUrl,
      environment: inv.environment,
    };
  }

  const pdf = generateTicketPDF({
    width,
    companyName: s['company.name'] || 'PLAWIMADD GROUP',
    companyIfu: s['emecef.ifu'] || '3202226549581',
    companyAddress: s['company.address'] || 'GODOMEY - ABOMEY CALAVI',
    companyContact: s['company.contact'] || '97918000 / 97747178',
    invoiceNumber: transaction.invoiceNumber,
    date: transaction.createdAt,
    sellerName: transaction.user?.firstName && transaction.user?.lastName
      ? `${transaction.user.firstName} ${transaction.user.lastName}`
      : null,
    customerName: transaction.customerName,
    items: transaction.items.map((it) => ({
      name: it.product.name,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.totalPrice),
    })),
    subtotal: Number(transaction.totalAmount),
    discount: Number(transaction.discount),
    total: Number(transaction.finalAmount),
    paidAmount: Number(transaction.paidAmount),
    remainingBalance: Number(transaction.remainingBalance),
    paymentMethod: transaction.paymentMethod,
    normalization,
  });

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ticket-${transaction.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  });
}
