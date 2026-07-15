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

type SeedCategory = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
};

type SeedProduct = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  brand: string;
  color: string;
  price: number;
  offerPrice: number | null;
  stock: number;
  rating: number;
  imgUrl: string[];
};

const categories: SeedCategory[] = [
  {
    id: 'cat-smartphones',
    name: 'Smartphones',
    description: 'Smartphones pour les cours, le travail, la creation et le quotidien.',
    imageUrl: '/images/catalog/catalog-smartphone.jpg',
  },
  {
    id: 'cat-ordinateurs',
    name: 'Ordinateurs',
    description: 'Ordinateurs portables et machines pour etudes, bureau et productivite.',
    imageUrl: '/images/catalog/catalog-laptop.jpg',
  },
  {
    id: 'cat-audio',
    name: 'Audio',
    description: 'Ecouteurs, casques, barres de son et accessoires audio modernes.',
    imageUrl: '/images/catalog/catalog-headphones.jpg',
  },
  {
    id: 'cat-montres',
    name: 'Montres connectees',
    description: 'Montres intelligentes pour le sport, le suivi sante et le quotidien.',
    imageUrl: '/images/catalog/catalog-smartwatch.jpg',
  },
  {
    id: 'cat-tv',
    name: 'Televiseurs',
    description: 'Televiseurs et ecrans de salon pour films, series et gaming.',
    imageUrl: '/images/catalog/catalog-tv.jpg',
  },
  {
    id: 'cat-electromenager',
    name: 'Electromenager',
    description: 'Petit electromenager utile pour la maison et la cuisine.',
    imageUrl: '/images/catalog/catalog-coffee-machine.jpg',
  },
  {
    id: 'cat-tablettes',
    name: 'Tablettes',
    description: 'Tablettes pour cours, lecture, dessin et mobilite.',
    imageUrl: '/images/catalog/catalog-tablet.jpg',
  },
  {
    id: 'cat-gaming',
    name: 'Gaming',
    description: 'Consoles, manettes et accessoires de jeu.',
    imageUrl: '/images/catalog/catalog-gaming.jpg',
  },
  {
    id: 'cat-accessoires',
    name: 'Accessoires',
    description: 'Chargeurs, cables, coques et petits accessoires du quotidien.',
    imageUrl: '/images/catalog/catalog-earbuds.jpg',
  },
];

