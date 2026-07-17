import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { getEmecefConfig, checkStatus, EmecefError } from '@/lib/emecef';

// GET /api/admin/emecef/status
// Contrôle de connectivité + validité du jeton auprès d'e-MECeF.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'orders.view');
  if (!auth.authorized) return auth.response!;

  try {
    const config = await getEmecefConfig();
    const data = await checkStatus(config);
    return NextResponse.json({
      ok: true,
      environment: config.environment,
      ifu: config.ifu,
      enabled: config.enabled,
      service: data,
    });
  } catch (err) {
    const e = err as EmecefError;
    return NextResponse.json(
      { ok: false, code: e.code || 'ERROR', message: e.message },
      { status: e.status && e.status >= 400 ? e.status : 502 },
    );
  }
}
