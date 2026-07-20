import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { sendEmail } from '@/lib/email';
import { getStudentInstallmentReminderTemplate } from '@/lib/emailTemplates';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'students.view');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { installmentId, orderId } = await req.json();

    const where: Record<string, unknown> = { status: 'OVERDUE' };
    if (installmentId) where.id = installmentId;
    if (orderId) where.orderId = orderId;

    const installments = await prisma.studentInstallment.findMany({
      where: where as any,
      include: {
        order: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (installments.length === 0) {
      return NextResponse.json({ success: false, message: 'Aucune echeance en retard trouvee.' }, { status: 404 });
    }

    const sent: string[] = [];
    for (const inst of installments) {
      const userEmail = inst.order?.user?.email;
      if (!userEmail) continue;

      const fullName = [inst.order.user?.firstName, inst.order.user?.lastName].filter(Boolean).join(' ') || 'Étudiant';
      const html = getStudentInstallmentReminderTemplate({
        fullName,
        installmentNumber: inst.installmentNumber,
        amount: Number(inst.amount),
        dueDate: inst.dueDate,
      });

      const ok = await sendEmail({
        to: userEmail,
        subject: "Rappel de retard de paiement d'échéance",
        html,
      });

      if (ok) {
        await prisma.studentInstallment.update({
          where: { id: inst.id },
          data: { remindedAt: new Date() },
        });
        sent.push(inst.id);
      }
    }

    return NextResponse.json({ success: true, sent: sent.length, total: installments.length });
  } catch (error) {
    console.error('Erreur envoi rappels:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
