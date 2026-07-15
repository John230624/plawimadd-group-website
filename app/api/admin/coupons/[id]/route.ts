import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'promotions.edit');
  if (!authResult.authorized) return authResult.response!;

  const { id } = await params;

  try {
    const body = await req.json();
    const { code, discountType, discountValue, minAmount, maxUses, usedCount, startsAt, expiresAt, active } = body;

    const data: Record<string, unknown> = {};
    if (code !== undefined) data.code = code;
    if (discountType !== undefined) {
      if (!['PERCENTAGE', 'FIXED'].includes(discountType)) {
        return NextResponse.json({ success: false, message: 'discountType doit être PERCENTAGE ou FIXED.' }, { status: 400 });
      }
      data.discountType = discountType;
    }
    if (discountValue !== undefined) data.discountValue = discountValue;
    if (minAmount !== undefined) data.minAmount = minAmount;
    if (maxUses !== undefined) data.maxUses = maxUses;
    if (usedCount !== undefined) data.usedCount = usedCount;
    if (startsAt !== undefined) data.startsAt = startsAt ? new Date(startsAt) : null;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (active !== undefined) data.active = active;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, message: 'Aucun champ à mettre à jour.' }, { status: 400 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data,
    });

    await logActivity({ userId: authResult.userId, action: 'UPDATE', entity: 'COUPON', entityId: id, details: `Mise à jour du coupon ${coupon.code}` });

    return NextResponse.json({ success: true, coupon }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur PUT coupon:', _error);
    if (
      typeof _error === 'object' && _error !== null && 'code' in _error &&
      (_error as { code?: string }).code === 'P2025'
    ) {
      return NextResponse.json({ success: false, message: 'Coupon non trouvé.' }, { status: 404 });
    }
    if (
      typeof _error === 'object' && _error !== null && 'code' in _error &&
      (_error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json({ success: false, message: 'Ce code coupon existe déjà.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'promotions.delete');
  if (!authResult.authorized) return authResult.response!;

  const { id } = await params;

  try {
    const deleted = await prisma.coupon.delete({ where: { id } });
    await logActivity({ userId: authResult.userId, action: 'DELETE', entity: 'COUPON', entityId: id, details: `Suppression du coupon ${deleted.code}` });
    return NextResponse.json({ success: true, message: 'Coupon supprimé avec succès.' }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur DELETE coupon:', _error);
    if (
      typeof _error === 'object' && _error !== null && 'code' in _error &&
      (_error as { code?: string }).code === 'P2025'
    ) {
      return NextResponse.json({ success: false, message: 'Coupon non trouvé.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
