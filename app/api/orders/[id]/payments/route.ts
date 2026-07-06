import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(_req);
  if (!authResult.authorized) return authResult.response!;

  const { id } = await params;

  try {
    const payments = await prisma.orderPayment.findMany({
      where: { orderId: id },
      include: { recordedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { paidAt: 'desc' },
    });

    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
    const order = await prisma.order.findUnique({
      where: { id },
      select: { totalAmount: true },
    });

    return NextResponse.json({
      success: true,
      data: payments,
      totalPaid,
      totalAmount: Number(order?.totalAmount || 0),
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  const { id } = await params;

  try {
    const { amount, paymentMethod, reference, notes } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Montant invalide.' }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ success: false, message: 'Mode de paiement requis.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Commande introuvable.' }, { status: 404 });
    }

    const payment = await prisma.orderPayment.create({
      data: {
        orderId: id,
        amount,
        paymentMethod,
        reference: reference || null,
        notes: notes || null,
        recordedById: (req as any).user?.id || null,
        paidAt: new Date(),
      },
    });

    const allPayments = await prisma.orderPayment.findMany({
      where: { orderId: id },
    });
    const totalPaid = allPayments.reduce((s, p) => s + Number(p.amount), 0);
    const isFullyPaid = totalPaid >= Number(order.totalAmount);

    if (isFullyPaid) {
      await prisma.order.update({
        where: { id },
        data: {
          status: 'PAID_SUCCESS',
          paymentStatus: 'COMPLETED',
        },
      });

      await prisma.payment.updateMany({
        where: { orderId: id },
        data: { status: 'COMPLETED', paymentDate: new Date() },
      });
    } else {
      await prisma.order.update({
        where: { id },
        data: { paymentStatus: 'PENDING' },
      });
    }

    await logActivity({
      userId: (req as any).user?.id || null,
      action: 'CREATE',
      entity: 'ORDER_PAYMENT',
      entityId: payment.id,
      details: `Paiement ${paymentMethod} de ${amount} enregistre sur commande ${id.slice(0, 8)}`,
    });

    return NextResponse.json({ success: true, data: payment, isFullyPaid }, { status: 201 });
  } catch (error) {
    console.error('Erreur enregistrement paiement:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
