import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeAdminRequest(req);
  if (!auth.authorized) return auth.response!;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ message: 'userId requis' }, { status: 400 });
  try {
    const roles = await prisma.userRoleModel.findMany({
      where: { userId },
      include: { role: true },
    });
    const permissions = await prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });
    return NextResponse.json({ roles: roles.map((r) => r.role), permissions });
  } catch { return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 }); }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeAdminRequest(req);
  if (!auth.authorized) return auth.response!;
  try {
    const { userId, roleId } = await req.json();
    if (!userId || !roleId) return NextResponse.json({ message: 'userId et roleId requis' }, { status: 400 });
    await prisma.userRoleModel.create({ data: { userId, roleId } });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch { return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 }); }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeAdminRequest(req);
  if (!auth.authorized) return auth.response!;
  try {
    const { userId, roleId } = await req.json();
    await prisma.userRoleModel.deleteMany({ where: { userId, roleId } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 }); }
}
