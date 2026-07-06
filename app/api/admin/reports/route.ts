import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';

function monthKey(date: Date): string {
  return date.toISOString().substring(0, 7);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date;

    if (startDate) {
      dateFrom = new Date(startDate);
    } else {
      dateFrom = new Date();
      dateFrom.setMonth(dateFrom.getMonth() - 11);
      dateFrom.setDate(1);
    }
    dateFrom.setHours(0, 0, 0, 0);

    if (endDate) {
      dateTo = new Date(endDate + 'T23:59:59.999Z');
    } else {
      dateTo = new Date(now);
      dateTo.setHours(23, 59, 59, 999);
    }

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
        where: { paymentStatus: 'COMPLETED', orderDate: { gte: dateFrom, lte: dateTo } },
      }),
      prisma.order.count({ where: { orderDate: { gte: dateFrom, lte: dateTo } } }),
      prisma.product.count(),
      prisma.user.count(),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      prisma.order.findMany({
        where: { orderDate: { gte: dateFrom, lte: dateTo } },
        orderBy: sortBy === 'date' ? { orderDate: sortOrder as 'asc' | 'desc' } :
                 sortBy === 'total' ? { totalAmount: sortOrder as 'asc' | 'desc' } :
                 { orderDate: 'desc' },
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
          orderDate: { gte: dateFrom, lte: dateTo },
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

    // Revenu réel par produit : SUM(priceAtOrder * quantity) pour les commandes complétées
    const productRevenueMap = new Map<string, number>();
    if (productIds.length > 0) {
      const orderItemsWithRevenue = await prisma.orderItem.findMany({
        where: {
          productId: { in: productIds },
          order: { paymentStatus: 'COMPLETED', orderDate: { gte: dateFrom, lte: dateTo } },
        },
        select: {
          productId: true,
          quantity: true,
          priceAtOrder: true,
        },
      });
      for (const item of orderItemsWithRevenue) {
        const rev = Number(item.priceAtOrder) * item.quantity;
        productRevenueMap.set(item.productId, (productRevenueMap.get(item.productId) || 0) + rev);
      }
    }

    const formattedTopProducts: { rank: number; name: string; totalSold: number; revenue: number }[] = [];
    for (let i = 0; i < topProducts.length; i++) {
      const item = topProducts[i];
      formattedTopProducts.push({
        rank: i + 1,
        name: productsMap.get(item.productId) || 'Produit inconnu',
        totalSold: item._sum.quantity || 0,
        revenue: Math.round(productRevenueMap.get(item.productId) || 0),
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

    const twelveMonthsAgo = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1);
    const revenueByMonth: { month: string; revenue: number }[] = [];
    const monthCount = Math.max(1, Math.ceil((dateTo.getTime() - twelveMonthsAgo.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    for (let i = 0; i < monthCount && i < 12; i++) {
      const d = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
      if (d > dateTo) break;
      const key = monthKey(d);
      revenueByMonth.push({ month: key, revenue: monthlyRevenueMap.get(key) || 0 });
    }

    const totalRevenue = totalRevenueResult._sum.totalAmount?.toNumber() || 0;

    // Agrégations pour les StatCards supplémentaires
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todayRevenue = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: 'COMPLETED', orderDate: { gte: todayStart, lte: todayEnd } },
    });
    const todayOrders = await prisma.order.count({
      where: { orderDate: { gte: todayStart, lte: todayEnd } },
    });
    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING', orderDate: { gte: dateFrom, lte: dateTo } },
    });

    return NextResponse.json(
      {
        success: true,
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers: totalUsers,
        topProducts: formattedTopProducts,
        recentOrders: formattedRecentOrders,
        monthlyRevenues: revenueByMonth,
        todayRevenue: todayRevenue._sum.totalAmount?.toNumber() || 0,
        todayOrders,
        pendingOrders,
      },
      { status: 200 }
    );
  } catch (_error: unknown) {
    console.error('Erreur GET reports:', _error);
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
