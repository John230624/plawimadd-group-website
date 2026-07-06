import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ message: 'Le champ status est requis.' }, { status: 400 });
    }

    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: 'Paiement introuvable.' }, { status: 404 });
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: { status },
    });

    await logActivity({
      userId: authResult.userId,
      action: 'UPDATE',
      entity: 'Payment',
      entityId: id,
      details: `Statut mis à jour vers ${status}`,
    });

    return NextResponse.json({ success: true, payment }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur PUT payment:', _error);
    return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
