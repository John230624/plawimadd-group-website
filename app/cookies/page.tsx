import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Politique de cookies | Plawimadd Group',
  description: 'Comment Plawimadd Group utilise les cookies et technologies similaires.',
};

const sections = [
  {
    title: '1. Qu’est-ce qu’un cookie ?',
    body: `Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d'un site.
Il permet de mémoriser des informations sur votre navigation afin d'assurer le bon fonctionnement
du site ou d'en mesurer l'utilisation.`,
  },
  {
    title: '2. Cookies essentiels',
    body: `Ces cookies sont indispensables au fonctionnement du site : maintien de votre session,
contenu du panier, sécurité de la connexion. Ils ne peuvent pas être désactivés car le site
ne fonctionnerait plus correctement sans eux.`,
  },
  {
    title: '3. Cookies de mesure d’audience',
    body: `Avec votre accord, nous utilisons des cookies pour comprendre comment le site est utilisé
(pages visitées, durée de visite) afin de l'améliorer. Ces données sont agrégées et ne permettent
pas de vous identifier personnellement.`,
  },
  {
    title: '4. Cookies tiers',
    body: `Certains services intégrés au site (paiement Kkiapay, connexion Google) peuvent déposer
leurs propres cookies, régis par les politiques de confidentialité de ces services.`,
  },
  {
    title: '5. Gérer vos préférences',
    body: `Vous pouvez à tout moment modifier votre choix en supprimant les données de navigation de
votre navigateur, ce qui fera réapparaître le bandeau de consentement. Vous pouvez également
configurer votre navigateur pour bloquer les cookies.`,
  },
  {
    title: '6. Durée de conservation',
    body: `Les cookies essentiels expirent à la fin de votre session ou après une durée maximale de
13 mois. Votre choix de consentement est conservé 6 mois avant de vous être redemandé.`,
  },
];

export default function CookiesPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-400">Mentions légales</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Politique de cookies</h1>
      <p className="mt-3 text-sm text-slate-500">
        Dernière mise à jour :{' '}
        {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
      </p>

      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-slate-600">{s.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
        Pour toute question relative aux cookies ou à vos données personnelles, consultez notre{' '}
        <Link href="/privacy-policy" className="font-medium text-slate-900 underline underline-offset-2">
          politique de confidentialité
        </Link>{' '}
        ou contactez-nous via la{' '}
        <Link href="/contact" className="font-medium text-slate-900 underline underline-offset-2">
          page contact
        </Link>
        .
      </div>
    </div>
  );
}
