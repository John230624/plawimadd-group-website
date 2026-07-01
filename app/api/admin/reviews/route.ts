import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        product: {
          select: { id: true, name: true, imgUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = reviews.map((review) => ({
      ...review,
      user: review.user
        ? {
            ...review.user,
            name: `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || review.user.email,
          }
        : null,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur GET reviews:', _error);
    return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const body = await req.json();
    const { ids, action } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: 'Liste d\'IDs valide requise.' }, { status: 400 });
    }

    if (action === 'delete') {
      const result = await prisma.review.deleteMany({
        where: { id: { in: ids } },
      });
      return NextResponse.json({ success: true, message: `${result.count} avis supprimés.` }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'Action non supportée. Utilisez "delete".' }, { status: 400 });
  } catch (_error: unknown) {
    console.error('Erreur PATCH reviews:', _error);
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
