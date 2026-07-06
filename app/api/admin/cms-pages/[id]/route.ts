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
    const { slug, title, content, published } = await req.json();

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
      userId: authResult.userId || null,
      action: 'UPDATE',
      entity: 'CMS_PAGE',
      entityId: id,
      details: `Page "${page.title}" mise à jour`,
    });

    return NextResponse.json({ success: true, page }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur PUT cms-page:', _error);
    if (
      typeof _error === 'object' && _error !== null && 'code' in _error &&
      (_error as { code?: string }).code === 'P2025'
    ) {
      return NextResponse.json({ success: false, message: 'Page non trouvée.' }, { status: 404 });
    }
    if (
      typeof _error === 'object' && _error !== null && 'code' in _error &&
      (_error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json({ success: false, message: 'Ce slug existe déjà.' }, { status: 409 });
    }
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
    const deletedPage = await prisma.cmsPage.delete({ where: { id } });
    await logActivity({
      userId: authResult.userId || null,
      action: 'DELETE',
      entity: 'CMS_PAGE',
      entityId: id,
      details: `Page "${deletedPage.title}" supprimée`,
    });
    return NextResponse.json({ success: true, message: 'Page supprimée avec succès.' }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur DELETE cms-page:', _error);
    if (
      typeof _error === 'object' && _error !== null && 'code' in _error &&
      (_error as { code?: string }).code === 'P2025'
    ) {
      return NextResponse.json({ success: false, message: 'Page non trouvée.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
