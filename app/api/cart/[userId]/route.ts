// C:\xampp\htdocs\plawimadd_group\app\api\cart\[userId]\route.ts
// Cette route gère les articles du panier en interagissant avec le modèle CartItem.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assurez-vous que votre client Prisma est correctement importé
import { authorizeUser, AuthResult } from '@/lib/authUtils'; // Importation de la fonction d'autorisation commune
import { Decimal } from '@prisma/client/runtime/library'; // Réintroduit car utilisé pour le typage de Prisma.Decimal

interface Context {
    params: Promise<{
        userId: string;
    }>;
}

// Interface pour le format des articles du panier renvoyés au client
interface ClientCartItem {
    productId: string;
    quantity: number;
    name: string;
    imgUrl: string; // URL de l'image principale, après parsing
    price: number;
}

// Type pour les données brutes des articles du panier récupérées de Prisma,
// incluant les informations du produit lié.
type PrismaCartItemWithProduct = {
    productId: string;
    quantity: number;
    product: {
        name: string;
        imgUrl: string | null; // imgUrl est une chaîne JSON ou null dans la DB
        price: Decimal; // MODIFICATION ICI: Utilisation de Decimal pour un typage précis
    } | null; // Le produit peut être null si la relation est optionnelle ou non trouvée
};


// Helper function to parse imgUrl from Prisma Product (server-side)
// Assumes imgUrl in DB is a JSON string representing an array of strings or a single string.
const parsePrismaImgUrl = (imgUrl: string | null): string => {
    if (!imgUrl) {
        return ''; // Return empty string if no image URL
    }
    try {
        const parsed = JSON.parse(imgUrl);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
            return parsed[0]; // Return the first URL if it's an array
        } else if (typeof parsed === 'string') {
            return parsed; // Return the string directly if it was a stringified single URL
        }
    } catch (e) {
        // If parsing fails, treat the original string as a single URL
        if (typeof imgUrl === 'string') {
            return imgUrl;
        }
    }
    return ''; // Fallback for any unhandled cases
};

/**
 * GET /api/cart/[userId]
 * Récupère les articles du panier pour un utilisateur spécifique.
 * Nécessite une authentification et une autorisation (utilisateur ou admin).
 */
