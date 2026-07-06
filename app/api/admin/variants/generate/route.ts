import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { productId, selectedAttributes } = await req.json();
    // selectedAttributes = [{ attributeId, values: [{ attributeValueId, priceModifier, stockAdjustment }] }]

    if (!productId || !selectedAttributes || !Array.isArray(selectedAttributes) || selectedAttributes.length === 0) {
      return NextResponse.json({ message: 'productId et selectedAttributes requis.' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ message: 'Produit introuvable.' }, { status: 404 });
    }

    // Build attribute combinations (Cartesian product)
    const attributeGroups = selectedAttributes.map((attr: { attributeId: string; values: { attributeValueId: string; priceModifier?: number; stockAdjustment?: number }[] }) =>
      attr.values.map((v) => ({
        attributeId: attr.attributeId,
        attributeValueId: v.attributeValueId,
        priceModifier: v.priceModifier ?? 0,
        stockAdjustment: v.stockAdjustment ?? 0,
      }))
    );

    function cartesianProduct<T>(arrays: T[][]): T[][] {
      return arrays.reduce<T[][]>((acc, curr) =>
        acc.flatMap(c => curr.map(v => [...c, v]))
      , [[]]);
    }

    const combinations = cartesianProduct(attributeGroups);
    const basePrice = Number(product.price);

    // Fetch attribute values for naming
    const allValueIds = combinations.flat().map(c => c.attributeValueId);
    const attributeValues = await prisma.attributeValue.findMany({
      where: { id: { in: allValueIds } },
      select: { id: true, value: true },
    });
    const valueMap = new Map(attributeValues.map(v => [v.id, v.value]));

    const variants = combinations.map((combo, index) => {
      const modifierTotal = combo.reduce((sum, attr) => sum + (attr.priceModifier || 0), 0);
      const stockTotal = combo.reduce((sum, attr) => sum + (attr.stockAdjustment || 0), 0);
      const variantPrice = Math.max(0, basePrice + modifierTotal);

      const names = combo.map(c => valueMap.get(c.attributeValueId) || '').filter(Boolean);
      const skuBase = product.name.slice(0, 3).toUpperCase().replace(/\s+/g, '');
      const sku = `${skuBase}-${names.join('-').replace(/\s+/g, '')}-${index + 1}`;

      return {
        productId,
        sku: sku.toUpperCase(),
        variantName: names.join(' / '),
        price: new Decimal(variantPrice),
        stock: Math.max(0, stockTotal),
        attributes: combo.map(c => ({
          attributeId: c.attributeId,
          attributeValueId: c.attributeValueId,
          priceModifier: c.priceModifier !== 0 ? new Decimal(c.priceModifier) : null,
          stockAdjustment: c.stockAdjustment || null,
        })),
      };
    });

    await logActivity({
      userId: req.user?.id || null,
      action: 'CREATE',
      entity: 'PRODUCT_VARIANT',
      entityId: productId,
      details: `${variants.length} variantes générées pour le produit ${productId}`,
    });

    return NextResponse.json({ variants, count: variants.length }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}
