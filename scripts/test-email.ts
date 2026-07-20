import { getWelcomeTemplate, getPasswordResetTemplate, getStudentInstallmentReminderTemplate } from '../lib/emailTemplates';
import { sendEmail } from '../lib/email';

async function test() {
  console.log("=== Test de génération de templates ===");
  const welcome = getWelcomeTemplate("John", "Doe");
  console.log("Welcome HTML generated. Length:", welcome.length);
  
  const reset = getPasswordResetTemplate("John", "http://localhost:3000/reset?token=123");
  console.log("Reset HTML generated. Length:", reset.length);

  const reminder = getStudentInstallmentReminderTemplate({
    fullName: "Jane Doe",
    installmentNumber: 2,
    amount: 150000,
    dueDate: new Date()
  });
  console.log("Reminder HTML generated. Length:", reminder.length);

  console.log("\n=== Test d'envoi d'email (Mode fallback console) ===");
  const sent = await sendEmail({
    to: "test@example.com",
    subject: "Test de template Plawimadd",
    html: welcome
  });
  console.log("Statut d'envoi:", sent ? "SUCCÈS" : "FALLBACK CONSOLE OK");
}

test().catch(console.error);
