import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult, getSupremeAdminId } from '@/lib/authUtils';

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

    const supremeAdminId = await getSupremeAdminId();

    // Empecher de modifier l'administrateur supreme
    if (userId === supremeAdminId) {
      return NextResponse.json({ message: "Impossible de modifier les rôles de l'administrateur suprême." }, { status: 403 });
    }

    const adminRole = await prisma.role.findFirst({ where: { name: 'Administrateur' } });
    const isAssigningAdminRole = roleId === adminRole?.id;

    if (auth.userId !== supremeAdminId) {
      if (isAssigningAdminRole) {
        return NextResponse.json({ message: "Seul l'administrateur suprême peut accorder le rôle d'administrateur." }, { status: 403 });
      }

      const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (targetUser?.role === 'ADMIN') {
        return NextResponse.json({ message: "Seul l'administrateur suprême peut modifier les rôles d'un administrateur." }, { status: 403 });
      }
    }

    await prisma.userRoleModel.create({ data: { userId, roleId } });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch { return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 }); }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeAdminRequest(req);
  if (!auth.authorized) return auth.response!;
  try {
    const { userId, roleIds, permissionOverrides } = await req.json();
    if (!userId || !Array.isArray(roleIds)) {
      return NextResponse.json({ message: 'userId et roleIds requis' }, { status: 400 });
    }

    const supremeAdminId = await getSupremeAdminId();

    if (userId === supremeAdminId) {
      return NextResponse.json({ message: "Impossible de modifier les rôles ou permissions de l'administrateur suprême." }, { status: 403 });
    }

    const adminRole = await prisma.role.findFirst({ where: { name: 'Administrateur' } });
    const isAdminRoleInPlay = roleIds.includes(adminRole?.id);

    if (auth.userId !== supremeAdminId) {
      if (isAdminRoleInPlay) {
        return NextResponse.json({ message: "Seul l'administrateur suprême peut accorder le rôle d'administrateur." }, { status: 403 });
      }

      const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (targetUser?.role === 'ADMIN') {
        return NextResponse.json({ message: "Seul l'administrateur suprême peut modifier les rôles ou permissions d'un administrateur." }, { status: 403 });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRoleModel.deleteMany({ where: { userId } });
      if (roleIds.length > 0) {
        await tx.userRoleModel.createMany({
          data: roleIds.map((roleId: string) => ({ userId, roleId })),
          skipDuplicates: true,
        });
      }

      if (Array.isArray(permissionOverrides)) {
        await tx.userPermission.deleteMany({ where: { userId } });
        const overrides = permissionOverrides.filter(
          (item: { permissionId?: unknown; granted?: unknown }) =>
            typeof item.permissionId === 'string' && typeof item.granted === 'boolean'
        );
        if (overrides.length > 0) {
          await tx.userPermission.createMany({
            data: overrides.map((item: { permissionId: string; granted: boolean }) => ({
              userId,
              permissionId: item.permissionId,
              granted: item.granted,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    await logPermissionChange(userId, auth.userId || null);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeAdminRequest(req);
  if (!auth.authorized) return auth.response!;
  try {
    const { userId, roleId } = await req.json();

    const supremeAdminId = await getSupremeAdminId();

    if (userId === supremeAdminId) {
      return NextResponse.json({ message: "Impossible de retirer des rôles de l'administrateur suprême." }, { status: 403 });
    }

    if (auth.userId !== supremeAdminId) {
      const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (targetUser?.role === 'ADMIN') {
        return NextResponse.json({ message: "Seul l'administrateur suprême peut retirer des rôles d'un administrateur." }, { status: 403 });
      }
    }

    await prisma.userRoleModel.deleteMany({ where: { userId, roleId } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 }); }
}

async function logPermissionChange(userId: string, actorId: string | null) {
  try {
    const { logActivity } = await import('@/lib/logActivity');
    await logActivity({
      userId: actorId,
      action: 'UPDATE',
      entity: 'USER_PERMISSION',
      entityId: userId,
      details: `Permissions et roles de l'utilisateur ${userId} mis a jour`,
    });
  } catch {
    // Logging must not block permission updates.
  }
}
