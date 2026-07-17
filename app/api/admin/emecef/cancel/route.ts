import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { cancelNormalized } from '@/lib/emecef-service';
import { EmecefError } from '@/lib/emecef';
import { logActivity } from '@/lib/logActivity';

// POST /api/admin/emecef/cancel
// Body: { normalizedInvoiceId: string }
// Émet un avoir (FA/EA) pour annuler une facture normalisée confirmée.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'orders.edit');
  if (!auth.authorized) return auth.response!;

  let body: { normalizedInvoiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Corps JSON invalide.' }, { status: 400 });
  }
  if (!body.normalizedInvoiceId) {
    return NextResponse.json({ ok: false, message: "Champ 'normalizedInvoiceId' requis." }, { status: 400 });
  }

  try {
    const invoice = await cancelNormalized(body.normalizedInvoiceId, auth.userId);
    await logActivity({
      userId: auth.userId,
      action: 'CANCEL',
      entity: 'INVOICE',
      entityId: invoice.id,
      details: `Avoir e-MECeF émis pour la facture ${invoice.nim ?? invoice.id}`,
    });
    return NextResponse.json({ ok: true, invoice });
  } catch (err) {
    const e = err as EmecefError;
    return NextResponse.json(
      { ok: false, code: e.code || 'ERROR', message: e.message },
      { status: e.status && e.status >= 400 && e.status < 500 ? e.status : 502 },
    );
  }
}
