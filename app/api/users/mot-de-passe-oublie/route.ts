// C:\xampp\htdocs\plawimadd_group\app\api\users\mot-de-passe-oublie\route.ts
// Cette route gère la demande de réinitialisation de mot de passe (envoi de lien par email).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma'; // Importez votre client Prisma
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Configuration du transporteur Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Ou tout autre service SMTP
    auth: {
        user: process.env.EMAIL_USER!, // Assurez-vous que ces variables sont définies dans .env
        pass: process.env.EMAIL_PASS!,
    },
    // Configuration pour les environnements de développement non sécurisés (si nécessaire, à ne pas utiliser en production)
    // tls: {
    //     rejectUnauthorized: false
    // }
});

interface ResetPasswordRequestBody {
    email: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    // La variable 'connection' n'est plus nécessaire avec Prisma
    try {
        const body: ResetPasswordRequestBody = await request.json();

        if (!body.email) {
            return NextResponse.json(
                { message: "L'email est requis pour la réinitialisation du mot de passe." },
                { status: 400 }
            );
        }

        // 1. Rechercher l'utilisateur avec Prisma
        // Utiliser 'findUnique' avec 'select' pour obtenir uniquement les champs nécessaires
        const user = await prisma.user.findUnique({
            where: { email: body.email },
            select: {
                id: true,
                firstName: true,
                // Assurez-vous que 'resetPasswordToken' et 'resetPasswordExpires' sont définis
                // comme String? et DateTime? dans votre schema.prisma
            },
        });

        if (!user) {
            // Toujours répondre de manière générique pour ne pas divulguer l'existence d'un email
            console.log(`Demande de réinitialisation pour email non trouvé: ${body.email}`);
            return NextResponse.json(
                {
                    message:
                        'Si un compte associé à cet email existe, un lien de réinitialisation de mot de passe a été envoyé.',
                },
                { status: 200 }
            );
        }

        // 2. Générer le token de réinitialisation et la date d'expiration
        const resetToken: string = crypto.randomBytes(32).toString('hex');
        const expiresAt: Date = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes d'expiration

        // 3. Mettre à jour l'utilisateur avec Prisma
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: expiresAt,
            },
        });

        // 4. Construire le lien de réinitialisation
        // Assurez-vous que  est défini dans votre .env (ex: http://localhost:3000)
        const baseUrl = process.env.NEXTAUTH_URL ;
        if (!baseUrl) {
            console.error("NEXTAUTH_URL  n'est pas défini dans les variables d'environnement.");
            // Décidez si vous voulez retourner une erreur ici ou continuer et laisser l'envoi d'email échouer
            return NextResponse.json(
                { message: 'Configuration serveur incomplète pour la réinitialisation de mot de passe.' },
                { status: 500 }
            );
        }
        const resetLink = `${baseUrl}/reinitialiser-mot-de-passe?token=${resetToken}`;

        // 5. Envoyer l'e-mail
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER!,
                to: body.email,
                subject: 'Réinitialisation de votre mot de passe',
                html: `
                    <p>Bonjour ${user.firstName || 'utilisateur'},</p>
                    <p>Vous avez demandé une réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous :</p>
                    <p><a href="${resetLink}">Réinitialiser mon mot de passe</a></p>
                    <p>Ce lien expirera dans 15 minutes.</p>
                    <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.</p>
                `,
            });
            console.log(`Email de réinitialisation envoyé à ${body.email}`);
        } catch (_emailError: unknown) { // CORRECTION: Renommé 'emailError' en '_emailError'
            console.error('Erreur lors de l’envoi de l’email de réinitialisation:', _emailError);
            // On renvoie quand même un succès pour des raisons de sécurité (ne pas informer si l'email existe)
            // mais on log l'erreur côté serveur.
        }

        // 6. Réponse finale (toujours générique pour des raisons de sécurité)
        return NextResponse.json(
            {
                message:
                    'Si un compte associé à cet email existe, un lien de réinitialisation de mot de passe a été envoyé.',
            },
            { status: 200 }
        );
    } catch (_error: unknown) { // CORRECTION: Renommé 'error' en '_error'
        console.error('Erreur lors de la demande de réinitialisation du mot de passe:', _error);
        return NextResponse.json(
            { message: "Erreur serveur. Veuillez réessayer plus tard." },
            { status: 500 }
        );
    }
    // Le bloc 'finally' n'est plus nécessaire car Prisma gère ses propres connexions
}

// --- GET (Méthode non autorisée) ---
export async function GET(_request: NextRequest): Promise<NextResponse> { // Ajout du typage pour _request
    return NextResponse.json(
        { message: 'Méthode GET non autorisée pour cette route de réinitialisation de mot de passe.' },
        { status: 405 }
    );
}