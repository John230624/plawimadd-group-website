// C:\xampp\htdocs\plawimadd_group\app\api\orders\[userId]\route.ts
// Cette route gère la récupération des commandes pour un utilisateur spécifique.
// Accessible uniquement par l'utilisateur lui-même ou un administrateur.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Importez votre client Prisma
import { authorizeUser, AuthResult, Context } from '@/lib/authUtils'; // Importez la fonction d'autorisation utilisateur et Context

// Les imports de mysql2/promise ne sont plus nécessaires
// import pool from '@/lib/db';
// import type { PoolConnection, RowDataPacket } from 'mysql2/promise';

// Les interfaces spécifiques aux RowDataPacket ne sont plus nécessaires car Prisma génère ses propres types.
// interface SessionUser { ... }
// interface OrderRow { ... }
// interface OrderItemRow { ... }

export async function GET(req: NextRequest, context: Context): Promise<NextResponse> {
    // 1. Authentification et Autorisation
    // authorizeUser gère déjà la logique pour vérifier si l'utilisateur est le propriétaire de l'ID ou un ADMIN.
    const authResult: AuthResult = await authorizeUser(req, context);
    if (!authResult.authorized) {
        // authorizeUser renvoie déjà la réponse appropriée (401, 403)
        return authResult.response!;
    }
    const userIdFromParams = authResult.userId!; // L'ID de l'utilisateur autorisé (provenant des params ou de la session/token)

    try {
        // 2. Récupération des commandes de l'utilisateur via Prisma
        const orders = await prisma.order.findMany({
            where: { userId: userIdFromParams },
            orderBy: { orderDate: 'desc' }, // Trie par la date de commande la plus récente
            include: {
                orderItems: { // Inclut les articles de chaque commande
                    include: {
                        product: { // Inclut les détails du produit pour chaque article de commande
                            select: {
                                name: true,
                                imgUrl: true, // Récupère l'URL de l'image du produit
                                color: true,
                            },
                        },
                    },
                },
                shippingAddress: true, // Inclut l'adresse de livraison associée (si liée)
                payment: { // Inclut les détails de paiement
                    select: {
                        paymentMethod: true,
                        status: true,
                        transactionId: true,
                        amount: true,
                        currency: true,
                        paymentDate: true,
                    }
                }
            },
        });

        // 3. Formater les données pour la réponse frontend
        const formattedOrders = orders.map((order) => {
            const items = order.orderItems.map((item) => {
                let imageUrl: string[] = [];
                // Logique de parsing de imgUrl (si c'est un JSON string d'URLs)
                if (item.product?.imgUrl) {
                    try {
                        const parsed = JSON.parse(item.product.imgUrl);
                        if (Array.isArray(parsed)) {
                            imageUrl = parsed;
                        } else if (typeof parsed === 'string') {
                            imageUrl = [parsed];
                        }
                    } catch {
                        // Si le parsing échoue, et c'est une chaîne, utilisez-la directement
                        if (typeof item.product.imgUrl === 'string' && (item.product.imgUrl.startsWith('/') || item.product.imgUrl.startsWith('http'))) {
                            imageUrl = [item.product.imgUrl];
                        }
                    }
                }

                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    priceAtOrder: parseFloat(item.priceAtOrder.toString()), // Convertir Decimal en number
                    name: item.product?.name || 'Produit Inconnu',
                    imgUrl: imageUrl.length > 0 ? imageUrl[0] : '/placeholder-product.png', // Première image ou placeholder
                    color: item.product?.color || null,
                };
            });

            return {
                id: order.id,
                totalAmount: parseFloat(order.totalAmount.toString()), // Convertir Decimal en number
                orderStatus: order.status, // Statut de la commande
                paymentStatus: order.payment?.status || order.paymentStatus, // Statut de paiement (priorité à la table Payment)
                shippingAddressLine1: order.shippingAddressLine1,
                shippingAddressLine2: order.shippingAddressLine2,
                shippingCity: order.shippingCity,
                shippingState: order.shippingState,
                shippingZipCode: order.shippingZipCode,
                shippingCountry: order.shippingCountry,
                orderDate: order.orderDate.toISOString(), // Convertir Date en string ISO
                paymentMethod: order.payment?.paymentMethod || 'N/A',
                paymentTransactionId: order.payment?.transactionId || null,
                paymentAmount: order.payment?.amount ? parseFloat(order.payment.amount.toString()) : 0,
                paymentCurrency: order.payment?.currency || 'XOF',
                paymentDate: order.payment?.paymentDate?.toISOString() || null,
                items: items, // Articles de commande formatés
                createdAt: order.createdAt.toISOString(),
                updatedAt: order.updatedAt.toISOString(),
            };
        });

        return NextResponse.json(formattedOrders, { status: 200 });
    } catch (_error: unknown) { // Correction ESLint: renommé 'error' en '_error'
        console.error('Erreur GET /api/orders/[userId]:', _error);
        return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}