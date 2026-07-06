import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingPermissions = await prisma.permission.count();
  if (existingPermissions > 0) {
    console.log('Permissions déjà existantes — skip');
    return;
  }

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

  await prisma.permission.createMany({ data: permissionsData });
  console.log(`✓ ${permissionsData.length} permissions créées`);

  const allPermissions = await prisma.permission.findMany();

  const adminRole = await prisma.role.create({
    data: { name: 'Administrateur', description: 'Accès complet à toutes les fonctionnalités', isSystem: true },
  });

  const sellerRole = await prisma.role.create({
    data: { name: 'Vendeur', description: 'Gestion des produits, ventes POS et commandes', isSystem: true },
  });

  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
  });

  const sellerSlugs = new Set([
    'products.view', 'products.create', 'products.edit', 'products.manage-stock',
    'categories.view',
    'orders.view', 'orders.create', 'orders.update-status',
    'pos.access', 'pos.sell', 'pos.discount', 'pos.view-transactions',
    'colors.view', 'characteristics.view',
    'reviews.view', 'reviews.reply',
    'students.view',
  ]);

  await prisma.rolePermission.createMany({
    data: allPermissions.filter((p) => sellerSlugs.has(p.slug)).map((p) => ({ roleId: sellerRole.id, permissionId: p.id })),
  });

  console.log(`✓ Rôle "Administrateur" — ${allPermissions.length} permissions`);
  console.log(`✓ Rôle "Vendeur" — ${allPermissions.filter((p) => sellerSlugs.has(p.slug)).length} permissions`);

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
