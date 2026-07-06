import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json([], { status: 200 });
    }

    const characteristics = await prisma.productCharacteristic.findMany({
      where: { productId },
      include: { characteristic: true },
    });

    return NextResponse.json(characteristics);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { productId, characteristicId, value } = await req.json();
    if (!productId || !characteristicId || value === undefined) {
      return NextResponse.json({ message: 'Champs requis.' }, { status: 400 });
    }

    const pc = await prisma.productCharacteristic.upsert({
      where: {
        productId_characteristicId: { productId, characteristicId },
      },
      update: { value },
      create: { productId, characteristicId, value },
    });

    return NextResponse.json(pc, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ message: 'productId requis.' }, { status: 400 });
    }

    await prisma.productCharacteristic.deleteMany({
      where: { productId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}
