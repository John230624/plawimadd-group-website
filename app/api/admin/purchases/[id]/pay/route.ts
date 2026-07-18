import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/admin/purchases/[id]/pay
// Enregistre un paiement fournisseur sur cet achat.
// Body: { amount, method?, reference?, notes? }
export async function POST(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!auth.authorized) return auth.response!;
  const { id } = await context.params;

  let body: { amount?: number; method?: string; reference?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ message: 'Montant invalide.' }, { status: 400 });
  }

  const purchase = await prisma.purchase.findUnique({ where: { id } });
  if (!purchase) return NextResponse.json({ message: 'Achat introuvable.' }, { status: 404 });
  if (purchase.status === 'CANCELLED') {
    return NextResponse.json({ message: 'Achat annulé — paiement impossible.' }, { status: 409 });
  }

  const remaining = Number(purchase.totalAmount) - Number(purchase.paidAmount);
  if (amount > remaining + 0.5) {
    return NextResponse.json({ message: `Le montant dépasse le reste à payer (${remaining}).` }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.supplierPayment.create({
      data: {
        supplierId: purchase.supplierId,
        purchaseId: id,
        amount: new Prisma.Decimal(amount),
        method: body.method?.trim() || 'CASH',
        reference: body.reference?.trim() || null,
        notes: body.notes?.trim() || null,
        userId: auth.userId,
      },
    }),
    prisma.purchase.update({
      where: { id },
      data: { paidAmount: { increment: amount } },
    }),
  ]);

  await logActivity({ userId: auth.userId, action: 'PAY', entity: 'PURCHASE', entityId: id, details: `Paiement fournisseur ${amount} sur ${purchase.reference}` });
  return NextResponse.json({ ok: true, remaining: remaining - amount });
}
