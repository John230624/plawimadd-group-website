'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'plawimadd-cookie-consent';

type Consent = 'accepted' | 'essential';

export function getCookieConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'accepted' || v === 'essential' ? v : null;
}

// Bandeau de consentement minimaliste : deux choix clairs, pas de dark patterns.
// Le choix est conservé en localStorage ; aucun cookie non essentiel n'est
// déposé tant que l'utilisateur n'a pas accepté.
export default function CookieBanner(): React.ReactElement | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true);
  }, []);

  function choose(consent: Consent) {
    window.localStorage.setItem(STORAGE_KEY, consent);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden />
          <p className="text-sm leading-6 text-slate-600">
            Nous utilisons des cookies essentiels au fonctionnement du site (panier, connexion) et,
            avec votre accord, des cookies de mesure d&apos;audience.{' '}
            <Link href="/cookies" className="font-medium text-slate-900 underline underline-offset-2">
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => choose('essential')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Essentiels uniquement
          </button>
          <button
            onClick={() => choose('accepted')}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}
