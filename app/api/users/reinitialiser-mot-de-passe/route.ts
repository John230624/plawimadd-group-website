// C:\xampp\htdocs\plawimadd_group\app\api\users\reinitialiser-mot-de-passe\route.ts
// Cette route gère la soumission du nouveau mot de passe avec un jeton de réinitialisation.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/passwordPolicy';

interface UserWithResetToken {
    id: string;
    resetPasswordExpires: Date | null;
}

interface ResetPasswordRequestBody {
    token: string;
    newPassword: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const { token, newPassword }: ResetPasswordRequestBody = await req.json();

        if (!token || !newPassword) {
            return NextResponse.json(
                { message: 'Le jeton de réinitialisation et le nouveau mot de passe sont requis.' },
                { status: 400 }
            );
        }

        const passwordCheck = validatePassword(newPassword);
        if (!passwordCheck.valid) {
            return NextResponse.json(
                { message: passwordCheck.message },
                { status: 400 }
            );
        }

        // 2. Rechercher l'utilisateur par le jeton de réinitialisation avec Prisma
        const user: UserWithResetToken | null = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date(), // 'gt' signifie "greater than" (plus grand que)
                },
            },
            select: {
                id: true,
                resetPasswordExpires: true,
            },
        });

        if (!user) {
            console.warn(`Tentative de réinitialisation avec un jeton invalide ou expiré: ${token}`);
            return NextResponse.json(
                { message: 'Jeton de réinitialisation invalide ou expiré. Veuillez refaire une demande.' },
                { status: 400 }
            );
        }

        // 3. Hacher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 4. Mettre à jour le mot de passe et nettoyer les tokens avec Prisma
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null, // Nettoyer le jeton
                resetPasswordExpires: null, // Nettoyer la date d'expiration
            },
        });

        return NextResponse.json(
            { message: 'Votre mot de passe a été réinitialisé avec succès.' },
            { status: 200 }
        );
    } catch (_error: unknown) {
        console.error('Erreur lors de la réinitialisation du mot de passe:', _error);
        return NextResponse.json(
            { message: "Erreur serveur. Veuillez réessayer plus tard." },
            { status: 500 }
        );
    }
}

// --- GET (Méthode non autorisée) ---
export async function GET(_req: NextRequest): Promise<NextResponse> {
    return NextResponse.json(
        { message: 'Méthode GET non autorisée pour cette route de réinitialisation de mot de passe.' },
        { status: 405 }
    );
}