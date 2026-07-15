'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import axios from 'axios';

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

export default function MiniCustomOfferWidget(): React.ReactElement | null {
  const [offers, setOffers] = useState<CustomOffer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    axios.get('/api/custom-offer')
      .then((res) => {
        if (active && res.data.success) {
          const list = (res.data.offers || []) as CustomOffer[];
          const activeList = list.filter((o) => o.isActive);
          
          if (activeList.length > 0) {
            // Sort to ensure the student offer (isStudent: true) is always first
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
        console.error('Erreur lors du chargement des offres dans le widget:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Auto-cycle through the offers every 15 seconds
  useEffect(() => {
    if (offers.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 15000); // 15 seconds interval

    return () => clearInterval(timer);
  }, [offers]);

  if (loading || offers.length === 0) {
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
    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-[2px] shadow-sm select-none">
      <div className="flex h-[180px]">
        {/* Left Side: Offer Image & Overlay Banner */}
        <div className={`relative w-[38%] overflow-hidden ${currentOffer.bgColor} flex flex-col justify-end p-3 shrink-0`}>
          <Image
            src={currentOffer.image}
            alt={currentOffer.title}
            fill
            className="object-cover object-center pointer-events-none"
            sizes="(max-width: 768px) 100px, 150px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
          <div className="absolute bottom-2 left-2.5 right-2.5 text-white z-10 text-left">
            <span className="text-[8px] font-extrabold uppercase tracking-wider bg-red-600 text-white px-1.5 py-0.5 rounded-[1px] inline-block mb-1">
              {currentOffer.badgeText}
            </span>
            <h4 className="text-[11px] font-extrabold leading-tight tracking-tight">
              {currentOffer.title}
            </h4>
          </div>
        </div>

        {/* Right Side: Offer Details and CTA */}
        <div className="w-[62%] p-3.5 flex flex-col justify-between bg-white text-left">
          <div className="relative">
            {/* Slide Indicators / Navigation inside widget */}
            {offers.length > 1 && (
              <div className="absolute top-0 right-0 flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-[2px] p-0.5 z-20">
                <button
                  onClick={handlePrev}
                  className="p-0.5 hover:bg-slate-200 text-slate-500 rounded-[1px] transition"
                  title="Précédent"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="text-[9px] font-bold text-slate-500 px-0.5 font-mono">
                  {currentIndex + 1}/{offers.length}
                </span>
                <button
                  onClick={handleNext}
                  className="p-0.5 hover:bg-slate-200 text-slate-500 rounded-[1px] transition"
                  title="Suivant"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="pr-12">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                {currentOffer.isStudent && <Sparkles className="h-3 w-3 text-amber-500" />}
                Plawimadd Group
              </span>
              <h3 className="text-xs font-extrabold leading-tight text-slate-900 mt-0.5 truncate">
                {currentOffer.title}
              </h3>
              <p className="mt-1 text-[10px] leading-[14px] text-slate-500 font-medium line-clamp-2">
                {currentOffer.description}
              </p>
            </div>

            {/* Bullet points (max 2 for spacing) */}
            <div className="mt-2 flex flex-col gap-0.5">
              {bulletPoints.slice(0, 2).map((point, index) => (
                <div key={index} className="flex items-center gap-1 text-[9px] text-slate-700 font-bold truncate">
                  <span className="text-red-500 font-extrabold">★</span>
                  <span className="truncate">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Link
              href={currentOffer.buttonUrl}
              className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-[9px] font-extrabold transition rounded-[2px] tracking-wide"
            >
              {currentOffer.buttonText}
              <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
