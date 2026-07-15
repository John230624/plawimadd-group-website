import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeAdminRequest(req);
  if (!auth.authorized) return auth.response!;
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const validSortFields = ['name', 'createdAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const orderDir = sortOrder === 'desc' ? 'desc' : 'asc';

    const [total, roles, totalPermissions, totalUsersWithRoles, systemRoles] = await Promise.all([
      prisma.role.count({ where }),
      prisma.role.findMany({
        where,
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } },
          users: {
            take: 5,
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy: { [orderField]: orderDir },
        skip,
        take: limit,
      }),
      prisma.permission.count(),
      prisma.userRoleModel.count(),
      prisma.role.count({ where: { isSystem: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: roles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalRoles: total,
        totalPermissions,
        totalUsersWithRoles,
        systemRoles,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeAdminRequest(req);
  if (!auth.authorized) return auth.response!;
  try {
    const { name, description, permissionIds } = await req.json();
    if (!name) return NextResponse.json({ success: false, message: 'Nom requis' }, { status: 400 });
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: (permissionIds || []).map((id: string) => ({ permissionId: id })),
        },
      },
    });
    await logActivity({ userId: req.user?.id || null, action: 'CREATE', entity: 'ROLE', entityId: role.id, details: `Rôle "${name}" créé` });
    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeAdminRequest(req);
  if (!auth.authorized) return auth.response!;
  try {
    const { id, name, description, permissionIds } = await req.json();
    if (!id || !name) return NextResponse.json({ success: false, message: 'ID et nom requis' }, { status: 400 });
    const role = await prisma.role.update({ where: { id }, data: { name, description } });
    if (permissionIds) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((pid: string) => ({ roleId: id, permissionId: pid })),
        });
      }
    }
    await logActivity({ userId: req.user?.id || null, action: 'UPDATE', entity: 'ROLE', entityId: role.id, details: `Rôle "${name}" modifié` });
    return NextResponse.json({ success: true, data: role });
  } catch {
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeAdminRequest(req);
  if (!auth.authorized) return auth.response!;
  try {
    const { id } = await req.json();
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) return NextResponse.json({ success: false, message: 'Rôle introuvable' }, { status: 404 });
    if (role.name === 'Administrateur') {
      return NextResponse.json({ success: false, message: 'Impossible de supprimer le rôle Administrateur principal.' }, { status: 400 });
    }
    await prisma.role.delete({ where: { id } });
    await logActivity({ userId: req.user?.id || null, action: 'DELETE', entity: 'ROLE', entityId: id, details: `Rôle "${role.name}" supprimé (${role._count.users} utilisateur(s) impacté(s))` });
    return NextResponse.json({ success: true, message: `Rôle "${role.name}" supprimé. ${role._count.users} utilisateur(s) impacté(s).` });
  } catch {
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
