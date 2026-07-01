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
    const { rating, comment } = body;

    const data: Record<string, unknown> = {};
    if (rating !== undefined) data.rating = rating;
    if (comment !== undefined) data.comment = comment;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, message: 'Aucun champ à mettre à jour.' }, { status: 400 });
    }

    const review = await prisma.review.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, review }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur PUT review:', _error);
    if (
      typeof _error === 'object' && _error !== null && 'code' in _error &&
      (_error as { code?: string }).code === 'P2025'
    ) {
      return NextResponse.json({ success: false, message: 'Avis non trouvé.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
