// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { Decimal, PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
// Importez les types générés par Prisma directement pour une meilleure compatibilité
import { Product as PrismaProduct, Category } from '@prisma/client';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

// Définir le type du produit tel qu'il est retourné par Prisma avec la catégorie incluse
type ProductWithCategory = PrismaProduct & { category: Category };

// Define the type for the product as it will be returned in the API response
// This omits Prisma's specific types (Decimal, raw JSON string for imgUrl)
// and ensures client-friendly types (number, string[])
type ApiResponseProduct = Omit<ProductWithCategory, 'price' | 'offerPrice' | 'imgUrl' | 'categoryId'> & {
    price: number;
    offerPrice: number | null;
    imgUrl: string[];
    visible: boolean;
};

// Interface for the request body when creating/updating a product
interface ProductRequest {
    name: string;
    description: string;
    categoryId: string;
    price: number;
    offerPrice?: number | null;
    stock: number;
    imgUrl: string | string[]; // Accepts a string or an array of strings
    brand?: string | null;
    color?: string | null;
}


// --- GET (Récupérer un produit par ID) ---
export async function GET(req: NextRequest, context: RouteContext): Promise<NextResponse> {
    const { id } = await context.params;

    if (!id) {
        return NextResponse.json({ success: false, message: 'ID du produit manquant.' }, { status: 400 });
    }

    try {
        // Le type de 'product' ici est ProductWithCategory grâce à 'include: { category: true }'
        const product = await prisma.product.findUnique({
            where: { id: id },
            include: {
                category: true, // Include category details for the response
            },
        });

        if (!product) {
            return NextResponse.json({ success: false, message: 'Produit non trouvé.' }, { status: 404 });
        }

        // Convertir les types Prisma.Decimal en nombres JavaScript
        // et préparer imgUrl pour le client, en s'assurant que c'est un tableau de chaînes
        const responseProduct: ApiResponseProduct = {
            ...product,
            price: parseFloat(product.price.toString()),
            offerPrice: product.offerPrice ? parseFloat(product.offerPrice.toString()) : null,
            imgUrl: [],
            visible: product.visible,
        };

        // Parser imgUrl: si c'est une chaîne JSON, la parser. Si null, cela reste un tableau vide.
        if (product.imgUrl) {
            try {
                const parsed = JSON.parse(product.imgUrl);
                if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                    responseProduct.imgUrl = parsed;
                } else if (typeof parsed === 'string') {
                    responseProduct.imgUrl = [parsed];
                }
            } catch {
                if (typeof product.imgUrl === 'string') {
                    responseProduct.imgUrl = [product.imgUrl];
                }
            }
        }

        return NextResponse.json({ success: true, product: responseProduct }, { status: 200 });

    } catch (_error: unknown) {
        console.error('Erreur lors de la récupération du produit par ID:', _error);
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

// --- PUT (Mettre à jour un produit) ---
export async function PUT(req: NextRequest, context: RouteContext): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeAdminRequest(req);
    if (!authResult.authorized) {
        return authResult.response!;
    }

    const { id } = await context.params;
    const { name, description, categoryId, price, offerPrice, stock, imgUrl, brand, color } = await req.json() as ProductRequest;

    if (!id) {
        return NextResponse.json({ success: false, message: 'ID du produit manquant pour la mise à jour.' }, { status: 400 });
    }
    // Validate required fields
    if (!name || !description || !categoryId || price === undefined || stock === undefined || !imgUrl) {
        return NextResponse.json({ success: false, message: 'Champs obligatoires manquants pour la mise à jour.' }, { status: 400 });
    }

    try {
        const finalOfferPrice =
            (offerPrice !== undefined && offerPrice !== null && offerPrice > 0)
                ? new Decimal(offerPrice)
                : null;

        // Ensure imgUrl is stored as a JSON stringified array in the database
        const imgUrlArray = Array.isArray(imgUrl) ? imgUrl : [imgUrl];
        const imgUrlString = JSON.stringify(imgUrlArray);

        // Le type de 'updatedProduct' ici est ProductWithCategory
        const updatedProduct = await prisma.product.update({
            where: { id: id },
            data: {
                name: name,
                description: description,
                price: new Decimal(price),
                offerPrice: finalOfferPrice,
                stock: stock,
                imgUrl: imgUrlString,
                brand: brand,
                color: color,
                category: { connect: { id: categoryId } },
                updatedAt: new Date(),
            },
            include: {
                category: true, // Inclure la catégorie dans la réponse après la mise à jour
            }
        });

        // Convertir les types Decimal et parser imgUrl pour la réponse API
        const responseUpdatedProduct: ApiResponseProduct = {
            ...updatedProduct,
            price: parseFloat(updatedProduct.price.toString()),
            offerPrice: updatedProduct.offerPrice ? parseFloat(updatedProduct.offerPrice.toString()) : null,
            imgUrl: [],
            visible: updatedProduct.visible,
        };

        if (updatedProduct.imgUrl) {
            try {
                const parsed = JSON.parse(updatedProduct.imgUrl);
                if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                    responseUpdatedProduct.imgUrl = parsed;
                } else if (typeof parsed === 'string') {
                    responseUpdatedProduct.imgUrl = [parsed];
                }
            } catch {
                if (typeof updatedProduct.imgUrl === 'string') {
                    responseUpdatedProduct.imgUrl = [updatedProduct.imgUrl];
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Produit mis à jour avec succès.', product: responseUpdatedProduct }, { status: 200 });

    } catch (_error: unknown) {
        console.error('Erreur lors de la mise à jour du produit:', _error);
        if (_error instanceof PrismaClientKnownRequestError) {
            if (_error.code === 'P2025') {
                return NextResponse.json({ success: false, message: 'Produit non trouvé pour la mise à jour.' }, { status: 404 });
            }
            // Gérer la violation de contrainte unique, par exemple, si le nom du produit doit être unique
            if (_error.code === 'P2002') {
                return NextResponse.json({ success: false, message: 'Un produit avec ce nom existe déjà.' }, { status: 409 });
            }
        }
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

// --- PATCH (Mise à jour partielle inline: stock, price, visible) ---
export async function PATCH(req: NextRequest, context: RouteContext): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeAdminRequest(req);
    if (!authResult.authorized) {
        return authResult.response!;
    }

    const { id } = await context.params;
    if (!id) {
        return NextResponse.json({ success: false, message: 'ID du produit manquant.' }, { status: 400 });
    }

    try {
        const body = await req.json() as Record<string, unknown>;
        const data: Record<string, unknown> = {};

        if (body.stock !== undefined) {
            data.stock = Number(body.stock);
        }
        if (body.price !== undefined) {
            data.price = new Decimal(Number(body.price));
        }
        if (body.offerPrice !== undefined) {
            data.offerPrice = body.offerPrice !== null ? new Decimal(Number(body.offerPrice)) : null;
        }
        if (body.visible !== undefined) {
            data.visible = Boolean(body.visible);
        }
        if (body.name !== undefined) {
            data.name = String(body.name);
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ success: false, message: 'Aucun champ à mettre à jour.' }, { status: 400 });
        }

        data.updatedAt = new Date();

        const updatedProduct = await prisma.product.update({
            where: { id },
            data,
            include: { category: true },
        });

        const responseProduct: ApiResponseProduct = {
            ...updatedProduct,
            price: parseFloat(updatedProduct.price.toString()),
            offerPrice: updatedProduct.offerPrice ? parseFloat(updatedProduct.offerPrice.toString()) : null,
            imgUrl: [],
            visible: updatedProduct.visible,
        };

        if (updatedProduct.imgUrl) {
            try {
                const parsed = JSON.parse(updatedProduct.imgUrl);
                if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                    responseProduct.imgUrl = parsed;
                } else if (typeof parsed === 'string') {
                    responseProduct.imgUrl = [parsed];
                }
            } catch {
                if (typeof updatedProduct.imgUrl === 'string') {
                    responseProduct.imgUrl = [updatedProduct.imgUrl];
                }
            }
        }

        return NextResponse.json({ success: true, product: responseProduct }, { status: 200 });
    } catch (_error: unknown) {
        console.error('Erreur lors de la mise à jour partielle du produit:', _error);
        return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
    }
}

// --- DELETE (Supprimer un produit) ---
export async function DELETE(req: NextRequest, context: RouteContext): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeAdminRequest(req);
    if (!authResult.authorized) {
        return authResult.response!;
    }

    const { id } = await context.params;

    if (!id) {
        return NextResponse.json({ success: false, message: 'ID du produit manquant.' }, { status: 400 });
    }

    try {
        await prisma.product.delete({
            where: { id: id },
        });

        return NextResponse.json({ success: true, message: 'Produit supprimé avec succès.' }, { status: 200 });

    } catch (_error: unknown) {
        console.error('Erreur lors de la suppression du produit:', _error);
        if (_error instanceof PrismaClientKnownRequestError) {
            if (_error.code === 'P2025') {
                return NextResponse.json({ success: false, message: 'Produit non trouvé.' }, { status: 404 });
            }
            if (_error.code === 'P2003') { // Foreign key constraint failed
                return NextResponse.json({
                    success: false,
                    message: 'Impossible de supprimer le produit car il est lié à des commandes existantes ou des articles de panier. Veuillez le retirer des paniers/commandes d\'abord ou configurer la suppression en cascade dans votre schéma Prisma.'
                }, { status: 409 });
            }
        }
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}
