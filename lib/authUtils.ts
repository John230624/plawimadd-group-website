// C:\xampp\htdocs\plawimadd_group\lib\authUtils.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { User } from '@/lib/types';

// Déclaration de module pour étendre l'interface Request de Next.js si nécessaire
// Cela permet d'attacher l'objet 'user' à la requête après autorisation.
declare module 'next/server' {
    interface NextRequest {
        user?: User; // Ajoute la propriété 'user' optionnelle à NextRequest
    }
}

export interface Context {
    params?: Promise<{
        userId?: string;
        id?: string;
        [key: string]: string | undefined;
    }>;
}

// Interface pour le résultat des fonctions d'autorisation.
// Indique si l'utilisateur est autorisé, une réponse si non autorisé, et les détails de l'utilisateur.
export interface AuthResult {
    authorized: boolean;
    response?: NextResponse; // Optionnel : une réponse HTTP à retourner si l'autorisation échoue
    userId?: string;         // L'ID de l'utilisateur autorisé (si autorisé)
    userRole?: 'USER' | 'ADMIN'; // Le rôle de l'utilisateur (si autorisé)
}

/**
 * Fonction d'autorisation pour les routes API nécessitant un userId spécifique dans les paramètres URL.
 * Vérifie l'authentification via NextAuth session ou via un JWT.
 * L'utilisateur doit être l'utilisateur ciblé par l'URL ou un ADMIN.
 *
 * @param req La requête NextRequest.
 * @param context Le contexte de la route, contenant les paramètres dynamiques (ex: userId/id).
 * @returns Un objet AuthResult indiquant si l'utilisateur est autorisé et les détails si oui.
 */
export async function authorizeUser(req: NextRequest, context: Context): Promise<AuthResult> {
    const resolvedParams = await context.params;

    const userIdFromParams = resolvedParams?.userId || resolvedParams?.id;

    if (!userIdFromParams) {
        console.error("authorizeUser appelée sans un userId ou id valide dans context.params.");
        return { authorized: false, response: NextResponse.json({ message: 'Configuration de route incorrecte : ID de ressource manquant dans les paramètres d\'URL.' }, { status: 500 }) };
    }

    const session = await getServerSession(authOptions);

    if (!session?.user) {
        console.warn("Autorisation échouée : Aucune session valide.");
        return { authorized: false, response: NextResponse.json({ message: 'Non authentifié.' }, { status: 401 }) };
    }

    if (session.user.id === userIdFromParams || session.user.role === 'ADMIN') {
        console.log("Autorisation réussie via la session NextAuth.");
        req.user = session.user as User;
        return { authorized: true, userId: session.user.id, userRole: session.user.role as 'USER' | 'ADMIN' };
    }

    console.warn(`Utilisateur ${session.user.id} non autorisé pour la ressource ${userIdFromParams}.`);
    return { authorized: false, response: NextResponse.json({ message: 'Non autorisé pour cette ressource.' }, { status: 403 }) };
}

/**
 * Fonction d'autorisation spécifique pour les routes d'administration.
 * Vérifie si l'utilisateur est authentifié et a le rôle 'ADMIN'.
 * Utilise la session NextAuth en priorité, puis le JWT.
 *
 * @param req La requête NextRequest.
 * @returns Un objet AuthResult indiquant si l'utilisateur est autorisé et les détails si oui.
 */
export async function authorizeAdminRequest(req: NextRequest): Promise<AuthResult> {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        console.warn("Accès non authentifié à une API d'administration.");
        return { authorized: false, response: NextResponse.json({ message: 'Non authentifié.' }, { status: 401 }) };
    }

    if (session.user.role === 'ADMIN') {
        console.log("Accès ADMIN autorisé via la session NextAuth.");
        req.user = session.user as User;
        return { authorized: true, userId: session.user.id, userRole: 'ADMIN' };
    }

    console.warn(`Accès non autorisé à une API d'administration par ${session.user.id} (Rôle: ${session.user.role || 'Aucun'})`);
    return {
        authorized: false,
        response: NextResponse.json({ message: 'Accès interdit. Seuls les administrateurs sont autorisés.' }, { status: 403 }),
    };
}


/**
 * Fonction d'autorisation pour les routes nécessitant simplement qu'un utilisateur soit connecté (authentifié).
 * Récupère l'ID de l'utilisateur connecté via la session NextAuth ou un JWT.
 * N'utilise PAS de `userId` des paramètres d'URL.
 *
 * @param req La requête NextRequest.
 * @returns Un objet AuthResult indiquant si l'utilisateur est authentifié et son ID.
 */
export async function authorizeLoggedInUser(req: NextRequest): Promise<AuthResult> {
    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
        console.log("Autorisation réussie via la session NextAuth pour l'utilisateur connecté.");
        req.user = session.user as User;
        return { authorized: true, userId: session.user.id, userRole: session.user.role === 'ADMIN' ? 'ADMIN' : 'USER' };
    }

    console.warn("Accès non authentifié: Aucun utilisateur connecté détecté.");
    return { authorized: false, response: NextResponse.json({ message: 'Non authentifié. Veuillez vous connecter.' }, { status: 401 }) };
}
