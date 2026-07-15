import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/lib/authUtils';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/logActivity';
import { orderStatusSchema } from '@/lib/validation';
import { ZodError } from 'zod';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authorizeByPermission(request, 'orders.update-status');
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await request.json();
    const normalizedBody = { ...body, status: body.status?.toUpperCase() };
    const parsed = orderStatusSchema.parse(normalizedBody);
    const { orderId, status } = parsed;

    const result = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Commande non trouvée.' },
        { status: 404 }
      );
    }

    await logActivity({ userId: auth.userId, action: 'UPDATE', entity: 'ORDER', entityId: orderId, details: `Mise à jour du statut de la commande ${orderId} vers ${status}` });

    return NextResponse.json(
      { success: true, message: 'Statut de la commande mis à jour avec succès.' },
      { status: 200 }
    );

  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { success: false, message: 'Commande non trouvée.' },
        { status: 404 }
      );
    }

    console.error("Erreur lors de la mise à jour du statut de la commande:", error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur lors de la mise à jour du statut de la commande.' },
      { status: 500 }
    );
  }
}
