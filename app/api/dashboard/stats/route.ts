import { NextRequest, NextResponse } from 'next/server';

import { authorizeAdminRequest } from '@/lib/authUtils';
import prisma from '@/lib/prisma';

function monthKey(date: Date): string {
  return date.toISOString().substring(0, 7);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Période par défaut : 6 derniers mois
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    let dateFrom = sixMonthsAgo;
    let dateTo = new Date();
    dateTo.setHours(23, 59, 59, 999);

    if (startDateParam) {
      dateFrom = new Date(startDateParam);
      dateFrom.setHours(0, 0, 0, 0);
    }
    if (endDateParam) {
      dateTo = new Date(endDateParam);
      dateTo.setHours(23, 59, 59, 999);
    }

    const orderWhere = { orderDate: { gte: dateFrom, lte: dateTo } };

    const [
      totalProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenueResult,
      totalUsers,
      lowStockCount,
      outOfStockCount,
      pendingStudentRequests,
      recentOrders,
      ordersPerMonthResult,
      revenuePerMonthResult,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count({ where: orderWhere }),
      prisma.order.count({ where: { ...orderWhere, status: 'PENDING' } }),
      prisma.order.count({ where: { ...orderWhere, paymentStatus: 'COMPLETED' } }),
      prisma.order.count({ where: { ...orderWhere, status: 'CANCELLED' } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { ...orderWhere, paymentStatus: 'COMPLETED' },
      }),
      prisma.user.count(),
      prisma.product.count({ where: { stock: { gt: 0, lte: 5 } } }),
      prisma.product.count({ where: { stock: { lte: 0 } } }),
      prisma.studentInstallmentRequest.count({ where: { status: 'PENDING' } }),
      prisma.order.findMany({
        where: orderWhere,
        orderBy: { orderDate: 'desc' },
        take: 15,
        select: {
          id: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          shippingCountry: true,
          orderDate: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          payment: {
            select: {
              paymentMethod: true,
              status: true,
              transactionId: true,
              paymentDate: true,
            },
          },
        },
      }),
      prisma.order.groupBy({
        by: ['orderDate'],
        _count: { id: true },
        where: { orderDate: { gte: dateFrom, lte: dateTo } },
        orderBy: { orderDate: 'asc' },
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

    const monthlyOrdersMap = new Map<string, number>();
    ordersPerMonthResult.forEach((item) => {
      const key = monthKey(item.orderDate);
      monthlyOrdersMap.set(key, (monthlyOrdersMap.get(key) || 0) + item._count.id);
    });

    const monthlyRevenueMap = new Map<string, number>();
    revenuePerMonthResult.forEach((item) => {
      const key = monthKey(item.orderDate);
      monthlyRevenueMap.set(
        key,
        (monthlyRevenueMap.get(key) || 0) + (item._sum.totalAmount?.toNumber() || 0)
      );
    });

    // Générer les mois entre dateFrom et dateTo
    const ordersPerMonth: { month: string; orderCount: number }[] = [];
    const revenuePerMonth: { month: string; totalMonthlyRevenue: number }[] = [];

    const startMonth = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1);
    const endMonth = new Date(dateTo.getFullYear(), dateTo.getMonth(), 1);
    const totalMonths = Math.max(1, ((endMonth.getFullYear() - startMonth.getFullYear()) * 12) + (endMonth.getMonth() - startMonth.getMonth()) + 1);

    for (let index = 0; index < totalMonths && index < 12; index += 1) {
      const currentMonth = new Date(
        startMonth.getFullYear(),
        startMonth.getMonth() + index,
        1
      );
      if (currentMonth > dateTo) break;
      const key = monthKey(currentMonth);

      ordersPerMonth.push({
        month: key,
        orderCount: monthlyOrdersMap.get(key) || 0,
      });
      revenuePerMonth.push({
        month: key,
        totalMonthlyRevenue: monthlyRevenueMap.get(key) || 0,
      });
    }

    const countryMap = new Map<string, number>();
    recentOrders.forEach((order) => {
      const country = order.shippingCountry || 'Non renseigne';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    const countryBreakdown = Array.from(countryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const formattedRecentOrders = recentOrders.map((order) => ({
      orderId: order.id,
      customerName: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
      customerEmail: order.user?.email || '',
      totalAmount: order.totalAmount.toNumber(),
      orderStatus: order.status,
      paymentStatus: order.payment?.status || order.paymentStatus,
      orderDate: order.orderDate.toISOString(),
      paymentMethod: order.payment?.paymentMethod || null,
      paymentTransactionId: order.payment?.transactionId || null,
      paymentDate: order.payment?.paymentDate?.toISOString() || null,
    }));

    const totalRevenue = totalRevenueResult._sum.totalAmount?.toNumber() || 0;
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    const alerts = [
      pendingOrders > 0
        ? {
            id: 'pending-orders',
            title: 'Commandes en attente',
            description: `${pendingOrders} commande(s) attendent un traitement.`,
            severity: 'warning',
            href: '/seller/orders',
          }
        : null,
      pendingStudentRequests > 0
        ? {
            id: 'student-requests',
            title: 'Demandes etudiantes',
            description: `${pendingStudentRequests} dossier(s) etudiant(s) a verifier.`,
            severity: 'info',
            href: '/seller/student-installment',
          }
        : null,
      lowStockCount > 0
        ? {
            id: 'low-stock',
            title: 'Stock faible',
            description: `${lowStockCount} reference(s) sous le seuil de 5 unites.`,
            severity: 'warning',
            href: '/seller/stocks',
          }
        : null,
      outOfStockCount > 0
        ? {
            id: 'out-of-stock',
            title: 'Ruptures de stock',
            description: `${outOfStockCount} produit(s) indisponibles.`,
            severity: 'error',
            href: '/seller/stocks',
          }
        : null,
    ].filter(Boolean);

    return NextResponse.json(
      {
        success: true,
        totalProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue,
        totalUsers,
        lowStockCount,
        outOfStockCount,
        pendingStudentRequests,
        alerts,
        countryBreakdown,
        recentOrders: formattedRecentOrders,
        ordersPerMonth,
        revenuePerMonth,
        message: 'Dashboard stats fetched successfully.',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Erreur lors de la récupération des statistiques du tableau de bord:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' },
      { status: 500 }
    );
  }
}
