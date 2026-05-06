'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, GraduationCap, X } from 'lucide-react';

interface StudentOfferPopupProps {
  onExploreOffer: () => void;
}

const POPUP_DELAY_MS = 1800;
const CLOSE_COOLDOWN_MS = 8 * 60 * 1000;
const CTA_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const POPUP_STORAGE_KEY = 'student-offer-popup-next-open-at';

function shouldOpenPopup(): boolean {
  const nextOpenAt = window.localStorage.getItem(POPUP_STORAGE_KEY);

  if (!nextOpenAt) {
    return true;
  }

  return Number(nextOpenAt) <= Date.now();
}

function scheduleNextPopup(delayMs: number): void {
  window.localStorage.setItem(POPUP_STORAGE_KEY, String(Date.now() + delayMs));
}

export default function StudentOfferPopup({
  onExploreOffer,
}: StudentOfferPopupProps): React.ReactElement | null {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);

    if (!shouldOpenPopup()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, POPUP_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  React.useEffect(() => {
    if (!isVisible) {
      setIsReady(false);
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      setIsReady(true);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [isVisible]);

  const handleClose = React.useCallback(() => {
    scheduleNextPopup(CLOSE_COOLDOWN_MS);
    setIsVisible(false);
  }, []);

  const handleExplore = React.useCallback(() => {
    scheduleNextPopup(CTA_COOLDOWN_MS);
    setIsVisible(false);
    onExploreOffer();
  }, [onExploreOffer]);

  if (!isMounted || !isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[80] bg-[rgba(15,23,42,0.26)] backdrop-blur-[2px] transition duration-300 ${
        isReady ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`fixed bottom-4 left-4 right-4 z-[81] mx-auto w-auto max-w-[420px] overflow-hidden rounded-[1.7rem] border border-[rgba(191,219,254,0.65)] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)] transition duration-300 ease-out sm:bottom-6 sm:left-auto sm:right-6 ${
          isReady ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/86 text-slate-500 transition hover:bg-white hover:text-slate-950"
          aria-label="Fermer la popup offre etudiante"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative h-[172px] overflow-hidden">
          <Image
            src="/images/background_etudiant2.jpg"
            alt="Offre etudiante"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(37,99,235,0.12),rgba(15,23,42,0.68))]" />

          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/16 px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
            <GraduationCap className="h-3.5 w-3.5" />
            Offre etudiante
          </div>

          <div className="absolute inset-x-4 bottom-4 text-white">
            <p className="max-w-[12ch] text-[1.55rem] font-semibold leading-[0.96] tracking-[-0.06em]">
              Payez 50% puis le reste sur 2 mois.
            </p>
          </div>
        </div>

        <div className="p-5">
          <p className="text-[1.15rem] font-semibold leading-[1.15] tracking-[-0.04em] text-slate-950">
            Materiel etudiant avec paiement par tranche.
          </p>

          <p className="mt-2 text-sm leading-7 text-slate-500">
            Offre reservee aux etudiants verifies, avec validation simple du dossier avant
            activation.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[rgba(237,244,253,0.95)] px-3 py-1.5 text-xs font-medium text-[var(--brand-700)]">
              3 tranches fixes
            </span>
            <span className="rounded-full bg-[rgba(237,244,253,0.95)] px-3 py-1.5 text-xs font-medium text-[var(--brand-700)]">
              Validation etudiante
            </span>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={handleExplore}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand-600)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)]"
            >
              Voir l&apos;offre
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
