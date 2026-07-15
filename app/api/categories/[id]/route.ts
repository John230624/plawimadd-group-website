// C:\xampp\htdocs\plawimadd_group\app\api\categories/[id]/route.ts
// Cette route gère les opérations CRUD (Get, Put, Delete) pour une catégorie spécifique par son ID.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

interface Context {
    params: Promise<{
        id: string;
    }>;
}

// GET: Récupérer une catégorie par son ID
export async function GET(req: NextRequest, context: Context): Promise<NextResponse> {
    const { id } = await context.params;

    try {
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: 'ID de catégorie valide (chaîne) manquant.' }, { status: 400 });
        }

        const category = await prisma.category.findUnique({
            where: { id: id },
            include: {
                characteristics: {
                    include: { characteristic: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        if (!category) {
            return NextResponse.json({ message: 'Catégorie non trouvée.' }, { status: 404 });
        }

        const chars = category.characteristics.map((cc) => cc.characteristic);

        return NextResponse.json({ ...category, characteristics: chars }, { status: 200 });
    } catch (_error: unknown) {
        console.error('Erreur lors de la récupération de la catégorie:', _error);
        return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

// PUT: Mettre à jour une catégorie par son ID (Requiert le rôle ADMIN)
export async function PUT(req: NextRequest, context: Context): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeByPermission(req, 'categories.edit');
    if (!authResult.authorized) return authResult.response!;

    const { id } = await context.params;

    try {
        const { name, description, imageUrl, parentId } = await req.json();

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json({ message: 'Le nom de la catégorie (chaîne non vide) est requis pour la mise à jour.' }, { status: 400 });
        }
        if (description !== undefined && typeof description !== 'string' && description !== null) {
            return NextResponse.json({ message: 'La description doit être une chaîne ou null.' }, { status: 400 });
        }
        if (imageUrl !== undefined && typeof imageUrl !== 'string' && imageUrl !== null) {
            return NextResponse.json({ message: 'L\'URL de l\'image doit être une chaîne ou null.' }, { status: 400 });
        }
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: 'ID de catégorie valide (chaîne) manquant pour la mise à jour.' }, { status: 400 });
        }

        let level: number | undefined;
        if (parentId !== undefined) {
            if (parentId === null) {
                level = 0;
            } else {
                const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { level: true } });
                level = parent ? parent.level + 1 : 0;
            }
        }

        const updatedCategory = await prisma.category.update({
            where: { id: id },
            data: {
                name: name.trim(),
                description: description || null,
                imageUrl: imageUrl || null,
                parentId: parentId !== undefined ? (parentId || null) : undefined,
                ...(level !== undefined ? { level } : {}),
                updatedAt: new Date(),
            },
        });

        await logActivity({
            userId: req.user?.id || null,
            action: 'UPDATE',
            entity: 'CATEGORY',
            entityId: id,
            details: `Catégorie "${name}" mise à jour`,
        });

        return NextResponse.json({ message: 'Catégorie mise à jour avec succès.', category: updatedCategory }, { status: 200 });
    } catch (_error: unknown) {

        if (
            typeof _error === 'object' &&
            _error !== null &&
            'code' in _error &&
            (_error as { code?: string }).code === 'P2025'
        ) {
            return NextResponse.json({ message: 'Catégorie non trouvée ou aucune modification effectuée.' }, { status: 404 });
        }

        console.error('Erreur lors de la mise à jour de la catégorie:', _error);
        return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

// DELETE: Supprimer une catégorie par son ID (Requiert le rôle ADMIN)
export async function DELETE(req: NextRequest, context: Context): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeByPermission(req, 'categories.delete');
    if (!authResult.authorized) return authResult.response!;

    const { id } = await context.params;

    try {
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: 'ID de catégorie valide (chaîne) manquant pour la suppression.' }, { status: 400 });
        }

        // Détacher les sous-catégories avant suppression
        await prisma.category.updateMany({
            where: { parentId: id },
            data: { parentId: null, level: 0 },
        });

        const deletedCategory = await prisma.category.delete({
            where: { id: id },
        });

        await logActivity({
            userId: req.user?.id || null,
            action: 'DELETE',
            entity: 'CATEGORY',
            entityId: id,
            details: `Catégorie "${deletedCategory.name}" supprimée`,
        });

        return NextResponse.json({ message: 'Catégorie supprimée avec succès.', category: deletedCategory }, { status: 200 });
    } catch (_error: unknown) {
        console.error('Erreur lors de la suppression de la catégorie:', _error);

        if (
            typeof _error === 'object' &&
            _error !== null &&
            'code' in _error &&
            (_error as { code?: string }).code === 'P2025'
        ) {
            return NextResponse.json({ message: 'Catégorie non trouvée ou déjà supprimée.' }, { status: 404 });
        }

        if (
            typeof _error === 'object' &&
            _error !== null &&
            'code' in _error &&
            (_error as { code?: string }).code === 'P2003'
        ) {
            return NextResponse.json({
                message: "Impossible de supprimer la catégorie car elle est liée à d'autres entités (ex: produits). Supprimez d'abord les produits associés ou configurez la suppression en cascade dans votre schéma Prisma."
            }, { status: 409 });
        }

        return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}
