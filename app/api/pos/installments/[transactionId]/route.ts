import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import { recordInstallmentPayment, InstallmentError } from '@/lib/installments';

/**
 * Charge la transaction POS et vérifie l'appartenance (le vendeur propriétaire
 * ou un admin). Retourne la transaction ou une réponse d'erreur.
 */
async function loadOwnedTransaction(transactionId: string, userId: string, isAdmin: boolean) {
  const transaction = await prisma.posTransaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      userId: true,
      customerName: true,
      customerPhone: true,
      invoiceNumber: true,
      finalAmount: true,
      paidAmount: true,
      remainingBalance: true,
      paymentMethod: true,
      dueDate: true,
    },
  });

  if (!transaction) {
    return { transaction: null, error: NextResponse.json({ message: 'Transaction introuvable.' }, { status: 404 }) };
  }
  if (!isAdmin && transaction.userId !== userId) {
    return { transaction: null, error: NextResponse.json({ message: 'Accès interdit.' }, { status: 403 }) };
  }
  return { transaction, error: null };
}

// GET: historique des tranches + résumé payé / reste / total
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> },
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'pos.view-transactions');
  if (!authResult.authorized) return authResult.response!;
  const isAdmin = authResult.userRole === 'ADMIN';

  const { transactionId } = await params;
  const { transaction, error } = await loadOwnedTransaction(transactionId, authResult.userId!, isAdmin);
  if (error) return error;

  const payments = await prisma.orderPayment.findMany({
    where: { orderId: `POS-${transactionId}` },
    include: { recordedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { paidAt: 'asc' },
  });

  const totalAmount = Number(transaction!.finalAmount);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, totalAmount - totalPaid);

  return NextResponse.json({
    success: true,
    transactionId,
    invoiceNumber: transaction!.invoiceNumber,
    customerName: transaction!.customerName,
    customerPhone: transaction!.customerPhone,
    paymentMethod: transaction!.paymentMethod,
    dueDate: transaction!.dueDate,
    totalAmount,
    totalPaid,
    remaining,
    isFullyPaid: remaining <= 0.5,
    payments: payments.map((p, index) => ({
      id: p.id,
      installmentNumber: index + 1,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      reference: p.reference,
      notes: p.notes,
      paidAt: p.paidAt,
      recordedByName: p.recordedBy
        ? `${p.recordedBy.firstName || ''} ${p.recordedBy.lastName || ''}`.trim() || null
        : null,
    })),
  });
}

// POST: encaisser une tranche
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> },
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'pos.sell');
  if (!authResult.authorized) return authResult.response!;
  const isAdmin = authResult.userRole === 'ADMIN';
  const userId = authResult.userId!;

  const { transactionId } = await params;
  const { transaction, error } = await loadOwnedTransaction(transactionId, userId, isAdmin);
  if (error) return error;

  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : 'CASH';
    const reference = typeof body.reference === 'string' ? body.reference.trim() : null;
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null;

    const result = await recordInstallmentPayment({
      orderId: `POS-${transactionId}`,
      amount,
      paymentMethod,
      reference,
      notes,
      recordedById: userId,
    });

    await logActivity({
      userId,
      action: 'INSTALLMENT_PAYMENT',
      entity: 'POS_TRANSACTION',
      entityId: transactionId,
      details: `Tranche de ${Math.round(amount)} XOF encaissée sur ${transaction!.invoiceNumber}. Payé: ${Math.round(result.totalPaid)}, Reste: ${Math.round(result.remaining)}${result.isFullyPaid ? ' (SOLDÉE)' : ''}`,
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (err) {
    if (err instanceof InstallmentError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    console.error('Erreur encaissement tranche POS:', err);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
