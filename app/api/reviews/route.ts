import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  if (!productId) return NextResponse.json({ message: 'productId requis' }, { status: 400 });
  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = reviews.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.user.firstName && r.user.lastName ? `${r.user.firstName} ${r.user.lastName}` : 'Anonyme',
      avatar: r.user.image || '/images/default_avatar.png',
      rating: r.rating,
      text: r.comment,
      date: r.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
