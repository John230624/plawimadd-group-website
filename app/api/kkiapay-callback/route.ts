// app/api/kkiapay-callback/route.ts - VERSION LIVE UNIQUEMENT
import { getKkiapayConfig, verifyKkiapayTransaction } from '@/lib/kkiapay';
import prisma from '@/lib/prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

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
    const isSuccess = verification.status === 'SUCCESS';

    console.log(`✅ Vérification LIVE:`, {
      transactionId: kkiapayTransactionId,
      status: verification.status,
      amount: verification.amount,
      success: isSuccess
    });

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
    });

    console.log(`✅ Commande ${transactionId} mise à jour - Succès LIVE: ${isSuccess}`);

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
