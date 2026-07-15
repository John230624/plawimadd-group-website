// app/api/admin/order-status/[orderId]/route.ts
// app/api/admin/order-status/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/lib/authUtils';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/logActivity';
import { OrderStatus } from '@prisma/client';

interface Context {
  params: Promise<{
    orderId: string;
  }>;
}

// ✅ GET une commande par ID
export async function GET(request: NextRequest, context: Context) {
  const authResult = await authorizeByPermission(request, 'orders.view');
  if (!authResult.authorized) return authResult.response!;

  const { orderId } = await context.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ message: 'Commande non trouvée' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Erreur GET commande :', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

// ✅ PUT pour mettre à jour le statut
export async function PUT(request: NextRequest, context: Context) {
  const authResult = await authorizeByPermission(request, 'orders.update-status');
  if (!authResult.authorized) return authResult.response!;

  const { orderId } = await context.params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requête invalide' }, { status: 400 });
  }

  const { status } = body;

  if (!status || !(status in OrderStatus)) {
    return NextResponse.json({ message: 'Statut invalide.' }, { status: 400 });
  }

  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: { set: status as OrderStatus },
      },
    });

    await logActivity({
      userId: authResult.userId,
      action: 'UPDATE',
      entity: 'ORDER',
      entityId: orderId,
      details: `Commande #${orderId} marquée comme "${status}"`,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Erreur PUT commande :', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

// ✅ DELETE une commande (optionnel selon ton business)
export async function DELETE(request: NextRequest, context: Context) {
  const authResult = await authorizeByPermission(request, 'orders.delete');
  if (!authResult.authorized) return authResult.response!;

  const { orderId } = await context.params;

  try {
    // Utiliser une transaction pour s'assurer que les articles de commande sont supprimés avant la commande elle-même
    await prisma.$transaction([
      prisma.orderItem.deleteMany({
        where: { orderId: orderId },
      }),
      prisma.order.delete({
        where: { id: orderId },
      }),
    ]);

    await logActivity({
      userId: authResult.userId,
      action: 'DELETE',
      entity: 'ORDER',
      entityId: orderId,
      details: `Commande #${orderId} supprimée`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE commande :', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
