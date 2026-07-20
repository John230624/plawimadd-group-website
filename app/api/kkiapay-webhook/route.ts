// app/api/kkiapay-webhook/route.ts
// Notification serveur-a-serveur de Kkiapay (filet de securite du callback navigateur).
// Si le client ferme son navigateur apres paiement, le callback GET ne se declenche
// jamais : ce webhook confirme quand meme la commande.
//
// Securite : le payload recu n'est JAMAIS cru sur parole. On re-verifie la
// transaction aupres de l'API Kkiapay avec la cle privee ; seul ce resultat
// fait foi (statut, montant, et notre orderId stocke dans `state`).
import { verifyKkiapayTransaction } from '@/lib/kkiapay';
import prisma from '@/lib/prisma';
import { recordOrderStockOut, restockOrder } from '@/lib/stock';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ received: false, message: 'Payload JSON invalide.' }, { status: 400 });
  }

  const kkiapayTransactionId =
    typeof payload.transactionId === 'string' ? payload.transactionId : null;

  if (!kkiapayTransactionId) {
    console.warn('[Kkiapay Webhook] transactionId absent du payload:', payload);
    // 200 : inutile que Kkiapay reessaie un payload qui ne contiendra jamais l'id.
    return NextResponse.json({ received: true, processed: false });
  }

  try {
    const verification = await verifyKkiapayTransaction(kkiapayTransactionId);

    // Notre orderId voyage dans le champ `data` du widget, que Kkiapay
    // restitue dans `state` a la verification (fallback : champs du payload).
    const orderId =
      (typeof verification.state === 'string' && verification.state) ||
      (typeof payload.stateData === 'string' && payload.stateData) ||
      (typeof payload.state === 'string' && payload.state) ||
      null;

    if (!orderId) {
      console.warn(
        `[Kkiapay Webhook] Impossible de relier la transaction ${kkiapayTransactionId} a une commande (state vide).`
      );
      return NextResponse.json({ received: true, processed: false });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        totalAmount: true,
        userId: true,
        paymentStatus: true,
        orderItems: { select: { productId: true, quantity: true } },
      },
    });

    if (!order) {
      console.warn(`[Kkiapay Webhook] Commande ${orderId} introuvable.`);
      return NextResponse.json({ received: true, processed: false });
    }

    const expectedAmount = Number(order.totalAmount);
    // Meme tolerance d'arrondi que le callback navigateur.
    const amountIsValid = verification.amount + 1 >= expectedAmount;
    const isSuccess = verification.status === 'SUCCESS' && amountIsValid;

    // Idempotence : si le callback navigateur est deja passe et a conclu au
    // meme etat, on ne refait rien (le webhook arrive souvent en double).
    const alreadyCompleted = order.paymentStatus === PaymentStatus.COMPLETED;
    if (alreadyCompleted && isSuccess) {
      return NextResponse.json({ received: true, processed: true, alreadyProcessed: true });
    }

    await prisma.$transaction(async (prismaTx) => {
      await prismaTx.order.update({
        where: { id: orderId },
        data: {
          status: isSuccess ? OrderStatus.PROCESSING : OrderStatus.PAYMENT_FAILED,
          paymentStatus: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          updatedAt: new Date(),
        },
      });

      await prismaTx.payment.upsert({
        where: { orderId },
        update: {
          transactionId: kkiapayTransactionId,
          paymentMethod: verification.paymentMethod,
          amount: verification.amount,
          currency: verification.currency,
          status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          paymentDate: new Date(),
          updatedAt: new Date(),
        },
        create: {
          order: { connect: { id: orderId } },
          transactionId: kkiapayTransactionId,
          paymentMethod: verification.paymentMethod,
          amount: verification.amount,
          currency: verification.currency,
          status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (isSuccess) {
        // recordOrderStockOut est idempotent : pas de double sortie de stock
        // si le callback navigateur est passe avant nous.
        await recordOrderStockOut(prismaTx, {
          orderId,
          items: order.orderItems,
          userId: order.userId,
        });
      } else if (alreadyCompleted) {
        await restockOrder(prismaTx, { orderId, userId: order.userId });
      }
    });

    console.log(
      `[Kkiapay Webhook] Commande ${orderId} traitee via webhook - succes: ${isSuccess} (tx ${kkiapayTransactionId})`
    );

    if (isSuccess && !alreadyCompleted) {
      try {
        await sendOrderConfirmationEmail(orderId);
      } catch (emailError) {
        console.error('[Kkiapay Webhook] Erreur envoi email confirmation:', emailError);
      }
    }

    return NextResponse.json({ received: true, processed: true, success: isSuccess });
  } catch (error) {
    console.error('[Kkiapay Webhook] Erreur de traitement:', error);
    // 500 : Kkiapay reessaiera plus tard (erreur transitoire possible).
    return NextResponse.json(
      { received: false, message: 'Erreur de verification, reessayer.' },
      { status: 500 }
    );
  }
}
