'use client';

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { resolveCountry } from '@/lib/countries';

interface CountryFlagProps {
  /** Nom du pays ("Benin") ou code ISO2 ("BJ"). */
  country?: string | null;
  className?: string;
}

/**
 * Affiche le drapeau du pays de facon dynamique (via flagcdn).
 * Retombe sur une icone si le pays est inconnu ou l'image indisponible.
 */
export default function CountryFlag({ country, className = 'h-4 w-6' }: CountryFlagProps): React.ReactElement {
  const info = resolveCountry(country);
  const [errored, setErrored] = useState(false);

  let isoCode = info?.iso || null;
  let countryName = info?.name || '';

  // Fallback direct si le code fait 2 lettres (ex: "US")
  if (!isoCode && country && country.length === 2) {
    isoCode = country.toLowerCase();
    countryName = country.toUpperCase();
  }

  if (!isoCode || errored) {
    return (
      <span className={`inline-flex items-center justify-center rounded-[3px] bg-slate-100 text-slate-400 ${className}`}>
        <MapPin className="h-3 w-3" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/48x36/${isoCode}.png`}
      alt={countryName}
      onError={() => setErrored(true)}
      loading="lazy"
      className={`inline-block shrink-0 rounded-[3px] object-cover ring-1 ring-black/10 ${className}`}
    />
  );
}
