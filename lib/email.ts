import { Resend } from 'resend';
import prisma from './prisma';
import {
  getWelcomeTemplate,
  getOrderConfirmationTemplate,
  EmailOrderItem
} from './emailTemplates';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM || 'Plawimadd Group <onboarding@resend.dev>';

/**
 * Envoie un email générique au format HTML via Resend.
 * Si Resend n'est pas configuré, l'email est loggé dans la console de développement.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!resend) {
    console.log('\n==================================================');
    console.log('[EMAIL] ⚠️ RESEND_API_KEY non configurée.');
    console.log('[EMAIL] Destinataire :', options.to);
    console.log('[EMAIL] Sujet :', options.subject);
    console.log('[EMAIL] Contenu HTML :', options.html);
    console.log('==================================================\n');
    return false;
  }

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (response.error) {
      console.error(`[EMAIL] Erreur Resend pour ${options.to}:`, response.error);
      return false;
    }

    console.log(`[EMAIL] Envoyé avec succès à ${options.to} via Resend. ID:`, response.data?.id);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Exception lors de l'envoi à ${options.to} via Resend:`, err);
    return false;
  }
}

/**
 * Envoie un email de bienvenue à un utilisateur nouvellement inscrit.
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  lastName: string
): Promise<boolean> {
  const html = getWelcomeTemplate(firstName, lastName);
  return sendEmail({
    to: email,
    subject: 'Bienvenue chez Plawimadd Group ! 🎉',
    html,
  });
}

/**
 * Envoie un email de confirmation de commande et de paiement à partir de l'ID de la commande.
 * Récupère dynamiquement les informations de la commande, de l'utilisateur et des articles.
 */
export async function sendOrderConfirmationEmail(orderId: string): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        orderItems: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      console.error(`[EMAIL] Commande ${orderId} introuvable pour envoi de confirmation.`);
      return false;
    }

    const customerName = [order.user?.firstName, order.user?.lastName].filter(Boolean).join(' ') || 'Client';
    const emailTo = order.userEmail || order.user?.email;

    if (!emailTo) {
      console.error(`[EMAIL] Pas d'adresse email trouvée pour la commande ${orderId}.`);
      return false;
    }

    const items: EmailOrderItem[] = order.orderItems.map((item) => ({
      productName: item.product?.name || 'Produit',
      quantity: item.quantity,
      price: Number(item.priceAtOrder),
    }));

    const shippingAddress = {
      fullName: customerName,
      street: order.shippingAddressLine1,
      area: order.shippingAddressLine2,
      city: order.shippingCity,
      state: order.shippingState,
      country: order.shippingCountry,
      pincode: order.shippingZipCode,
      phoneNumber: order.userPhoneNumber,
    };

    const html = getOrderConfirmationTemplate({
      orderId: order.id,
      orderDate: order.orderDate,
      customerName,
      customerEmail: emailTo,
      items,
      totalAmount: Number(order.totalAmount),
      currency: order.currency || 'CFA',
      paymentMethod: 'Kkiapay Mobile',
      shippingAddress,
    });

    return sendEmail({
      to: emailTo,
      subject: `Confirmation de votre commande Plawimadd Group - #${order.id}`,
      html,
    });
  } catch (error) {
    console.error(`[EMAIL] Erreur lors de l'envoi de la confirmation de commande ${orderId}:`, error);
    return false;
  }
}
