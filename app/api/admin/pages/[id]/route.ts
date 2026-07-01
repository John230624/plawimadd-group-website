import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';

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
    return NextResponse.json({ success: true, message: 'Page supprimée avec succès.' }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