export async function GET(req: NextRequest, context: Context): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeUser(req, context);
    if (!authResult.authorized) {
        return authResult.response!;
    }
    const userId = authResult.userId!;

    try {
        // Récupérer les articles du panier de l'utilisateur depuis le modèle CartItem
        const cartItems: PrismaCartItemWithProduct[] = await prisma.cartItem.findMany({
            where: { userId: userId },
            select: { // Sélectionnez les champs nécessaires pour le client
                productId: true,
                quantity: true,
                product: { // Inclure les informations du produit associé
                    select: {
                        name: true,
                        imgUrl: true, // Ceci est la chaîne JSON stockée dans la DB
                        price: true, // Pour pouvoir recalculer le prix total côté client si nécessaire
                    }
                }
            },
        });

        // Mapper les cartItems pour qu'ils correspondent à l'interface client
        const formattedCartItems: ClientCartItem[] = cartItems.map((item: PrismaCartItemWithProduct) => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.product?.name || 'Unknown Product', // Récupère le nom du produit
            imgUrl: parsePrismaImgUrl(item.product?.imgUrl || null), // Parse l'URL de l'image
            price: item.product?.price ? parseFloat(item.product.price.toString()) : 0, // Récupère le prix
        }));

        return NextResponse.json({ success: true, cartItems: formattedCartItems }, { status: 200 });
    } catch (_error: unknown) {
        console.error("Erreur lors de la récupération du panier:", _error);
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

/**
 * POST /api/cart/[userId]
 * Ajoute un article au panier de l'utilisateur ou met à jour sa quantité.
 * Nécessite une authentification et une autorisation.
 */
export async function POST(req: NextRequest, context: Context): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeUser(req, context);
    if (!authResult.authorized) {
        return authResult.response!;
    }
    const userId = authResult.userId!;

    try {
        const { productId, quantity = 1 } = await req.json(); // quantity est la quantité à *ajouter*, pas le total

        if (!productId || typeof quantity !== 'number' || quantity <= 0) {
            return NextResponse.json({ success: false, message: 'ID du produit et quantité valide sont requis.' }, { status: 400 });
        }

        // Vérifier si l'article existe déjà dans le panier de l'utilisateur
        const existingCartItem = await prisma.cartItem.findFirst({
            where: {
                userId: userId,
                productId: productId,
            },
        });

        let updatedCartItem;
        if (existingCartItem) {
            // Mettre à jour la quantité si l'article existe déjà
            updatedCartItem = await prisma.cartItem.update({
                where: { id: existingCartItem.id },
                data: {
                    quantity: existingCartItem.quantity + quantity,
                },
            });
            console.log("Article panier mis à jour :", updatedCartItem);
        } else {
            // Créer un nouvel article de panier si ce n'est pas le cas
            updatedCartItem = await prisma.cartItem.create({
                data: {
                    userId: userId,
                    productId: productId,
                    quantity: quantity,
                },
            });
            console.log("Nouvel article panier créé :", updatedCartItem);
        }

        // Récupérer tous les articles du panier mis à jour pour le renvoyer au client
        const updatedCartItems: PrismaCartItemWithProduct[] = await prisma.cartItem.findMany({
            where: { userId: userId },
            select: {
                productId: true,
                quantity: true,
                product: {
                    select: {
                        name: true,
                        imgUrl: true, // Ceci est la chaîne JSON stockée dans la DB
                        price: true,
                    }
                }
            },
        });
        const formattedUpdatedCartItems: ClientCartItem[] = updatedCartItems.map((item: PrismaCartItemWithProduct) => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.product?.name || 'Unknown Product',
            imgUrl: parsePrismaImgUrl(item.product?.imgUrl || null), // Parse l'URL de l'image
            price: item.product?.price ? parseFloat(item.product.price.toString()) : 0,
        }));


        return NextResponse.json({ success: true, message: 'Article ajouté/mis à jour dans le panier.', cartItems: formattedUpdatedCartItems }, { status: 200 });
    } catch (_error: unknown) {
        console.error("Erreur lors de l'ajout au panier:", _error);
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

/**
 * PUT /api/cart/[userId]
 * Met à jour la quantité d'un article spécifique dans le panier à une valeur fixe.
 * Nécessite une authentification et une autorisation.
 */
export async function PUT(req: NextRequest, context: Context): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeUser(req, context);
    if (!authResult.authorized) {
        return authResult.response!;
    }
    const userId = authResult.userId!;

    try {
        const { productId, quantity } = await req.json(); // quantity est la nouvelle quantité totale

        if (!productId || typeof quantity !== 'number' || quantity < 0) {
            return NextResponse.json({ success: false, message: 'ID du produit et quantité valide sont requis.' }, { status: 400 });
        }

        if (quantity === 0) {
            // Si la quantité est 0, supprimer l'article du panier
            await prisma.cartItem.deleteMany({
                where: {
                    userId: userId,
                    productId: productId,
                },
            });
            console.log(`Article ${productId} supprimé du panier pour l'utilisateur ${userId}.`);
        } else {
            // Sinon, mettre à jour la quantité existante ou créer si non existant (upsert)
            const existingCartItem = await prisma.cartItem.findFirst({
                where: {
                    userId: userId,
                    productId: productId,
                },
            });

            if (existingCartItem) {
                await prisma.cartItem.update({
                    where: { id: existingCartItem.id },
                    data: { quantity: quantity },
                });
                console.log(`Quantité de l'article ${productId} mise à jour à ${quantity} pour l'utilisateur ${userId}.`);
            } else {
                // Si l'article n'existe pas et que la quantité est > 0, le créer
                await prisma.cartItem.create({
                    data: {
                        userId: userId,
                        productId: productId,
                        quantity: quantity,
                    },
                });
                console.log(`Nouvel article ${productId} ajouté avec la quantité ${quantity} pour l'utilisateur ${userId}.`);
            }
        }

        // Récupérer et renvoyer tous les articles du panier mis à jour
        const updatedCartItems: PrismaCartItemWithProduct[] = await prisma.cartItem.findMany({
            where: { userId: userId },
            select: {
                productId: true,
                quantity: true,
                product: {
                    select: {
                        name: true,
                        imgUrl: true, // Ceci est la chaîne JSON stockée dans la DB
                        price: true,
                    }
                }
            },
        });
        const formattedUpdatedCartItems: ClientCartItem[] = updatedCartItems.map((item: PrismaCartItemWithProduct) => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.product?.name || 'Unknown Product',
            imgUrl: parsePrismaImgUrl(item.product?.imgUrl || null), // Parse l'URL de l'image
            price: item.product?.price ? parseFloat(item.product.price.toString()) : 0,
        }));

        return NextResponse.json({ success: true, message: 'Quantité du panier mise à jour.', cartItems: formattedUpdatedCartItems }, { status: 200 });
    } catch (_error: unknown) {
        console.error("Erreur lors de la mise à jour de la quantité du panier:", _error);
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

/**
 * DELETE /api/cart/[userId]
 * Supprime un article spécifique du panier OU vide tout le panier si aucun productId n'est fourni.
 * Nécessite une authentification et une autorisation.
 */
export async function DELETE(req: NextRequest, context: Context): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeUser(req, context);
    if (!authResult.authorized) {
        return authResult.response!;
    }
    const userId = authResult.userId!;

    try {
        let productId: string | undefined;
        // Tente de lire le corps de la requête. Si aucun corps n'est envoyé, req.json() peut échouer.
        // Nous allons capturer l'erreur et considérer productId comme undefined dans ce cas.
        try {
            const body = await req.json();
            productId = body.productId;
        } catch (e) {
            console.log("[DELETE Cart] Aucun productId trouvé dans le corps de la requête, supposons une suppression de tous les articles du panier.");
            // productId reste undefined si le corps est vide ou invalide JSON
        }

        let deleteResult;
        if (productId) {
            // Cas 1: Supprimer un article spécifique
            deleteResult = await prisma.cartItem.deleteMany({
                where: {
                    userId: userId,
                    productId: productId,
                },
            });
            if (deleteResult.count === 0) {
                return NextResponse.json({ success: false, message: 'Article non trouvé dans le panier ou déjà supprimé.' }, { status: 404 });
            }
            console.log(`[DELETE Cart] Article ${productId} supprimé du panier pour l'utilisateur ${userId}.`);
            return NextResponse.json({ success: true, message: 'Article supprimé du panier.' }, { status: 200 });

        } else {
            // Cas 2: Vider tous les articles du panier pour l'utilisateur
            deleteResult = await prisma.cartItem.deleteMany({
                where: {
                    userId: userId,
                },
            });
            console.log(`[DELETE Cart] ${deleteResult.count} articles supprimés du panier de l'utilisateur ${userId} (panier vidé).`);
            return NextResponse.json({ success: true, message: 'Panier vidé avec succès.' }, { status: 200 });
        }

    } catch (_error: unknown) {
        console.error("Erreur lors de la suppression du panier:", _error);
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}
