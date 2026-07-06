import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import { OrderStatus } from '@prisma/client';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { ids, status } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ success: false, message: 'IDs (tableau) et statut sont requis.' }, { status: 400 });
    }

    const upperStatus = status.toUpperCase();
    if (!Object.values(OrderStatus).includes(upperStatus as OrderStatus)) {
      return NextResponse.json({ success: false, message: 'Statut invalide.' }, { status: 400 });
    }

    const result = await prisma.order.updateMany({
      where: { id: { in: ids } },
      data: { status: upperStatus as OrderStatus, updatedAt: new Date() },
    });

    for (const id of ids) {
      await logActivity({ userId: authResult.userId, action: 'UPDATE', entity: 'ORDER', entityId: id, details: `Mise à jour groupée du statut de la commande ${id} vers ${upperStatus}` });
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} commande(s) mise(s) à jour.`,
      count: result.count,
    });
  } catch (_error: unknown) {
    console.error('Erreur PATCH batch commandes:', _error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
