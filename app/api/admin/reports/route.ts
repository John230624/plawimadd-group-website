import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';

async function getMonthRange(monthsBack: number): Promise<Date> {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsBack);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function monthKey(date: Date): string {
  return date.toISOString().substring(0, 7);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const twelveMonthsAgo = await getMonthRange(11);

    const [
      totalRevenueResult,
      totalOrders,
      totalProducts,
      totalUsers,
      topProducts,
      recentOrders,
      revenueByMonthResult,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'COMPLETED' },
      }),
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      prisma.order.findMany({
        orderBy: { orderDate: 'desc' },
        take: 10,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          payment: { select: { status: true, paymentMethod: true, transactionId: true } },
        },
      }),
      prisma.order.groupBy({
        by: ['orderDate'],
        _sum: { totalAmount: true },
        where: {
          paymentStatus: 'COMPLETED',
          orderDate: { gte: twelveMonthsAgo },
        },
        orderBy: { orderDate: 'asc' },
      }),
    ]);

    const productIds = topProducts.map((p) => p.productId);
    const productsMap = new Map<string, string>();
    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      });
      for (const p of products) productsMap.set(p.id, p.name);
    }

    const formattedTopProducts: { rank: number; name: string; totalSold: number; revenue: number }[] = [];
    for (let i = 0; i < topProducts.length; i++) {
      const item = topProducts[i];
      formattedTopProducts.push({
        rank: i + 1,
        name: productsMap.get(item.productId) || 'Produit inconnu',
        totalSold: item._sum.quantity || 0,
        revenue: 0,
      });
    }

    const formattedRecentOrders = recentOrders.map((order) => ({
      id: order.id,
      client: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || order.user?.email || 'Inconnu',
      total: parseFloat(order.totalAmount.toString()),
      status: order.status,
      date: order.orderDate.toISOString(),
    }));

    const monthlyRevenueMap = new Map<string, number>();
    revenueByMonthResult.forEach((item) => {
      const key = monthKey(item.orderDate);
      monthlyRevenueMap.set(
        key,
        (monthlyRevenueMap.get(key) || 0) + (item._sum.totalAmount?.toNumber() || 0)
      );
    });

    const revenueByMonth: { month: string; revenue: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
      const key = monthKey(d);
      revenueByMonth.push({ month: key, revenue: monthlyRevenueMap.get(key) || 0 });
    }

    return NextResponse.json(
      {
        success: true,
        totalRevenue: totalRevenueResult._sum.totalAmount?.toNumber() || 0,
        totalOrders,
        totalProducts,
        totalCustomers: totalUsers,
        topProducts: formattedTopProducts,
        recentOrders: formattedRecentOrders,
        monthlyRevenues: revenueByMonth,
      },
      { status: 200 }
    );
  } catch (_error: unknown) {
    console.error('Erreur GET reports:', _error);
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
