'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, ShieldCheck, Truck } from 'lucide-react';

interface HomeHeroProps {
  onBrowseCatalog: () => void;
  onContact: () => void;
}

export default function HomeHero({
  onBrowseCatalog,
  onContact,
}: HomeHeroProps): React.ReactElement {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[2.3rem] bg-[oklch(97%_0.014_254.604)] shadow-[0_35px_90px_rgba(15,23,42,0.12)]"
    >
      <Image
        src="/images/hero-bg.jpg"
        alt="Plawimadd Group hero background"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,32,0.68)_0%,rgba(8,15,32,0.42)_34%,rgba(8,15,32,0.12)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.02)_100%)]" />

      <div className="relative z-10 flex min-h-[390px] items-end px-6 py-7 sm:px-8 md:min-h-[430px] md:px-10 md:py-9 lg:px-12 lg:py-10">
        <div className="max-w-[760px] text-white">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-200)] backdrop-blur">
            <MapPin className="h-4 w-4" />
            Plawimadd Group - Abomey-Calavi, Benin
          </div>

          <h1 className="max-w-[22ch] text-[2rem] font-semibold leading-[1] tracking-[-0.035em] sm:text-[2.4rem] lg:max-w-[22ch] lg:text-[3.25rem]">
            <span className="block">Votre boutique en ligne</span>
            <span className="block">d&apos;electronique et</span>
            <span className="block">d&apos;equipements du quotidien.</span>
          </h1>

          <p className="mt-4 max-w-[62ch] text-sm leading-7 text-slate-200 sm:text-[15px] lg:max-w-[58ch]">
            Plawimadd Group vous accompagne avec une selection claire, un service humain et des
            produits penses pour la maison, les etudes, le travail et les usages modernes.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onBrowseCatalog}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-600)] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[oklch(51.5%_0.244_263.7)]"
            >
              Voir le catalogue
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onContact}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Nous contacter
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-200 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[var(--brand-300)]" />
              Livraison et suivi soignes
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--brand-300)]" />
              Assistance rapide et fiable
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
