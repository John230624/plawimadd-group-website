// C:\xampp\htdocs\plawimadd_group\app\api\orders\create-after-payment\route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth'; // Pour l'authentification de l'utilisateur
import { authOptions } from '@/lib/authOptions';
import { logActivity } from '@/lib/logActivity';
import { recordOrderStockOut } from '@/lib/stock';

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
            kkiapayPaymentMethod,
            kkiapayAmount,
            kkiapayStatus, // Récupération du statut Kkiapay pour la logique
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

        await prisma.$transaction(async (prismaTx) => {
            // Déterminer le statut de paiement initial de la commande
            const initialPaymentStatusForOrder = kkiapayStatus === 'SUCCESS' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING;

            // Créer la commande
            const newOrder = await prismaTx.order.create({
                data: {
                    id: orderId, // Utilise l'UUID généré côté client
                    userId: user.id,
                    totalAmount: new Prisma.Decimal(totalAmount),
                    status: OrderStatus.PENDING, // Le statut de la commande reste PENDING comme demandé
                    paymentStatus: initialPaymentStatusForOrder, // Statut de paiement dynamique basé sur Kkiapay
                    currency: currency,
                    shippingAddressLine1: shippingAddress.street ?? '', 
                    shippingAddressLine2: shippingAddress.area,
                    shippingCity: shippingAddress.city,
                    shippingState: shippingAddress.state,
                    shippingZipCode: shippingAddress.pincode,
                    shippingCountry: shippingAddress.country,
                    shippingAddressId: shippingAddress.id || null, // Peut être null si nouvelle adresse
                    userEmail: userEmail,
                    userPhoneNumber: userPhoneNumber,
                    orderDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    orderItems: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            priceAtOrder: new Prisma.Decimal(item.price),
                        })),
                    },
                },
            });
            console.log(`[Create Order After Payment] Commande ${newOrder.id} créée avec statut PENDING et paiement ${initialPaymentStatusForOrder}.`);

            // Créer l'enregistrement de paiement initial
            await prismaTx.payment.create({
                data: {
                    orderId: newOrder.id,
                    paymentMethod: kkiapayPaymentMethod || paymentMethod,
                    transactionId: kkiapayTransactionId || null, // L'ID de transaction Kkiapay peut être null si non fourni
                    amount: new Prisma.Decimal(kkiapayAmount || totalAmount), // Utilise le montant Kkiapay si dispo, sinon totalAmount
                    currency: currency,
                    status: initialPaymentStatusForOrder, // Statut du paiement dans la table Payment
                    paymentDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            console.log(`[Create Order After Payment] Enregistrement de paiement initial créé pour commande ${newOrder.id}.`);

            // Inventaire : sortie de stock si le paiement est déjà confirmé
            // (sinon le callback Kkiapay s'en chargera à la confirmation).
            if (initialPaymentStatusForOrder === PaymentStatus.COMPLETED) {
                await recordOrderStockOut(prismaTx, {
                    orderId: newOrder.id,
                    items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
                    userId: user.id,
                });
            }

            // Vider le panier de l'utilisateur
            await prismaTx.cartItem.deleteMany({
                where: { userId: user.id },
            });
            console.log(`[Create Order After Payment] Panier de l'utilisateur ${user.id} vidé.`);
        });

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
