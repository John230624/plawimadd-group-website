import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeAdminRequest(_req);
  if (!auth.authorized) return auth.response!;
  try {
    const permissions = await prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { name: 'asc' }] });
    return NextResponse.json(permissions);
  } catch { return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 }); }
}
