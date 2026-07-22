// app/api/kkiapay-callback/route.ts - VERSION LIVE & SECURISEE
import { getKkiapayConfig, verifyKkiapayTransaction } from '@/lib/kkiapay';
import prisma from '@/lib/prisma';
import { recordOrderStockOut, restockOrder } from '@/lib/stock';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

function getAppBaseUrl(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  if (host && !host.includes('0.0.0.0')) {
    return `${proto}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('0.0.0.0')) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  const origin = request.nextUrl.origin;
  return origin.replace('0.0.0.0', 'localhost');
}

export async function GET(request: NextRequest) {
  console.log("🔄 Kkiapay Callback GET reçu");

  const baseUrl = getAppBaseUrl(request);
  const { searchParams } = new URL(request.url);

  // Extraire orderId et transaction_id de Kkiapay
  // Kkiapay peut envoyer orderId comme `orderId`, `transactionId` (si nomming legacy), ou dans `state`
  const orderId = searchParams.get('orderId') || searchParams.get('state');
  
  // L'ID de transaction Kkiapay est envoyé sous `transaction_id`, `id`, ou fallback
  let kkiapayTransactionId = searchParams.get('transaction_id') || searchParams.get('id');

  // Si searchParams.get('transactionId') ne correspond pas à l'orderId principal, c'est l'id Kkiapay
  const rawTxId = searchParams.get('transactionId');
  if (!kkiapayTransactionId && rawTxId && rawTxId !== orderId) {
    kkiapayTransactionId = rawTxId;
  }

  // Fallback si orderId n'était pas précisé séparément mais que rawTxId est notre UUID d'ordre
  const targetOrderId = orderId || (rawTxId && rawTxId.includes('-') ? rawTxId : null);

  console.log("📋 Paramètres callback résolus:", { targetOrderId, kkiapayTransactionId, rawTxId });

  if (!targetOrderId) {
    console.error("❌ orderId manquant dans le callback");
    return NextResponse.redirect(
      `${baseUrl}/order-status?status=error&message=${encodeURIComponent('ID de commande manquant')}`
    );
  }

  if (!kkiapayTransactionId) {
    console.error("❌ kkiapayTransactionId manquant");
    return NextResponse.redirect(
      `${baseUrl}/order-status?orderId=${targetOrderId}&status=failed&message=${encodeURIComponent('ID de transaction Kkiapay manquant')}`
    );
  }

  try {
    const config = getKkiapayConfig();
    console.log(`🔧 Callback - mode ${config.isSandbox ? 'SANDBOX' : 'LIVE'} - Vérification en cours...`);

    // 🔥 VÉRIFICATION RÉELLE OBLIGATOIRE AUPRÈS DE KKIAPAY
    const verification = await verifyKkiapayTransaction(kkiapayTransactionId);

    // Attente/Retry pour récupérer la commande au cas où create-after-payment du navigateur n'a pas encore fini
    let order = null;
    for (let attempt = 1; attempt <= 4; attempt++) {
      order = await prisma.order.findUnique({
        where: { id: targetOrderId },
        select: {
          totalAmount: true,
          userId: true,
          paymentStatus: true,
          orderItems: { select: { productId: true, quantity: true } },
        },
      });

      if (order) break;
      if (attempt < 4) {
        console.log(`⏳ Commande ${targetOrderId} non encore en base (tentative ${attempt}/4)... Attente 750ms`);
        await new Promise((resolve) => setTimeout(resolve, 750));
      }
    }

    if (!order) {
      console.error(`❌ Commande ${targetOrderId} introuvable en base de données`);
      return NextResponse.redirect(
        `${baseUrl}/order-status?orderId=${targetOrderId}&status=failed&message=${encodeURIComponent('Commande introuvable')}`
      );
    }

    const expectedAmount = Number(order.totalAmount);
    // Tolérance d'1 unité pour absorber les arrondis
    const amountIsValid = verification.amount + 1 >= expectedAmount;
    const isSuccess = verification.status === 'SUCCESS' && amountIsValid;

    if (verification.status === 'SUCCESS' && !amountIsValid) {
      console.error(
        `❌ Montant insuffisant pour la commande ${targetOrderId}: payé ${verification.amount}, attendu ${expectedAmount}`
      );
    }

    const wasCompleted = order.paymentStatus === PaymentStatus.COMPLETED;

    // Mise à jour atomique de la commande et du paiement
    await prisma.$transaction(async (prismaTx) => {
      await prismaTx.order.update({
        where: { id: targetOrderId },
        data: {
          status: isSuccess ? OrderStatus.PROCESSING : OrderStatus.PAYMENT_FAILED,
          paymentStatus: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          updatedAt: new Date(),
        },
      });

      await prismaTx.payment.upsert({
        where: { orderId: targetOrderId },
        update: {
          transactionId: kkiapayTransactionId,
          paymentMethod: verification.paymentMethod || 'KKIAPAY',
          amount: verification.amount,
          currency: verification.currency || 'XOF',
          status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          paymentDate: new Date(),
          updatedAt: new Date(),
        },
        create: {
          order: { connect: { id: targetOrderId } },
          transactionId: kkiapayTransactionId,
          paymentMethod: verification.paymentMethod || 'KKIAPAY',
          amount: verification.amount,
          currency: verification.currency || 'XOF',
          status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Sortie de stock si paiement validé
      if (isSuccess) {
        await recordOrderStockOut(prismaTx, {
          orderId: targetOrderId,
          items: order.orderItems,
          userId: order.userId,
        });
      } else if (wasCompleted) {
        await restockOrder(prismaTx, { orderId: targetOrderId, userId: order.userId });
      }
    });

    console.log(`✅ Commande ${targetOrderId} mise à jour - Succès: ${isSuccess}`);

    if (isSuccess && !wasCompleted) {
      try {
        await sendOrderConfirmationEmail(targetOrderId);
      } catch (emailError) {
        console.error("❌ Erreur envoi email de confirmation:", emailError);
      }
    }

    // Redirection sécurisée
    const redirectUrl = isSuccess
      ? `${baseUrl}/order-status?orderId=${targetOrderId}&status=success`
      : `${baseUrl}/order-status?orderId=${targetOrderId}&status=failed&message=${encodeURIComponent(verification.reason?.message || 'Paiement échoué')}`;

    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    // Le detail technique (cles API, reponse brute de Kkiapay...) reste dans les
    // logs serveur : il ne doit jamais atterrir dans l'URL vue par l'acheteur.
    console.error("❌ Erreur dans le callback Kkiapay:", error);

    return NextResponse.redirect(
      `${baseUrl}/order-status?orderId=${targetOrderId}&status=pending`
    );
  }
}
