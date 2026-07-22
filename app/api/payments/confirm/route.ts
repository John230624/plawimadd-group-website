/**
 * Voie rapide de confirmation : appelee par la page de statut des le retour du
 * widget, avec l'identifiant de transaction annonce par Kkiapay.
 *
 * Elle ne decide rien par elle-meme — elle delegue a settleIntent(), qui
 * re-interroge l'API Kkiapay. Le webhook reste le filet si le navigateur
 * disparait avant cet appel.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { settleIntent } from '@/lib/payment-settlement';
import { failureMessage } from '@/lib/payment-messages';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Non authentifie.' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      intentId?: string;
      transactionId?: string;
    };
    const intentId = typeof body.intentId === 'string' ? body.intentId.trim() : '';
    const transactionId = typeof body.transactionId === 'string' ? body.transactionId.trim() : '';

    if (!intentId || !transactionId) {
      return NextResponse.json(
        { success: false, message: 'Reference de paiement incomplete.' },
        { status: 400 }
      );
    }

    // La tentative doit appartenir a l'appelant : sans ce controle, n'importe
    // quel compte connecte pourrait denouer la tentative d'un autre.
    const intent = await prisma.paymentIntent.findFirst({
      where: { id: intentId, userId: session.user.id },
      select: { id: true },
    });
    if (!intent) {
      return NextResponse.json(
        { success: false, message: 'Tentative de paiement introuvable.' },
        { status: 404 }
      );
    }

    const result = await settleIntent({ intentId, transactionId });

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
    return NextResponse.json({ success: true, state: 'PENDING' });
  } catch (error) {
    console.error('[CONFIRM] Erreur:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la confirmation du paiement.' },
      { status: 500 }
    );
  }
}
