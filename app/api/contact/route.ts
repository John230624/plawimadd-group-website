// C:\xampp\htdocs\plawimadd_group\app\api\contact\route.ts

import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validation';
import { ZodError } from 'zod';
// import nodemailer from 'nodemailer'; // À décommenter et configurer si vous voulez envoyer de vrais emails

interface ContactPayload {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const body = await req.json();
        const parsed = contactSchema.parse(body);
        const { name, email, subject, message } = parsed;

        // --- Partie à décommenter pour un vrai envoi d'email ---
        /*
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Exemple : Gmail, Outlook, SMTP custom
            auth: {
                user: process.env.EMAIL_USER, // Utilisez des variables d'environnement
                pass: process.env.EMAIL_PASS, // Utilisez des variables d'environnement
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER, // Votre adresse email de service
            to: process.env.CONTACT_RECEIVER_EMAIL, // L'adresse où vous voulez recevoir les messages
            replyTo: email,
            subject: `Nouveau message de contact : ${subject} (De ${name})`,
            html: `
                <p><strong>Nom :</strong> ${name}</p>
                <p><strong>Email :</strong> ${email}</p>
                <p><strong>Sujet :</strong> ${subject}</p>
                <p><strong>Message :</strong></p>
                <p>${message}</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email envoyé avec succès !');
        */
        // --- Fin de la partie email ---

        // Logs en mode développement
        console.log('--- Nouveau Message de Contact ---');
        console.log(`Nom: ${name}`);
        console.log(`Email: ${email}`);
        console.log(`Sujet: ${subject}`);
        console.log(`Message: ${message}`);
        console.log('-------------------------------');

        // Simule un délai d’envoi (optionnel)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return NextResponse.json({ message: 'Message envoyé avec succès !' }, { status: 200 });
    } catch (_error: unknown) {
        if (_error instanceof ZodError) {
            return NextResponse.json(
                { message: _error.issues[0].message },
                { status: 400 }
            );
        }
        console.error("Erreur dans l'API de contact:", _error);
        return NextResponse.json(
            { message: "Erreur serveur. Veuillez réessayer plus tard." },
            { status: 500 }
        );
    }
}