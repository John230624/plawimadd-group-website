import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASS!,
  },
});

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[EMAIL] EMAIL_USER/EMAIL_PASS non configurés. Email non envoyé à', options.to);
    console.log('[EMAIL] Sujet:', options.subject);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER!,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[EMAIL] Envoyé à ${options.to}: ${options.subject}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Erreur envoi à ${options.to}:`, err);
    return false;
  }
}
