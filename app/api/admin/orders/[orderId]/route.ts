// app/api/admin/order-status/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

interface Context {
  params: Promise<{
    orderId: string;
  }>;
}

// ✅ GET une commande par ID
export async function GET(request: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

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
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

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

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Erreur PUT commande :', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

// ✅ DELETE une commande (optionnel selon ton business)
export async function DELETE(request: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

    const { orderId } = await context.params;

  try {
    await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE commande :', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
