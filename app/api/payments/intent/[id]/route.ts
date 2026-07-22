/**
 * Etat d'une tentative de paiement, interroge en boucle par la page de statut.
 *
 * Sert aussi de rattrapage : si la tentative est encore en attente alors qu'un
 * identifiant de transaction est connu, on retente le denouement plutot que
 * d'attendre passivement le webhook.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PaymentIntentStatus } from '@prisma/client';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { settleIntent } from '@/lib/payment-settlement';
import { failureMessage, type PaymentFailureCodeValue } from '@/lib/payment-messages';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: Context): Promise<NextResponse> {
  const { id } = await context.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Non authentifie.' }, { status: 401 });
    }

    const intent = await prisma.paymentIntent.findFirst({
      where: { id, userId: session.user.id },
      select: {
        id: true,
        status: true,
        orderId: true,
        transactionId: true,
        failureReason: true,
      },
    });

    if (!intent) {
      return NextResponse.json(
        { success: false, message: 'Tentative de paiement introuvable.' },
        { status: 404 }
      );
    }

    if (intent.orderId) {
      return NextResponse.json({ success: true, state: 'PAID', orderId: intent.orderId });
    }

    if (intent.status === PaymentIntentStatus.FAILED) {
      return NextResponse.json({
        success: true,
        state: 'FAILED',
        message: failureMessage(intent.failureReason as PaymentFailureCodeValue),
      });
    }

    // Rattrapage : le webhook a peut-etre pris du retard ou n'est jamais arrive.
    if (intent.transactionId) {
      const result = await settleIntent({
        intentId: intent.id,
        transactionId: intent.transactionId,
      });
      if (result.outcome === 'PAID') {
        return NextResponse.json({ success: true, state: 'PAID', orderId: result.orderId });
      }
      if (result.outcome === 'FAILED') {
        return NextResponse.json({
          success: true,
          state: 'FAILED',
          message: failureMessage(result.code),
        });
      }
    }

    return NextResponse.json({ success: true, state: 'PENDING' });
  } catch (error) {
    console.error(`[INTENT ${id}] Lecture d'etat impossible:`, error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la verification du paiement.' },
      { status: 500 }
    );
  }
}
