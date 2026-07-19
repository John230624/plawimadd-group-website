import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import { Prisma } from '@prisma/client';

const Decimal = Prisma.Decimal;
type Decimal = Prisma.Decimal;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!authResult.authorized) return authResult.response!;

  try {
    const {
      productId, sku, variantName, price, stock,
      leadTimeDays, moq, weight, dimensions,
      attributes, images,
    } = await req.json();

    if (!productId || !sku || !sku.trim() || price === undefined) {
      return NextResponse.json({ message: 'productId, sku et price requis.' }, { status: 400 });
    }

    const variant = await prisma.$transaction(async (tx) => {
      const created = await tx.productVariant.create({
        data: {
          productId,
          sku: sku.trim(),
          variantName: variantName || null,
          price: new Decimal(price),
          stock: stock ?? 0,
          leadTimeDays: leadTimeDays || null,
          moq: moq ?? 1,
          weight: weight || null,
          dimensions: dimensions || null,
          attributes: attributes?.length
            ? {
                create: attributes.map((attr: { attributeId: string; attributeValueId?: string; priceModifier?: number; stockAdjustment?: number; weightModifier?: number }) => ({
                  attributeId: attr.attributeId,
                  attributeValueId: attr.attributeValueId || null,
                  priceModifier: attr.priceModifier ? new Decimal(attr.priceModifier) : null,
                  stockAdjustment: attr.stockAdjustment || null,
                  weightModifier: attr.weightModifier || null,
                })),
              }
            : undefined,
          images: images?.length
            ? {
                create: images.map((img: { imageUrl: string; displayOrder?: number; isMainImage?: boolean }, idx: number) => ({
                  imageUrl: img.imageUrl,
                  displayOrder: img.displayOrder ?? idx,
                  isMainImage: img.isMainImage ?? false,
                })),
              }
            : undefined,
        },
        include: {
          attributes: { include: { attribute: true, value: true } },
          images: { orderBy: { displayOrder: 'asc' } },
        },
      });
      return created;
    });

    await logActivity({
      userId: req.user?.id || null,
      action: 'CREATE',
      entity: 'PRODUCT_VARIANT',
      entityId: variant.id,
      details: `Variante "${variant.sku}" créée pour le produit ${productId}`,
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as Record<string, unknown>).code === 'P2002') {
      return NextResponse.json({ message: 'Ce SKU existe déjà.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { id, sku, variantName, price, stock, leadTimeDays, moq, weight, dimensions, isActive, attributes, images } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'ID requis.' }, { status: 400 });
    }

    const variant = await prisma.$transaction(async (tx) => {
      if (attributes) {
        await tx.variantAttribute.deleteMany({ where: { variantId: id } });
      }
      if (images) {
        await tx.variantImage.deleteMany({ where: { variantId: id } });
      }

      return tx.productVariant.update({
        where: { id },
        data: {
          ...(sku !== undefined && { sku: sku.trim() }),
          ...(variantName !== undefined && { variantName }),
          ...(price !== undefined && { price: new Decimal(price) }),
          ...(stock !== undefined && { stock }),
          ...(leadTimeDays !== undefined && { leadTimeDays }),
          ...(moq !== undefined && { moq }),
          ...(weight !== undefined && { weight }),
          ...(dimensions !== undefined && { dimensions }),
          ...(isActive !== undefined && { isActive }),
          ...(attributes?.length && {
            attributes: {
              create: attributes.map((attr: { attributeId: string; attributeValueId?: string; priceModifier?: number; stockAdjustment?: number; weightModifier?: number }) => ({
                attributeId: attr.attributeId,
                attributeValueId: attr.attributeValueId || null,
                priceModifier: attr.priceModifier ? new Decimal(attr.priceModifier) : null,
                stockAdjustment: attr.stockAdjustment || null,
                weightModifier: attr.weightModifier || null,
              })),
            },
          }),
          ...(images?.length && {
            images: {
              create: images.map((img: { imageUrl: string; displayOrder?: number; isMainImage?: boolean }, idx: number) => ({
                imageUrl: img.imageUrl,
                displayOrder: img.displayOrder ?? idx,
                isMainImage: img.isMainImage ?? false,
              })),
            },
          }),
        },
        include: {
          attributes: { include: { attribute: true, value: true } },
          images: { orderBy: { displayOrder: 'asc' } },
        },
      });
    });

    await logActivity({
      userId: req.user?.id || null,
      action: 'UPDATE',
      entity: 'PRODUCT_VARIANT',
      entityId: variant.id,
      details: `Variante "${variant.sku}" mise à jour`,
    });

    return NextResponse.json(variant);
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'products.manage-stock');
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const productId = searchParams.get('productId');

    if (!id && !productId) {
      return NextResponse.json({ message: 'ID ou productId requis.' }, { status: 400 });
    }

    if (productId) {
      const deleted = await prisma.productVariant.deleteMany({ where: { productId } });
      await logActivity({
        userId: req.user?.id || null,
        action: 'DELETE',
        entity: 'PRODUCT_VARIANT',
        entityId: productId,
        details: `${deleted.count} variante(s) supprimée(s) pour le produit ${productId}`,
      });
      return NextResponse.json({ success: true, count: deleted.count });
    }

    const variant = await prisma.productVariant.delete({ where: { id: id! } });

    await logActivity({
      userId: req.user?.id || null,
      action: 'DELETE',
      entity: 'PRODUCT_VARIANT',
      entityId: id!,
      details: `Variante "${variant.sku}" supprimée`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}
