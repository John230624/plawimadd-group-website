import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { generateOrderInvoicePDF } from '@/lib/invoice-order';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Non authentifie.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId requis.' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'ADMIN';

    const order = await prisma.order.findFirst({
      where: isAdmin ? { id: orderId } : { id: orderId, userId: session.user.id },
      include: {
        orderItems: {
          include: { product: { select: { name: true } } },
        },
        orderPayments: { orderBy: { paidAt: 'asc' } },
        payment: true,
        user: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Commande introuvable.' }, { status: 404 });
    }

    const hasStudentInstallments = await prisma.studentInstallment.count({
      where: { orderId: order.id },
    });

    const payments = order.orderPayments.map((p) => ({
      method: p.paymentMethod,
      amount: Number(p.amount),
      reference: p.reference,
      paidAt: p.paidAt,
    }));

    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const totalAmount = Number(order.totalAmount);
    const isFullyPaid = totalPaid >= totalAmount;

    const orderType = hasStudentInstallments > 0 ? 'student' : 'standard' as const;

    const shippingParts = [
      order.shippingAddressLine1,
      order.shippingAddressLine2,
      order.shippingCity,
      order.shippingState,
      order.shippingCountry,
    ].filter(Boolean);

    const pdf = generateOrderInvoicePDF({
      invoiceNumber: `FACT-${order.id.slice(0, 8).toUpperCase()}`,
      orderId: order.id,
      orderDate: order.createdAt,
      customerName: order.user.firstName && order.user.lastName
        ? `${order.user.firstName} ${order.user.lastName}`
        : order.userEmail,
      customerEmail: order.userEmail,
      customerPhone: order.userPhoneNumber || order.user.phoneNumber,
      shippingAddress: shippingParts.length > 0 ? shippingParts.join(', ') : null,
      items: order.orderItems.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.priceAtOrder),
        totalPrice: Number(item.priceAtOrder) * item.quantity,
      })),
      payments,
      totalAmount,
      totalPaid,
      currency: order.currency,
      type: orderType,
      isFullyPaid,
    });

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    const label = isFullyPaid ? 'facture-soldee' : totalPaid > 0 ? 'facture-partielle' : 'facture';

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${label}-${order.id.slice(0, 8)}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Erreur generation facture:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
