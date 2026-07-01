import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { Prisma, PaymentStatus } from '@prisma/client';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');
    const status = searchParams.get('status');

    const where: Prisma.PaymentWhereInput = {};
    if (transactionId) {
      where.transactionId = { contains: transactionId };
    }
    if (status) {
      where.status = status as PaymentStatus;
    }

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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = payments.map((payment) => ({
      ...payment,
      amount: parseFloat(payment.amount.toString()),
      order: payment.order
        ? {
            ...payment.order,
            totalAmount: parseFloat(payment.order.totalAmount.toString()),
          }
        : null,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur GET payments:', _error);
    return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
