import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get('categoryId');

    const where = categoryId
      ? { categories: { some: { categoryId } } }
      : {};

    const characteristics = await prisma.characteristic.findMany({
      where,
      include: {
        categories: {
          include: { category: { select: { id: true, name: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        values: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(characteristics);
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { name, categoryIds, attributeType, isVariant, displayOrder } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'Le nom est requis.' }, { status: 400 });
    }

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ message: 'Au moins une catégorie est requise.' }, { status: 400 });
    }

    const validTypes = ['TEXT', 'SELECT', 'MULTI_SELECT', 'RANGE', 'COLOR', 'SIZE'];
    const finalType = attributeType && validTypes.includes(attributeType) ? attributeType : 'SELECT';

    const characteristic = await prisma.characteristic.create({
      data: {
        name: name.trim(),
        attributeType: finalType,
        isVariant: isVariant ?? false,
        displayOrder: displayOrder ?? 0,
        categories: {
          create: categoryIds.map((catId: string) => ({
            categoryId: catId,
            sortOrder: 0,
            required: true,
          })),
        },
      },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true } } },
        },
        values: true,
      },
    });

    await logActivity({
      userId: req.user?.id || null,
      action: 'CREATE',
      entity: 'CHARACTERISTIC',
      entityId: characteristic.id,
      details: `Caractéristique "${characteristic.name}" créée (${categoryIds.length} catégorie(s))`,
    });

    return NextResponse.json(characteristic, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as Record<string, unknown>).code === 'P2002') {
      return NextResponse.json({ message: 'Cette caractéristique existe déjà.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { id, name, categoryIds, attributeType, isVariant, displayOrder } = await req.json();
    if (!id || !name || !name.trim()) {
      return NextResponse.json({ message: 'ID et nom requis.' }, { status: 400 });
    }

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ message: 'Au moins une catégorie est requise.' }, { status: 400 });
    }

    const validTypes = ['TEXT', 'SELECT', 'MULTI_SELECT', 'RANGE', 'COLOR', 'SIZE'];

    const characteristic = await prisma.$transaction(async (tx) => {
      await tx.categoryCharacteristic.deleteMany({ where: { characteristicId: id } });

      return tx.characteristic.update({
        where: { id },
        data: {
          name: name.trim(),
          ...(attributeType && validTypes.includes(attributeType) && { attributeType: attributeType }),
          ...(isVariant !== undefined && { isVariant }),
          ...(displayOrder !== undefined && { displayOrder }),
          categories: {
            create: categoryIds.map((catId: string) => ({
              categoryId: catId,
              sortOrder: 0,
              required: true,
            })),
          },
        },
        include: {
          categories: {
            include: { category: { select: { id: true, name: true } } },
          },
          values: true,
        },
      });
    });

    await logActivity({
      userId: req.user?.id || null,
      action: 'UPDATE',
      entity: 'CHARACTERISTIC',
      entityId: characteristic.id,
      details: `Caractéristique "${characteristic.name}" mise à jour (${categoryIds.length} catégorie(s))`,
    });

    return NextResponse.json(characteristic);
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ message: 'ID requis.' }, { status: 400 });
    }

    const characteristic = await prisma.characteristic.delete({ where: { id } });

    await logActivity({
      userId: req.user?.id || null,
      action: 'DELETE',
      entity: 'CHARACTERISTIC',
      entityId: characteristic.id,
      details: `Caractéristique "${characteristic.name}" supprimée`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}
