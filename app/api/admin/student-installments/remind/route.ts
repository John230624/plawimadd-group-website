import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
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

      const ok = await sendEmail({
        to: userEmail,
        subject: 'Rappel de paiement echeance',
        html: `<p>Bonjour ${inst.order.user?.firstName || ''} ${inst.order.user?.lastName || ''},</p>
<p>Nous vous rappelons que votre echeance de paiement <strong>Tranche #${inst.installmentNumber}</strong> de <strong>${Number(inst.amount).toLocaleString('fr-FR')} FCFA</strong> est arrivee a echeance le ${new Date(inst.dueDate).toLocaleDateString('fr-FR')}.</p>
<p>Nous vous invitons a regulariser votre situation dans les plus brefs delais.</p>
<p>Cordialement,<br/>L'equipe Plawimadd Group</p>`,
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
