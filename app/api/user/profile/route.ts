// C:\xampp\htdocs\plawimadd_group\app\api\user\profile\route.ts
// Cette route gère la récupération, la mise à jour (profil et mot de passe) et la suppression du compte de l'utilisateur.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeLoggedInUser, AuthResult, getSupremeAdminId } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/passwordPolicy';

/**
 * GET /api/user/profile
 * Récupère le profil complet de l'utilisateur actuellement authentifié.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeLoggedInUser(req);
    if (!authResult.authorized) {
        return authResult.response!;
    }
    const userId = authResult.userId!;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                addresses: true,
                cartItems: true,
                orders: true,
                reviews: true,
            },
        });

        if (!user) {
            console.warn(`Profil utilisateur non trouvé pour l'ID: ${userId}`);
            return NextResponse.json({ success: false, message: 'Profil utilisateur non trouvé.' }, { status: 404 });
        }

        const { password: _password, resetPasswordToken: _resetPasswordToken, resetPasswordExpires: _resetPasswordExpires, ...safeUser } = user;

        return NextResponse.json({ success: true, user: safeUser }, { status: 200 });

    } catch (_error: unknown) {
        console.error("Erreur serveur lors de la récupération du profil utilisateur:", _error);
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

/**
 * PATCH /api/user/profile
 * Met à jour le profil de l'utilisateur (Prénom, Nom, Téléphone, et/ou Mot de passe).
 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeLoggedInUser(req);
    if (!authResult.authorized) {
        return authResult.response!;
    }
    const userId = authResult.userId!;

    try {
        const body = await req.json();

        interface UpdateProfileData {
            firstName?: string;
            lastName?: string;
            phoneNumber?: string;
            password?: string;
        }

        const updateData: UpdateProfileData = {};

        // 1. Gestion des informations de profil de base
        if (typeof body.firstName === 'string') {
            updateData.firstName = body.firstName;
        }
        if (typeof body.lastName === 'string') {
            updateData.lastName = body.lastName;
        }
        if (typeof body.phoneNumber === 'string' || body.phoneNumber === null) {
            updateData.phoneNumber = body.phoneNumber;
        }

        // 2. Gestion du changement de mot de passe
        if (body.newPassword) {
            if (!body.currentPassword) {
                return NextResponse.json({ success: false, message: "Le mot de passe actuel est requis pour changer de mot de passe." }, { status: 400 });
            }

            // Récupérer le mot de passe actuel stocké en base de données
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true },
            });

            if (!user) {
                return NextResponse.json({ success: false, message: "Utilisateur non trouvé." }, { status: 404 });
            }

            // Vérifier que le mot de passe actuel est correct
            const isMatch = await bcrypt.compare(body.currentPassword, user.password);
            if (!isMatch) {
                return NextResponse.json({ success: false, message: "Le mot de passe actuel est incorrect." }, { status: 400 });
            }

            // Valider la force du nouveau mot de passe
            const passwordCheck = validatePassword(body.newPassword);
            if (!passwordCheck.valid) {
                return NextResponse.json({ success: false, message: passwordCheck.message }, { status: 400 });
            }

            // Hacher le nouveau mot de passe
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(body.newPassword, salt);
        }

        // Vérifiez si des données à mettre à jour sont présentes
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, message: "Aucune donnée valide fournie pour la mise à jour." }, { status: 400 });
        }

        // Mettre à jour l'utilisateur dans la base de données
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                addresses: true,
                cartItems: true,
                orders: true,
                reviews: true,
            }
        });

        const { password: _password, resetPasswordToken: _resetPasswordToken, resetPasswordExpires: _resetPasswordExpires, ...safeUpdatedUser } = updatedUser;

        await logActivity({
            userId,
            action: 'UPDATE',
            entity: 'USER',
            entityId: userId,
            details: body.newPassword ? 'Mise à jour du profil et modification du mot de passe' : 'Mise à jour du profil utilisateur',
        });

        return NextResponse.json({ success: true, message: "Profil mis à jour avec succès.", user: safeUpdatedUser }, { status: 200 });

    } catch (_error: unknown) {
        console.error("Erreur lors de la mise à jour du profil utilisateur:", _error);
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

/**
 * DELETE /api/user/profile
 * Supprime le compte de l'utilisateur actuellement authentifié.
 * S'il y a des données sensibles liées à des transactions ou des commandes, le profil est anonymisé.
 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const authResult: AuthResult = await authorizeLoggedInUser(req);
    if (!authResult.authorized) {
        return authResult.response!;
    }
    const userId = authResult.userId!;

    const supremeAdminId = await getSupremeAdminId();
    if (userId === supremeAdminId) {
        return NextResponse.json({ success: false, message: "L'administrateur suprême ne peut pas supprimer son propre compte." }, { status: 403 });
    }

    try {
        // Vérifier si des entités empêchent une suppression physique (clés étrangères sans cascade)
        const userWithCriticalData = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                orders: { select: { id: true }, take: 1 },
                posTransactions: { select: { id: true }, take: 1 },
                posSessions: { select: { id: true }, take: 1 },
            }
        });

        if (!userWithCriticalData) {
            return NextResponse.json({ success: false, message: "Utilisateur non trouvé." }, { status: 404 });
        }

        const hasCriticalData = userWithCriticalData.orders.length > 0 || 
                                userWithCriticalData.posTransactions.length > 0 || 
                                userWithCriticalData.posSessions.length > 0;

        if (hasCriticalData) {
            // Anonymisation sécurisée du compte pour préserver l'historique financier et les contraintes de clés étrangères
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const anonymizedEmail = `deleted-${userId.slice(0, 8)}-${randomSuffix}@plawimadd-deleted.com`;
            const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

            await prisma.user.update({
                where: { id: userId },
                data: {
                    firstName: "Compte",
                    lastName: "Supprimé",
                    phoneNumber: null,
                    email: anonymizedEmail,
                    password: randomPassword,
                    banned: true,
                    bannedAt: new Date(),
                }
            });

            await logActivity({
                userId,
                action: 'UPDATE',
                entity: 'USER',
                entityId: userId,
                details: 'Compte utilisateur anonymisé et désactivé (suppression de compte)',
            });

            return NextResponse.json({ success: true, message: "Votre compte a été supprimé (anonymisé et désactivé) avec succès." }, { status: 200 });
        } else {
            // Aucun historique bloquant, suppression complète et propre dans la base de données
            await prisma.$transaction([
                prisma.address.deleteMany({ where: { userId } }),
                prisma.cartItem.deleteMany({ where: { userId } }),
                prisma.reviewReply.deleteMany({ where: { userId } }),
                prisma.review.deleteMany({ where: { userId } }),
                prisma.userRoleModel.deleteMany({ where: { userId } }),
                prisma.userPermission.deleteMany({ where: { userId } }),
                prisma.user.delete({ where: { id: userId } })
            ]);

            return NextResponse.json({ success: true, message: "Votre compte a été définitivement supprimé." }, { status: 200 });
        }
    } catch (_error: unknown) {
        console.error("Erreur lors de la suppression du compte utilisateur:", _error);
        return NextResponse.json({ success: false, message: "Erreur serveur lors de la suppression du compte." }, { status: 500 });
    }
}