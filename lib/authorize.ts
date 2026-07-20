import prisma from '@/lib/prisma';

const SYSTEM_ROLE_NAMES = {
  USER: 'Utilisateur',
  SELLER: 'Vendeur',
  ADMIN: 'Administrateur',
} as const;

type AuthorizeResult = {
  authorized: boolean;
  response?: never; // No response for internal functions
};

/**
 * Check if a user has a specific permission.
 * Checks through roles (UserRoleModel -> Role -> RolePermission -> Permission)
 * and direct user permission overrides (UserPermission).
 */
export async function hasPermission(userId: string, permissionSlug: string): Promise<boolean> {
  if (!userId) return false;

  // Check direct user permissions first (overrides)
  const deniedPerm = await prisma.userPermission.findFirst({
    where: { userId, granted: false, permission: { slug: permissionSlug } },
  });
  if (deniedPerm) return false;

  const userPerm = await prisma.userPermission.findFirst({
    where: { userId, permission: { slug: permissionSlug } },
  });
  if (userPerm) return userPerm.granted;

  // Check through roles
  const userRoles = await prisma.userRoleModel.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  for (const ur of userRoles) {
    const found = ur.role.permissions.find((rp) => rp.permission.slug === permissionSlug);
    if (found) return true;
  }

  // Fallback: legacy User.role values still map to the matching system role
  // when no granular role link has been assigned yet.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === 'ADMINSUPRA') return true;

  if (user?.role && userRoles.length === 0) {
    const systemRole = await prisma.role.findUnique({
      where: { name: SYSTEM_ROLE_NAMES[user.role] },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    return Boolean(systemRole?.permissions.some((rp) => rp.permission.slug === permissionSlug));
  }

  return false;
}

/**
 * Batch check multiple permissions for a user.
 */
export async function hasPermissions(userId: string, permissionSlugs: string[]): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  for (const slug of permissionSlugs) {
    results[slug] = await hasPermission(userId, slug);
  }
  return results;
}

/**
 * Get all permission slugs for a user.
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const allPerms: string[] = [];
  const addPermission = (slug: string) => {
    if (!deniedSlugs.has(slug) && !allPerms.includes(slug)) {
      allPerms.push(slug);
    }
  };

  const deniedPerms = await prisma.userPermission.findMany({
    where: { userId, granted: false },
    include: { permission: true },
  });
  const deniedSlugs = new Set(deniedPerms.map((up) => up.permission.slug));

  // Direct permissions
  const userPerms = await prisma.userPermission.findMany({
    where: { userId, granted: true },
    include: { permission: true },
  });
  userPerms.forEach((up) => addPermission(up.permission.slug));

  // Role-based permissions
  const userRoles = await prisma.userRoleModel.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      addPermission(rp.permission.slug);
    }
  }

  // Legacy role fallback
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === 'ADMINSUPRA') {
    const all = await prisma.permission.findMany({ select: { slug: true } });
    return all.map((p) => p.slug).filter((slug) => !deniedSlugs.has(slug));
  }

  if (user?.role && userRoles.length === 0) {
    const systemRole = await prisma.role.findUnique({
      where: { name: SYSTEM_ROLE_NAMES[user.role] },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    for (const rp of systemRole?.permissions || []) {
      addPermission(rp.permission.slug);
    }
  }

  return allPerms;
}
