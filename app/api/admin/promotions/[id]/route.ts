import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
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

    return NextResponse.json({ success: true, coupon }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  const { id } = await params;

  try {
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Promotion supprimée avec succès.' }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
