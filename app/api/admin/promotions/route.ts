import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'promotions.view');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const status = searchParams.get('status') || 'all';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const now = new Date();

    const where: Prisma.CouponWhereInput = {};

    if (q) {
      where.code = { contains: q };
    }

    switch (status) {
      case 'active':
        where.active = true;
        where.AND = [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        ];
        break;
      case 'inactive':
        where.active = false;
        break;
      case 'expired':
        where.expiresAt = { not: null, lt: now };
        break;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const validSortFields = ['code', 'discountType', 'discountValue', 'minAmount', 'maxUses', 'usedCount', 'startsAt', 'expiresAt', 'active', 'createdAt', 'updatedAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [total, coupons] = await Promise.all([
      prisma.coupon.count({ where }),
      prisma.coupon.findMany({
        where,
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: coupons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'promotions.create');
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

    await logActivity({
      userId: authResult.userId || null,
      action: 'CREATE',
      entity: 'PROMOTION',
      entityId: coupon.id,
      details: `Code promo "${code}" créé`,
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
