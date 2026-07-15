import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'pos.view-transactions');
  if (!authResult.authorized) return authResult.response!;
  const userId = authResult.userId!;

  try {
    const transactions = await prisma.posTransaction.findMany({
      where: { userId },
      include: { items: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formatted = transactions.map((t) => ({
      ...t,
      totalAmount: Number(t.totalAmount),
      discount: Number(t.discount),
      finalAmount: Number(t.finalAmount),
      items: t.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(_req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(_req, 'pos.access');
  if (!authResult.authorized) return authResult.response!;

  // This endpoint creates a new session if none exists
  const userId = authResult.userId!;
  try {
    let session = await prisma.posSession.findFirst({ where: { userId, status: 'OPEN' } });
    if (!session) {
      session = await prisma.posSession.create({ data: { userId } });
    }
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
