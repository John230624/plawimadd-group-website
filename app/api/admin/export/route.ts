import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return [headerLine, ...dataLines, ''].join('\n');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { type } = await req.json();

    if (!type || !['products', 'orders', 'users'].includes(type)) {
      return NextResponse.json({ success: false, message: 'Type doit être "products", "orders" ou "users".' }, { status: 400 });
    }

    let csv = '';

    if (type === 'products') {
      const products = await prisma.product.findMany({
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const headers = ['name', 'category', 'brand', 'price', 'offerPrice', 'stock', 'visible', 'createdAt'];
      const rows = products.map((p) => [
        p.name,
        p.category?.name || '',
        p.brand || '',
        parseFloat(p.price.toString()).toString(),
        p.offerPrice ? parseFloat(p.offerPrice.toString()).toString() : '',
        p.stock.toString(),
        p.visible ? 'true' : 'false',
        p.createdAt.toISOString(),
      ]);
      csv = arrayToCsv(headers, rows);
    } else if (type === 'orders') {
      const orders = await prisma.order.findMany({
        include: { user: { select: { email: true } } },
        orderBy: { orderDate: 'desc' },
      });
      const headers = ['id', 'userEmail', 'totalAmount', 'status', 'paymentStatus', 'orderDate', 'shippingCity'];
      const rows = orders.map((o) => [
        o.id,
        o.user?.email || o.userEmail || '',
        parseFloat(o.totalAmount.toString()).toString(),
        o.status || '',
        o.paymentStatus || '',
        o.orderDate.toISOString(),
        o.shippingCity || '',
      ]);
      csv = arrayToCsv(headers, rows);
    } else if (type === 'users') {
      const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
      const headers = ['email', 'firstName', 'lastName', 'role', 'phoneNumber', 'banned', 'createdAt'];
      const rows = users.map((u) => [
        u.email,
        u.firstName || '',
        u.lastName || '',
        u.role || '',
        u.phoneNumber || '',
        u.banned ? 'true' : 'false',
        u.createdAt.toISOString(),
      ]);
      csv = arrayToCsv(headers, rows);
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (_error: unknown) {
    console.error('Erreur POST export:', _error);
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
