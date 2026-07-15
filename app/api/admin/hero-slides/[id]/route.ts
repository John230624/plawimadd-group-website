import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest } from '@/lib/authUtils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const authResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  const { id } = await context.params;

  try {
    const body = await req.json();
    const { title, tagline, description, image, category, bgColor, accentColor, layout, order } = body;

    const existing = await prisma.heroSlide.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Diapositive introuvable.' }, { status: 404 });
    }

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        tagline: tagline !== undefined ? tagline : existing.tagline,
        description: description !== undefined ? description : existing.description,
        image: image !== undefined ? image : existing.image,
        category: category !== undefined ? category : existing.category,
        bgColor: bgColor !== undefined ? bgColor : existing.bgColor,
        accentColor: accentColor !== undefined ? accentColor : existing.accentColor,
        layout: layout !== undefined ? layout : existing.layout,
        order: typeof order === 'number' ? order : existing.order,
      },
    });

    return NextResponse.json({ success: true, slide });
  } catch (error) {
    console.error('Erreur PUT hero-slides:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const authResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.heroSlide.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Diapositive introuvable.' }, { status: 404 });
    }

    await prisma.heroSlide.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Diapositive supprimée.' });
  } catch (error) {
    console.error('Erreur DELETE hero-slides:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
