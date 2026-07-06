import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(_req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const now = new Date();

    const allInstallments = await prisma.studentInstallment.findMany({
      include: { order: { select: { totalAmount: true } } },
    });

    const totalCount = allInstallments.length;
    const paidCount = allInstallments.filter((i) => i.status === 'PAID').length;
    const pendingCount = allInstallments.filter((i) => i.status === 'PENDING').length;
    const overdueCount = allInstallments.filter((i) => i.status === 'OVERDUE').length;

    const paidAmount = allInstallments
      .filter((i) => i.status === 'PAID')
      .reduce((s, i) => s + Number(i.amount), 0);
    const pendingAmount = allInstallments
      .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
      .reduce((s, i) => s + Number(i.amount), 0);
    const lateFeesTotal = allInstallments
      .filter((i) => i.lateFee)
      .reduce((s, i) => s + Number(i.lateFee), 0);

    const totalOrderAmount = allInstallments
      .reduce((s, i) => s + Number(i.order?.totalAmount || 0), 0);

    const byMonth: Record<string, { paid: number; total: number }> = {};
    allInstallments.forEach((i) => {
      const date = i.paidAt || i.dueDate;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { paid: 0, total: 0 };
      byMonth[key].total += Number(i.amount);
      if (i.status === 'PAID') byMonth[key].paid += Number(i.amount);
    });

    const monthlyTrend = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    return NextResponse.json({
      success: true,
      stats: {
        totalCount,
        paidCount,
        pendingCount,
        overdueCount,
        paidAmount,
        pendingAmount,
        lateFeesTotal,
        totalOrderAmount,
        monthlyTrend,
        recoveryRate: totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Erreur stats echeances:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