const products: SeedProduct[] = [
  {
    id: 'prod-iphone-16',
    name: 'Apple iPhone 16 128GB',
    description: 'Modele recent Apple iPhone pour photo, reseaux, cours et usage quotidien.',
    categoryId: 'cat-smartphones',
    brand: 'Apple iPhone',
    color: 'Bleu',
    price: 649000,
    offerPrice: 619000,
    stock: 12,
    rating: 4.8,
    imgUrl: ['/images/catalog/catalog-smartphone.jpg', '/images/samsung_s23phone_image.png'],
  },
  {
    id: 'prod-iphone-16-pro',
    name: 'Apple iPhone 16 Pro 256GB',
    description: 'Version Pro avec meilleur confort photo et stockage plus genereux.',
    categoryId: 'cat-smartphones',
    brand: 'Apple iPhone',
    color: 'Titane',
    price: 819000,
    offerPrice: 789000,
    stock: 8,
    rating: 4.9,
    imgUrl: ['/images/catalog/catalog-smartphone.jpg', '/images/default_product_image.png'],
  },
  {
    id: 'prod-iphone-15',
    name: 'Apple iPhone 15 128GB',
    description: 'iPhone equilibre pour etudes, travail, photo et creation de contenu.',
    categoryId: 'cat-smartphones',
    brand: 'Apple iPhone',
    color: 'Blanc',
    price: 569000,
    offerPrice: 539000,
    stock: 10,
    rating: 4.7,
    imgUrl: ['/images/default_product_image.png', '/images/catalog/catalog-smartphone.jpg'],
  },
  {
    id: 'prod-iphone-14-pro-max',
    name: 'Apple iPhone 14 Pro Max 256GB',
    description: 'Grand ecran, belle autonomie et experience premium.',
    categoryId: 'cat-smartphones',
    brand: 'Apple iPhone',
    color: 'Violet',
    price: 699000,
    offerPrice: 649000,
    stock: 6,
    rating: 4.7,
    imgUrl: ['/images/default_product_image.png', '/images/catalog/catalog-smartphone.jpg'],
  },
  {
    id: 'prod-galaxy-s23',
    name: 'Samsung Galaxy S23 256GB',
    description: 'Smartphone Android premium et compact pour productivite et photo.',
    categoryId: 'cat-smartphones',
    brand: 'Samsung Galaxy',
    color: 'Vert',
    price: 589000,
    offerPrice: 559000,
    stock: 11,
    rating: 4.6,
    imgUrl: ['/images/samsung_s23phone_image.png', '/images/catalog/catalog-smartphone.jpg'],
  },
  {
    id: 'prod-galaxy-s23-ultra',
    name: 'Samsung Galaxy S23 Ultra 512GB',
    description: 'Modele grand format pour photo, video et performance intensive.',
    categoryId: 'cat-smartphones',
    brand: 'Samsung Galaxy',
    color: 'Noir',
    price: 869000,
    offerPrice: 829000,
    stock: 5,
    rating: 4.8,
    imgUrl: ['/images/samsung_s23phone_image.png', '/images/catalog/catalog-smartphone.jpg'],
  },
  {
    id: 'prod-galaxy-a55',
    name: 'Samsung Galaxy A55 128GB',
    description: 'Modele Android plus accessible pour etudes et usage quotidien.',
    categoryId: 'cat-smartphones',
    brand: 'Samsung Galaxy',
    color: 'Bleu',
    price: 339000,
    offerPrice: 319000,
    stock: 14,
    rating: 4.4,
    imgUrl: ['/images/samsung_s23phone_image.png'],
  },
  {
    id: 'prod-macbook-air-m2',
    name: 'MacBook Air M2 13 pouces',
    description: 'Portable fin et leger, parfait pour les etudiants et jeunes pros.',
    categoryId: 'cat-ordinateurs',
    brand: 'Apple MacBook',
    color: 'Minuit',
    price: 865000,
    offerPrice: 825000,
    stock: 7,
    rating: 4.9,
    imgUrl: ['/images/macbook_image.png', '/images/catalog/catalog-laptop.jpg'],
  },
  {
    id: 'prod-macbook-pro-14',
    name: 'MacBook Pro 14 pouces 512GB',
    description: 'Ordinateur puissant pour montage, creation, design et productivite.',
    categoryId: 'cat-ordinateurs',
    brand: 'Apple MacBook',
    color: 'Argent',
    price: 1225000,
    offerPrice: 1175000,
    stock: 4,
    rating: 4.9,
    imgUrl: ['/images/macbook_image.png', '/images/catalog/catalog-laptop.jpg'],
  },
  {
    id: 'prod-asus-zenbook',
    name: 'ASUS Zenbook 14',
    description: 'Ultrabook Windows pour bureautique, mobilite et autonomie.',
    categoryId: 'cat-ordinateurs',
    brand: 'ASUS',
    color: 'Bleu gris',
    price: 615000,
    offerPrice: 585000,
    stock: 9,
    rating: 4.5,
    imgUrl: ['/images/asus_laptop_image.png', '/images/catalog/catalog-laptop.jpg'],
  },
  {
    id: 'prod-hp-probook',
    name: 'HP ProBook 450',
    description: 'Ordinateur fiable pour entreprise, ecole et travail hybride.',
    categoryId: 'cat-ordinateurs',
    brand: 'HP',
    color: 'Gris',
    price: 545000,
    offerPrice: 519000,
    stock: 9,
    rating: 4.4,
    imgUrl: ['/images/header_ordi_hp_probook_image.png', '/images/catalog/catalog-laptop.jpg'],
  },
  {
    id: 'prod-hp-15-student',
    name: 'HP 15 Student Edition 256GB',
    description: 'Portable simple et efficace pour notes, cours, navigation et visio.',
    categoryId: 'cat-ordinateurs',
    brand: 'HP',
    color: 'Argent',
    price: 429000,
    offerPrice: 399000,
    stock: 11,
    rating: 4.3,
    imgUrl: ['/images/header_ordi_hp_probook_image.png'],
  },
  {
    id: 'prod-airpods-pro',
    name: 'AirPods Pro',
    description: 'Ecouteurs Apple avec reduction de bruit et format tres pratique.',
    categoryId: 'cat-audio',
    brand: 'Apple AirPods',
    color: 'Blanc',
    price: 169000,
    offerPrice: 149000,
    stock: 14,
    rating: 4.8,
    imgUrl: ['/images/apple_earphone_image.png', '/images/product_details_page_apple_earphone_image1.png'],
  },
  {
    id: 'prod-airpods-3',
    name: 'AirPods 3',
    description: 'Ecouteurs Apple legers, simples et confortables.',
    categoryId: 'cat-audio',
    brand: 'Apple AirPods',
    color: 'Blanc',
    price: 129000,
    offerPrice: 119000,
    stock: 13,
    rating: 4.6,
    imgUrl: ['/images/apple_earphone_image.png', '/images/product_details_page_apple_earphone_image2.png'],
  },
  {
    id: 'prod-bose-qc',
    name: 'Bose QuietComfort',
    description: 'Casque premium pour travail, voyage et concentration.',
    categoryId: 'cat-audio',
    brand: 'Bose',
    color: 'Noir',
    price: 245000,
    offerPrice: 225000,
    stock: 8,
    rating: 4.7,
    imgUrl: ['/images/bose_headphone_image.png', '/images/catalog/catalog-headphones.jpg'],
  },
  {
    id: 'prod-jbl-soundbar',
    name: 'JBL Soundbar Home',
    description: 'Barre de son compacte pour salon moderne et usage familial.',
    categoryId: 'cat-audio',
    brand: 'JBL',
    color: 'Noir',
    price: 189000,
    offerPrice: 169000,
    stock: 7,
    rating: 4.5,
    imgUrl: ['/images/jbl_soundbox_image.png', '/images/catalog/catalog-soundbar.jpg'],
  },
  {
    id: 'prod-sony-buds',
    name: 'Sony Airbuds Lite',
    description: 'Ecouteurs sans fil pour appels, musique et mobilite.',
    categoryId: 'cat-audio',
    brand: 'Sony Audio',
    color: 'Blanc',
    price: 99000,
    offerPrice: 89000,
    stock: 16,
    rating: 4.3,
    imgUrl: ['/images/sony_airbuds_image.png', '/images/catalog/catalog-earbuds.jpg'],
  },
  {
    id: 'prod-watch-series-9',
    name: 'Apple Watch Series 9 45mm',
    description: 'Montre connectee elegante et polyvalente.',
    categoryId: 'cat-montres',
    brand: 'Apple Watch',
    color: 'Gold',
    price: 269000,
    offerPrice: 249000,
    stock: 10,
    rating: 4.8,
    imgUrl: ['/images/venu_watch_image.png', '/images/catalog/catalog-smartwatch.jpg'],
  },
  {
    id: 'prod-watch-ultra',
    name: 'Apple Watch Ultra 49mm',
    description: 'Version sport et outdoor avec autonomie renforcee.',
    categoryId: 'cat-montres',
    brand: 'Apple Watch',
    color: 'Titane',
    price: 415000,
    offerPrice: 389000,
    stock: 5,
    rating: 4.9,
    imgUrl: ['/images/venu_watch_image.png', '/images/catalog/catalog-smartwatch.jpg'],
  },
  {
    id: 'prod-galaxy-watch-6',
    name: 'Samsung Galaxy Watch 6 40mm',
    description: 'Montre Samsung pour suivi bien-etre, appels et sport.',
    categoryId: 'cat-montres',
    brand: 'Samsung Galaxy Watch',
    color: 'Argent',
    price: 189000,
    offerPrice: 169000,
    stock: 11,
    rating: 4.6,
    imgUrl: ['/images/catalog/catalog-smartwatch.jpg'],
  },
  {
    id: 'prod-galaxy-watch-classic',
    name: 'Samsung Galaxy Watch Classic 47mm',
    description: 'Version plus habillee et plus premium de la montre Samsung.',
    categoryId: 'cat-montres',
    brand: 'Samsung Galaxy Watch',
    color: 'Noir',
    price: 235000,
    offerPrice: 219000,
    stock: 6,
    rating: 4.5,
    imgUrl: ['/images/catalog/catalog-smartwatch.jpg'],
  },
  {
    id: 'prod-lg-oled',
    name: 'LG OLED 55 pouces',
    description: 'Televiseur premium pour films, series et experience home cinema.',
    categoryId: 'cat-tv',
    brand: 'LG TV',
    color: 'Noir',
    price: 895000,
    offerPrice: 845000,
    stock: 4,
    rating: 4.8,
    imgUrl: ['/images/header_tv_image.png', '/images/catalog/catalog-tv.jpg'],
  },
  {
    id: 'prod-samsung-tv',
    name: 'Samsung Smart TV 50 pouces',
    description: 'Televiseur 4K pour salon, streaming et usage familial.',
    categoryId: 'cat-tv',
    brand: 'Samsung TV',
    color: 'Noir',
    price: 645000,
    offerPrice: 599000,
    stock: 6,
    rating: 4.6,
    imgUrl: ['/images/header_tv_image.png', '/images/catalog/catalog-tv.jpg'],
  },
  {
    id: 'prod-projector-home',
    name: 'Projecteur Home Cinema',
    description: 'Solution projection pour salon, presentations et divertissement.',
    categoryId: 'cat-tv',
    brand: 'Vision Home',
    color: 'Blanc',
    price: 289000,
    offerPrice: 259000,
    stock: 6,
    rating: 4.4,
    imgUrl: ['/images/projector_image.png', '/images/catalog/catalog-tv.jpg'],
  },
  {
    id: 'prod-coffee-premium',
    name: 'Machine a cafe Premium',
    description: 'Machine a cafe elegante pour cuisine moderne.',
    categoryId: 'cat-electromenager',
    brand: 'Cuisine Maison',
    color: 'Inox',
    price: 225000,
    offerPrice: 199000,
    stock: 7,
    rating: 4.5,
    imgUrl: ['/images/catalog/catalog-coffee-machine.jpg'],
  },
  {
    id: 'prod-coffee-compact',
    name: 'Machine a cafe Compact',
    description: 'Format compact et simple pour la maison.',
    categoryId: 'cat-electromenager',
    brand: 'Cuisine Maison',
    color: 'Noir',
    price: 159000,
    offerPrice: 139000,
    stock: 9,
    rating: 4.3,
    imgUrl: ['/images/catalog/catalog-coffee-machine.jpg'],
  },
  {
    id: 'prod-blender-smart',
    name: 'Blender Smart Mix',
    description: 'Blender de cuisine pratique pour jus, smoothies et sauces.',
    categoryId: 'cat-electromenager',
    brand: 'Cuisine Maison',
    color: 'Noir',
    price: 79000,
    offerPrice: 69000,
    stock: 13,
    rating: 4.2,
    imgUrl: ['/images/catalog/catalog-appliances.jpg'],
  },
  {
    id: 'prod-ipad-air',
    name: 'iPad Air 256GB',
    description: 'Tablette premium pour notes, dessin et travail mobile.',
    categoryId: 'cat-tablettes',
    brand: 'Apple iPad',
    color: 'Bleu',
    price: 539000,
    offerPrice: 509000,
    stock: 8,
    rating: 4.8,
    imgUrl: ['/images/catalog/catalog-tablet.jpg'],
  },
  {
    id: 'prod-ipad-10',
    name: 'iPad 10e generation 64GB',
    description: 'Tablette polyvalente pour cours, lecture et divertissement.',
    categoryId: 'cat-tablettes',
    brand: 'Apple iPad',
    color: 'Argent',
    price: 359000,
    offerPrice: 339000,
    stock: 10,
    rating: 4.6,
    imgUrl: ['/images/catalog/catalog-tablet.jpg'],
  },
  {
    id: 'prod-galaxy-tab-s9',
    name: 'Samsung Galaxy Tab S9',
    description: 'Tablette Android haut de gamme pour productivite et media.',
    categoryId: 'cat-tablettes',
    brand: 'Samsung Tablet',
    color: 'Graphite',
    price: 489000,
    offerPrice: 459000,
    stock: 7,
    rating: 4.5,
    imgUrl: ['/images/catalog/catalog-tablet.jpg'],
  },
  {
    id: 'prod-ps5-slim',
    name: 'PlayStation 5 Slim',
    description: 'Console nouvelle generation pour gaming et divertissement.',
    categoryId: 'cat-gaming',
    brand: 'PlayStation',
    color: 'Blanc',
    price: 479000,
    offerPrice: 449000,
    stock: 6,
    rating: 4.8,
    imgUrl: ['/images/playstation_image.png', '/images/catalog/catalog-gaming.jpg'],
  },
  {
    id: 'prod-xbox-controller',
    name: 'Manette Sans Fil Pro',
    description: 'Manette ergonomique pour console et jeux sur PC.',
    categoryId: 'cat-gaming',
    brand: 'Gaming Gear',
    color: 'Noir',
    price: 59000,
    offerPrice: 52000,
    stock: 18,
    rating: 4.4,
    imgUrl: ['/images/md_controller_image.png', '/images/catalog/catalog-gaming.jpg'],
  },
  {
    id: 'prod-gamepad-compact',
    name: 'Manette Compact Edition',
    description: 'Format compact pour sessions de jeu et cadeaux tech.',
    categoryId: 'cat-gaming',
    brand: 'Gaming Gear',
    color: 'Noir',
    price: 39000,
    offerPrice: 34000,
    stock: 21,
    rating: 4.1,
    imgUrl: ['/images/sm_controller_image.png', '/images/catalog/catalog-gaming.jpg'],
  },
  {
    id: 'prod-usbc-cable',
    name: 'Cable USB-C Charge Rapide',
    description: 'Cable pratique pour smartphone, tablette et ordinateur.',
    categoryId: 'cat-accessoires',
    brand: 'Plawimadd Access',
    color: 'Blanc',
    price: 12000,
    offerPrice: 9500,
    stock: 40,
    rating: 4.2,
    imgUrl: ['/images/catalog/catalog-earbuds.jpg'],
  },
  {
    id: 'prod-chargeur-65w',
    name: 'Chargeur 65W Multi Usage',
    description: 'Chargeur rapide pour smartphone, tablette et laptop compatible.',
    categoryId: 'cat-accessoires',
    brand: 'Plawimadd Access',
    color: 'Blanc',
    price: 22000,
    offerPrice: 18000,
    stock: 26,
    rating: 4.4,
    imgUrl: ['/images/catalog/catalog-appliances.jpg'],
  },
  {
    id: 'prod-airpods-case',
    name: 'Etui AirPods Premium',
    description: 'Etui de protection simple et propre pour ecouteurs Apple.',
    categoryId: 'cat-accessoires',
    brand: 'Plawimadd Access',
    color: 'Beige',
    price: 9000,
    offerPrice: 7000,
    stock: 35,
    rating: 4.1,
    imgUrl: ['/images/product_details_page_apple_earphone_image5.png'],
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
      },
      create: category,
    });
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        offerPrice: product.offerPrice,
        stock: product.stock,
        imgUrl: JSON.stringify(product.imgUrl),
        brand: product.brand,
        color: product.color,
        rating: product.rating,
        categoryId: product.categoryId,
      },
      create: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        offerPrice: product.offerPrice,
        stock: product.stock,
        imgUrl: JSON.stringify(product.imgUrl),
        brand: product.brand,
        color: product.color,
        rating: product.rating,
        categoryId: product.categoryId,
      },
    });
  }
}

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

main()
  .then(async () => {
    await seedPermissionsAndRoles();
    await assignAdminRole();
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
