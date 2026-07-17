import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { normalizeDocument, type NormalizeSource } from '@/lib/emecef-service';
import { EmecefError, type EmecefInvoiceType } from '@/lib/emecef';
import { logActivity } from '@/lib/logActivity';

// POST /api/admin/emecef/normalize
// Body: { source: 'ORDER' | 'POS', id: string, type?: 'FV'|'EV' }
// Normalise un document (facture normalisée DGI) à la demande.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'orders.edit');
  if (!auth.authorized) return auth.response!;

  let body: { source?: string; id?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Corps JSON invalide.' }, { status: 400 });
  }

  const source = body.source as NormalizeSource;
  if (source !== 'ORDER' && source !== 'POS') {
    return NextResponse.json({ ok: false, message: "Champ 'source' invalide (ORDER|POS)." }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ ok: false, message: "Champ 'id' requis." }, { status: 400 });
  }
  const type = (body.type as EmecefInvoiceType) || 'FV';

  try {
    const invoice = await normalizeDocument({ source, id: body.id, type, userId: auth.userId });
    await logActivity({
      userId: auth.userId,
      action: 'NORMALIZE',
      entity: 'INVOICE',
      entityId: invoice.id,
      details: `Facture normalisée ${source} ${body.id} — NIM ${invoice.nim ?? '?'}`,
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
