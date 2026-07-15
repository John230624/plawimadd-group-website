// app/api/admin/orders/route.ts
// Cette route gère la récupération et la mise à jour des commandes par les administrateurs.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
// Renommer OrderStatus de lib/types pour éviter le conflit avec Prisma.OrderStatus
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { OrderStatus as CustomOrderStatus, PaymentStatus as CustomPaymentStatus } from '@/lib/types';
// CORRECTION ICI : Retrait de PaymentStatus de l'importation directe car non utilisé explicitement
import { OrderStatus, Prisma } from '@prisma/client'; // Importez OrderStatus directement, et Prisma pour les types utilitaires


// Fonction utilitaire pour parser l'URL de l'image en un tableau de chaînes
const parsePrismaImgUrl = (imgUrl: string | null): string[] => {
    if (!imgUrl) return [];
    try {
        const parsed = JSON.parse(imgUrl);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
            return parsed;
        } else if (typeof parsed === 'string') {
            return [parsed];
        }
    } catch (e) {
        if (typeof imgUrl === 'string') {
            return [imgUrl];
        }
    }
    return [];
};

// Définir un type complet pour la commande incluant toutes les relations incluses dans le findMany
type OrderWithAllRelations = Prisma.OrderGetPayload<{
    include: {
        user: {
            select: {
                firstName: true;
                lastName: true;
                email: true;
            };
        };
        orderItems: {
            include: {
                product: {
                    select: {
                        id: true;
                        name: true;
                        imgUrl: true;
                        price: true;
                        offerPrice: true;
                        color: true;
                    };
                };
            };
        };
        payment: true;
        orderPayments: true;
    };
}>;

