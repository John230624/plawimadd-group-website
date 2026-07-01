// app/api/user/orders/route.ts
// Cette route gère la récupération des commandes d'un utilisateur authentifié.

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeLoggedInUser, AuthResult } from '@/lib/authUtils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Prisma } from '@prisma/client'; // Importé pour Prisma.Decimal, mais non utilisé directement dans le code final de la route.

// Interfaces pour la structure des données (à adapter si nécessaire)
interface OrderItemResponse {
    productId: string;
    quantity: number;
    priceAtOrder: number; // Changé de Prisma.Decimal à number
    product: {
        name: string;
        imgUrl: string | null;
    };
}

interface OrderResponse {
    id: string;
    userId: string;
    totalAmount: number; // Changé de Prisma.Decimal à number
    status: string | null;
    paymentStatus: string | null;
    shippingAddressLine1: string;
    shippingAddressLine2: string | null;
    shippingCity: string;
    shippingState: string;
    shippingZipCode: string | null;
    shippingCountry: string;
    userEmail: string;
    userPhoneNumber: string | null;
    currency: string;
    orderDate: Date;
    createdAt: Date;
    updatedAt: Date;
    orderItems: OrderItemResponse[];
    paymentMethod: string | null;
    transactionId: string | null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    // 1. Authentification de l'utilisateur
    const authResult: AuthResult = await authorizeLoggedInUser(req);
    if (!authResult.authorized) {
        return authResult.response!;
    }
    const userId = authResult.userId!; // L'ID de l'utilisateur authentifié

    try {
        console.log(`[API/user/orders] Fetching orders for user ID: ${userId}`);

        // Récupérer toutes les commandes de l'utilisateur, y compris les articles de commande et les détails du produit
        const orders = await prisma.order.findMany({
            where: { userId: userId },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                imgUrl: true,
                            },
                        },
                    },
                },
                payment: true, // INCLUSION DE LA RELATION PAYMENT
            },
            orderBy: {
                createdAt: 'desc', // Trier par date de création, les plus récentes en premier
            },
        });

        // Mapper les données pour le frontend
        const formattedOrders: OrderResponse[] = orders.map(order => ({
            id: order.id,
            userId: order.userId,
            totalAmount: order.totalAmount.toNumber(), // Convertir Decimal en number
            status: order.status,
            paymentStatus: order.paymentStatus,
            shippingAddressLine1: order.shippingAddressLine1,
            shippingAddressLine2: order.shippingAddressLine2,
            shippingCity: order.shippingCity,
            shippingState: order.shippingState,
            shippingZipCode: order.shippingZipCode,
            shippingCountry: order.shippingCountry,
            userEmail: order.userEmail,
            userPhoneNumber: order.userPhoneNumber,
            currency: order.currency,
            orderDate: order.orderDate,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            paymentMethod: order.payment?.paymentMethod || null,
            transactionId: order.payment?.transactionId || null,
            orderItems: order.orderItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtOrder: item.priceAtOrder.toNumber(), // Convertir Decimal en number
                product: {
                    name: item.product.name,
                    imgUrl: item.product.imgUrl,
                },
            })),
        }));

        console.log(`[API/user/orders] Found ${formattedOrders.length} orders for user ${userId}.`);
        return NextResponse.json({ success: true, data: formattedOrders }, { status: 200 });

    } catch (error: unknown) {
        console.error('[API/user/orders] Erreur lors de la récupération des commandes de l\'utilisateur:', error);
        return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

// La fonction POST est commentée comme décidé précédemment pour éviter les doublons.
/*
export async function POST(req: NextRequest): Promise<NextResponse> {
    // ... (votre code POST précédemment commenté)
}
*/
