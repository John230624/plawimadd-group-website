import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest } from '@/lib/authUtils';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const authResult = await authorizeAdminRequest(_req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const orders = await prisma.order.findMany({
      where: { studentInstallments: { some: {} } },
      include: {
        studentInstallments: { orderBy: { installmentNumber: 'asc' } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'Commande;Client;Email;Total commande;Tranche;Montant;Echeance;Statut;Paye le;Reference;Mode paiement;Frais retard;Notes\n';
    const rows = orders.flatMap((o) =>
      o.studentInstallments.map((inst) => {
        const clientName = `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.trim();
        return [
          o.id.slice(0, 8),
          clientName,
          o.user?.email || '',
          Number(o.totalAmount).toLocaleString('fr-FR'),
          `Tranche ${inst.installmentNumber}`,
          Number(inst.amount).toLocaleString('fr-FR'),
          new Date(inst.dueDate).toLocaleDateString('fr-FR'),
          inst.status,
          inst.paidAt ? new Date(inst.paidAt).toLocaleDateString('fr-FR') : '',
          inst.paymentReference || '',
          inst.paymentMethod || '',
          inst.lateFee ? Number(inst.lateFee).toLocaleString('fr-FR') : '',
          (inst.notes || '').replace(/;/g, ','),
        ].join(';');
      })
    ).join('\n');

    const csv = '\uFEFF' + header + rows;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="echeanciers-export.csv"',
      },
    });
  } catch (error) {
    console.error('Erreur export CSV echeances:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
