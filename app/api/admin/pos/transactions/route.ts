import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/lib/authUtils';
import prisma from '@/lib/prisma';

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult = await authorizeByPermission(req, 'pos.view-transactions');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 250), 500);

    const transactions = await prisma.posTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    });

    const today = startOfToday();
    const todayTransactions = transactions.filter((transaction) => transaction.createdAt >= today);
    const totalAmount = transactions.reduce((sum, transaction) => sum + Number(transaction.finalAmount), 0);
    const todayAmount = todayTransactions.reduce((sum, transaction) => sum + Number(transaction.finalAmount), 0);
    const cashAmount = transactions
      .filter((transaction) => transaction.paymentMethod === 'CASH')
      .reduce((sum, transaction) => sum + Number(transaction.finalAmount), 0);

    const data = transactions.map((transaction) => ({
      id: transaction.id,
      invoiceNumber: transaction.invoiceNumber,
      customerName: transaction.customerName,
      customerPhone: transaction.customerPhone,
      customerEmail: transaction.customerEmail,
      totalAmount: Number(transaction.totalAmount),
      discount: Number(transaction.discount),
      finalAmount: Number(transaction.finalAmount),
      paidAmount: Number(transaction.paidAmount),
      remainingBalance: Number(transaction.remainingBalance),
      dueDate: transaction.dueDate?.toISOString() || null,
      paymentMethod: transaction.paymentMethod,
      createdAt: transaction.createdAt.toISOString(),
      seller: {
        name:
          `${transaction.user.firstName || ''} ${transaction.user.lastName || ''}`.trim() ||
          transaction.user.email ||
          'Vendeur',
        email: transaction.user.email,
      },
      items: transaction.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    }));

    return NextResponse.json({
      success: true,
      stats: {
        transactions: transactions.length,
        todayTransactions: todayTransactions.length,
        totalAmount,
        todayAmount,
        cashAmount,
      },
      data,
    });
  } catch (error) {
    console.error('Admin POS transactions error:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
