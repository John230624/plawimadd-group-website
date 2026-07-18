import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

type RouteContext = { params: Promise<{ id: string }> };

// PUT /api/admin/suppliers/[id] — mise à jour.
export async function PUT(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!auth.authorized) return auth.response!;
  const { id } = await context.params;

  let body: { name?: string; contactName?: string; phone?: string; email?: string; address?: string; ifu?: string; notes?: string; isActive?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 });
  }

  const existing = await prisma.supplier.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return NextResponse.json({ message: 'Fournisseur introuvable.' }, { status: 404 });

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.contactName !== undefined ? { contactName: body.contactName?.trim() || null } : {}),
      ...(body.phone !== undefined ? { phone: body.phone?.trim() || null } : {}),
      ...(body.email !== undefined ? { email: body.email?.trim() || null } : {}),
      ...(body.address !== undefined ? { address: body.address?.trim() || null } : {}),
      ...(body.ifu !== undefined ? { ifu: body.ifu?.trim() || null } : {}),
      ...(body.notes !== undefined ? { notes: body.notes?.trim() || null } : {}),
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
    },
  });

  await logActivity({ userId: auth.userId, action: 'UPDATE', entity: 'SUPPLIER', entityId: id, details: `Fournisseur "${supplier.name}" mis à jour` });
  return NextResponse.json({ ok: true, supplier });
}

// DELETE /api/admin/suppliers/[id] — suppression douce.
export async function DELETE(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const auth: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!auth.authorized) return auth.response!;
  const { id } = await context.params;

  const existing = await prisma.supplier.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return NextResponse.json({ message: 'Fournisseur introuvable.' }, { status: 404 });

  await prisma.supplier.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  await logActivity({ userId: auth.userId, action: 'DELETE', entity: 'SUPPLIER', entityId: id, details: `Fournisseur "${existing.name}" supprimé` });
  return NextResponse.json({ ok: true });
}
