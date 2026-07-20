// C:\xampp\htdocs\plawimadd_group\app\api\contact\route.ts

import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validation';
import { logActivity } from '@/lib/logActivity';
import { ZodError } from 'zod';
import { sendEmail } from '@/lib/email';
import { getContactMessageTemplate } from '@/lib/emailTemplates';

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

        // --- Envoi d'email de contact aux admins ---
        try {
            const adminEmail = process.env.CONTACT_RECEIVER_EMAIL || 'admin@plawimaddgroup.com';
            const html = getContactMessageTemplate({ name, email, subject, message });
            await sendEmail({
                to: adminEmail,
                subject: `Nouveau message de contact : ${subject} (De ${name})`,
                html,
            });
            console.log('Email de contact envoyé aux admins avec succès !');
        } catch (emailErr) {
            console.error("Erreur lors de l'envoi de l'email de contact aux admins:", emailErr);
        }

        // Logs en mode développement
        console.log('--- Nouveau Message de Contact ---');
        console.log(`Nom: ${name}`);
        console.log(`Email: ${email}`);
        console.log(`Sujet: ${subject}`);
        console.log(`Message: ${message}`);
        console.log('-------------------------------');

        // Simule un délai d’envoi (optionnel)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await logActivity({
          userId: null,
          action: 'CREATE',
          entity: 'CONTACT',
          entityId: null,
          details: `Nouveau message de contact de ${name} (${email}) : ${subject}`,
        });

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