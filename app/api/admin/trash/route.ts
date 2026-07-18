import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeAdminRequest(_req);
  if (!auth.authorized) return auth.response!;

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [products, categories, orders] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, name: true, deletedAt: true, category: { select: { name: true } } },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.category.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, name: true, deletedAt: true },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.order.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, deletedAt: true, totalAmount: true },
        orderBy: { deletedAt: 'desc' },
      }),
    ]);

    const purgeCount = {
      products: await prisma.product.count({ where: { deletedAt: { lte: thirtyDaysAgo } } }),
      categories: await prisma.category.count({ where: { deletedAt: { lte: thirtyDaysAgo } } }),
      orders: await prisma.order.count({ where: { deletedAt: { lte: thirtyDaysAgo } } }),
    };

    return NextResponse.json({
      items: {
        products: products.map((p) => ({ ...p, type: 'product', label: p.name })),
        categories: categories.map((c) => ({ ...c, type: 'category', label: c.name })),
        orders: orders.map((o) => ({ ...o, type: 'order', label: `#${o.id.slice(0, 8)}` })),
      },
      purgeCount,
      purgeDate: thirtyDaysAgo,
    });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeAdminRequest(req);
  if (!auth.authorized) return auth.response!;

  try {
    const { id, type, action } = await req.json();
    if (!id || !type || !action) return NextResponse.json({ message: 'Paramètres manquants' }, { status: 400 });

    const entityName = type === 'product' ? 'Product' : type === 'category' ? 'Category' : 'Order';
    const model = prisma[entityName as keyof typeof prisma] as any;

    if (action === 'restore') {
      await model.update({ where: { id }, data: { deletedAt: null } });
      await logActivity({ userId: req.user?.id || null, action: 'RESTORE', entity: entityName.toUpperCase(), entityId: id, details: `Restauré depuis la corbeille` });
      return NextResponse.json({ success: true, message: 'Élément restauré' });
    }

    if (action === 'delete') {
      try {
        await model.delete({ where: { id } });
        await logActivity({ userId: req.user?.id || null, action: 'DELETE_PERMANENT', entity: entityName.toUpperCase(), entityId: id, details: `Supprimé définitivement depuis la corbeille` });
        return NextResponse.json({ success: true, message: 'Élément supprimé définitivement' });
      } catch (error: any) {
        console.error('Erreur lors de la suppression définitive:', error);
        if (error && typeof error === 'object' && error.code === 'P2003') {
          return NextResponse.json({
            success: false,
            message: 'Impossible de supprimer définitivement cet élément car il est lié à des historiques de commandes, des transactions ou des avis existants. Vous pouvez le laisser dans la corbeille.'
          }, { status: 409 });
        }
        return NextResponse.json({ message: 'Erreur serveur lors de la suppression définitive.' }, { status: 500 });
      }
    }

    if (action === 'purge-all') {
      try {
        const modelName = entityName as 'Product' | 'Category' | 'Order';
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const count = await (prisma[modelName as keyof typeof prisma] as any).deleteMany({
          where: { deletedAt: { lte: thirtyDaysAgo } },
        });
        await logActivity({ userId: req.user?.id || null, action: 'PURGE', entity: entityName.toUpperCase(), entityId: 'all', details: `Purge automatique: ${count.count} ${type}(s) supprimé(s)` });
        return NextResponse.json({ success: true, message: `${count.count} élément(s) purgé(s)` });
      } catch (error: any) {
        console.error('Erreur lors de la purge:', error);
        if (error && typeof error === 'object' && error.code === 'P2003') {
          return NextResponse.json({
            success: false,
            message: 'Certains éléments de plus de 30 jours n\'ont pas pu être purgés car ils sont liés à des historiques de commandes ou de transactions.'
          }, { status: 409 });
        }
        return NextResponse.json({ message: 'Erreur serveur lors de la purge.' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'Action inconnue' }, { status: 400 });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
