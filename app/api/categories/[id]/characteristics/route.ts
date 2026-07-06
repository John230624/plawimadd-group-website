import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  const { id } = await context.params;
  const body = await req.json() as { characteristicIds?: string[]; characteristics?: { id: string; required: boolean }[] };
  const items = Array.isArray(body.characteristics) ? body.characteristics : body.characteristicIds;

  if (!Array.isArray(items)) {
    return NextResponse.json({ message: 'characteristicIds requis.' }, { status: 400 });
  }

  try {
    await prisma.categoryCharacteristic.deleteMany({ where: { categoryId: id } });

    if (items.length > 0) {
      await prisma.categoryCharacteristic.createMany({
        data: items.map((item, index) => ({
          categoryId: id,
          characteristicId: typeof item === 'string' ? item : item.id,
          sortOrder: index,
          required: typeof item === 'string' ? true : item.required,
        })),
      });
    }

    await logActivity({
      userId: req.user?.id || null,
      action: 'UPDATE',
      entity: 'CATEGORY',
      entityId: id,
      details: 'Caractéristiques de la catégorie mises à jour',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}
