import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'reviews.view');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Prisma.ReviewWhereInput = {};

    if (search) {
      where.OR = [
        { product: { name: { contains: search } } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    if (status !== 'ALL') {
      where.status = status;
    }

    if (dateFrom) {
      where.createdAt = { ...(where.createdAt as Prisma.DateTimeFilter || {}), gte: new Date(dateFrom) };
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      where.createdAt = { ...(where.createdAt as Prisma.DateTimeFilter || {}), lt: endDate };
    }

    const orderBy: Prisma.ReviewOrderByWithRelationInput = {};
    if (sortBy === 'product') {
      orderBy.product = { name: sortOrder as Prisma.SortOrder };
    } else if (sortBy === 'rating') {
      orderBy.rating = sortOrder as Prisma.SortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder as Prisma.SortOrder;
    } else {
      orderBy.createdAt = sortOrder as Prisma.SortOrder;
    }

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          product: {
            select: { id: true, name: true, imgUrl: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const data = reviews.map((review) => ({
      ...review,
      user: review.user
        ? {
            ...review.user,
            name: `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || review.user.email,
          }
        : null,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur GET reviews:', _error);
    return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'reviews.delete');
  if (!authResult.authorized) return authResult.response!;

  try {
    const body = await req.json();
    const { ids, action } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: 'Liste d\'IDs valide requise.' }, { status: 400 });
    }

    if (action === 'delete') {
      const result = await prisma.review.deleteMany({
        where: { id: { in: ids } },
      });

      await logActivity({
        userId: authResult.userId || null,
        action: 'UPDATE',
        entity: 'REVIEW',
        entityId: null,
        details: `${result.count} avis supprimés (IDs: ${ids.join(', ')})`,
      });

      return NextResponse.json({ success: true, message: `${result.count} avis supprimés.` }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'Action non supportée. Utilisez "delete".' }, { status: 400 });
  } catch (_error: unknown) {
    console.error('Erreur PATCH reviews:', _error);
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
