// app/api/kkiapay-callback/route.ts - VERSION LIVE UNIQUEMENT
import { getKkiapayConfig, verifyKkiapayTransaction } from '@/lib/kkiapay';
import prisma from '@/lib/prisma';
import { recordOrderStockOut, restockOrder } from '@/lib/stock';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  console.log("🔄 Kkiapay Callback GET reçu - MODE LIVE");

  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transactionId');
  const kkiapayTransactionId = searchParams.get('transaction_id') || searchParams.get('id');

  console.log("📋 Paramètres callback:", { transactionId, kkiapayTransactionId });

  if (!transactionId) {
    console.error("❌ transactionId manquant dans le callback");
    return NextResponse.redirect(
      `${request.nextUrl.origin}/order-status?status=error&message=${encodeURIComponent('ID de transaction manquant')}`
    );
  }

  if (!kkiapayTransactionId) {
    console.error("❌ kkiapayTransactionId manquant en mode LIVE");
    return NextResponse.redirect(
      `${request.nextUrl.origin}/order-status?orderId=${transactionId}&status=failed&message=${encodeURIComponent('ID de transaction Kkiapay manquant')}`
    );
  }

  try {
    const config = getKkiapayConfig();
    console.log(`🔧 Callback - MODE LIVE - Vérification réelle obligatoire`);

    // 🔥 VÉRIFICATION RÉELLE OBLIGATOIRE EN LIVE
    const verification = await verifyKkiapayTransaction(kkiapayTransactionId);

    // Récupération de la commande pour valider que le montant payé correspond bien
    // au total attendu (protection contre les sous-paiements).
    const order = await prisma.order.findUnique({
      where: { id: transactionId },
      select: {
        totalAmount: true,
        userId: true,
        paymentStatus: true,
        orderItems: { select: { productId: true, quantity: true } },
      },
    });

    if (!order) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/order-status?orderId=${transactionId}&status=failed&message=${encodeURIComponent('Commande introuvable')}`
      );
    }

    const expectedAmount = Number(order.totalAmount);
    // Tolérance d'1 unité pour absorber d'éventuels arrondis de la passerelle.
    const amountIsValid = verification.amount + 1 >= expectedAmount;
    const isSuccess = verification.status === 'SUCCESS' && amountIsValid;

    if (verification.status === 'SUCCESS' && !amountIsValid) {
      console.error(
        `❌ Montant insuffisant pour la commande ${transactionId}: payé ${verification.amount}, attendu ${expectedAmount}`
      );
    }

    // Mise à jour de la base de données
    await prisma.$transaction(async (prismaTx) => {
      // Mettre à jour le statut de la commande
      await prismaTx.order.update({
        where: { id: transactionId },
        data: {
          status: isSuccess ? OrderStatus.PROCESSING : OrderStatus.PAYMENT_FAILED,
          paymentStatus: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          updatedAt: new Date(),
        },
      });

      // Mettre à jour le paiement avec les vraies données
      await prismaTx.payment.upsert({
        where: { orderId: transactionId },
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
          order: { connect: { id: transactionId } },
          transactionId: kkiapayTransactionId,
          paymentMethod: verification.paymentMethod,
          amount: verification.amount,
          currency: verification.currency,
          status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Inventaire : sortie de stock à la confirmation du paiement (idempotent),
      // re-crédit si un paiement d'abord complété est finalement refusé.
      const wasCompleted = order.paymentStatus === PaymentStatus.COMPLETED;
      if (isSuccess) {
        await recordOrderStockOut(prismaTx, {
          orderId: transactionId,
          items: order.orderItems,
          userId: order.userId,
        });
      } else if (wasCompleted) {
        await restockOrder(prismaTx, { orderId: transactionId, userId: order.userId });
      }
    });

    console.log(`✅ Commande ${transactionId} mise à jour - Succès LIVE: ${isSuccess}`);

    const wasCompleted = order.paymentStatus === PaymentStatus.COMPLETED;
    if (isSuccess && !wasCompleted) {
      try {
        await sendOrderConfirmationEmail(transactionId);
      } catch (emailError) {
        console.error("❌ Erreur envoi email de confirmation:", emailError);
      }
    }

    // Redirection
    const redirectUrl = isSuccess
      ? `${request.nextUrl.origin}/order-status?orderId=${transactionId}&status=success`
      : `${request.nextUrl.origin}/order-status?orderId=${transactionId}&status=failed&message=${encodeURIComponent(verification.reason?.message || 'Paiement échoué')}`;

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error("❌ Erreur dans le callback LIVE:", error);
    
    // En cas d'erreur de vérification, le paiement est considéré comme échoué
    return NextResponse.redirect(
      `${request.nextUrl.origin}/order-status?orderId=${transactionId}&status=failed&message=${encodeURIComponent('Erreur de vérification du paiement')}`
    );
  }
} 
//pourcommiter, sans impact sur le code
