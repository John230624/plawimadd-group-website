import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';

function monthKey(date: Date): string {
  return date.toISOString().substring(0, 7);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'reports.view');
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

    const orderWhere = { orderDate: { gte: dateFrom, lte: dateTo } };
    const nonPosOrderWhere = { ...orderWhere, id: { not: { startsWith: 'POS-' } } };

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [
      totalRevenueResult,
      totalOrders,
      totalProducts,
      totalUsers,
      topProducts,
      recentOrders,
      revenueByMonthResult,
      posRevenueByMonthResult,
      posTotalRevenueResult,
      stockAggregation,
      costAggregation,
      productsAddedThisPeriod,
      productsAddedToday,
      todayOrderRevenue,
      todayPosRevenue,
      completedOrderItems,
      posTransactionItems,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'COMPLETED', ...nonPosOrderWhere },
      }),
      prisma.order.count({ where: orderWhere }),
      prisma.product.count(),
      prisma.user.count(),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      prisma.order.findMany({
        where: nonPosOrderWhere,
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
        where: { paymentStatus: 'COMPLETED', ...nonPosOrderWhere },
        orderBy: { orderDate: 'asc' },
      }),
      prisma.posTransaction.groupBy({
        by: ['createdAt'],
        _sum: { finalAmount: true },
        where: {
          paymentMethod: { in: ['CASH', 'TRANSFER'] },
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.posTransaction.aggregate({
        _sum: { finalAmount: true },
        where: {
          paymentMethod: { in: ['CASH', 'TRANSFER'] },
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      }),
      // Valeur totale du stock au prix de vente
      prisma.product.aggregate({
        _sum: { price: true, costPrice: true, stock: true },
        where: { visible: true, deletedAt: null },
      }),
      // Valeur totale du stock au prix de revient
      prisma.product.aggregate({
        _sum: { costPrice: true },
        where: { visible: true, deletedAt: null, costPrice: { not: null } },
      }),
      prisma.product.count({
        where: { createdAt: { gte: dateFrom, lte: dateTo } },
      }),
      prisma.product.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'COMPLETED', orderDate: { gte: todayStart, lte: todayEnd }, id: { not: { startsWith: 'POS-' } } },
      }),
      prisma.posTransaction.aggregate({
        _sum: { finalAmount: true },
        where: { paymentMethod: { in: ['CASH', 'TRANSFER'] }, createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      // OrderItems avec produits pour calculer le coût des ventes
      prisma.orderItem.findMany({
        where: {
          order: { paymentStatus: 'COMPLETED', orderDate: { gte: dateFrom, lte: dateTo } },
        },
        select: {
          quantity: true,
          priceAtOrder: true,
          product: { select: { costPrice: true } },
        },
      }),
      // POS transaction items avec produits pour calculer le coût des ventes POS
      prisma.posTransactionItem.findMany({
        where: {
          transaction: {
            paymentMethod: { in: ['CASH', 'TRANSFER'] },
            createdAt: { gte: dateFrom, lte: dateTo },
          },
        },
        select: {
          quantity: true,
          unitPrice: true,
          product: { select: { costPrice: true } },
        },
      }),
    ]);

    // Calcul du coût total des ventes réalisées
    let totalCostOfGoodsSold = 0;
    let fullyCostedOrders = 0;
    for (const item of completedOrderItems) {
      if (item.product.costPrice) {
        totalCostOfGoodsSold += Number(item.product.costPrice) * item.quantity;
        fullyCostedOrders++;
      }
    }
    for (const item of posTransactionItems) {
      if (item.product.costPrice) {
        totalCostOfGoodsSold += Number(item.product.costPrice) * item.quantity;
        fullyCostedOrders++;
      }
    }

    // Valeur du stock
    const totalSellingPrice = stockAggregation._sum.price
      ? Number(stockAggregation._sum.price) * (stockAggregation._sum.stock || 0)
      : 0;
    const totalCostPrice = costAggregation._sum.costPrice
      ? Number(costAggregation._sum.costPrice) * (stockAggregation._sum.stock || 0)
      : 0;
    const productCount = stockAggregation._sum.stock || 0;

    // Calcul plus précis : somme de (price * stock) et (costPrice * stock) par produit
    const allProducts = await prisma.product.findMany({
      where: { visible: true, deletedAt: null },
      select: { price: true, costPrice: true, stock: true },
    });
    let preciseStockValueAtSelling = 0;
    let preciseStockValueAtCost = 0;
    for (const p of allProducts) {
      preciseStockValueAtSelling += Number(p.price) * p.stock;
      if (p.costPrice) {
        preciseStockValueAtCost += Number(p.costPrice) * p.stock;
      }
    }
    const stockProfitPotential = preciseStockValueAtSelling - preciseStockValueAtCost;

    // Bénéfice réalisé
    const totalRevenue = (totalRevenueResult._sum.totalAmount?.toNumber() || 0) + (posTotalRevenueResult._sum.finalAmount?.toNumber() || 0);
    const realizedProfit = totalRevenue - totalCostOfGoodsSold;
    const profitMargin = totalRevenue > 0 ? (realizedProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const todayRevenue = (todayOrderRevenue._sum.totalAmount?.toNumber() || 0) + (todayPosRevenue._sum.finalAmount?.toNumber() || 0);
    const todayOrders = await prisma.order.count({
      where: { orderDate: { gte: todayStart, lte: todayEnd } },
    });
    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING', orderDate: { gte: dateFrom, lte: dateTo } },
    });

    const productIds = topProducts.map((p) => p.productId);
    const productsMap = new Map<string, string>();
    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      });
      for (const p of products) productsMap.set(p.id, p.name);
    }

    const productRevenueMap = new Map<string, number>();
    if (productIds.length > 0) {
      const orderItemsWithRevenue = await prisma.orderItem.findMany({
        where: {
          productId: { in: productIds },
          order: { paymentStatus: 'COMPLETED', orderDate: { gte: dateFrom, lte: dateTo } },
        },
        select: { productId: true, quantity: true, priceAtOrder: true },
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
      monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + (item._sum.totalAmount?.toNumber() || 0));
    });
    posRevenueByMonthResult.forEach((item) => {
      const key = monthKey(item.createdAt);
      monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + (item._sum.finalAmount?.toNumber() || 0));
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

    return NextResponse.json(
      {
        success: true,
        // Revenus & commandes
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers: totalUsers,
        todayRevenue,
        todayOrders,
        pendingOrders,
        averageOrderValue: Math.round(averageOrderValue),
        // Produits
        totalStockUnits: productCount,
        stockValueAtSellingPrice: preciseStockValueAtSelling,
        stockValueAtCostPrice: preciseStockValueAtCost,
        stockProfitPotential: Math.round(stockProfitPotential),
        productsAddedThisPeriod,
        productsAddedToday,
        // Bénéfices
        totalCostOfGoodsSold,
        realizedProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        fullyCostedOrders,
        // Données existantes
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
