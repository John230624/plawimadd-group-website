import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import { recordInstallmentPayment, InstallmentError } from '@/lib/installments';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(_req, 'payments.view');
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
  const authResult: AuthResult = await authorizeByPermission(req, 'orders.edit');
  if (!authResult.authorized) return authResult.response!;

  const { id } = await params;

  try {
    const { amount, paymentMethod, reference, notes } = await req.json();

    // Enregistre la tranche, recalcule le reste, met à jour la commande et
    // synchronise la vente au comptoir (PosTransaction) si applicable.
    const result = await recordInstallmentPayment({
      orderId: id,
      amount: Number(amount),
      paymentMethod,
      reference: reference || null,
      notes: notes || null,
      recordedById: authResult.userId || null,
    });

    await logActivity({
      userId: authResult.userId || null,
      action: 'CREATE',
      entity: 'ORDER_PAYMENT',
      entityId: result.paymentId,
      details: `Paiement ${paymentMethod} de ${Math.round(Number(amount))} enregistre sur commande ${id.slice(0, 8)}. Reste: ${Math.round(result.remaining)}${result.isFullyPaid ? ' (SOLDÉE)' : ''}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: result.isFullyPaid ? 'Paiement enregistré. Commande soldée.' : 'Paiement enregistré.',
        data: { id: result.paymentId },
        totalPaid: result.totalPaid,
        remaining: result.remaining,
        isFullyPaid: result.isFullyPaid,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof InstallmentError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error('Erreur enregistrement paiement:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
