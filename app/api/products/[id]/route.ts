// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
// Importez les types générés par Prisma directement pour une meilleure compatibilité
import { Prisma, Product as PrismaProduct, Category } from '@prisma/client';

const Decimal = Prisma.Decimal;
type Decimal = Prisma.Decimal;

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
type ApiResponseProduct = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    offerPrice: number | null;
    stock: number;
    imgUrl: string[];
    createdAt: Date;
    updatedAt: Date;
    category: { id: string; name: string; description: string | null; imageUrl: string | null; createdAt: Date; updatedAt: Date };
    rating: number | null;
    brand: string | null;
    videoUrl: string | null;
    color: string | null;
    visible: boolean;
    weight: number | null;
    length: number | null;
    width: number | null;
    height: number | null;
    costPrice: number | null;
    metaTitle: string | null;
    metaDescription: string | null;
    tags: string[] | null;
    attributesJson: Record<string, unknown> | null;
    moqMin: number | null;
    moqMax: number | null;
    leadTimeRange: string | null;
    certifications: string[] | null;
    soldCount: number | null;
    reviewCount: number | null;
    variants?: {
        id: string;
        sku: string;
        variantName: string | null;
        price: number;
        stock: number;
        leadTimeDays: number | null;
        moq: number | null;
        weight: number | null;
        dimensions: string | null;
        isActive: boolean;
        attributes: {
            id: string;
            attributeId: string;
            attributeValueId: string | null;
            priceModifier: number | null;
            attribute: { id: string; name: string; attributeType: string };
            value: { id: string; value: string; colorCode: string | null; imageUrl: string | null } | null;
        }[];
        images: {
            id: string;
            imageUrl: string;
            isMainImage: boolean;
            displayOrder: number;
        }[];
    }[];
};

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
                category: true,
                variants: {
                    where: { isActive: true },
                    include: {
                        attributes: {
                            include: {
                                attribute: { select: { id: true, name: true, attributeType: true } },
                                value: { select: { id: true, value: true, colorCode: true, imageUrl: true } },
                            },
                        },
                        images: { orderBy: { displayOrder: 'asc' } },
                    },
                    orderBy: { price: 'asc' },
                },
            },
        });

        if (!product || product.deletedAt !== null) {
            return NextResponse.json({ success: false, message: 'Produit non trouvé.' }, { status: 404 });
        }

        const parsedImgUrls: string[] = [];
        if (product.imgUrl) {
            try {
                const parsed = JSON.parse(product.imgUrl);
                if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                    parsedImgUrls.push(...parsed);
                } else if (typeof parsed === 'string') {
                    parsedImgUrls.push(parsed);
                }
            } catch {
                if (typeof product.imgUrl === 'string') {
                    parsedImgUrls.push(product.imgUrl);
                }
            }
        }

        const parsedAttributesJson = product.attributesJson
            ? (() => { try { return JSON.parse(product.attributesJson); } catch { return null; } })()
            : null;
        const parsedCertifications = product.certifications
            ? (() => { try { const c = JSON.parse(product.certifications); return Array.isArray(c) ? c : null; } catch { return null; } })()
            : null;

        const responseProduct: ApiResponseProduct = {
            id: product.id,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price.toString()),
            offerPrice: product.offerPrice ? parseFloat(product.offerPrice.toString()) : null,
            stock: product.stock,
            imgUrl: parsedImgUrls,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            category: product.category,
            rating: product.rating,
            brand: product.brand,
            videoUrl: product.videoUrl ?? null,
            color: product.color,
            visible: product.visible,
            weight: product.weight,
            length: product.length,
            width: product.width,
            height: product.height,
            costPrice: product.costPrice ? parseFloat(product.costPrice.toString()) : null,
            metaTitle: product.metaTitle,
            metaDescription: product.metaDescription,
            tags: product.tags ? (() => { try { const t = JSON.parse(product.tags!); return Array.isArray(t) ? t : null; } catch { return null; } })() : null,
            attributesJson: parsedAttributesJson,
            moqMin: product.moqMin,
            moqMax: product.moqMax,
            leadTimeRange: product.leadTimeRange,
            certifications: parsedCertifications,
            soldCount: product.soldCount,
            reviewCount: product.reviewCount,
            variants: product.variants?.map(v => ({
                ...v,
                price: parseFloat(v.price.toString()),
                attributes: v.attributes.map(a => ({
                    ...a,
                    priceModifier: a.priceModifier ? parseFloat(a.priceModifier.toString()) : null,
                })),
            })),
        };

        return NextResponse.json({ success: true, product: responseProduct }, { status: 200 });

    } catch (_error: unknown) {
        console.error('Erreur lors de la récupération du produit par ID:', _error);
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

// --- PUT (Mettre à jour un produit) ---
export async function PUT(req: NextRequest, context: RouteContext): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeByPermission(req, 'products.edit');
    if (!authResult.authorized) {
        return authResult.response!;
    }

    const { id } = await context.params;
    const body = await req.json() as Record<string, unknown>;
    const { name, description, categoryId, imgUrl, brand, color, attributesJson, moqMin, moqMax, leadTimeRange, certifications } = body;
    const price = body.price as number;
    const offerPrice = body.offerPrice as number | undefined | null;
    const stock = body.stock as number;

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

        const imgUrlValue = imgUrl as string | string[];
        const imgUrlArray = Array.isArray(imgUrlValue) ? imgUrlValue : [imgUrlValue];
        const imgUrlString = JSON.stringify(imgUrlArray);

        const updateData: Record<string, unknown> = {
            name: name as string,
            description: description as string,
            price: new Decimal(price),
            offerPrice: finalOfferPrice,
            stock: stock,
            imgUrl: imgUrlString,
            brand: brand as string | undefined | null,
            color: color as string | undefined | null,
            category: { connect: { id: categoryId as string } },
            updatedAt: new Date(),
        };

        if (body.videoUrl !== undefined) {
            const v = typeof body.videoUrl === 'string' ? body.videoUrl.trim() : '';
            updateData.videoUrl = v || null;
        }

        if (attributesJson !== undefined) {
            updateData.attributesJson = typeof attributesJson === 'string' ? attributesJson : JSON.stringify(attributesJson);
        }
        if (moqMin !== undefined) updateData.moqMin = moqMin;
        if (moqMax !== undefined) updateData.moqMax = moqMax;
        if (leadTimeRange !== undefined) updateData.leadTimeRange = leadTimeRange;
        if (certifications !== undefined) {
            updateData.certifications = typeof certifications === 'string' ? certifications : JSON.stringify(certifications);
        }
        if (body.visible !== undefined) updateData.visible = body.visible as boolean;
        if (body.costPrice !== undefined) updateData.costPrice = body.costPrice ? new Decimal(body.costPrice as number) : null;
        if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : null;
        if (body.weight !== undefined) updateData.weight = body.weight as number | null;
        if (body.length !== undefined) updateData.length = body.length as number | null;
        if (body.width !== undefined) updateData.width = body.width as number | null;
        if (body.height !== undefined) updateData.height = body.height as number | null;

        const updatedProduct = await prisma.product.update({
            where: { id: id },
            data: updateData,
            include: {
                category: true,
            }
        });

        await logActivity({
            userId: req.user?.id || null,
            action: 'UPDATE',
            entity: 'PRODUCT',
            entityId: id,
            details: `Produit "${updatedProduct.name}" mis à jour`,
        });

        const parsedUpdateImgUrls: string[] = [];
        if (updatedProduct.imgUrl) {
            try {
                const parsed = JSON.parse(updatedProduct.imgUrl);
                if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                    parsedUpdateImgUrls.push(...parsed);
                } else if (typeof parsed === 'string') {
                    parsedUpdateImgUrls.push(parsed);
                }
            } catch {
                if (typeof updatedProduct.imgUrl === 'string') {
                    parsedUpdateImgUrls.push(updatedProduct.imgUrl);
                }
            }
        }

        const responseUpdatedProduct: ApiResponseProduct = {
            id: updatedProduct.id,
            name: updatedProduct.name,
            description: updatedProduct.description,
            price: parseFloat(updatedProduct.price.toString()),
            offerPrice: updatedProduct.offerPrice ? parseFloat(updatedProduct.offerPrice.toString()) : null,
            stock: updatedProduct.stock,
            imgUrl: parsedUpdateImgUrls,
            createdAt: updatedProduct.createdAt,
            updatedAt: updatedProduct.updatedAt,
            category: updatedProduct.category,
            rating: updatedProduct.rating,
            brand: updatedProduct.brand,
            videoUrl: updatedProduct.videoUrl ?? null,
            color: updatedProduct.color,
            visible: updatedProduct.visible,
            weight: updatedProduct.weight,
            length: updatedProduct.length,
            width: updatedProduct.width,
            height: updatedProduct.height,
            costPrice: updatedProduct.costPrice ? parseFloat(updatedProduct.costPrice.toString()) : null,
            metaTitle: updatedProduct.metaTitle,
            metaDescription: updatedProduct.metaDescription,
            tags: updatedProduct.tags ? (() => { try { const t = JSON.parse(updatedProduct.tags!); return Array.isArray(t) ? t : null; } catch { return null; } })() : null,
            attributesJson: updatedProduct.attributesJson ? (() => { try { return JSON.parse(updatedProduct.attributesJson!); } catch { return null; } })() : null,
            moqMin: updatedProduct.moqMin,
            moqMax: updatedProduct.moqMax,
            leadTimeRange: updatedProduct.leadTimeRange,
            certifications: updatedProduct.certifications ? (() => { try { const c = JSON.parse(updatedProduct.certifications!); return Array.isArray(c) ? c : null; } catch { return null; } })() : null,
            soldCount: updatedProduct.soldCount,
            reviewCount: updatedProduct.reviewCount,
        };

        return NextResponse.json({ success: true, message: 'Produit mis à jour avec succès.', product: responseUpdatedProduct }, { status: 200 });

    } catch (_error: unknown) {
        console.error('Erreur lors de la mise à jour du produit:', _error);
        const err = _error as any;
        if (err && typeof err === 'object') {
            if (err.code === 'P2025') {
                return NextResponse.json({ success: false, message: 'Produit non trouvé pour la mise à jour.' }, { status: 404 });
            }
            // Gérer la violation de contrainte unique, par exemple, si le nom du produit doit être unique
            if (err.code === 'P2002') {
                return NextResponse.json({ success: false, message: 'Un produit avec ce nom existe déjà.' }, { status: 409 });
            }
        }
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

// --- PATCH (Mise à jour partielle inline: stock, price, visible) ---
export async function PATCH(req: NextRequest, context: RouteContext): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeByPermission(req, 'products.edit');
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
        if (body.lowStockThreshold !== undefined) {
            data.lowStockThreshold = body.lowStockThreshold === null ? null : Math.max(0, Number(body.lowStockThreshold));
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

        await logActivity({
            userId: req.user?.id || null,
            action: 'UPDATE',
            entity: 'PRODUCT',
            entityId: id,
            details: `Produit "${updatedProduct.name}" mis à jour partiellement`,
        });

        const patchImgUrls: string[] = [];
        if (updatedProduct.imgUrl) {
            try {
                const parsed = JSON.parse(updatedProduct.imgUrl);
                if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                    patchImgUrls.push(...parsed);
                } else if (typeof parsed === 'string') {
                    patchImgUrls.push(parsed);
                }
            } catch {
                if (typeof updatedProduct.imgUrl === 'string') {
                    patchImgUrls.push(updatedProduct.imgUrl);
                }
            }
        }

        const responseProduct: ApiResponseProduct = {
            id: updatedProduct.id,
            name: updatedProduct.name,
            description: updatedProduct.description,
            price: parseFloat(updatedProduct.price.toString()),
            offerPrice: updatedProduct.offerPrice ? parseFloat(updatedProduct.offerPrice.toString()) : null,
            stock: updatedProduct.stock,
            imgUrl: patchImgUrls,
            createdAt: updatedProduct.createdAt,
            updatedAt: updatedProduct.updatedAt,
            category: updatedProduct.category,
            rating: updatedProduct.rating,
            brand: updatedProduct.brand,
            videoUrl: updatedProduct.videoUrl ?? null,
            color: updatedProduct.color,
            visible: updatedProduct.visible,
            weight: updatedProduct.weight,
            length: updatedProduct.length,
            width: updatedProduct.width,
            height: updatedProduct.height,
            costPrice: updatedProduct.costPrice ? parseFloat(updatedProduct.costPrice.toString()) : null,
            metaTitle: updatedProduct.metaTitle,
            metaDescription: updatedProduct.metaDescription,
            tags: updatedProduct.tags ? (() => { try { const t = JSON.parse(updatedProduct.tags!); return Array.isArray(t) ? t : null; } catch { return null; } })() : null,
            attributesJson: updatedProduct.attributesJson ? (() => { try { return JSON.parse(updatedProduct.attributesJson!); } catch { return null; } })() : null,
            moqMin: updatedProduct.moqMin,
            moqMax: updatedProduct.moqMax,
            leadTimeRange: updatedProduct.leadTimeRange,
            certifications: updatedProduct.certifications ? (() => { try { const c = JSON.parse(updatedProduct.certifications!); return Array.isArray(c) ? c : null; } catch { return null; } })() : null,
            soldCount: updatedProduct.soldCount,
            reviewCount: updatedProduct.reviewCount,
        };

        return NextResponse.json({ success: true, product: responseProduct }, { status: 200 });
    } catch (_error: unknown) {
        console.error('Erreur lors de la mise à jour partielle du produit:', _error);
        return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
    }
}

// --- DELETE (Supprimer un produit - Soft Delete) ---
export async function DELETE(req: NextRequest, context: RouteContext): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeByPermission(req, 'products.delete');
    if (!authResult.authorized) {
        return authResult.response!;
    }

    const { id } = await context.params;

    if (!id) {
        return NextResponse.json({ success: false, message: 'ID du produit manquant.' }, { status: 400 });
    }

    try {
        const deletedProduct = await prisma.product.update({
            where: { id: id },
            data: { deletedAt: new Date() },
        });

        await logActivity({
            userId: req.user?.id || null,
            action: 'DELETE',
            entity: 'PRODUCT',
            entityId: id,
            details: `Produit "${deletedProduct.name}" supprimé`,
        });

        return NextResponse.json({ success: true, message: 'Produit supprimé avec succès.' }, { status: 200 });

    } catch (_error: unknown) {
        console.error('Erreur lors de la suppression du produit:', _error);
        const err = _error as any;
        if (err && typeof err === 'object') {
            if (err.code === 'P2025') {
                return NextResponse.json({ success: false, message: 'Produit non trouvé.' }, { status: 404 });
            }
        }
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}
