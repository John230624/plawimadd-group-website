import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest } from '@/lib/authUtils';

interface UpdateStudentInstallmentPayload {
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  adminNote?: string;
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  const authResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  const { id } = context.params;

  try {
    const body = (await req.json()) as UpdateStudentInstallmentPayload;

    if (!body.status) {
      return NextResponse.json(
        { success: false, message: 'Le statut est obligatoire.' },
        { status: 400 }
      );
    }

    const request = await prisma.studentInstallmentRequest.update({
      where: { id },
      data: {
        status: body.status,
        adminNote: body.adminNote || null,
        reviewedAt: body.status === 'PENDING' ? null : new Date(),
      },
    });

    return NextResponse.json({ success: true, request }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la mise a jour de la demande.' },
      { status: 500 }
    );
  }
}
