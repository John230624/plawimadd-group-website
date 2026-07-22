// C:\xampp\htdocs\plawimadd_group\app\api\orders\create-after-payment\route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth'; // Pour l'authentification de l'utilisateur
import { authOptions } from '@/lib/authOptions';
import { logActivity } from '@/lib/logActivity';
import { recordOrderStockOut } from '@/lib/stock';
import { verifyKkiapayTransaction } from '@/lib/kkiapay';
import { sendOrderConfirmationEmail } from '@/lib/email';

// Interface pour le corps de la requête POST de ce endpoint
interface CreateOrderAfterPaymentPayload {
    id: string; // L'ID de commande généré côté client (UUID)
    items: {
        productId: string;
        quantity: number;
        price: number; // Prix unitaire au moment de la commande
    }[];
    totalAmount: number;
    shippingAddress: {
        id?: number; // L'ID de l'adresse existante si sélectionnée
        fullName: string;
        phoneNumber: string;
        area: string;
        city: string;
        state: string;
        street: string;
        country: string;
        pincode: string;
        isDefault?: boolean;
    };
    paymentMethod: string; // Ex: "Kkiapay"
    userEmail: string;
    userPhoneNumber: string | null;
    currency: string;
    // Informations de transaction Kkiapay reçues du frontend
    kkiapayTransactionId?: string;
    kkiapayPaymentMethod?: string;
    kkiapayAmount?: number;
    kkiapayStatus?: string; // Statut de la transaction Kkiapay (ex: 'SUCCESS', 'FAILED')
}

