import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest } from '@/lib/authUtils';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { title, tagline, description, image, category, bgColor, accentColor, layout, order } = body;

    if (!title || !tagline || !description || !image || !category) {
      return NextResponse.json({ success: false, message: 'Champs obligatoires manquants.' }, { status: 400 });
    }

    const slide = await prisma.heroSlide.create({
      data: {
        title,
        tagline,
        description,
        image,
        category,
        bgColor: bgColor || '#f3f4f6',
        accentColor: accentColor || '#3b82f6',
        layout: layout || 'left',
        order: typeof order === 'number' ? order : 0,
      },
    });

    return NextResponse.json({ success: true, slide });
  } catch (error) {
    console.error('Erreur POST hero-slides:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
