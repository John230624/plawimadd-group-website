import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeByPermission(req, 'categories.delete');
    if (!authResult.authorized) {
        return authResult.response!;
    }

    try {
        const body = await req.json() as { ids: string[]; action: string };
        const { ids, action } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: false, message: 'Aucune catégorie sélectionnée.' }, { status: 400 });
        }

        if (action === 'delete') {
            // Détacher les sous-catégories avant suppression
            await prisma.category.updateMany({
                where: { parentId: { in: ids } },
                data: { parentId: null, level: 0 },
            });
            const result = await prisma.category.deleteMany({ where: { id: { in: ids } } });
            for (const id of ids) {
                await logActivity({ userId: authResult.userId, action: 'DELETE', entity: 'CATEGORY', entityId: id, details: `Suppression de la catégorie ${id}` });
            }
            return NextResponse.json({ success: true, count: result.count }, { status: 200 });
        }

        return NextResponse.json({ success: false, message: 'Action inconnue.' }, { status: 400 });
    } catch (error) {
        console.error('Erreur batch categories:', error);
        return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
    }
}