export async function POST(req: NextRequest) {
    console.log("==> /api/orders/create-after-payment POST reçu");

    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.id) {
            console.error("[Create Order After Payment] Utilisateur non authentifié.");
            return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
        }

        const userId = session.user.id;

        const body: CreateOrderAfterPaymentPayload = await req.json();
        const {
            id: orderId, // L'ID de commande généré côté client
            items,
            totalAmount,
            shippingAddress,
            paymentMethod,
            userEmail,
            userPhoneNumber,
            currency,
            kkiapayTransactionId,
            // kkiapayPaymentMethod / kkiapayAmount / kkiapayStatus du payload sont
            // volontairement ignorés : seules les données re-vérifiées via l'API
            // Kkiapay font foi (voir bloc SÉCURITÉ ci-dessous).
        } = body;

        // Vérifications de base
        if (!orderId || !items || items.length === 0 || !totalAmount || !shippingAddress || !userEmail) {
            console.error("[Create Order After Payment] Données de commande manquantes dans le payload.");
            return NextResponse.json({ success: false, message: 'Données de commande manquantes' }, { status: 400 });
        }

        // Assurez-vous que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            console.error(`[Create Order After Payment] Utilisateur ${userId} non trouvé.`);
            return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });
        }

        // ─── SÉCURITÉ : rien de ce qui touche à l'argent ne vient du client ───
        // 1) Prix et total recalculés depuis la base ; les prix du payload sont ignorés.
        const productIds = [...new Set(items.map((item) => item.productId))];
        const dbProducts = await prisma.product.findMany({
            where: { id: { in: productIds }, deletedAt: null },
            select: { id: true, price: true, offerPrice: true },
        });
        if (dbProducts.length !== productIds.length) {
            return NextResponse.json(
                { success: false, message: 'Un des produits de la commande est introuvable.' },
                { status: 400 }
            );
        }
        const priceById = new Map(
            dbProducts.map((p) => [p.id, Number(p.offerPrice ?? p.price)])
        );
        const serverItems = items.map((item) => ({
            productId: item.productId,
            quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
            unitPrice: priceById.get(item.productId)!,
        }));
        const serverTotal = serverItems.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        );

        // 2) Le statut COMPLETED n'est accordé qu'après vérification RÉELLE de la
        //    transaction auprès de l'API Kkiapay (clé privée). Le kkiapayStatus
        //    envoyé par le navigateur n'est jamais cru sur parole.
        let verifiedCompleted = false;
        let verifiedMethod: string | null = null;
        let verifiedAmount: number | null = null;
        let verifiedCurrency: string | null = null;

        if (kkiapayTransactionId) {
            // Anti-rejeu : une transaction Kkiapay ne peut financer qu'une seule commande.
            const existingPayment = await prisma.payment.findUnique({
                where: { transactionId: kkiapayTransactionId },
                select: { orderId: true },
            });
            if (existingPayment && existingPayment.orderId !== orderId) {
                console.error(
                    `[Create Order After Payment] Transaction ${kkiapayTransactionId} déjà utilisée pour la commande ${existingPayment.orderId}.`
                );
                return NextResponse.json(
                    { success: false, message: 'Transaction déjà utilisée.' },
                    { status: 409 }
                );
            }

            try {
                const verification = await verifyKkiapayTransaction(kkiapayTransactionId);
                // `state` porte notre orderId (champ data du widget) quand il est présent.
                const stateMatches =
                    !verification.state || String(verification.state) === orderId;
                const amountIsValid = verification.amount + 1 >= serverTotal;
                verifiedCompleted =
                    verification.status === 'SUCCESS' && amountIsValid && stateMatches;
                if (verifiedCompleted) {
                    verifiedMethod = verification.paymentMethod;
                    verifiedAmount = verification.amount;
                    verifiedCurrency = verification.currency;
                } else {
                    console.warn(
                        `[Create Order After Payment] Vérification Kkiapay non concluante pour ${kkiapayTransactionId}: status=${verification.status}, amount=${verification.amount}/${serverTotal}, stateMatch=${stateMatches}. Commande créée en PENDING.`
                    );
                }
            } catch (verifyError) {
                // API indisponible : on ne bloque pas la commande, mais elle reste
                // PENDING — le callback ou le webhook la confirmeront.
                console.warn(
                    '[Create Order After Payment] Vérification Kkiapay indisponible, commande en PENDING:',
                    verifyError
                );
            }
        }

        await prisma.$transaction(async (prismaTx) => {
            const initialPaymentStatusForOrder = verifiedCompleted ? PaymentStatus.COMPLETED : PaymentStatus.PENDING;
            const initialOrderStatus = verifiedCompleted ? OrderStatus.PROCESSING : OrderStatus.PENDING;

            // Vérifier si la commande existe déjà (ex: créée par callback ou webhook simultané)
            const existingOrder = await prismaTx.order.findUnique({
                where: { id: orderId },
            });

            if (existingOrder) {
                console.log(`[Create Order After Payment] Commande ${orderId} existante trouvée. Mise à jour des statuts.`);
                await prismaTx.order.update({
                    where: { id: orderId },
                    data: {
                        status: initialOrderStatus,
                        paymentStatus: initialPaymentStatusForOrder,
                        updatedAt: new Date(),
                    },
                });
            } else {
                // Créer la commande
                await prismaTx.order.create({
                    data: {
                        id: orderId, // Utilise l'UUID généré côté client
                        userId: user.id,
                        totalAmount: new Prisma.Decimal(serverTotal),
                        status: initialOrderStatus,
                        paymentStatus: initialPaymentStatusForOrder,
                        currency: currency,
                        shippingAddressLine1: shippingAddress.street ?? '', 
                        shippingAddressLine2: shippingAddress.area,
                        shippingCity: shippingAddress.city,
                        shippingState: shippingAddress.state,
                        shippingZipCode: shippingAddress.pincode,
                        shippingCountry: shippingAddress.country,
                        shippingAddressId: shippingAddress.id || null,
                        userEmail: userEmail,
                        userPhoneNumber: userPhoneNumber,
                        orderDate: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        orderItems: {
                            create: serverItems.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                priceAtOrder: new Prisma.Decimal(item.unitPrice),
                            })),
                        },
                    },
                });
                console.log(`[Create Order After Payment] Commande ${orderId} créée avec statut ${initialOrderStatus} et paiement ${initialPaymentStatusForOrder}.`);
            }

            // Enregistrer ou mettre à jour le paiement
            await prismaTx.payment.upsert({
                where: { orderId: orderId },
                update: {
                    paymentMethod: verifiedMethod || paymentMethod,
                    transactionId: kkiapayTransactionId || null,
                    amount: new Prisma.Decimal(verifiedAmount ?? serverTotal),
                    currency: verifiedCurrency || currency,
                    status: initialPaymentStatusForOrder,
                    paymentDate: new Date(),
                    updatedAt: new Date(),
                },
                create: {
                    orderId: orderId,
                    paymentMethod: verifiedMethod || paymentMethod,
                    transactionId: kkiapayTransactionId || null,
                    amount: new Prisma.Decimal(verifiedAmount ?? serverTotal),
                    currency: verifiedCurrency || currency,
                    status: initialPaymentStatusForOrder,
                    paymentDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            console.log(`[Create Order After Payment] Enregistrement de paiement géré pour commande ${orderId}.`);

            // Inventaire : sortie de stock si le paiement est confirmé
            if (initialPaymentStatusForOrder === PaymentStatus.COMPLETED) {
                await recordOrderStockOut(prismaTx, {
                    orderId: orderId,
                    items: serverItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
                    userId: user.id,
                });
            }

            // Vider le panier de l'utilisateur
            await prismaTx.cartItem.deleteMany({
                where: { userId: user.id },
            });
            console.log(`[Create Order After Payment] Panier de l'utilisateur ${user.id} vidé.`);
        });

        // Si le paiement est complété dès la création, on envoie le mail de confirmation
        if (verifiedCompleted) {
            try {
                await sendOrderConfirmationEmail(orderId);
            } catch (emailError) {
                console.error("[Create Order After Payment] Erreur envoi email confirmation:", emailError);
            }
        }

        await logActivity({
          userId,
          action: 'CREATE',
          entity: 'ORDER',
          entityId: orderId,
          details: `Commande créée après paiement`,
        });

        return NextResponse.json({ success: true, orderId: orderId, message: 'Commande créée avec succès' }, { status: 200 });

    } catch (error) {
        console.error("[Create Order After Payment] Erreur lors de la création de la commande:", error);
        return NextResponse.json({ success: false, message: 'Erreur serveur interne' }, { status: 500 });
    }
}
