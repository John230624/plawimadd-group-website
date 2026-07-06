import prisma from '@/lib/prisma';

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

  // Fallback: ADMIN role in the old User.role field has full access
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === 'ADMIN') return true;

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

  // Direct permissions
  const userPerms = await prisma.userPermission.findMany({
    where: { userId, granted: true },
    include: { permission: true },
  });
  userPerms.forEach((up) => allPerms.push(up.permission.slug));

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
      if (!allPerms.includes(rp.permission.slug)) {
        allPerms.push(rp.permission.slug);
      }
    }
  }

  // Admin fallback
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === 'ADMIN') {
    const all = await prisma.permission.findMany({ select: { slug: true } });
    return all.map((p) => p.slug);
  }

  return allPerms;
}
