import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeAdminRequest(req);
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
            const result = await prisma.category.deleteMany({ where: { id: { in: ids } } });
            return NextResponse.json({ success: true, count: result.count }, { status: 200 });
        }

        return NextResponse.json({ success: false, message: 'Action inconnue.' }, { status: 400 });
    } catch (error) {
        console.error('Erreur batch categories:', error);
        return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
    }
}
