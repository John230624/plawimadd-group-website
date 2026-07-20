import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import { sendEmail } from '@/lib/email';
import { getStudentInstallmentDecisionTemplate } from '@/lib/emailTemplates';

interface UpdateStudentInstallmentPayload {
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  adminNote?: string;
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;

  try {
    const body = (await req.json()) as UpdateStudentInstallmentPayload;
    const permission = body.status === 'REJECTED' ? 'students.reject' : 'students.approve';
    const authResult = await authorizeByPermission(req, permission);
    if (!authResult.authorized) return authResult.response!;

    if (!body.status) {
      return NextResponse.json({ success: false, message: 'Le statut est obligatoire.' }, { status: 400 });
    }

    if (body.status === 'REJECTED' && !body.adminNote) {
      return NextResponse.json({ success: false, message: 'Un motif de rejet est obligatoire.' }, { status: 400 });
    }

    const existing = await prisma.studentInstallmentRequest.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Demande introuvable.' }, { status: 404 });
    }

    const request = await prisma.studentInstallmentRequest.update({
      where: { id },
      data: {
        status: body.status,
        adminNote: body.adminNote || null,
        reviewedAt: body.status === 'PENDING' ? null : new Date(),
        reviewedById: body.status !== 'PENDING' ? authResult.userId : null,
      },
    });

    await logActivity({
      userId: authResult.userId,
      action: 'UPDATE',
      entity: 'STUDENT_INSTALLMENT',
      entityId: id,
      details: `Demande etudiante ${id} -> ${body.status}${body.adminNote ? ' : ' + body.adminNote : ''}`,
    });

    if (existing.user?.email && (body.status === 'APPROVED' || body.status === 'REJECTED')) {
      const statusLabel = body.status === 'APPROVED' ? 'approuvée' : 'rejetée';
      const html = getStudentInstallmentDecisionTemplate({
        fullName: existing.fullName,
        status: body.status,
        adminNote: body.adminNote,
      });

      await sendEmail({
        to: existing.studentEmail || existing.user.email,
        subject: `Votre demande de financement a été ${statusLabel}`,
        html,
      });
    }

    return NextResponse.json({ success: true, request }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la mise a jour de la demande etudiante:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
