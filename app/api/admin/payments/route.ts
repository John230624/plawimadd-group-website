import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { Prisma, PaymentStatus } from '@prisma/client';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const transactionId = searchParams.get('transactionId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Prisma.PaymentWhereInput = {};

    const searchValue = search || transactionId;
    if (searchValue) {
      where.OR = [
        { transactionId: { contains: searchValue } },
        { order: { userEmail: { contains: searchValue } } },
      ];
    }

    if (status) {
      where.status = status as PaymentStatus;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const allowedSortFields = ['createdAt', 'amount', 'status'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const total = await prisma.payment.count({ where });

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            userEmail: true,
            orderDate: true,
            orderItems: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: { [safeSortBy]: safeSortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = payments.map((payment) => ({
      id: payment.id,
      transactionId: payment.transactionId,
      orderId: payment.orderId,
      client: payment.order?.userEmail || 'N/A',
      method: payment.paymentMethod,
      amount: parseFloat(payment.amount.toString()),
      status: payment.status,
      createdAt: payment.createdAt,
      order: payment.order
        ? {
            id: payment.order.id,
            total: parseFloat(payment.order.totalAmount.toString()),
            status: payment.order.status,
            items: payment.order.orderItems?.length || 0,
          }
        : null,
    }));

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur GET payments:', _error);
    return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
