import { Prisma, UserRole } from '@prisma/client';

export const SYSTEM_ROLE_NAMES: Record<UserRole, string> = {
  USER: 'Utilisateur',
  SELLER: 'Vendeur',
  ADMIN: 'Administrateur',
};

export async function ensureSystemRoles(tx: Prisma.TransactionClient) {
  const roles = await Promise.all(
    Object.entries(SYSTEM_ROLE_NAMES).map(([legacyRole, name]) =>
      tx.role.upsert({
        where: { name },
        update: { isSystem: true },
        create: {
          name,
          description:
            legacyRole === 'ADMIN'
              ? 'Acces complet a toutes les fonctionnalites'
              : legacyRole === 'SELLER'
                ? 'Gestion des produits, ventes POS et commandes'
                : 'Compte client standard',
          isSystem: true,
        },
      })
    )
  );

  return Object.fromEntries(
    roles.map((role) => {
      const legacyRole = Object.entries(SYSTEM_ROLE_NAMES).find(([, name]) => name === role.name)?.[0];
      return [legacyRole, role];
    })
  ) as Record<UserRole, { id: string; name: string }>;
}

export async function syncUserSystemRole(tx: Prisma.TransactionClient, userId: string, legacyRole: UserRole) {
  const systemRoles = await ensureSystemRoles(tx);
  const systemRoleIds = Object.values(systemRoles).map((role) => role.id);

  await tx.userRoleModel.deleteMany({
    where: {
      userId,
      roleId: { in: systemRoleIds },
    },
  });

  await tx.userRoleModel.create({
    data: {
      userId,
      roleId: systemRoles[legacyRole].id,
    },
  });
}
