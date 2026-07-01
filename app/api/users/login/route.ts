// C:\xampp\htdocs\plawimadd_group\app\api\users\login\route.ts
// Cette route gère la connexion des utilisateurs.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/validation';
import { ZodError } from 'zod';

export async function POST(req: NextRequest): Promise<NextResponse> {
    // La variable 'connection' n'est plus nécessaire avec Prisma
    try {
        const body = await req.json();
        const parsed = loginSchema.parse(body);
        const { email, password } = parsed;

        // Utiliser Prisma pour trouver l'utilisateur par email
        const user = await prisma.user.findUnique({
            where: { email: email },
            // N'incluez pas le mot de passe dans 'select' si vous ne comptez pas le vérifier.
            // Par défaut, tous les champs sont inclus, SAUF si vous utilisez 'select'.
            // Si 'password' est un champ optionnel ou si vous avez des hooks avant/après la lecture
            // dans Prisma, assurez-vous qu'il est accessible ici.
            select: {
                id: true,
                email: true,
                password: true, // Nous avons besoin du mot de passe pour la comparaison bcrypt
                firstName: true,
                lastName: true,
                role: true,
                // Incluez d'autres champs nécessaires pour l'objet utilisateur retourné
            },
        });

        if (!user) {
            // Utiliser un message générique pour ne pas divulguer si l'email existe ou non
            return NextResponse.json(
                { message: 'Identifiants invalides.' },
                { status: 401 }
            );
        }

        // Comparer le mot de passe fourni avec le mot de passe haché de la base de données
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { message: 'Identifiants invalides.' },
                { status: 401 }
            );
        }

        // Créer un nouvel objet utilisateur sans le mot de passe pour la réponse
        const { password: _password, ...userWithoutPassword } = user;

        return NextResponse.json(
            { message: 'Connexion réussie !', user: userWithoutPassword },
            { status: 200 }
        );
    } catch (_error: unknown) {
        if (_error instanceof ZodError) {
            return NextResponse.json(
                { message: _error.issues[0].message },
                { status: 400 }
            );
        }
        console.error("Erreur lors de la connexion de l'utilisateur:", _error);
        return NextResponse.json(
            { message: "Erreur serveur. Veuillez réessayer plus tard." },
            { status: 500 }
        );
    }
}

export async function GET(_req: NextRequest): Promise<NextResponse> { // Ajout du type pour _req
    return NextResponse.json(
        { message: 'Méthode GET non autorisée pour cette route.' },
        { status: 405 }
    );
}