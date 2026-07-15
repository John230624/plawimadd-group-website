import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await authorizeByPermission(req, 'students.approve');
  if (!authResult.authorized) return authResult.response!;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const { dueDate, amount, lateFee, notes } = body;

    const existing = await prisma.studentInstallment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Echeance introuvable.' }, { status: 404 });
    }

    if (existing.status === 'PAID') {
      return NextResponse.json({ success: false, message: 'Impossible de modifier une echeance deja payee.' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (dueDate) data.dueDate = new Date(dueDate);
    if (amount !== undefined) data.amount = amount;
    if (lateFee !== undefined) data.lateFee = lateFee;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.studentInstallment.update({
      where: { id },
      data: data as any,
    });

    await logActivity({
      userId: authResult.userId,
      action: 'UPDATE',
      entity: 'STUDENT_INSTALLMENT',
      entityId: id,
      details: `Modification echeance #${existing.installmentNumber}: ${Object.keys(data).join(', ')}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Erreur modification echeance:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
