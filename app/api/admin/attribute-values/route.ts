import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'characteristics.view');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const characteristicId = searchParams.get('characteristicId');

    const where = characteristicId ? { characteristicId } : {};

    const values = await prisma.attributeValue.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(values);
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'characteristics.create');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { characteristicId, value, valueSlug, colorCode, imageUrl, sortOrder } = await req.json();

    if (!characteristicId || !value || !value.trim()) {
      return NextResponse.json({ message: 'characteristicId et value requis.' }, { status: 400 });
    }

    const attrValue = await prisma.attributeValue.create({
      data: {
        characteristicId,
        value: value.trim(),
        valueSlug: valueSlug || value.trim().toLowerCase().replace(/\s+/g, '-'),
        colorCode: colorCode || null,
        imageUrl: imageUrl || null,
        sortOrder: sortOrder ?? 0,
      },
    });

    await logActivity({
      userId: req.user?.id || null,
      action: 'CREATE',
      entity: 'ATTRIBUTE_VALUE',
      entityId: attrValue.id,
      details: `Valeur "${attrValue.value}" créée`,
    });

    return NextResponse.json(attrValue, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as Record<string, unknown>).code === 'P2002') {
      return NextResponse.json({ message: 'Cette valeur existe déjà pour cette caractéristique.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'characteristics.edit');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { id, value, valueSlug, colorCode, imageUrl, sortOrder, isActive } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'ID requis.' }, { status: 400 });
    }

    const attrValue = await prisma.attributeValue.update({
      where: { id },
      data: {
        ...(value !== undefined && { value: value.trim() }),
        ...(valueSlug !== undefined && { valueSlug }),
        ...(colorCode !== undefined && { colorCode: colorCode || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await logActivity({
      userId: req.user?.id || null,
      action: 'UPDATE',
      entity: 'ATTRIBUTE_VALUE',
      entityId: attrValue.id,
      details: `Valeur "${attrValue.value}" mise à jour`,
    });

    return NextResponse.json(attrValue);
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'characteristics.delete');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID requis.' }, { status: 400 });
    }

    await prisma.attributeValue.delete({ where: { id } });

    await logActivity({
      userId: req.user?.id || null,
      action: 'DELETE',
      entity: 'ATTRIBUTE_VALUE',
      entityId: id,
      details: `Valeur d'attribut supprimée`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}
