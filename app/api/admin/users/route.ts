import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult, getSupremeAdminId } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { syncUserSystemRole } from '@/lib/roleSync';

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  role: true,
  banned: true,
  bannedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type UserSelectPayload = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');
    const statusFilter = searchParams.get('status');

    const whereClause: Prisma.UserWhereInput = {};

    if (roleFilter?.toUpperCase() === 'USER') {
      whereClause.role = 'USER';
    } else if (roleFilter?.toUpperCase() === 'SELLER') {
      whereClause.role = 'SELLER';
    } else if (roleFilter?.toUpperCase() === 'ADMIN') {
      whereClause.role = 'ADMIN';
    }

    if (statusFilter === 'active') {
      whereClause.banned = false;
    } else if (statusFilter === 'banned') {
      whereClause.banned = true;
    }

    const users: UserSelectPayload[] = await prisma.user.findMany({
      where: whereClause,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });

    const formattedUsers = users.map((user) => ({
      ...user,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    }));

    return NextResponse.json(formattedUsers, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur GET utilisateurs:', _error);
    return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { email, password, firstName, lastName, phoneNumber, role } = await req.json();

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ success: false, message: 'Email et mot de passe valides sont requis.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Cet email est déjà utilisé.' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const upperRole = role?.toUpperCase();
    if (upperRole && upperRole !== 'ADMIN' && upperRole !== 'SELLER' && upperRole !== 'USER') {
      return NextResponse.json({ success: false, message: 'Role invalide. Les roles autorises sont ADMIN, SELLER ou USER.' }, { status: 400 });
    }

    const legacyRole = (upperRole || 'USER') as 'ADMIN' | 'SELLER' | 'USER';

    const supremeAdminId = await getSupremeAdminId();
    if (legacyRole === 'ADMIN' && authResult.userId !== supremeAdminId) {
      return NextResponse.json({ success: false, message: "Seul l'administrateur suprême peut créer de nouveaux administrateurs." }, { status: 403 });
    }

    const newUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          phoneNumber: phoneNumber || null,
          role: legacyRole,
        },
        select: userSelect,
      });
      await syncUserSystemRole(tx, created.id, legacyRole);
      return created;
    });

    await logActivity({
      userId: authResult.userId || null,
      action: 'CREATE',
      entity: 'USER',
      entityId: newUser.id,
      details: `Utilisateur "${email}" créé`,
    });

    return NextResponse.json({ success: true, message: 'Utilisateur créé avec succès.', user: newUser }, { status: 201 });
  } catch (_error: unknown) {
    console.error('Erreur POST utilisateur:', _error);
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, message: 'ID utilisateur valide est requis.' }, { status: 400 });
    }

    const supremeAdminId = await getSupremeAdminId();

    // Empêcher de bannir ou de modifier le rôle de l'administrateur suprême
    if (id === supremeAdminId) {
      if (fields.role !== undefined && fields.role.toUpperCase() !== 'ADMIN') {
        return NextResponse.json({ success: false, message: "Impossible de modifier le rôle de l'administrateur suprême." }, { status: 403 });
      }
      if (fields.banned === true) {
        return NextResponse.json({ success: false, message: "Impossible de bannir l'administrateur suprême." }, { status: 403 });
      }
    }

    // Un administrateur non-suprême ne peut pas bannir son propre compte ni toucher aux administrateurs
    if (authResult.userId !== supremeAdminId) {
      if (fields.banned !== undefined && id === authResult.userId) {
        return NextResponse.json({ success: false, message: 'Vous ne pouvez pas bannir votre propre compte.' }, { status: 400 });
      }

      const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
      const isTargetAdmin = targetUser?.role === 'ADMIN';
      const isPromotingToAdmin = fields.role !== undefined && fields.role.toUpperCase() === 'ADMIN';

      if (isTargetAdmin || isPromotingToAdmin) {
        return NextResponse.json({ success: false, message: "Seul l'administrateur suprême peut modifier ou créer d'autres administrateurs." }, { status: 403 });
      }
    }

    const data: Prisma.UserUpdateInput = {};

    if (fields.firstName !== undefined) data.firstName = fields.firstName;
    if (fields.lastName !== undefined) data.lastName = fields.lastName;
    if (fields.email !== undefined) {
      if (typeof fields.email !== 'string') {
        return NextResponse.json({ success: false, message: 'Email invalide.' }, { status: 400 });
      }
      const existing = await prisma.user.findUnique({ where: { email: fields.email }, select: { id: true } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ success: false, message: 'Cet email est déjà utilisé.' }, { status: 409 });
      }
      data.email = fields.email;
    }
    if (fields.phoneNumber !== undefined) data.phoneNumber = fields.phoneNumber;
    if (fields.role !== undefined) {
      const upperRole = fields.role.toUpperCase();
      if (upperRole !== 'ADMIN' && upperRole !== 'SELLER' && upperRole !== 'USER') {
        return NextResponse.json({ success: false, message: 'Role invalide.' }, { status: 400 });
      }
      data.role = upperRole;
    }
    if (fields.banned !== undefined) {
      data.banned = fields.banned === true;
      data.bannedAt = fields.banned === true ? new Date() : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, message: 'Aucun champ valide à mettre à jour.' }, { status: 400 });
    }

    const updatedUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const result = await tx.user.updateMany({
        where: { id },
        data: { ...data, updatedAt: new Date() },
      });
      if (result.count === 0) throw new Error('Utilisateur non trouvé.');
      if (typeof data.role === 'string') {
        await syncUserSystemRole(tx, id, data.role as 'ADMIN' | 'SELLER' | 'USER');
      }
      return tx.user.findUnique({ where: { id }, select: userSelect });
    });

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé.' }, { status: 404 });
    }

    let details = `Utilisateur "${updatedUser.email}" mis à jour`;
    if (data.banned !== undefined) {
      details = data.banned === true
        ? `Utilisateur "${updatedUser.email}" banni`
        : `Utilisateur "${updatedUser.email}" débanni`;
    }
    await logActivity({
      userId: authResult.userId || null,
      action: 'UPDATE',
      entity: 'USER',
      entityId: updatedUser.id,
      details,
    });

    return NextResponse.json({ success: true, message: 'Utilisateur mis à jour.', user: updatedUser }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur PATCH utilisateur:', _error);
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { id } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, message: 'ID utilisateur (chaîne) valide est requis pour la suppression.' }, { status: 400 });
    }

    const supremeAdminId = await getSupremeAdminId();

    if (id === supremeAdminId) {
      return NextResponse.json({ success: false, message: "Impossible de supprimer l'administrateur suprême." }, { status: 403 });
    }

    if (id === authResult.userId) {
      return NextResponse.json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte.' }, { status: 400 });
    }

    if (authResult.userId !== supremeAdminId) {
      const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
      if (targetUser?.role === 'ADMIN') {
        return NextResponse.json({ success: false, message: "Seul l'administrateur suprême peut supprimer d'autres administrateurs." }, { status: 403 });
      }
    }

    const deleteResult: Prisma.BatchPayload = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return tx.user.deleteMany({ where: { id } });
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé ou déjà supprimé.' }, { status: 404 });
    }

    await logActivity({
      userId: authResult.userId || null,
      action: 'DELETE',
      entity: 'USER',
      entityId: id,
      details: `Utilisateur "${id}" supprimé`,
    });

    return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès.' }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur DELETE utilisateur:', _error);

    if (
      typeof _error === 'object' &&
      _error !== null &&
      'code' in _error &&
      (_error as { code?: string }).code === 'P2003'
    ) {
      return NextResponse.json({
        success: false,
        message: "Impossible de supprimer l'utilisateur car il est lié à d'autres données (commandes, adresses, panier, avis). Supprimez d'abord les données associées ou configurez la suppression en cascade dans votre schéma Prisma."
      }, { status: 409 });
    }

    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
