import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { generateInvoicePDF } from '@/lib/invoice';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'pos.view-transactions');
  if (!authResult.authorized) return authResult.response!;
  const userId = authResult.userId!;
  const isAdmin = authResult.userRole === 'ADMIN' || authResult.userRole === 'ADMINSUPRA';

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
    if (!isAdmin && transaction.userId !== userId) {
      return NextResponse.json({ message: 'Acces interdit' }, { status: 403 });
    }

    // Historique des tranches encaissées (pour les ventes à crédit)
    const orderPayments = transaction.paymentMethod === 'INSTALLMENT'
      ? await prisma.orderPayment.findMany({
          where: { orderId: `POS-${transaction.id}` },
          orderBy: { paidAt: 'asc' },
        })
      : [];
    const remainingBalance = Number(transaction.remainingBalance);

    const pdf = generateInvoicePDF({
      invoiceNumber: transaction.invoiceNumber,
      date: transaction.createdAt,
      customerName: transaction.customerName,
      customerPhone: transaction.customerPhone,
      customerEmail: transaction.customerEmail,
      customerIFU: transaction.customerIFU,
      customerAddress: transaction.customerAddress,
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
      paidAmount: Number(transaction.paidAmount),
      remainingBalance,
      dueDate: transaction.dueDate,
      paymentMethod: transaction.paymentMethod,
      sellerName: transaction.user?.firstName && transaction.user?.lastName
        ? `${transaction.user.firstName} ${transaction.user.lastName}`
        : 'Vendeur',
      sellerPhone: transaction.user?.phoneNumber || undefined,
      payments: orderPayments.map((p) => ({
        amount: Number(p.amount),
        method: p.paymentMethod,
        paidAt: p.paidAt,
        reference: p.reference,
      })),
      isFullyPaid: remainingBalance <= 0.5,
    });

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="facture-${transaction.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ message: 'Erreur generation PDF' }, { status: 500 });
  }
}
