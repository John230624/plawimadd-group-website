// lib/emailTemplates.ts
// Ce fichier contient tous les templates HTML d'emails haut de gamme et réutilisables.

const BASE_URL = process.env.NEXTAUTH_URL || 'https://plawimaddgroup.com';
const SUPPORT_EMAIL = process.env.CONTACT_RECEIVER_EMAIL || 'support@plawimaddgroup.com';

/**
 * Gabarit général enveloppant (Layout)
 */
export function getEmailLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
      overflow: hidden;
    }
    .header {
      background-color: #0f172a;
      padding: 32px 40px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff !important;
      letter-spacing: -0.5px;
      text-decoration: none;
    }
    .logo span {
      color: #3b82f6;
    }
    .content {
      padding: 40px;
      line-height: 1.6;
      font-size: 16px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      font-size: 13px;
      color: #64748b;
    }
    .btn {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      font-weight: 600;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .btn:hover {
      background-color: #1d4ed8;
    }
    h1, h2, h3 {
      color: #0f172a;
      margin-top: 0;
      font-weight: 700;
    }
    h1 { font-size: 22px; margin-bottom: 20px; }
    h2 { font-size: 18px; margin-bottom: 16px; }
    p { margin: 0 0 16px; }
    .text-center { text-align: center; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-success { background-color: #dcfce7; color: #15803d; }
    .badge-warning { background-color: #fef9c3; color: #a16207; }
    .badge-danger { background-color: #fee2e2; color: #b91c1c; }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 24px 0;
    }
    .receipt-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    .receipt-table th {
      text-align: left;
      padding: 12px 8px;
      border-bottom: 2px solid #e2e8f0;
      color: #475569;
      font-weight: 600;
    }
    .receipt-table td {
      padding: 12px 8px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .totals-box {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin-top: 20px;
    }
    .total-row {
      margin-bottom: 8px;
      font-size: 14px;
      color: #475569;
    }
    .total-label {
      display: inline-block;
      width: 150px;
    }
    .total-val {
      float: right;
      font-weight: 600;
      color: #0f172a;
    }
    .total-row.grand-total {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 8px;
    }
    .total-row.grand-total .total-label {
      color: #0f172a;
      font-weight: 700;
    }
    .total-row.grand-total .total-val {
      font-size: 18px;
      color: #2563eb;
    }
    .meta-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      background-color: #fafafa;
      margin-bottom: 20px;
    }
    .meta-item {
      font-size: 14px;
      margin-bottom: 6px;
    }
    .meta-item strong {
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="${BASE_URL}" class="logo">PLAWIMADD <span>GROUP</span></a>
      </div>
      <div class="content">
        ${bodyHtml}
      </div>
      <div class="footer">
        <p>Vous recevez cet e-mail suite à votre activité sur Plawimadd Group.</p>
        <p>© 2026 Plawimadd Group. Tous droits réservés.</p>
        <p>Des questions ? Contactez notre support : <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb; text-decoration: none;">${SUPPORT_EMAIL}</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. Template Mail de Bienvenue
 */
export function getWelcomeTemplate(firstName: string, lastName: string): string {
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'client';
  const body = `
    <h1>Bienvenue chez Plawimadd Group ! 🎉</h1>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Nous sommes ravis de vous compter parmi nos nouveaux membres. Votre compte a été créé avec succès sur notre plateforme.</p>
    <p>Plawimadd Group est votre destination privilégiée pour dénicher les meilleurs produits électroniques, d'informatique et d'équipements technologiques.</p>
    <p>Voici ce que vous pouvez faire dès maintenant :</p>
    <ul style="padding-left: 20px; margin-bottom: 20px;">
      <li>Parcourir notre catalogue de produits high-tech.</li>
      <li>Ajouter des articles à votre panier et à votre liste de souhaits.</li>
      <li>Bénéficier de nos facilités de paiement par tranches (réservé aux étudiants éligibles).</li>
    </ul>
    <div class="text-center">
      <a href="${BASE_URL}" class="btn">Explorer la boutique</a>
    </div>
    <div class="divider"></div>
    <p>Si vous avez la moindre question concernant notre service client, notre support technique ou les modalités de livraison, n'hésitez pas à répondre directement à cet email.</p>
    <p>Cordialement,<br/><strong>L'équipe Plawimadd Group</strong></p>
  `;
  return getEmailLayout('Bienvenue chez Plawimadd Group', body);
}

/**
 * 2. Template Mail de Confirmation de Commande / Paiement
 */
export interface EmailOrderItem {
  productName: string;
  quantity: number;
  price: number;
}

export function getOrderConfirmationTemplate(options: {
  orderId: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string;
  items: EmailOrderItem[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    street: string;
    area?: string | null;
    city: string;
    state: string;
    country: string;
    pincode?: string | null;
    phoneNumber?: string | null;
  };
}): string {
  const itemsHtml = options.items
    .map(
      (item) => `
    <tr>
      <td>
        <strong style="color: #0f172a;">${item.productName}</strong>
      </td>
      <td style="text-align: center;">x${item.quantity}</td>
      <td style="text-align: right; font-weight: 500;">
        ${Number(item.price).toLocaleString('fr-FR')} ${options.currency}
      </td>
      <td style="text-align: right; font-weight: 600; color: #0f172a;">
        ${Number(item.price * item.quantity).toLocaleString('fr-FR')} ${options.currency}
      </td>
    </tr>
  `
    )
    .join('');

  const dateStr = new Date(options.orderDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const address = options.shippingAddress;
  const addressStr = [
    address.street,
    address.area,
    `${address.pincode ? address.pincode + ' ' : ''}${address.city}`,
    address.state,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');

  const body = `
    <h1>Merci pour votre achat ! 🛍️</h1>
    <p>Bonjour <strong>${options.customerName}</strong>,</p>
    <p>Votre commande a été confirmée et est en cours de traitement. Nous vous remercions pour votre confiance envers Plawimadd Group.</p>
    
    <div class="meta-box">
      <div class="meta-item"><strong>N° de commande :</strong> <span style="font-family: monospace; font-weight: 600;">${options.orderId}</span></div>
      <div class="meta-item"><strong>Date :</strong> ${dateStr}</div>
      <div class="meta-item"><strong>Mode de paiement :</strong> ${options.paymentMethod}</div>
      <div class="meta-item"><strong>Statut du paiement :</strong> <span class="badge badge-success">Payé</span></div>
    </div>

    <h2>Détail de la commande</h2>
    <table class="receipt-table">
      <thead>
        <tr>
          <th style="text-align: left;">Produit</th>
          <th style="text-align: center; width: 60px;">Qté</th>
          <th style="text-align: right; width: 100px;">Prix Unitaire</th>
          <th style="text-align: right; width: 100px;">Sous-total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals-box">
      <div class="total-row">
        <span class="total-label">Sous-total</span>
        <span class="total-val">${Number(options.totalAmount).toLocaleString('fr-FR')} ${options.currency}</span>
      </div>
      <div class="total-row">
        <span class="total-label">Livraison</span>
        <span class="total-val">Gratuit</span>
      </div>
      <div class="total-row grand-total">
        <span class="total-label">Total Payé</span>
        <span class="total-val">${Number(options.totalAmount).toLocaleString('fr-FR')} ${options.currency}</span>
      </div>
    </div>

    <div class="divider"></div>

    <h2>Adresse de livraison</h2>
    <p style="background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 14px;">
      <strong>${address.fullName}</strong><br/>
      ${addressStr}<br/>
      ${address.phoneNumber ? 'Tél : ' + address.phoneNumber : ''}
    </p>

    <div class="text-center" style="margin-top: 30px;">
      <a href="${BASE_URL}/student/orders" class="btn">Suivre ma commande</a>
    </div>
    
    <p style="margin-top: 30px;">Cordialement,<br/><strong>L'équipe Plawimadd Group</strong></p>
  `;
  return getEmailLayout(`Confirmation de commande #${options.orderId}`, body);
}

/**
 * 3. Template Mail Réinitialisation Mot de passe
 */
export function getPasswordResetTemplate(firstName: string, resetLink: string): string {
  const name = firstName || 'utilisateur';
  const body = `
    <h1>Réinitialisation de votre mot de passe 🔒</h1>
    <p>Bonjour ${name},</p>
    <p>Vous avez demandé une réinitialisation de votre mot de passe pour votre espace Plawimadd Group.</p>
    <p>Veuillez cliquer sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
    <div class="text-center">
      <a href="${resetLink}" class="btn" style="background-color: #0f172a;">Réinitialiser mon mot de passe</a>
    </div>
    <p style="color: #e11d48; font-weight: 500;">Attention : Ce lien expira dans 15 minutes.</p>
    <div class="divider"></div>
    <p style="font-size: 14px; color: #64748b;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité. Votre mot de passe actuel restera inchangé.</p>
    <p>Cordialement,<br/><strong>L'équipe Plawimadd Group</strong></p>
  `;
  return getEmailLayout('Réinitialisation de votre mot de passe', body);
}

/**
 * 4. Templates Échéance Étudiant (Validation / Rejet / Réouverture)
 */
export function getStudentInstallmentDecisionTemplate(options: {
  fullName: string;
  status: 'APPROVED' | 'REJECTED';
  adminNote?: string | null;
}): string {
  const isApproved = options.status === 'APPROVED';
  const statusLabel = isApproved ? 'approuvée' : 'rejetée';
  const badgeClass = isApproved ? 'badge-success' : 'badge-danger';
  
  let contentHtml = '';
  if (isApproved) {
    contentHtml = `
      <p>Nous avons le plaisir de vous informer que votre dossier d'éligibilité pour les paiements par tranches a été <strong>validé</strong> par nos équipes.</p>
      <p>Vous pouvez dès maintenant vous connecter sur le site et finaliser votre commande avec l'option de paiement échelonné lors du checkout.</p>
      <div class="text-center">
        <a href="${BASE_URL}/cart" class="btn">Accéder à mon panier</a>
      </div>
    `;
  } else {
    contentHtml = `
      <p>Nous regrettons de vous informer que votre demande de paiement échelonné a été <strong>rejetée</strong> après examen.</p>
      ${options.adminNote ? `<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <strong>Motif du rejet :</strong><br/>
        ${options.adminNote}
      </div>` : ''}
      <p>Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez soumettre un autre document, vous pouvez contacter notre support ou mettre à jour vos informations.</p>
    `;
  }

  const body = `
    <h1>Votre demande de financement étudiant 🎓</h1>
    <p>Bonjour <strong>${options.fullName}</strong>,</p>
    <p>Le statut de votre demande de paiement par tranches a été mis à jour :</p>
    <div style="text-align: center; margin: 24px 0;">
      <span class="badge ${badgeClass}" style="font-size: 16px; padding: 8px 16px;">${statusLabel}</span>
    </div>
    ${contentHtml}
    <p>Cordialement,<br/><strong>L'équipe Plawimadd Group</strong></p>
  `;
  
  return getEmailLayout(`Votre demande de financement a été ${statusLabel}`, body);
}

export function getStudentInstallmentReopenTemplate(fullName: string): string {
  const body = `
    <h1>Demande de financement rouverte 🎓</h1>
    <p>Bonjour <strong>${fullName}</strong>,</p>
    <p>Votre demande de paiement par tranches a été <strong>réouverte</strong> par l'administration Plawimadd Group.</p>
    <p>Vous pouvez à présent modifier votre dossier et soumettre de nouvelles pièces justificatives depuis votre tableau de bord étudiant.</p>
    <div class="text-center">
      <a href="${BASE_URL}/student/dashboard" class="btn">Modifier mon dossier</a>
    </div>
    <p>Cordialement,<br/><strong>L'équipe Plawimadd Group</strong></p>
  `;
  return getEmailLayout('Réouverture de votre demande de financement', body);
}

/**
 * 5. Template Rappel d'échéance de paiement en retard
 */
export function getStudentInstallmentReminderTemplate(options: {
  fullName: string;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
}): string {
  const formattedAmount = Number(options.amount).toLocaleString('fr-FR');
  const formattedDate = new Date(options.dueDate).toLocaleDateString('fr-FR');
  
  const body = `
    <h1 style="color: #b91c1c;">Rappel : Retard de paiement d'échéance ⚠️</h1>
    <p>Bonjour <strong>${options.fullName}</strong>,</p>
    <p>Nous vous contactons pour vous informer que votre mensualité <strong>Tranche #${options.installmentNumber}</strong> est arrivée à échéance.</p>
    
    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #d97706; margin-bottom: 12px; font-size: 16px;">Détails de l'impayé :</h3>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #4b5563;">Type d'échéance :</td>
          <td style="padding: 4px 0; font-weight: 600; text-align: right;">Tranche #${options.installmentNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #4b5563;">Montant dû :</td>
          <td style="padding: 4px 0; font-weight: 600; text-align: right; color: #b91c1c;">${formattedAmount} FCFA</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #4b5563;">Date limite de paiement :</td>
          <td style="padding: 4px 0; font-weight: 600; text-align: right; color: #d97706;">${formattedDate}</td>
        </tr>
      </table>
    </div>

    <p>Nous vous prions de régulariser cette situation au plus vite pour éviter toute suspension de votre compte étudiant ou l'application de frais de retard.</p>
    <div class="text-center">
      <a href="${BASE_URL}/student/dashboard" class="btn" style="background-color: #b91c1c;">Régler ma tranche en ligne</a>
    </div>
    <p>Si vous avez déjà procédé au règlement de cette tranche, veuillez ignorer ce message ou nous envoyer la preuve de paiement.</p>
    <p>Cordialement,<br/><strong>L'équipe Plawimadd Group</strong></p>
  `;
  return getEmailLayout("Rappel de retard de paiement d'échéance", body);
}

/**
 * 6. Template Mail de Contact pour l'administrateur
 */
export function getContactMessageTemplate(options: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  const body = `
    <h1>Nouveau message de contact ✉️</h1>
    <p>Vous avez reçu un nouveau message depuis le formulaire de contact du site Plawimadd Group.</p>
    
    <div class="meta-box">
      <div class="meta-item"><strong>Nom de l'expéditeur :</strong> ${options.name}</div>
      <div class="meta-item"><strong>Email :</strong> <a href="mailto:${options.email}">${options.email}</a></div>
      <div class="meta-item"><strong>Sujet :</strong> ${options.subject}</div>
    </div>
    
    <h2>Message :</h2>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; font-size: 15px; white-space: pre-wrap; line-height: 1.6; color: #1e293b;">
${options.message}
    </div>
    
    <div class="text-center" style="margin-top: 30px;">
      <a href="mailto:${options.email}?subject=Re: ${encodeURIComponent(options.subject)}" class="btn" style="background-color: #0f172a;">Répondre directement</a>
    </div>
  `;
  return getEmailLayout(`Nouveau message: ${options.subject}`, body);
}
