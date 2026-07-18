import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';

export interface ReceivableItem {
  source: 'POS' | 'STUDENT';
  id: string; // id de transaction POS ou id de commande (étudiant)
  customer: string;
  phone: string | null;
  reference: string; // n° de facture ou n° de commande
  total: number;
  paid: number;
  remaining: number;
  nextDueDate: string | null;
  overdue: boolean;
  createdAt: Date;
}

// GET /api/admin/receivables — créances clients consolidées (crédit comptoir + tranches étudiantes).
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'orders.view');
  if (!auth.authorized) return auth.response!;

  const now = new Date();

  // 1) Crédit comptoir : transactions POS avec reste à payer.
  const posCredits = await prisma.posTransaction.findMany({
    where: { remainingBalance: { gt: 0 } },
    select: {
      id: true,
      invoiceNumber: true,
      customerName: true,
      customerPhone: true,
      finalAmount: true,
      paidAmount: true,
      remainingBalance: true,
      dueDate: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const posItems: ReceivableItem[] = posCredits.map((t) => ({
    source: 'POS',
    id: t.id,
    customer: t.customerName || 'Client comptoir',
    phone: t.customerPhone,
    reference: t.invoiceNumber,
    total: Number(t.finalAmount),
    paid: Number(t.paidAmount),
    remaining: Number(t.remainingBalance),
    nextDueDate: t.dueDate ? t.dueDate.toISOString() : null,
    overdue: t.dueDate ? t.dueDate < now : false,
    createdAt: t.createdAt,
  }));

  // 2) Tranches étudiantes impayées, consolidées par commande.
  const unpaid = await prisma.studentInstallment.findMany({
    where: { status: { in: ['PENDING', 'OVERDUE'] } },
    include: {
      order: {
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          userPhoneNumber: true,
          user: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  const byOrder = new Map<string, typeof unpaid>();
  for (const inst of unpaid) {
    const list = byOrder.get(inst.orderId) || [];
    list.push(inst);
    byOrder.set(inst.orderId, list);
  }

  const studentItems: ReceivableItem[] = [];
  for (const [orderId, insts] of byOrder) {
    const order = insts[0].order;
    const paidAgg = await prisma.studentInstallment.aggregate({
      where: { orderId, status: 'PAID' },
      _sum: { amount: true },
    });
    const remaining = insts.reduce((s, i) => s + Number(i.amount), 0);
    const next = insts[0]; // trié par dueDate croissant
    const customer = order.user?.firstName && order.user?.lastName
      ? `${order.user.firstName} ${order.user.lastName}`
      : order.user?.email || 'Étudiant';

    studentItems.push({
      source: 'STUDENT',
      id: orderId,
      customer,
      phone: order.userPhoneNumber || order.user?.phoneNumber || null,
      reference: `CMD-${orderId.slice(0, 8).toUpperCase()}`,
      total: Number(order.totalAmount),
      paid: Number(paidAgg._sum.amount ?? 0),
      remaining,
      nextDueDate: next.dueDate.toISOString(),
      overdue: next.dueDate < now || insts.some((i) => i.status === 'OVERDUE'),
      createdAt: order.createdAt,
    });
  }

  const items = [...posItems, ...studentItems].sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    const da = a.nextDueDate ? new Date(a.nextDueDate).getTime() : Infinity;
    const db = b.nextDueDate ? new Date(b.nextDueDate).getTime() : Infinity;
    return da - db;
  });

  return NextResponse.json({
    items,
    summary: {
      totalOutstanding: items.reduce((s, i) => s + i.remaining, 0),
      posOutstanding: posItems.reduce((s, i) => s + i.remaining, 0),
      studentOutstanding: studentItems.reduce((s, i) => s + i.remaining, 0),
      overdueCount: items.filter((i) => i.overdue).length,
      count: items.length,
    },
  });
}
