import { NextRequest, NextResponse } from 'next/server';

import { authorizeLoggedInUser } from '@/lib/authUtils';
import { getUserPermissions } from '@/lib/authorize';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await authorizeLoggedInUser(req);
  if (!auth.authorized) return auth.response!;

  const permissions = await getUserPermissions(auth.userId!);
  return NextResponse.json({ permissions });
}
