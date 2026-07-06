import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeLoggedInUser, AuthResult } from '@/lib/authUtils';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeLoggedInUser(req);
  if (!authResult.authorized) return authResult.response!;
  const userId = authResult.userId!;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { wishlist: true },
    });
    const items: string[] = user?.wishlist ? JSON.parse(user.wishlist) : [];
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeLoggedInUser(req);
  if (!authResult.authorized) return authResult.response!;
  const userId = authResult.userId!;
  try {
    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ message: 'productId requis' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { wishlist: true } });
    let items: string[] = user?.wishlist ? JSON.parse(user.wishlist) : [];
    if (!items.includes(productId)) items.push(productId);
    await prisma.user.update({ where: { id: userId }, data: { wishlist: JSON.stringify(items) } });

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeLoggedInUser(req);
  if (!authResult.authorized) return authResult.response!;
  const userId = authResult.userId!;
  try {
    const { productId } = await req.json();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { wishlist: true } });
    let items: string[] = user?.wishlist ? JSON.parse(user.wishlist) : [];
    items = items.filter((id: string) => id !== productId);
    await prisma.user.update({ where: { id: userId }, data: { wishlist: JSON.stringify(items) } });

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
