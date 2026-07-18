import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

// Totaux d'une session (ventes, espèces attendues).
async function sessionTotals(sessionId: string, openingFloat: number) {
  const transactions = await prisma.posTransaction.findMany({
    where: { sessionId },
    select: { finalAmount: true, paidAmount: true, paymentMethod: true },
  });
  const salesTotal = transactions.reduce((s, t) => s + Number(t.finalAmount), 0);
  const cashCollected = transactions
    .filter((t) => t.paymentMethod === 'CASH')
    .reduce((s, t) => s + Number(t.paidAmount), 0);
  return {
    txCount: transactions.length,
    salesTotal,
    cashCollected,
    expectedCash: openingFloat + cashCollected,
  };
}

// GET /api/pos/session — session ouverte du vendeur + dernières sessions clôturées.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'pos.access');
  if (!auth.authorized) return auth.response!;
  const userId = auth.userId!;

  const open = await prisma.posSession.findFirst({
    where: { userId, status: 'OPEN' },
    orderBy: { openedAt: 'desc' },
  });

  const history = await prisma.posSession.findMany({
    where: { userId, status: 'CLOSED' },
    orderBy: { closedAt: 'desc' },
    take: 15,
  });

  let current = null;
  if (open) {
    const totals = await sessionTotals(open.id, Number(open.openingFloat));
    current = {
      id: open.id,
      openedAt: open.openedAt,
      openingFloat: Number(open.openingFloat),
      ...totals,
    };
  }

  return NextResponse.json({
    current,
    history: history.map((s) => ({
      id: s.id,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      openingFloat: Number(s.openingFloat),
      closingCash: s.closingCash !== null ? Number(s.closingCash) : null,
      expectedCash: s.expectedCash !== null ? Number(s.expectedCash) : null,
      variance: s.variance !== null ? Number(s.variance) : null,
      closingNotes: s.closingNotes,
    })),
  });
}

// POST /api/pos/session — ouvre une session avec un fond de caisse.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'pos.access');
  if (!auth.authorized) return auth.response!;
  const userId = auth.userId!;

  let body: { openingFloat?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 });
  }
  const openingFloat = Number(body.openingFloat ?? 0);
  if (!Number.isFinite(openingFloat) || openingFloat < 0) {
    return NextResponse.json({ message: 'Fond de caisse invalide.' }, { status: 400 });
  }

  const existing = await prisma.posSession.findFirst({ where: { userId, status: 'OPEN' } });
  if (existing) {
    return NextResponse.json({ message: 'Une session est déjà ouverte.' }, { status: 409 });
  }

  const session = await prisma.posSession.create({
    data: { userId, status: 'OPEN', openingFloat: new Prisma.Decimal(openingFloat) },
  });

  await logActivity({ userId, action: 'OPEN', entity: 'POS_SESSION', entityId: session.id, details: `Ouverture de caisse (fond: ${openingFloat})` });
  return NextResponse.json({ ok: true, sessionId: session.id });
}

// PUT /api/pos/session — clôture la session ouverte (comptage + écart).
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'pos.close-session');
  if (!auth.authorized) return auth.response!;
  const userId = auth.userId!;

  let body: { closingCash?: number; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 });
  }
  const closingCash = Number(body.closingCash);
  if (!Number.isFinite(closingCash) || closingCash < 0) {
    return NextResponse.json({ message: 'Montant compté invalide.' }, { status: 400 });
  }

  const open = await prisma.posSession.findFirst({ where: { userId, status: 'OPEN' } });
  if (!open) {
    return NextResponse.json({ message: 'Aucune session ouverte à clôturer.' }, { status: 404 });
  }

  const totals = await sessionTotals(open.id, Number(open.openingFloat));
  const variance = closingCash - totals.expectedCash;

  await prisma.posSession.update({
    where: { id: open.id },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
      closingCash: new Prisma.Decimal(closingCash),
      expectedCash: new Prisma.Decimal(totals.expectedCash),
      variance: new Prisma.Decimal(variance),
      closingNotes: body.notes?.trim() || null,
    },
  });

  await logActivity({
    userId,
    action: 'CLOSE',
    entity: 'POS_SESSION',
    entityId: open.id,
    details: `Clôture de caisse — attendu ${totals.expectedCash}, compté ${closingCash}, écart ${variance}`,
  });

  return NextResponse.json({
    ok: true,
    report: {
      sessionId: open.id,
      openedAt: open.openedAt,
      openingFloat: Number(open.openingFloat),
      txCount: totals.txCount,
      salesTotal: totals.salesTotal,
      cashCollected: totals.cashCollected,
      expectedCash: totals.expectedCash,
      closingCash,
      variance,
    },
  });
}
