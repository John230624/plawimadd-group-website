import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import { sendEmail } from '@/lib/email';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  const { id } = await context.params;

  try {
    const request = await prisma.studentInstallmentRequest.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });

    if (!request) {
      return NextResponse.json({ success: false, message: 'Demande introuvable.' }, { status: 404 });
    }

    if (request.status !== 'REJECTED') {
      return NextResponse.json({ success: false, message: 'Seules les demandes rejetees peuvent etre rouvertes.' }, { status: 400 });
    }

    await prisma.studentInstallmentRequest.update({
      where: { id },
      data: {
        status: 'PENDING',
        reviewedAt: null,
        reviewedById: null,
        adminNote: null,
      },
    });

    await logActivity({
      userId: authResult.userId,
      action: 'UPDATE',
      entity: 'STUDENT_INSTALLMENT',
      entityId: id,
      details: `Reouverture de la demande etudiante ${id}`,
    });

    if (request.user?.email) {
      await sendEmail({
        to: request.studentEmail || request.user.email,
        subject: 'Reouverture de votre demande de financement',
        html: `<p>Bonjour ${request.fullName},</p>
<p>Votre demande de paiement par tranche a ete rouvert par l'equipe Plawimadd Group.</p>
<p>Vous pouvez desormais soumettre a nouveau votre dossier si necessaire.</p>
<p>Cordialement,<br/>L'equipe Plawimadd Group</p>`,
      });
    }

    return NextResponse.json({ success: true, message: 'Demande rouverte.' });
  } catch (error) {
    console.error('Erreur reouverture:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
