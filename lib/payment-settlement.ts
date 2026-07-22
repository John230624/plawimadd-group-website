/**
 * Denouement d'une tentative de paiement en ligne.
 *
 * C'est le SEUL endroit du code autorise a creer une commande a partir d'un
 * paiement. La voie rapide (retour navigateur) et le webhook Kkiapay appellent
 * tous deux cette fonction : il ne peut donc pas exister deux logiques de
 * confirmation qui divergent.
 *
 * Garanties :
 *  - aucune commande n'existe tant que l'API Kkiapay n'a pas confirme ;
 *  - la fonction est idempotente : rejouee, elle renvoie la meme commande ;
 *  - deux appels concurrents ne peuvent pas creer deux commandes (verrou SQL) ;
 *  - une transaction Kkiapay ne peut financer qu'une seule commande.
 */
import { randomUUID } from 'crypto';
import { OrderStatus, PaymentIntentStatus, PaymentStatus, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { verifyKkiapayTransaction } from '@/lib/kkiapay';
import { recordOrderStockOut } from '@/lib/stock';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { logActivity } from '@/lib/logActivity';
import { PaymentFailureCode, type PaymentFailureCodeValue } from '@/lib/payment-messages';

export interface IntentItemSnapshot {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface IntentShippingSnapshot {
  addressId?: number | null;
  fullName: string;
  phoneNumber: string;
  street?: string | null;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode?: string | null;
}

export type SettleResult =
  | { outcome: 'PAID'; orderId: string }
  | { outcome: 'PENDING' }
  | { outcome: 'FAILED'; code: PaymentFailureCodeValue };

/** Signale qu'un appel concurrent a deja denoue cette tentative. */
class AlreadySettledError extends Error {}

/**
 * Programme les effets de bord hors du chemin critique : l'acheteur ne doit pas
 * attendre l'API d'emailing pour voir sa commande confirmee.
 */
function scheduleSideEffects(task: () => Promise<void>): void {
  const run = () =>
    task().catch((error) => {
      console.error('[SETTLE] Effet de bord post-paiement en echec:', error);
    });

  // `after()` de Next garantit l'execution apres la reponse HTTP. Hors contexte
  // de requete (tache planifiee, test), on retombe sur une promesse detachee.
  import('next/server')
    .then(({ after }) => {
      try {
        after(run);
      } catch {
        void run();
      }
    })
    .catch(() => {
      void run();
    });
}

function parseSnapshot<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Instantane ${label} illisible`);
  }
}

/**
 * Denoue une tentative de paiement.
 *
 * @param intentId      Tentative concernee (voyage dans le champ `data` du widget).
 * @param transactionId Identifiant de transaction annonce par Kkiapay.
 */
export async function settleIntent(params: {
  intentId: string;
  transactionId: string;
}): Promise<SettleResult> {
  const { intentId, transactionId } = params;

  const intent = await prisma.paymentIntent.findUnique({ where: { id: intentId } });

  if (!intent) {
    console.warn(`[SETTLE] Tentative ${intentId} introuvable.`);
    return { outcome: 'FAILED', code: PaymentFailureCode.INTENT_MISMATCH };
  }

  // ── Idempotence : deja denouee ────────────────────────────────────────────
  if (intent.orderId) {
    return { outcome: 'PAID', orderId: intent.orderId };
  }
  if (intent.status === PaymentIntentStatus.FAILED) {
    return {
      outcome: 'FAILED',
      code: (intent.failureReason as PaymentFailureCodeValue) ?? PaymentFailureCode.REJECTED,
    };
  }
  if (intent.status === PaymentIntentStatus.EXPIRED) {
    return { outcome: 'FAILED', code: PaymentFailureCode.EXPIRED };
  }

  // ── Anti-rejeu : cette transaction a-t-elle deja servi ailleurs ? ─────────
  const otherIntent = await prisma.paymentIntent.findUnique({
    where: { transactionId },
    select: { id: true },
  });
  if (otherIntent && otherIntent.id !== intentId) {
    console.error(
      `[SETTLE] Transaction ${transactionId} deja rattachee a la tentative ${otherIntent.id}, refusee pour ${intentId}.`
    );
    return { outcome: 'FAILED', code: PaymentFailureCode.ALREADY_USED };
  }

  // Meme garde cote paiements : couvre les transactions encaissees par l'ancien
  // flux, qui n'ont pas de tentative associee.
  const existingPayment = await prisma.payment.findUnique({
    where: { transactionId },
    select: { orderId: true },
  });
  if (existingPayment) {
    console.error(
      `[SETTLE] Transaction ${transactionId} deja portee par la commande ${existingPayment.orderId}.`
    );
    return { outcome: 'FAILED', code: PaymentFailureCode.ALREADY_USED };
  }

  // ── Seule autorite : l'API Kkiapay, interrogee de serveur a serveur ───────
  let verification: Awaited<ReturnType<typeof verifyKkiapayTransaction>>;
  try {
    verification = await verifyKkiapayTransaction(transactionId);
  } catch (error) {
    // Verdict inconnu, pas negatif : on ne marque surtout pas la tentative en
    // echec, sans quoi un incident passager condamnerait un paiement reussi.
    // Le webhook (ou un nouveau passage sur la page de statut) tranchera.
    console.error(`[SETTLE] Verification indisponible pour ${transactionId}:`, error);
    return { outcome: 'PENDING' };
  }

  const fail = async (code: PaymentFailureCodeValue): Promise<SettleResult> => {
    await prisma.paymentIntent.updateMany({
      where: { id: intentId, orderId: null },
      data: { status: PaymentIntentStatus.FAILED, failureReason: code },
    });
    return { outcome: 'FAILED', code };
  };

  // Controle 1 — le paiement a-t-il abouti ?
  if (verification.status !== 'SUCCESS') {
    console.warn(
      `[SETTLE] Paiement non abouti pour ${intentId} (tx ${transactionId}): statut ${verification.status}.`
    );
    return fail(PaymentFailureCode.REJECTED);
  }

  // Controle 2 — la transaction se rapporte-t-elle bien a CETTE tentative ?
  // `state` est l'echo du champ `data` transmis au widget. Quand la passerelle
  // le renvoie, il constitue le lien le plus fort possible et prime sur tout.
  if (verification.state) {
    if (String(verification.state) !== intentId) {
      console.error(
        `[SETTLE] Transaction ${transactionId} rattachee a ${verification.state}, refusee pour ${intentId}.`
      );
      return fail(PaymentFailureCode.INTENT_MISMATCH);
    }
  } else {
    // Sans echo, le rattachement repose sur le verrou d'unicite SQL pose plus
    // bas. Ce journal permet de verifier en production si l'echo arrive : s'il
    // est toujours present, ce repli peut etre supprime au profit du strict.
    console.warn(
      `[SETTLE] Kkiapay n'a pas renvoye \`state\` pour ${transactionId} ; rattachement a ${intentId} par verrou SQL.`
    );
  }

  // Controle 3 — la devise reglee est-elle la bonne ?
  const paidCurrency = (verification.currency || intent.currency).toUpperCase();
  if (paidCurrency !== intent.currency.toUpperCase()) {
    console.error(
      `[SETTLE] Devise ${paidCurrency} != ${intent.currency} pour la tentative ${intentId}.`
    );
    return fail(PaymentFailureCode.CURRENCY_MISMATCH);
  }

  // Controle 4 — le montant couvre-t-il le total ? Comparaison en Decimal pour
  // ne pas dependre des arrondis flottants. Aucune tolerance au sous-paiement.
  const paidAmount = new Prisma.Decimal(verification.amount);
  if (paidAmount.lessThan(intent.amount)) {
    console.error(
      `[SETTLE] Montant insuffisant pour ${intentId}: regle ${paidAmount.toString()}, attendu ${intent.amount.toString()}.`
    );
    return fail(PaymentFailureCode.AMOUNT_MISMATCH);
  }

  // ── Les quatre controles sont passes : la commande peut naitre ────────────
  const items = parseSnapshot<IntentItemSnapshot[]>(intent.itemsJson, 'articles');
  const shipping = parseSnapshot<IntentShippingSnapshot>(intent.shippingJson, 'livraison');
  const orderId = randomUUID();

  try {
    await prisma.$transaction(async (tx) => {
      // Verrou : `updateMany` conditionnel ne touche la ligne que si personne
      // ne l'a denouee entre-temps. `transactionId` etant unique, un rejeu
      // concurrent leve P2002 et annule toute la transaction.
      const claim = await tx.paymentIntent.updateMany({
        where: { id: intentId, orderId: null, status: PaymentIntentStatus.PENDING },
        data: {
          status: PaymentIntentStatus.SUCCEEDED,
          orderId,
          transactionId,
          failureReason: null,
        },
      });
      if (claim.count === 0) throw new AlreadySettledError();

      await tx.order.create({
        data: {
          id: orderId,
          userId: intent.userId,
          totalAmount: intent.amount,
          status: OrderStatus.PROCESSING,
          paymentStatus: PaymentStatus.COMPLETED,
          currency: intent.currency,
          shippingAddressLine1: shipping.street || shipping.area,
          shippingAddressLine2: shipping.area,
          shippingCity: shipping.city,
          shippingState: shipping.state,
          shippingZipCode: shipping.pincode ?? null,
          shippingCountry: shipping.country,
          shippingAddressId: shipping.addressId ?? null,
          userEmail: intent.userEmail,
          userPhoneNumber: intent.userPhoneNumber,
          orderDate: new Date(),
          orderItems: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtOrder: new Prisma.Decimal(item.unitPrice),
            })),
          },
        },
      });

      await tx.payment.create({
        data: {
          orderId,
          paymentMethod: verification.paymentMethod || 'KKIAPAY',
          transactionId,
          amount: paidAmount,
          currency: paidCurrency,
          status: PaymentStatus.COMPLETED,
          paymentDate: new Date(),
        },
      });

      await recordOrderStockOut(tx, {
        orderId,
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        userId: intent.userId,
      });

      await tx.cartItem.deleteMany({ where: { userId: intent.userId } });
    });
  } catch (error) {
    const isRace =
      error instanceof AlreadySettledError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002');

    if (isRace) {
      // Un appel concurrent a gagne : on renvoie SA commande, pas une nouvelle.
      const settled = await prisma.paymentIntent.findUnique({
        where: { id: intentId },
        select: { orderId: true, status: true, failureReason: true },
      });
      if (settled?.orderId) return { outcome: 'PAID', orderId: settled.orderId };
      if (settled?.status === PaymentIntentStatus.FAILED) {
        return {
          outcome: 'FAILED',
          code: (settled.failureReason as PaymentFailureCodeValue) ?? PaymentFailureCode.ALREADY_USED,
        };
      }
      return { outcome: 'PENDING' };
    }

    console.error(`[SETTLE] Creation de commande impossible pour ${intentId}:`, error);
    // La transaction a ete annulee en bloc : la tentative reste PENDING et
    // reste donc rejouable. On ne perd pas le paiement.
    return { outcome: 'PENDING' };
  }

  console.log(`[SETTLE] Commande ${orderId} creee depuis la tentative ${intentId}.`);

  scheduleSideEffects(async () => {
    await sendOrderConfirmationEmail(orderId);
    await logActivity({
      userId: intent.userId,
      action: 'CREATE',
      entity: 'ORDER',
      entityId: orderId,
      details: `Commande creee apres paiement verifie (tx ${transactionId})`,
    });
  });

  return { outcome: 'PAID', orderId };
}
