import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'students.approve');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { installmentId, paymentReference, paymentMethod, notes } = await req.json();

    if (!installmentId) {
      return NextResponse.json({ success: false, message: 'ID echeance requis.' }, { status: 400 });
    }

    const installment = await prisma.studentInstallment.findUnique({
      where: { id: installmentId },
      include: { order: true },
    });

    if (!installment) {
      return NextResponse.json({ success: false, message: 'Echeance introuvable.' }, { status: 404 });
    }

    if (installment.status !== 'PENDING') {
      return NextResponse.json({ success: false, message: 'Cette echeance a deja ete traitee.' }, { status: 400 });
    }

    const updated = await prisma.studentInstallment.update({
      where: { id: installmentId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentReference: paymentReference || null,
        paymentMethod: paymentMethod || null,
        paidById: authResult.userId,
        notes: notes || null,
      },
    });

    await prisma.orderPayment.create({
      data: {
        orderId: installment.orderId,
        amount: installment.amount,
        paymentMethod: paymentMethod || 'INSTALLMENT_STUDENT',
        reference: paymentReference || null,
        recordedById: authResult.userId,
        notes: notes || `Paiement tranche #${installment.installmentNumber}`,
        paidAt: new Date(),
      },
    });

    const allInstallments = await prisma.studentInstallment.findMany({
      where: { orderId: installment.orderId },
    });

    const allPaid = allInstallments.every((inst) => inst.status === 'PAID');

    if (allPaid) {
      await prisma.order.update({
        where: { id: installment.orderId },
        data: {
          status: 'PAID_SUCCESS',
          paymentStatus: 'COMPLETED',
        },
      });

      const payment = await prisma.payment.findFirst({
        where: { orderId: installment.orderId },
      });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED', paymentDate: new Date() },
        });
      }
    }

    await logActivity({
      userId: authResult.userId,
      action: 'UPDATE',
      entity: 'STUDENT_INSTALLMENT',
      entityId: installmentId,
      details: `Paiement echeance #${installment.installmentNumber} commande ${installment.orderId.slice(0, 8)} marquee payee${allPaid ? ' (tout solde)' : ''}`,
    });

    return NextResponse.json({ success: true, data: updated, allPaid });
  } catch (error) {
    console.error('Erreur paiement echeance:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
