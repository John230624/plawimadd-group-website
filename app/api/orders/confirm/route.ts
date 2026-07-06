import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeLoggedInUser } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await authorizeLoggedInUser(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'ID de commande requis.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Commande non trouvée.' }, { status: 404 });
    }

    if (order.userId !== auth.userId) {
      return NextResponse.json({ success: false, message: 'Non autorisé.' }, { status: 403 });
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ success: false, message: 'Cette commande a déjà été traitée.' }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    });

    await logActivity({
      userId: auth.userId,
      action: 'ORDER',
      entity: 'ORDER',
      entityId: orderId,
      details: `Confirmation de la commande ${orderId} par l'utilisateur`,
    });

    return NextResponse.json({ success: true, order: updated }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur confirmation commande:', _error);
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
