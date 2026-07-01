import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    const where: Prisma.CouponWhereInput = {};
    if (q) {
      where.code = { contains: q };
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(coupons, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const body = await req.json();
    const { code, discountType, discountValue, minAmount, maxUses, startsAt, expiresAt, active } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, message: 'Code requis.' }, { status: 400 });
    }
    if (!discountType || !['PERCENTAGE', 'FIXED'].includes(discountType)) {
      return NextResponse.json({ success: false, message: 'discountType doit être PERCENTAGE ou FIXED.' }, { status: 400 });
    }
    if (discountValue === undefined || discountValue === null || typeof discountValue !== 'number') {
      return NextResponse.json({ success: false, message: 'discountValue requis.' }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Ce code promo existe déjà.' }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue,
        minAmount: minAmount ?? 0,
        maxUses: maxUses ?? null,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: active ?? true,
      },
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
