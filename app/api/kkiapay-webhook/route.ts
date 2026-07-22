/**
 * Notification serveur-a-serveur de Kkiapay.
 *
 * C'est le filet de securite : si l'acheteur ferme son navigateur juste apres
 * avoir paye, c'est ce webhook — et lui seul — qui cree la commande. Il ne doit
 * donc jamais dependre de quoi que ce soit venant du navigateur.
 *
 * Le payload recu n'est pas cru sur parole : il sert uniquement a identifier la
 * tentative concernee. Le verdict vient de settleIntent(), qui re-interroge
 * l'API Kkiapay avec la cle privee.
 */
import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyKkiapayTransaction } from '@/lib/kkiapay';
import { settleIntent } from '@/lib/payment-settlement';

/**
 * Comparaison a duree constante : une comparaison naive laisse fuir le secret
 * caractere par caractere via le temps de reponse.
 */
function secretMatches(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Verifie que l'appel vient bien de Kkiapay. Le secret attendu est celui
 * configure dans le tableau de bord (en-tete `x-kkiapay-secret`).
 */
function isAuthenticCall(request: NextRequest): boolean {
  // Le hash secret est choisi par le marchand a la creation du webhook
  // (tableau de bord > Developpeurs > Cles API > Webhook). Il n'a aucun rapport
  // avec KKIAPAY_SECRET : pas de repli sur cette valeur, il ne matcherait
  // jamais et masquerait une configuration absente derriere un rejet silencieux.
  const expected = process.env.KKIAPAY_WEBHOOK_SECRET?.trim() || '';

  if (!expected) {
    console.error(
      '[WEBHOOK] KKIAPAY_WEBHOOK_SECRET absent : tous les appels sont refuses. ' +
        'Renseignez la meme valeur que le champ "Hash Secret" du tableau de bord Kkiapay.'
    );
    return false;
  }

  const received =
    request.headers.get('x-kkiapay-secret') || request.headers.get('X-KKIAPAY-SECRET') || '';

  if (!received) return false;
  return secretMatches(received, expected);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthenticCall(request)) {
    console.warn('[WEBHOOK] Signature absente ou invalide.');
    return NextResponse.json({ received: false }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ received: false, message: 'Payload invalide.' }, { status: 400 });
  }

  const transactionId =
    typeof payload.transactionId === 'string' ? payload.transactionId.trim() : '';

  if (!transactionId) {
    console.warn('[WEBHOOK] transactionId absent du payload.');
    // 200 : inutile que Kkiapay reessaie un payload qui n'en contiendra jamais.
    return NextResponse.json({ received: true, processed: false });
  }

  try {
    // L'identifiant de tentative voyage dans le champ `data` du widget. Kkiapay
    // le restitue selon les cas dans le payload ou dans `state` a la
    // verification ; en dernier recours on retrouve la tentative deja rattachee.
    let intentId =
      (typeof payload.stateData === 'string' && payload.stateData) ||
      (typeof payload.state === 'string' && payload.state) ||
      '';

    if (!intentId) {
      const known = await prisma.paymentIntent.findUnique({
        where: { transactionId },
        select: { id: true },
      });
      intentId = known?.id ?? '';
    }

    if (!intentId) {
      const verification = await verifyKkiapayTransaction(transactionId);
      intentId = typeof verification.state === 'string' ? verification.state : '';
    }

    if (!intentId) {
      console.error(
        `[WEBHOOK] Transaction ${transactionId} impossible a rattacher a une tentative.`
      );
      // 200 : un reessai donnerait le meme resultat. Necessite une reprise manuelle.
      return NextResponse.json({ received: true, processed: false });
    }

    const result = await settleIntent({ intentId, transactionId });

    if (result.outcome === 'PENDING') {
      // Verdict inconnu (API injoignable) : on demande un reessai a Kkiapay.
      console.warn(`[WEBHOOK] Verdict indisponible pour ${intentId}, reessai attendu.`);
      return NextResponse.json({ received: false, retry: true }, { status: 503 });
    }

    console.log(
      `[WEBHOOK] Tentative ${intentId} denouee : ${result.outcome}${
        result.outcome === 'PAID' ? ` (commande ${result.orderId})` : ''
      }`
    );
    return NextResponse.json({ received: true, processed: true, state: result.outcome });
  } catch (error) {
    console.error('[WEBHOOK] Erreur de traitement:', error);
    // 500 : Kkiapay reessaiera, l'erreur peut etre passagere.
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
