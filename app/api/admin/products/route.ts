import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { Decimal } from '@prisma/client/runtime/library';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeAdminRequest(req);
    if (!authResult.authorized) {
        return authResult.response!;
    }

    try {
        const body = await req.json() as { ids: string[]; action: string; value?: unknown };
        const { ids, action, value } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: false, message: 'Aucun produit sélectionné.' }, { status: 400 });
        }

        let result: { count: number };

        switch (action) {
            case 'delete':
                result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
                break;

            case 'setCategory': {
                const categoryId = String(value);
                if (!categoryId) {
                    return NextResponse.json({ success: false, message: 'Catégorie requise.' }, { status: 400 });
                }
                result = await prisma.product.updateMany({
                    where: { id: { in: ids } },
                    data: { categoryId },
                });
                break;
            }

            case 'setStock': {
                const stock = Number(value);
                if (isNaN(stock) || stock < 0) {
                    return NextResponse.json({ success: false, message: 'Stock invalide.' }, { status: 400 });
                }
                result = await prisma.product.updateMany({
                    where: { id: { in: ids } },
                    data: { stock },
                });
                break;
            }

            case 'setVisible':
                result = await prisma.product.updateMany({
                    where: { id: { in: ids } },
                    data: { visible: Boolean(value) },
                });
                break;

            default:
                return NextResponse.json({ success: false, message: 'Action inconnue.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, count: result.count }, { status: 200 });
    } catch (error) {
        console.error('Erreur batch produits:', error);
        return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
    }
}
