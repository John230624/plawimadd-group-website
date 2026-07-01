import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const pages = await prisma.cmsPage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(pages, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { slug, title, content, published } = await req.json();

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ success: false, message: 'Slug requis.' }, { status: 400 });
    }
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ success: false, message: 'Titre requis.' }, { status: 400 });
    }
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, message: 'Contenu requis.' }, { status: 400 });
    }

    const existing = await prisma.cmsPage.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Ce slug existe déjà.' }, { status: 409 });
    }

    const page = await prisma.cmsPage.create({
      data: { slug, title, content, published: published ?? false },
    });

    return NextResponse.json({ success: true, page }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
