import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/admin/purchases/[id]/receive
// Réceptionne l'achat : entrée de stock tracée + mise à jour du prix de revient.
export async function POST(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!auth.authorized) return auth.response!;
  const { id } = await context.params;

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { items: true, supplier: { select: { name: true } } },
  });
  if (!purchase) return NextResponse.json({ message: 'Achat introuvable.' }, { status: 404 });
  if (purchase.status === 'RECEIVED') {
    return NextResponse.json({ message: 'Achat déjà réceptionné.' }, { status: 409 });
  }
  if (purchase.status === 'CANCELLED') {
    return NextResponse.json({ message: 'Achat annulé — réception impossible.' }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    for (const item of purchase.items) {
      const updated = await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          costPrice: item.unitCost, // dernier prix d'achat = prix de revient
        },
        select: { stock: true },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          stockBefore: updated.stock - item.quantity,
          stockAfter: updated.stock,
          reason: `Réception achat (${purchase.supplier.name})`,
          reference: purchase.reference,
          unitCost: item.unitCost,
          userId: auth.userId,
        },
      });
    }
    await tx.purchase.update({
      where: { id },
      data: { status: 'RECEIVED', receivedAt: new Date() },
    });
  });

  await logActivity({ userId: auth.userId, action: 'RECEIVE', entity: 'PURCHASE', entityId: id, details: `Achat ${purchase.reference} réceptionné (${purchase.items.length} article(s))` });
  return NextResponse.json({ ok: true });
}
