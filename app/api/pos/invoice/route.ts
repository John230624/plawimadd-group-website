import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeLoggedInUser, AuthResult } from '@/lib/authUtils';
import { generateInvoicePDF } from '@/lib/invoice';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeLoggedInUser(req);
  if (!authResult.authorized) return authResult.response!;

  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get('transactionId');
  if (!transactionId) return NextResponse.json({ message: 'transactionId requis' }, { status: 400 });

  try {
    const transaction = await prisma.posTransaction.findUnique({
      where: { id: transactionId },
      include: {
        items: { include: { product: { select: { name: true } } } },
        user: { select: { firstName: true, lastName: true, phoneNumber: true } },
      },
    });

    if (!transaction) return NextResponse.json({ message: 'Transaction introuvable' }, { status: 404 });

    const pdf = generateInvoicePDF({
      invoiceNumber: transaction.invoiceNumber,
      date: transaction.createdAt,
      customerName: transaction.customerName,
      customerPhone: transaction.customerPhone,
      items: transaction.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      subtotal: Number(transaction.totalAmount),
      discount: Number(transaction.discount),
      discountReason: transaction.discountReason,
      total: Number(transaction.finalAmount),
      paymentMethod: transaction.paymentMethod,
      sellerName: transaction.user.firstName && transaction.user.lastName
        ? `${transaction.user.firstName} ${transaction.user.lastName}`
        : 'Vendeur',
      sellerPhone: transaction.user.phoneNumber || undefined,
    });

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${transaction.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ message: 'Erreur generation PDF' }, { status: 500 });
  }
}
