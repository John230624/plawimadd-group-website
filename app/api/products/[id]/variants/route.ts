import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    const variants = await prisma.productVariant.findMany({
      where: {
        productId: id,
        isActive: true,
      },
      include: {
        attributes: {
          include: {
            attribute: { select: { id: true, name: true, attributeType: true } },
            value: { select: { id: true, value: true, colorCode: true, imageUrl: true } },
          },
        },
        images: {
          orderBy: { displayOrder: 'asc' },
          select: { id: true, imageUrl: true, isMainImage: true, displayOrder: true },
        },
      },
      orderBy: { price: 'asc' },
    });

    const formatted = variants.map(v => ({
      ...v,
      price: parseFloat(v.price.toString()),
      attributes: v.attributes.map(a => ({
        ...a,
        priceModifier: a.priceModifier ? parseFloat(a.priceModifier.toString()) : null,
      })),
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
