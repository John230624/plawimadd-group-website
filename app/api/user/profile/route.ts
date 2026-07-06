// C:\xampp\htdocs\plawimadd_group\app\api\user\profile\route.ts
// Cette route gère la récupération et la mise à jour (future) du profil complet de l'utilisateur authentifié.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Importez votre client Prisma

// IMPORTATION DES FONCTIONS ET INTERFACES D'AUTHUTILS
// Importer authorizeLoggedInUser pour cette route, car elle n'a pas de paramètres dynamiques
import { authorizeLoggedInUser, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

/**
 * GET /api/user/profile
 * Récupère le profil complet de l'utilisateur actuellement authentifié.
 * Nécessite une authentification.
 * @param {NextRequest} req La requête Next.js entrante.
 * @returns {Promise<NextResponse>} La réponse JSON avec le profil utilisateur ou un message d'erreur.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    // CORRECTION ICI : Utiliser authorizeLoggedInUser
    const authResult: AuthResult = await authorizeLoggedInUser(req);
    if (!authResult.authorized) {
        return authResult.response!;
    }
    const userId = authResult.userId!; // Récupère l'ID de l'utilisateur authentifié

    try {
        // Récupère le profil utilisateur complet depuis la base de données
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

        // IMPORTANT : Excluez les champs sensibles comme le mot de passe avant d'envoyer la réponse au client
        const { password: _password, resetPasswordToken: _resetPasswordToken, resetPasswordExpires: _resetPasswordExpires, ...safeUser } = user;

        return NextResponse.json({ success: true, user: safeUser }, { status: 200 });

    } catch (_error: unknown) {
        console.error("Erreur serveur lors de la récupération du profil utilisateur:", _error);
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}

/**
 * PATCH /api/user/profile
 * Met à jour le profil de l'utilisateur actuellement authentifié.
 * Nécessite une authentification.
 * Permet de mettre à jour des champs comme firstName, lastName, phoneNumber.
 * @param {NextRequest} req La requête Next.js entrante, contenant les données à mettre à jour.
 * @returns {Promise<NextResponse>} La réponse JSON avec le profil mis à jour ou un message d'erreur.
 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
    // CORRECTION ICI : Utiliser authorizeLoggedInUser
    const authResult: AuthResult = await authorizeLoggedInUser(req);
    if (!authResult.authorized) {
        return authResult.response!;
    }
    const userId = authResult.userId!;

    try {
        const body = await req.json();

        // Définition d'une interface pour les données de mise à jour reçues
        interface UpdateProfileData {
            firstName?: string;
            lastName?: string;
            phoneNumber?: string;
            email?: string; // Garder la prudence avec l'email
        }

        const updateData: UpdateProfileData = {};

        // Validez et ajoutez les champs à l'objet updateData si présents dans le body
        if (typeof body.firstName === 'string') {
            updateData.firstName = body.firstName;
        }
        if (typeof body.lastName === 'string') {
            updateData.lastName = body.lastName;
        }
        // Assurez-vous que phoneNumber est de type String? dans votre schema.prisma
        if (typeof body.phoneNumber === 'string' || body.phoneNumber === null) {
            updateData.phoneNumber = body.phoneNumber;
        }
        // Pour l'email, il est FORTEMENT recommandé de mettre en place un processus de vérification
        // (ex: envoi d'un email de confirmation) si l'utilisateur change son adresse email.
        // Ne l'activez pas sans cette sécurité.
        // if (typeof body.email === 'string') {
        // updateData.email = body.email;
        // }

        // Vérifiez si des données à mettre à jour sont présentes
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, message: "Aucune donnée valide fournie pour la mise à jour." }, { status: 400 });
        }

        // Mettre à jour l'utilisateur dans la base de données
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: { // Incluez les relations que vous voulez retourner dans la réponse mise à jour
                addresses: true,
                cartItems: true,
                orders: true,
                reviews: true,
            }
        });

        // Excluez les champs sensibles avant d'envoyer la réponse
        const { password: _password, resetPasswordToken: _resetPasswordToken, resetPasswordExpires: _resetPasswordExpires, ...safeUpdatedUser } = updatedUser;

        await logActivity({
          userId,
          action: 'UPDATE',
          entity: 'USER',
          entityId: userId,
          details: 'Mise à jour du profil utilisateur',
        });

        return NextResponse.json({ success: true, message: "Profil mis à jour avec succès.", user: safeUpdatedUser }, { status: 200 });

    } catch (_error: unknown) { // CORRECTION : Renommé 'error' en '_error'
        console.error("Erreur lors de la mise à jour du profil utilisateur:", _error);
        return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
    }
}