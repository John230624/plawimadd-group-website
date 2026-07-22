/**
 * Traduction des codes internes de paiement en phrases destinees a l'acheteur.
 *
 * Regle : aucun detail technique (cle API, reponse brute de la passerelle, trace
 * d'exception) ne doit jamais atteindre l'ecran ou l'URL. Le code part dans les
 * logs serveur, la phrase part au client.
 */

export const PaymentOutcome = {
  /** Verifie aupres de Kkiapay, commande creee. */
  PAID: 'PAID',
  /** Tentative ouverte, verdict pas encore connu. */
  PENDING: 'PENDING',
  /** Verdict negatif definitif : aucune commande n'a ete creee. */
  FAILED: 'FAILED',
} as const;

export type PaymentOutcomeValue = (typeof PaymentOutcome)[keyof typeof PaymentOutcome];

export const PaymentFailureCode = {
  /** La passerelle a refuse le paiement (solde, plafond, annulation...). */
  REJECTED: 'REJECTED',
  /** Montant regle inferieur au total de la commande. */
  AMOUNT_MISMATCH: 'AMOUNT_MISMATCH',
  /** Devise reglee differente de celle de la commande. */
  CURRENCY_MISMATCH: 'CURRENCY_MISMATCH',
  /** La transaction ne se rapporte pas a cette tentative de paiement. */
  INTENT_MISMATCH: 'INTENT_MISMATCH',
  /** Transaction inconnue de la passerelle. */
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  /** Transaction deja utilisee pour une autre commande. */
  ALREADY_USED: 'ALREADY_USED',
  /** Tentative abandonnee (delai depasse sans paiement). */
  EXPIRED: 'EXPIRED',
  /** Panne de notre cote ou passerelle injoignable : verdict inconnu. */
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type PaymentFailureCodeValue =
  (typeof PaymentFailureCode)[keyof typeof PaymentFailureCode];

const MESSAGES: Record<PaymentFailureCodeValue, string> = {
  REJECTED: "Le paiement a ete refuse par votre operateur. Aucun montant n'a ete preleve.",
  AMOUNT_MISMATCH:
    "Le montant regle ne couvre pas le total de la commande. Contactez-nous, nous reglons cela avec vous.",
  CURRENCY_MISMATCH:
    'La devise du paiement ne correspond pas a celle de la commande. Contactez-nous, nous reglons cela avec vous.',
  INTENT_MISMATCH:
    'Ce paiement ne correspond pas a cette commande. Contactez-nous, nous reglons cela avec vous.',
  TRANSACTION_NOT_FOUND:
    "Nous ne retrouvons pas cette transaction chez notre operateur de paiement. Si vous avez ete debite, contactez-nous.",
  ALREADY_USED: 'Ce paiement a deja ete utilise pour une autre commande.',
  EXPIRED: "Le delai de paiement est depasse. Vous pouvez relancer la commande depuis votre panier.",
  // Volontairement rassurant : le verdict est inconnu, pas negatif. Annoncer un
  // echec a quelqu'un qui vient d'etre debite serait faux.
  UNAVAILABLE:
    "Confirmation en cours, cela peut prendre un instant. Si vous avez ete debite, votre commande sera creee automatiquement.",
};

/** Phrase a afficher pour un echec. Toujours definie, jamais un code brut. */
export function failureMessage(code: PaymentFailureCodeValue | null | undefined): string {
  if (!code) return MESSAGES.UNAVAILABLE;
  return MESSAGES[code] ?? MESSAGES.UNAVAILABLE;
}

/** Vrai si l'echec est definitif ; faux si le verdict peut encore basculer. */
export function isTerminalFailure(code: PaymentFailureCodeValue | null | undefined): boolean {
  return code !== PaymentFailureCode.UNAVAILABLE && code != null;
}
