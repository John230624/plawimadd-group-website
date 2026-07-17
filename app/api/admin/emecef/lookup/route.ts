import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';

// GET /api/admin/emecef/lookup?source=POS|ORDER&id=<docId>
// Retourne la facture normalisée liée à un document (ou null).
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'orders.view');
  if (!auth.authorized) return auth.response!;

  const url = new URL(req.url);
  const source = url.searchParams.get('source');
  const id = url.searchParams.get('id');
  if (!id || (source !== 'POS' && source !== 'ORDER')) {
    return NextResponse.json({ message: 'Paramètres invalides (source, id).' }, { status: 400 });
  }

  const invoice = await prisma.normalizedInvoice.findFirst({
    where: source === 'ORDER' ? { orderId: id } : { posTransactionId: id },
    select: {
      id: true,
      status: true,
      type: true,
      nim: true,
      counters: true,
      ni: true,
      environment: true,
      errorDesc: true,
      confirmedAt: true,
    },
  });

  return NextResponse.json({ invoice });
}
