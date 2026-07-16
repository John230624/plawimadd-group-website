import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  envLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^"(.*)"$/, '$1');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

const prisma = new PrismaClient();

// Ce seed n'initialise QUE les données structurelles nécessaires en production :
// le système de permissions, les rôles système et leur assignation.
// Aucune donnée fictive (catégories/produits de démonstration) n'est insérée :
// le catalogue réel se gère entièrement via l'espace vendeur.

async function seedPermissionsAndRoles() {
  const modules = {
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
      permissionsData.push({
        name,
        slug,
        description: `Permission ${name}`,
        module,
      });
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

  console.log(`Permissions synchronisees: ${allPermissions.length}`);
  console.log(`Role "Administrateur" synchronise avec ${allPermissions.length} permissions`);
  console.log(`Role "Vendeur" synchronise avec ${allPermissions.filter((p) => sellerSlugs.has(p.slug)).length} permissions`);
  console.log(`Roles systeme assignes a ${users.length} utilisateurs`);
}

async function assignAdminRole() {
  const adminRole = await prisma.role.findFirst({ where: { name: 'Administrateur' } });
  if (!adminRole) return;

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
}

seedPermissionsAndRoles()
  .then(async () => {
    await assignAdminRole();
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
