import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'students.approve');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { installmentIds, paymentMethod, paymentReference } = await req.json();

    if (!installmentIds || !Array.isArray(installmentIds) || installmentIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Au moins une echeance requise.' }, { status: 400 });
    }

    const installments = await prisma.studentInstallment.findMany({
      where: { id: { in: installmentIds }, status: 'PENDING' },
      include: { order: true },
    });

    if (installments.length === 0) {
      return NextResponse.json({ success: false, message: 'Aucune echeance en attente trouvee.' }, { status: 400 });
    }

    const now = new Date();
    const orderIds = [...new Set(installments.map((i) => i.orderId))];

    await prisma.$transaction(async (tx) => {
      for (const inst of installments) {
        await tx.studentInstallment.update({
          where: { id: inst.id },
          data: {
            status: 'PAID',
            paidAt: now,
            paymentReference: paymentReference || null,
            paymentMethod: paymentMethod || null,
            paidById: authResult.userId,
          },
        });

        await tx.orderPayment.create({
          data: {
            orderId: inst.orderId,
            amount: inst.amount,
            paymentMethod: paymentMethod || 'INSTALLMENT_STUDENT',
            reference: paymentReference || null,
            recordedById: authResult.userId,
            notes: `Paiement collectif tranche #${inst.installmentNumber}`,
            paidAt: now,
          },
        });
      }

      for (const orderId of orderIds) {
        const allInst = await tx.studentInstallment.findMany({
          where: { orderId },
        });
        const allPaid = allInst.every((i) => i.status === 'PAID');

        if (allPaid) {
          await tx.order.update({
            where: { id: orderId },
            data: { status: 'PAID_SUCCESS', paymentStatus: 'COMPLETED' },
          });

          const payment = await tx.payment.findFirst({ where: { orderId } });
          if (payment) {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: 'COMPLETED', paymentDate: now },
            });
          }
        }
      }
    });

    await logActivity({
      userId: authResult.userId,
      action: 'UPDATE',
      entity: 'STUDENT_INSTALLMENT',
      details: `Paiement collectif de ${installments.length} echeances (${orderIds.length} commandes)`,
    });

    return NextResponse.json({ success: true, count: installments.length });
  } catch (error) {
    console.error('Erreur paiement collectif:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
