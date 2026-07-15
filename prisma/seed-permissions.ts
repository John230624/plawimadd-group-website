import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const modules: Record<string, string[]> = {
    products: [
      'products.view', 'products.create', 'products.edit', 'products.delete',
      'products.publish', 'products.manage-stock',
    ],
    categories: [
      'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
    ],
    orders: [
      'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
      'orders.update-status', 'orders.export',
    ],
    users: [
      'users.view', 'users.create', 'users.edit', 'users.delete', 'users.ban',
    ],
    promotions: [
      'promotions.view', 'promotions.create', 'promotions.edit', 'promotions.delete',
    ],
    reviews: [
      'reviews.view', 'reviews.reply', 'reviews.delete',
    ],
    payments: [
      'payments.view', 'payments.refund',
    ],
    settings: [
      'settings.view', 'settings.edit',
    ],
    reports: [
      'reports.view', 'reports.export',
    ],
    cms: [
      'cms.view', 'cms.create', 'cms.edit', 'cms.delete',
    ],
    characteristics: [
      'characteristics.view', 'characteristics.create', 'characteristics.edit', 'characteristics.delete',
    ],
    colors: [
      'colors.view', 'colors.create', 'colors.edit', 'colors.delete',
    ],
    pos: [
      'pos.access', 'pos.sell', 'pos.discount', 'pos.discount-approve',
      'pos.view-transactions', 'pos.close-session',
    ],
    students: [
      'students.view', 'students.approve', 'students.reject',
    ],
    activity: [
      'activity.view', 'activity.export',
    ],
    permissions: [
      'permissions.view', 'permissions.manage',
    ],
  };

  const permissionsData: { name: string; slug: string; description: string; module: string }[] = [];

  for (const [module, slugs] of Object.entries(modules)) {
    for (const slug of slugs) {
      const name = slug.split('.').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' - ');
      permissionsData.push({ name, slug, description: `Permission ${name}`, module });
    }
  }

  for (const permission of permissionsData) {
    await prisma.permission.upsert({
      where: { slug: permission.slug },
      update: {
        name: permission.name,
        description: permission.description,
        module: permission.module,
      },
      create: permission,
    });
  }
  console.log(`Permissions synchronisees: ${permissionsData.length}`);

  const allPermissions = await prisma.permission.findMany();

  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrateur' },
    update: { description: 'Accès complet à toutes les fonctionnalités', isSystem: true },
    create: { name: 'Administrateur', description: 'Accès complet à toutes les fonctionnalités', isSystem: true },
  });

  const sellerRole = await prisma.role.upsert({
    where: { name: 'Vendeur' },
    update: { description: 'Gestion des produits, ventes POS et commandes', isSystem: true },
    create: { name: 'Vendeur', description: 'Gestion des produits, ventes POS et commandes', isSystem: true },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'Utilisateur' },
    update: { description: 'Compte client standard', isSystem: true },
    create: { name: 'Utilisateur', description: 'Compte client standard', isSystem: true },
  });

  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  const sellerSlugs = new Set([
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'products.publish', 'products.manage-stock',
    'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
    'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
    'orders.update-status', 'orders.export',
    'promotions.view', 'promotions.create', 'promotions.edit', 'promotions.delete',
    'reviews.view', 'reviews.reply', 'reviews.delete',
    'payments.view',
    'reports.view', 'reports.export',
    'pos.access', 'pos.sell', 'pos.discount', 'pos.view-transactions', 'pos.close-session',
    'colors.view', 'colors.create', 'colors.edit', 'colors.delete',
    'characteristics.view', 'characteristics.create', 'characteristics.edit', 'characteristics.delete',
    'students.view', 'students.approve', 'students.reject',
  ]);

  await prisma.rolePermission.deleteMany({
    where: {
      roleId: sellerRole.id,
      permission: { slug: { notIn: Array.from(sellerSlugs) } },
    },
  });

  await prisma.rolePermission.createMany({
    data: allPermissions.filter((p) => sellerSlugs.has(p.slug)).map((p) => ({ roleId: sellerRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  console.log(`✓ Rôle "Administrateur" — ${allPermissions.length} permissions`);
  console.log(`✓ Rôle "Vendeur" — ${allPermissions.filter((p) => sellerSlugs.has(p.slug)).length} permissions`);

  const systemRoleByLegacyRole = {
    ADMIN: adminRole.id,
    SELLER: sellerRole.id,
    USER: userRole.id,
  } as const;
  const systemRoleIds = Object.values(systemRoleByLegacyRole);
  const users = await prisma.user.findMany({ select: { id: true, role: true } });
  for (const user of users) {
    const roleId = systemRoleByLegacyRole[user.role || 'USER'];
    await prisma.userRoleModel.deleteMany({
      where: { userId: user.id, roleId: { in: systemRoleIds } },
    });
    await prisma.userRoleModel.create({
      data: { userId: user.id, roleId },
    });
  }
  console.log(`✓ Rôles système assignés à ${users.length} utilisateurs`);

  const adminUsers = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  for (const user of adminUsers) {
    const existing = await prisma.userRoleModel.findFirst({
      where: { userId: user.id, roleId: adminRole.id },
    });
    if (!existing) {
      await prisma.userRoleModel.create({ data: { userId: user.id, roleId: adminRole.id } });
    }
  }
  console.log(`✓ Rôle "Administrateur" assigné à ${adminUsers.length} utilisateurs`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
