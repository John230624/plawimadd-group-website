import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { recordStockMovement, setInventoryLevel } from '@/lib/stock';
import { logActivity } from '@/lib/logActivity';

// GET /api/admin/stock/movements?productId=&page=&limit=
// Historique des mouvements de stock (filtrable par produit).
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!auth.authorized) return auth.response!;

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId') || undefined;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Number(searchParams.get('limit')) || 20);

  const where = productId ? { productId } : {};
  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return NextResponse.json({
    movements: movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      productName: m.product?.name ?? '',
      type: m.type,
      quantity: m.quantity,
      stockBefore: m.stockBefore,
      stockAfter: m.stockAfter,
      reason: m.reason,
      reference: m.reference,
      unitCost: m.unitCost ? Number(m.unitCost) : null,
      createdAt: m.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/admin/stock/movements
// Ajustement manuel ou comptage d'inventaire.
// Body: { productId, mode: 'ADJUSTMENT'|'INVENTORY'|'IN', quantity?, countedStock?, reason?, unitCost? }
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!auth.authorized) return auth.response!;

  let body: {
    productId?: string;
    mode?: string;
    quantity?: number;
    countedStock?: number;
    reason?: string;
    unitCost?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 });
  }

  if (!body.productId) {
    return NextResponse.json({ message: "Champ 'productId' requis." }, { status: 400 });
  }

  try {
    if (body.mode === 'INVENTORY') {
      if (typeof body.countedStock !== 'number' || body.countedStock < 0) {
        return NextResponse.json({ message: "'countedStock' invalide." }, { status: 400 });
      }
      const mv = await setInventoryLevel({
        productId: body.productId,
        countedStock: body.countedStock,
        reason: body.reason,
        userId: auth.userId,
      });
      await logActivity({ userId: auth.userId, action: 'INVENTORY', entity: 'STOCK', entityId: body.productId, details: `Inventaire → ${body.countedStock} (écart ${mv.quantity})` });
      return NextResponse.json({ ok: true, movement: mv });
    }

    // ADJUSTMENT ou IN : delta signé
    if (typeof body.quantity !== 'number' || body.quantity === 0) {
      return NextResponse.json({ message: "'quantity' (delta non nul) requis." }, { status: 400 });
    }
    const type = body.mode === 'IN' ? 'IN' : 'ADJUSTMENT';
    const mv = await recordStockMovement({
      productId: body.productId,
      type,
      quantity: body.quantity,
      reason: body.reason ?? (type === 'IN' ? 'Entrée de stock' : 'Ajustement manuel'),
      unitCost: body.unitCost ?? null,
      userId: auth.userId,
    });
    await logActivity({ userId: auth.userId, action: type, entity: 'STOCK', entityId: body.productId, details: `${type} ${body.quantity} (stock ${mv.stockAfter})` });
    return NextResponse.json({ ok: true, movement: mv });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message || 'Erreur mouvement de stock.' }, { status: 500 });
  }
}