// GET: Récupérer toutes les commandes (avec filtre de statut optionnel)
export async function GET(req: NextRequest): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeByPermission(req, 'orders.view');
    if (!authResult.authorized) return authResult.response!;

    try {
        const { searchParams } = new URL(req.url);
        const statusFilter = searchParams.get('status');

        const whereClause: Prisma.OrderWhereInput = {};

        if (statusFilter) {
            const upperStatus = statusFilter.toUpperCase();
            // Utiliser CustomOrderStatus pour la validation de l'input string
            // Puis caster vers l'OrderStatus importé directement de @prisma/client
            if (Object.values(CustomOrderStatus).includes(upperStatus as CustomOrderStatus)) {
                whereClause.status = { equals: upperStatus as OrderStatus }; // Utilise OrderStatus directement
            }
        }

        const orders: OrderWithAllRelations[] = await prisma.order.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imgUrl: true,
                                price: true,
                                offerPrice: true,
                                color: true,
                            },
                        },
                    },
                },
                payment: true,
                orderPayments: true,
            },
            orderBy: { orderDate: 'desc' },
        });

        const posTransactionIds = orders
            .filter((order) => order.id.startsWith('POS-'))
            .map((order) => order.id.replace(/^POS-/, ''));

        const posTransactions = posTransactionIds.length > 0
            ? await prisma.posTransaction.findMany({
                where: { id: { in: posTransactionIds } },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            })
            : [];

        const posTransactionMap = new Map(posTransactions.map((transaction) => [transaction.id, transaction]));

        const formattedOrders = orders.map((order: OrderWithAllRelations) => {
            const userName = `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim();
            const posTransaction = order.id.startsWith('POS-')
                ? posTransactionMap.get(order.id.replace(/^POS-/, ''))
                : null;
            const sellerName = posTransaction
                ? `${posTransaction.user.firstName || ''} ${posTransaction.user.lastName || ''}`.trim() || posTransaction.user.email || 'Vendeur'
                : null;
            const primaryOrderPayment = order.orderPayments[0];
            const totalAmountNumber = order.totalAmount.toNumber();
            const paidAmount = order.orderPayments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
            const remainingBalance = Math.max(0, totalAmountNumber - paidAmount);

            const formattedOrderItems = order.orderItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtOrder: item.priceAtOrder.toNumber(),
                product: {
                    id: item.product?.id || '',
                    name: item.product?.name || 'Produit Inconnu',
                    imgUrl: parsePrismaImgUrl(item.product?.imgUrl || null),
                    price: item.product?.price.toNumber() || 0,
                    offerPrice: item.product?.offerPrice?.toNumber() || null,
                    color: item.product?.color || null,
                }
            }));

            return {
                id: order.id,
                userId: order.userId,
                userName: posTransaction?.customerName || userName || order.user?.email || 'Utilisateur Inconnu',
                userEmail: posTransaction?.customerPhone || order.user?.email || '',
                totalAmount: totalAmountNumber,
                paidAmount,
                remainingBalance,
                status: order.status,
                paymentStatus: order.payment?.status || order.paymentStatus,
                orderDate: order.orderDate.toISOString(), // Ensure it's a string
                shippingAddressLine1: order.shippingAddressLine1,
                shippingAddressLine2: order.shippingAddressLine2,
                shippingCity: order.shippingCity,
                shippingState: order.shippingState,
                shippingZipCode: order.shippingZipCode,
                shippingCountry: order.shippingCountry,
                userPhoneNumber: order.userPhoneNumber,
                currency: order.currency,
                orderItems: formattedOrderItems,
                paymentMethod: order.payment?.paymentMethod || primaryOrderPayment?.paymentMethod || null,
                transactionId: order.payment?.transactionId || primaryOrderPayment?.reference || null,
                paymentDate: order.payment?.paymentDate?.toISOString() || primaryOrderPayment?.paidAt?.toISOString() || null,
                isPosOrder: Boolean(posTransaction),
                posTransactionId: posTransaction?.id || null,
                posInvoiceNumber: posTransaction?.invoiceNumber || null,
                posSellerName: sellerName,
                posSellerEmail: posTransaction?.user.email || null,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            };
        });

        return NextResponse.json(formattedOrders, { status: 200 });

    } catch (_error: unknown) {
        console.error('Erreur GET commandes:', _error);
        return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

// PUT: Mettre à jour le statut d'une commande
export async function PUT(req: NextRequest): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeByPermission(req, 'orders.update-status');
    if (!authResult.authorized) return authResult.response!;

    try {
        const { status: newStatus } = await req.json();
        const urlParts = req.nextUrl.pathname.split('/');
        const orderId = urlParts[urlParts.length - 1];

        if (!orderId || typeof orderId !== 'string' || !newStatus || typeof newStatus !== 'string') {
            return NextResponse.json({ success: false, message: 'ID de commande et statut valides sont requis.' }, { status: 400 });
        }

        const upperStatus = newStatus.toUpperCase();
        // Utiliser CustomOrderStatus pour la validation de l'input string
        if (!Object.values(CustomOrderStatus).includes(upperStatus as CustomOrderStatus)) {
            return NextResponse.json({ success: false, message: 'Statut de commande invalide.' }, { status: 400 });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: { set: upperStatus as OrderStatus }, // Utilise OrderStatus directement
                updatedAt: new Date(),
            },
        });

        await logActivity({
            userId: authResult.userId || null,
            action: 'UPDATE',
            entity: 'ORDER',
            entityId: orderId,
            details: `Commande #${orderId} marquée comme "${upperStatus}"`,
        });

        return NextResponse.json({ success: true, message: 'Statut de la commande mis à jour.', order: updatedOrder }, { status: 200 });
    } catch (_error: unknown) {
        console.error('Erreur PUT commande:', _error);
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

// DELETE: Supprimer une commande
export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeByPermission(req, 'orders.delete');
    if (!authResult.authorized) return authResult.response!;

    try {
        const { id } = await req.json();

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ success: false, message: 'ID de commande valide est requis pour la suppression.' }, { status: 400 });
        }

        const deleteResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await tx.orderItem.deleteMany({
                where: { orderId: id },
            });

            await tx.payment.deleteMany({
                where: { orderId: id },
            });

            return await tx.order.deleteMany({
                where: { id: id },
            });
        });

        if (deleteResult.count === 0) {
            return NextResponse.json({ success: false, message: 'Commande non trouvée ou déjà supprimée.' }, { status: 404 });
        }

        await logActivity({
            userId: authResult.userId || null,
            action: 'DELETE',
            entity: 'ORDER',
            entityId: id,
            details: `Commande #${id} supprimée`,
        });

        return NextResponse.json({ success: true, message: 'Commande supprimée avec succès.' }, { status: 200 });
    } catch (_error: unknown) {
        console.error('Erreur DELETE commande:', _error);
        if (
            typeof _error === 'object' &&
            _error !== null &&
            'code' in _error &&
            (_error as { code?: string }).code === 'P2025'
        ) {
            return NextResponse.json({ success: false, message: 'Commande non trouvée.' }, { status: 404 });
        }
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}
