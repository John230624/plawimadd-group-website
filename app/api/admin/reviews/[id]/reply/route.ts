import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'reviews.reply');
  if (!authResult.authorized) return authResult.response!;

  const { id } = await params;

  try {
    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, message: 'Le message est requis.' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ success: false, message: 'Avis non trouvé.' }, { status: 404 });
    }

    const reply = await prisma.reviewReply.create({
      data: {
        reviewId: id,
        userId: authResult.userId!,
        message: message.trim(),
      },
    });

    await logActivity({
      userId: authResult.userId || null,
      action: 'CREATE',
      entity: 'REVIEW_REPLY',
      entityId: reply.id,
      details: `Réponse ajoutée à l'avis #${id}`,
    });

    return NextResponse.json({ success: true, reply }, { status: 201 });
  } catch (_error: unknown) {
    console.error('Erreur POST reply:', _error);
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
