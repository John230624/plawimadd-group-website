'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import axios from 'axios';

interface StudentOfferPopupProps {
  onExploreOffer: () => void;
}

interface CustomOffer {
  id: string;
  title: string;
  description: string;
  badgeText: string;
  image: string;
  detailsJson: string;
  buttonText: string;
  buttonUrl: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  isStudent: boolean;
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
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [offers, setOffers] = useState<CustomOffer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch active custom offers
  useEffect(() => {
    let active = true;
    axios.get('/api/custom-offer')
      .then((res) => {
        if (active && res.data.success) {
          const list = (res.data.offers || []) as CustomOffer[];
          const activeList = list.filter((o) => o.isActive);
          if (activeList.length > 0) {
            // Ensure student offer (isStudent === true) is always first
            const sorted = [...activeList].sort((a, b) => {
              if (a.isStudent && !b.isStudent) return -1;
              if (!a.isStudent && b.isStudent) return 1;
              return 0;
            });
            setOffers(sorted);
          }
        }
      })
      .catch((err) => {
        console.error('Erreur lors du chargement des offres dans le popup:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  // Popup display triggers
  useEffect(() => {
    setIsMounted(true);
    if (!shouldOpenPopup()) return;

    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, POPUP_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setIsReady(false);
      return;
    }
    const animationFrame = window.requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [isVisible]);

  // Auto-cycle through custom offers every 25 seconds
  useEffect(() => {
    if (!isVisible || offers.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 25000); // 25 seconds interval

    return () => clearInterval(timer);
  }, [isVisible, offers]);

  const handleClose = useCallback(() => {
    scheduleNextPopup(CLOSE_COOLDOWN_MS);
    window.localStorage.setItem('plw-student-offer-badge', 'pinned');
    window.dispatchEvent(new Event('plw-student-offer-badge-changed'));
    setIsVisible(false);
  }, []);

  const handleExplore = useCallback((url: string) => {
    scheduleNextPopup(CTA_COOLDOWN_MS);
    window.localStorage.setItem('plw-student-offer-badge', 'pinned');
    window.dispatchEvent(new Event('plw-student-offer-badge-changed'));
    setIsVisible(false);
    
    // Redirect dynamically based on the offer CTA url
    if (url.startsWith('http')) {
      window.location.href = url;
    } else {
      window.location.href = url;
    }
  }, []);

  if (!isMounted || !isVisible || offers.length === 0) {
    return null;
  }

  const currentOffer = offers[currentIndex];
  let bulletPoints: string[] = [];
  try {
    const parsed = JSON.parse(currentOffer.detailsJson);
    if (Array.isArray(parsed)) {
      bulletPoints = parsed;
    }
  } catch {
    bulletPoints = [];
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  return (
    <div
      className={`fixed inset-0 z-[80] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isReady ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`relative w-full max-w-[560px] bg-white text-slate-850 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 rounded-[2px] overflow-hidden flex flex-col md:flex-row transition-all duration-300 ease-out ${
          isReady ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Left Column - Miniature Slide */}
        <div className={`relative w-full md:w-[40%] min-h-[180px] md:min-h-auto overflow-hidden ${currentOffer.bgColor} flex flex-col justify-end`}>
          <Image
            src={currentOffer.image}
            alt={currentOffer.title}
            fill
            className="object-cover object-center pointer-events-none"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white z-10 text-left">
            <span className="text-[9px] font-bold uppercase tracking-widest bg-red-600 text-white px-2 py-0.5 rounded-[1px] inline-block mb-1.5">
              {currentOffer.badgeText}
            </span>
            <h4 className="text-sm font-extrabold leading-tight tracking-tight">
              {currentOffer.title}
            </h4>
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="w-full md:w-[60%] p-6 flex flex-col justify-between relative bg-white min-h-[240px] text-left">
          {/* Close button X top-right */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-3.5 top-3.5 z-10 text-slate-400 hover:text-slate-950 transition p-1"
            aria-label="Fermer la popup offre"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          {/* Manual navigation controls if multiple offers */}
          {offers.length > 1 && (
            <div className="absolute bottom-20 right-6 flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-[2px] p-0.5 z-20">
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-slate-200 text-slate-500 rounded-[1px] transition"
                title="Précédent"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-bold text-slate-650 px-1 font-mono">
                {currentIndex + 1}/{offers.length}
              </span>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-slate-200 text-slate-500 rounded-[1px] transition"
                title="Suivant"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="pr-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Plawimadd Group
            </span>
            <h3 className="text-base font-extrabold leading-snug text-slate-900 mt-0.5">
              {currentOffer.title}
            </h3>
            <p className="mt-2 text-xs leading-[1.35rem] text-slate-500 font-medium line-clamp-3">
              {currentOffer.description}
            </p>

            <div className="mt-3.5 flex flex-col gap-1.5">
              {bulletPoints.slice(0, 3).map((point, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold truncate">
                  <span className="text-red-500 font-bold">★</span>
                  <span className="truncate">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-950 transition rounded-[2px]"
            >
              Plus tard
            </button>
            <button
              type="button"
              onClick={() => handleExplore(currentOffer.buttonUrl)}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition rounded-[2px]"
            >
              {currentOffer.buttonText}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
