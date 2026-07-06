import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    const characteristics = await prisma.characteristic.findMany({
      where: {
        categories: { some: { categoryId: id } },
      },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            value: true,
            valueSlug: true,
            colorCode: true,
            imageUrl: true,
            sortOrder: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(characteristics);
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}
