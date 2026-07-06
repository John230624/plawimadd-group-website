import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const statusFilter = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    const now = new Date();

    await prisma.studentInstallment.updateMany({
      where: { status: 'PENDING', dueDate: { lt: now } },
      data: { status: 'OVERDUE' },
    });

    const orderWhere: Record<string, unknown> = {
      studentInstallments: { some: {} },
    };

    if (statusFilter && statusFilter !== 'ALL') {
      orderWhere.studentInstallments = {
        some: { status: statusFilter },
      };
    }

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      orderWhere.createdAt = createdAt;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: orderWhere as any,
        include: {
          studentInstallments: {
            orderBy: { installmentNumber: 'asc' },
            include: {
              paidBy: { select: { firstName: true, lastName: true } },
            },
          },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: orderWhere as any }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Erreur chargement echeances:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
