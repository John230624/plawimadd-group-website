import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

// GET /api/admin/suppliers — liste avec total acheté / payé / dette.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!auth.authorized) return auth.response!;

  const suppliers = await prisma.supplier.findMany({
    where: { deletedAt: null },
    include: {
      purchases: {
        where: { status: { not: 'CANCELLED' } },
        select: { totalAmount: true, paidAmount: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({
    suppliers: suppliers.map((s) => {
      const totalPurchased = s.purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
      const totalPaid = s.purchases.reduce((sum, p) => sum + Number(p.paidAmount), 0);
      return {
        id: s.id,
        name: s.name,
        contactName: s.contactName,
        phone: s.phone,
        email: s.email,
        address: s.address,
        ifu: s.ifu,
        notes: s.notes,
        isActive: s.isActive,
        purchaseCount: s.purchases.length,
        totalPurchased,
        totalPaid,
        balance: totalPurchased - totalPaid, // dette restante envers le fournisseur
      };
    }),
  });
}

// POST /api/admin/suppliers — création.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!auth.authorized) return auth.response!;

  let body: { name?: string; contactName?: string; phone?: string; email?: string; address?: string; ifu?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ message: 'Le nom du fournisseur est requis.' }, { status: 400 });
  }

  const supplier = await prisma.supplier.create({
    data: {
      name: body.name.trim(),
      contactName: body.contactName?.trim() || null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      address: body.address?.trim() || null,
      ifu: body.ifu?.trim() || null,
      notes: body.notes?.trim() || null,
    },
  });

  await logActivity({ userId: auth.userId, action: 'CREATE', entity: 'SUPPLIER', entityId: supplier.id, details: `Fournisseur "${supplier.name}" créé` });
  return NextResponse.json({ ok: true, supplier });
}
