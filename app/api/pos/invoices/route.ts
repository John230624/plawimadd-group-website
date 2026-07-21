import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'pos.view-transactions');
  if (!authResult.authorized) return authResult.response!;
  const userId = authResult.userId!;
  const isAdmin = authResult.userRole === 'ADMIN' || authResult.userRole === 'ADMINSUPRA';

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const method = searchParams.get('method') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    const where: any = {};
    if (!isAdmin) where.userId = userId;
    // Filtre par mode de paiement (CASH, TRANSFER, INSTALLMENT)
    if (method && ['CASH', 'TRANSFER', 'INSTALLMENT'].includes(method)) {
      where.paymentMethod = method;
    }
    // Filtre par statut de règlement (pour les ventes à crédit)
    if (status === 'PAID') {
      where.remainingBalance = { lte: 0 };
    } else if (status === 'UNPAID') {
      where.remainingBalance = { gt: 0 };
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.posTransaction.findMany({
        where,
        include: {
          items: { include: { product: { select: { name: true } } } },
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.posTransaction.count({ where }),
    ]);

    const invoices = transactions.map((t) => ({
      id: t.id,
      invoiceNumber: t.invoiceNumber,
      customerName: t.customerName,
      customerPhone: t.customerPhone,
      customerEmail: t.customerEmail,
      totalAmount: Number(t.totalAmount),
      discount: Number(t.discount),
      discountReason: t.discountReason,
      finalAmount: Number(t.finalAmount),
      paidAmount: Number(t.paidAmount),
      remainingBalance: Number(t.remainingBalance),
      paymentMethod: t.paymentMethod,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
      sellerName: t.user.firstName && t.user.lastName ? `${t.user.firstName} ${t.user.lastName}` : 'Vendeur',
      items: t.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
    }));

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json({ message: 'Erreur lors du chargement des factures' }, { status: 500 });
  }
}
