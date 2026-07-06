import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json([], { status: 200 });
    }

    const characteristics = await prisma.categoryCharacteristic.findMany({
      where: { categoryId },
      include: { characteristic: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(
      characteristics.map((cc) => ({
        id: cc.characteristic.id,
        name: cc.characteristic.name,
        required: cc.required,
      }))
    );
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
