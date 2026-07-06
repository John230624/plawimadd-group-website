import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  const { id } = await params;

  try {
    const body = await req.json();
    const { slug, title, content, published } = body;

    const data: Record<string, unknown> = {};
    if (slug !== undefined) data.slug = slug;
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (published !== undefined) data.published = published;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, message: 'Aucun champ à mettre à jour.' }, { status: 400 });
    }

    const page = await prisma.cmsPage.update({
      where: { id },
      data,
    });

    await logActivity({
      userId: req.user?.id || null,
      action: 'UPDATE',
      entity: 'CMS_PAGE',
      entityId: id,
      details: `Page CMS mise à jour : ${page.title}`,
    });

    return NextResponse.json({ success: true, page }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  const { id } = await params;

  try {
    await prisma.cmsPage.delete({ where: { id } });

    await logActivity({
      userId: req.user?.id || null,
      action: 'DELETE',
      entity: 'CMS_PAGE',
      entityId: id,
      details: `Page CMS supprimée : ${id}`,
    });

    return NextResponse.json({ success: true, message: 'Page supprimée avec succès.' }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
