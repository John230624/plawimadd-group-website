import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;
  try {
    const colors = await prisma.color.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(colors);
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;
  try {
    const { name, hex } = await req.json();
    if (!name || !hex) return NextResponse.json({ message: 'Nom et hex requis.' }, { status: 400 });
    const color = await prisma.color.create({ data: { name: name.trim(), hex } });
    await logActivity({ userId: req.user?.id || null, action: 'CREATE', entity: 'COLOR', entityId: color.id, details: `Couleur "${color.name}" créée` });
    return NextResponse.json(color, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as Record<string, unknown>).code === 'P2002')
      return NextResponse.json({ message: 'Cette couleur existe déjà.' }, { status: 409 });
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;
  try {
    const { id, name, hex } = await req.json();
    if (!id || !name || !hex) return NextResponse.json({ message: 'ID, nom et hex requis.' }, { status: 400 });
    const color = await prisma.color.update({ where: { id }, data: { name: name.trim(), hex } });
    await logActivity({ userId: req.user?.id || null, action: 'UPDATE', entity: 'COLOR', entityId: color.id, details: `Couleur "${color.name}" modifiée` });
    return NextResponse.json(color);
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;
  try {
    const body = await req.json();
    const { id, ids } = body;

    if (id) {
      const color = await prisma.color.delete({ where: { id } });
      await logActivity({ userId: req.user?.id || null, action: 'DELETE', entity: 'COLOR', entityId: color.id, details: `Couleur "${color.name}" supprimée` });
      return NextResponse.json({ success: true, count: 1 });
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await prisma.color.deleteMany({ where: { id: { in: ids } } });
      await logActivity({ userId: req.user?.id || null, action: 'DELETE', entity: 'COLOR', details: `${ids.length} couleur(s) supprimée(s)` });
      return NextResponse.json({ success: true, count: ids.length });
    }

    return NextResponse.json({ message: 'ID ou IDs requis.' }, { status: 400 });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}
