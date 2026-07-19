import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Politique de confidentialité | Plawimadd Group',
  description: 'Comment Plawimadd Group collecte, utilise et protège vos données personnelles.',
};

const CONTACT_EMAIL = 'plawimaddgroup1beninbranch@gmail.com';

const sections: { title: string; body?: string; list?: string[] }[] = [
  {
    title: '1. Collecte des informations',
    body: `Nous collectons vos informations personnelles lorsque vous utilisez notre site ou nos
services : nom, adresse e-mail, numéro de téléphone, adresse de livraison et informations
fournies lors de la création d'un compte ou d'une commande.`,
  },
  {
    title: '2. Utilisation des informations',
    body: 'Vos informations sont utilisées pour :',
    list: [
      'Traiter vos commandes et paiements.',
      'Fournir un service client personnalisé.',
      'Améliorer nos produits et services.',
      'Vous informer sur nos promotions et offres spéciales, si vous y avez consenti.',
    ],
  },
  {
    title: '3. Partage des données',
    body: `Vos données ne sont jamais vendues. Elles ne sont partagées qu'avec les prestataires
strictement nécessaires au service : traitement des paiements (Kkiapay), hébergement du site,
et facturation normalisée (e-MECeF / DGI) lorsque la loi l'exige.`,
  },
  {
    title: '4. Sécurité des données',
    body: `Nous utilisons des mesures techniques et organisationnelles pour protéger vos données
contre tout accès non autorisé, perte ou modification : chiffrement des connexions (HTTPS),
mots de passe hachés et accès restreint aux données.`,
  },
  {
    title: '5. Vos droits',
    body: `Vous avez le droit d'accéder à vos données, de les corriger ou de demander leur
suppression. Pour exercer ces droits, contactez-nous à l'adresse indiquée ci-dessous.
Nous répondons sous 30 jours.`,
  },
  {
    title: '6. Modifications de cette politique',
    body: `Nous pouvons mettre à jour cette politique de confidentialité. Toute modification est
publiée sur cette page avec une nouvelle date de mise à jour.`,
  },
];

export default function PrivacyPolicyPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-400">Mentions légales</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Politique de confidentialité</h1>
      <p className="mt-3 text-sm text-slate-500">
        Dernière mise à jour :{' '}
        {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
      </p>

      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
            {s.body && (
              <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-slate-600">
                {s.body}
              </p>
            )}
            {s.list && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-slate-600">
                {s.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section>
          <h2 className="text-lg font-semibold text-slate-900">7. Contact</h2>
          <p className="mt-2 text-[15px] leading-7 text-slate-600">
            Pour toute question concernant cette politique ou vos données personnelles :
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-1 inline-block font-medium text-slate-900 underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>
        </section>
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
        Consultez également notre{' '}
        <Link href="/cookies" className="font-medium text-slate-900 underline underline-offset-2">
          politique de cookies
        </Link>
        .
      </div>
    </div>
  );
}
