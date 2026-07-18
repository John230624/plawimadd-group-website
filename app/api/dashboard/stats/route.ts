import { NextRequest, NextResponse } from 'next/server';

import { authorizeByPermission } from '@/lib/authUtils';
import prisma from '@/lib/prisma';

function monthKey(date: Date): string {
  return date.toISOString().substring(0, 7);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult = await authorizeByPermission(req, 'reports.view');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const granularity = searchParams.get('granularity') || 'auto';

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

    const diffDays = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    const resolvedGranularity = granularity === 'auto'
      ? (diffDays <= 14 ? 'day' : diffDays <= 60 ? 'week' : 'month')
      : granularity;

    const orderWhere = { orderDate: { gte: dateFrom, lte: dateTo } };
    const nonPosOrderWhere = { ...orderWhere, id: { not: { startsWith: 'POS-' } } };

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
      ordersByDayResult,
      orderRevenueByDayResult,
      posRevenueByDayResult,
      posTotalRevenueResult,
      outstandingCreditResult,
    ] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.order.count({ where: orderWhere }),
      prisma.order.count({ where: { ...orderWhere, status: 'PENDING' } }),
      prisma.order.count({ where: { ...orderWhere, paymentStatus: 'COMPLETED' } }),
      prisma.order.count({ where: { ...orderWhere, status: 'CANCELLED' } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'COMPLETED', ...nonPosOrderWhere },
      }),
      prisma.user.count(),
      prisma.$queryRaw<{ c: bigint }[]>`SELECT COUNT(*) AS c FROM products WHERE deletedAt IS NULL AND stock > 0 AND stock <= COALESCE(lowStockThreshold, 5)`.then((r) => Number(r[0]?.c ?? 0)),
      prisma.product.count({ where: { stock: { lte: 0 }, deletedAt: null } }),
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
          userPhoneNumber: true,
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
        where: orderWhere,
        orderBy: { orderDate: 'asc' },
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
      // Crédits en cours : reste à recouvrer sur les ventes à tranches (toutes périodes)
      prisma.posTransaction.aggregate({
        _sum: { remainingBalance: true },
        _count: { id: true },
        where: { paymentMethod: 'INSTALLMENT', remainingBalance: { gt: 0 } },
      }),
    ]);

    // Fusionner les revenus par jour (order + pos)
    const dailyRevenueMap = new Map<string, number>();
    const dailyOrderCountMap = new Map<string, number>();

    orderRevenueByDayResult.forEach((item) => {
      const key = item.orderDate.toISOString().slice(0, 10);
      dailyRevenueMap.set(key, (dailyRevenueMap.get(key) || 0) + (item._sum.totalAmount?.toNumber() || 0));
    });
    posRevenueByDayResult.forEach((item) => {
      const key = item.createdAt.toISOString().slice(0, 10);
      dailyRevenueMap.set(key, (dailyRevenueMap.get(key) || 0) + (item._sum.finalAmount?.toNumber() || 0));
    });
    ordersByDayResult.forEach((item) => {
      const key = item.orderDate.toISOString().slice(0, 10);
      dailyOrderCountMap.set(key, (dailyOrderCountMap.get(key) || 0) + item._count.id);
    });

    // Générer les points selon la granularité
    const revenueOverTime: { label: string; value: number }[] = [];
    const ordersOverTime: { label: string; count: number }[] = [];

    if (resolvedGranularity === 'day') {
      let d = new Date(dateFrom);
      while (d <= dateTo) {
        const key = d.toISOString().slice(0, 10);
        const day = d.getDate();
        const month = d.toLocaleString('fr-FR', { month: 'short' });
        revenueOverTime.push({ label: `${day} ${month}`, value: dailyRevenueMap.get(key) || 0 });
        ordersOverTime.push({ label: `${day} ${month}`, count: dailyOrderCountMap.get(key) || 0 });
        d.setDate(d.getDate() + 1);
      }
    } else if (resolvedGranularity === 'week') {
      // Grouper par semaine
      const weekMap = new Map<string, { revenue: number; orders: number }>();
      let d = new Date(dateFrom);
      while (d <= dateTo) {
        const key = d.toISOString().slice(0, 10);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const weekLabel = `Sem ${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)} ${d.toLocaleString('fr-FR', { month: 'short' })}`;
        const wKey = weekStart.toISOString().slice(0, 10);
        const existing = weekMap.get(wKey) || { revenue: 0, orders: 0 };
        weekMap.set(wKey, {
          revenue: existing.revenue + (dailyRevenueMap.get(key) || 0),
          orders: existing.orders + (dailyOrderCountMap.get(key) || 0),
        });
        d.setDate(d.getDate() + 1);
      }
      // Utiliser le lundi comme clé de semaine
      const sortedWeeks = Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b));
      for (const [_, data] of sortedWeeks) {
        const d = new Date(_);
        const label = `Sem ${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('fr-FR', { month: 'short' })}`;
        revenueOverTime.push({ label, value: data.revenue });
        ordersOverTime.push({ label, count: data.orders });
      }
    } else {
      // Mensuel
      const startMonth = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1);
      const endMonthDate = new Date(dateTo.getFullYear(), dateTo.getMonth(), 1);
      const totalMonths = Math.max(1, ((endMonthDate.getFullYear() - startMonth.getFullYear()) * 12) + (endMonthDate.getMonth() - startMonth.getMonth()) + 1);
      const monthLabels = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (let i = 0; i < totalMonths && i < 12; i++) {
        const currentMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
        if (currentMonth > dateTo) break;
        const key = monthKey(currentMonth);
        const monthRev = Array.from(dailyRevenueMap.entries())
          .filter(([k]) => k.startsWith(key))
          .reduce((sum, [, v]) => sum + v, 0);
        const monthOrders = Array.from(dailyOrderCountMap.entries())
          .filter(([k]) => k.startsWith(key))
          .reduce((sum, [, v]) => sum + v, 0);
        const label = `${monthLabels[currentMonth.getMonth()]} ${String(currentMonth.getFullYear()).slice(2)}`;
        revenueOverTime.push({ label, value: monthRev });
        ordersOverTime.push({ label, count: monthOrders });
      }
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

    // Résolution des infos client pour les ventes au comptoir (POS-)
    const recentPosIds = recentOrders
      .filter((order) => order.id.startsWith('POS-'))
      .map((order) => order.id.replace(/^POS-/, ''));
    const recentPosTransactions = recentPosIds.length > 0
      ? await prisma.posTransaction.findMany({
          where: { id: { in: recentPosIds } },
          select: { id: true, customerName: true, customerPhone: true, paymentMethod: true },
        })
      : [];
    const recentPosMap = new Map(recentPosTransactions.map((t) => [t.id, t]));

    const formattedRecentOrders = recentOrders.map((order) => {
      const posTx = order.id.startsWith('POS-')
        ? recentPosMap.get(order.id.replace(/^POS-/, ''))
        : null;
      const onlineName = `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim();
      return {
        orderId: order.id,
        customerName: posTx?.customerName || onlineName || 'Client',
        customerEmail: posTx ? (posTx.customerPhone || '') : (order.user?.email || ''),
        totalAmount: order.totalAmount.toNumber(),
        orderStatus: order.status,
        paymentStatus: order.payment?.status || order.paymentStatus,
        orderDate: order.orderDate.toISOString(),
        paymentMethod: posTx?.paymentMethod || order.payment?.paymentMethod || null,
        paymentTransactionId: order.payment?.transactionId || null,
        paymentDate: order.payment?.paymentDate?.toISOString() || null,
        isPosOrder: Boolean(posTx),
      };
    });

    const totalRevenue = (totalRevenueResult._sum.totalAmount?.toNumber() || 0) + (posTotalRevenueResult._sum.finalAmount?.toNumber() || 0);
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    const outstandingCredit = outstandingCreditResult._sum.remainingBalance?.toNumber() || 0;
    const openCreditCount = outstandingCreditResult._count.id || 0;
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
            description: `${lowStockCount} reference(s) sous leur seuil d'alerte.`,
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
        outstandingCredit,
        openCreditCount,
        totalUsers,
        lowStockCount,
        outOfStockCount,
        pendingStudentRequests,
        alerts,
        countryBreakdown,
        recentOrders: formattedRecentOrders,
        revenueOverTime,
        ordersOverTime,
        revenueGranularity: resolvedGranularity,
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
