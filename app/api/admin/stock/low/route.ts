import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';

interface LowStockRow {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number | null;
  price: string | number;
  imgUrl: string | null;
}

// GET /api/admin/stock/low
// Produits en stock bas ou en rupture (selon le seuil par produit, défaut 5).
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!auth.authorized) return auth.response!;

  const rows = await prisma.$queryRaw<LowStockRow[]>`
    SELECT id, name, stock, lowStockThreshold, price, imgUrl
    FROM products
    WHERE deletedAt IS NULL
      AND stock <= COALESCE(lowStockThreshold, 5)
    ORDER BY stock ASC
    LIMIT 200
  `;

  const items = rows.map((r) => ({
    id: r.id,
    name: r.name,
    stock: Number(r.stock),
    threshold: r.lowStockThreshold ?? 5,
    price: Number(r.price),
    outOfStock: Number(r.stock) <= 0,
  }));

  return NextResponse.json({
    items,
    lowCount: items.filter((i) => !i.outOfStock).length,
    outCount: items.filter((i) => i.outOfStock).length,
  });
}
