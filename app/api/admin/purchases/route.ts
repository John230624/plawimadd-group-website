import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

// GET /api/admin/purchases — liste paginée.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!auth.authorized) return auth.response!;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(50, Number(searchParams.get('limit')) || 20);
  const status = searchParams.get('status');

  const where = status && ['PENDING', 'RECEIVED', 'CANCELLED'].includes(status)
    ? { status: status as 'PENDING' | 'RECEIVED' | 'CANCELLED' }
    : {};

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);

  return NextResponse.json({
    purchases: purchases.map((p) => ({
      id: p.id,
      reference: p.reference,
      supplierName: p.supplier.name,
      supplierId: p.supplierId,
      status: p.status,
      totalAmount: Number(p.totalAmount),
      paidAmount: Number(p.paidAmount),
      balance: Number(p.totalAmount) - Number(p.paidAmount),
      itemCount: p.items.length,
      items: p.items.map((it) => ({
        productId: it.productId,
        productName: it.product.name,
        quantity: it.quantity,
        unitCost: Number(it.unitCost),
        totalCost: Number(it.totalCost),
      })),
      notes: p.notes,
      receivedAt: p.receivedAt,
      createdAt: p.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/admin/purchases — création d'une commande d'achat.
// Body: { supplierId, items: [{ productId, quantity, unitCost }], notes? }
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!auth.authorized) return auth.response!;

  let body: { supplierId?: string; items?: { productId: string; quantity: number; unitCost: number }[]; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 });
  }

  if (!body.supplierId) return NextResponse.json({ message: 'Fournisseur requis.' }, { status: 400 });
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ message: 'Au moins un article est requis.' }, { status: 400 });
  }
  for (const it of body.items) {
    if (!it.productId || !Number.isFinite(it.quantity) || it.quantity <= 0 || !Number.isFinite(it.unitCost) || it.unitCost < 0) {
      return NextResponse.json({ message: 'Article invalide (produit, quantité > 0, coût ≥ 0).' }, { status: 400 });
    }
  }

  const supplier = await prisma.supplier.findFirst({ where: { id: body.supplierId, deletedAt: null } });
  if (!supplier) return NextResponse.json({ message: 'Fournisseur introuvable.' }, { status: 404 });

  const total = body.items.reduce((s, it) => s + it.quantity * it.unitCost, 0);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const reference = `ACH-${dateStr}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const purchase = await prisma.purchase.create({
    data: {
      supplierId: body.supplierId,
      reference,
      totalAmount: new Prisma.Decimal(total),
      notes: body.notes?.trim() || null,
      createdById: auth.userId,
      items: {
        create: body.items.map((it) => ({
          productId: it.productId,
          quantity: Math.round(it.quantity),
          unitCost: new Prisma.Decimal(it.unitCost),
          totalCost: new Prisma.Decimal(it.quantity * it.unitCost),
        })),
      },
    },
    include: { items: true },
  });

  await logActivity({ userId: auth.userId, action: 'CREATE', entity: 'PURCHASE', entityId: purchase.id, details: `Achat ${reference} chez "${supplier.name}" (${body.items.length} article(s))` });
  return NextResponse.json({ ok: true, purchase: { id: purchase.id, reference: purchase.reference } });
}
