'use client';

import React, { useMemo } from 'react';
import { RotateCcw, ChevronDown, ChevronRight, Star, X } from 'lucide-react';
import type { Product } from '@/lib/types';

interface FilterSidebarProps {
  products: Product[];
  availableCategories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  showOnlyAvailable: boolean;
  onAvailableChange: (v: boolean) => void;
  showOnlyOffers: boolean;
  onOffersChange: (v: boolean) => void;
  allColors: { id: string; name: string; hex: string }[];
  selectedColorFilter: Set<string>;
  onColorFilterChange: (ids: Set<string>) => void;
  priceRange: { min: string; max: string };
  onPriceRangeChange: (range: { min: string; max: string }) => void;
  moqMax: string;
  onMoqMaxChange: (v: string) => void;
  selectedCertifications: string[];
  onCertificationsChange: (certs: string[]) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose?: () => void;
}

const CERTIFICATION_OPTIONS = [
  { slug: 'ce', label: 'CE' },
  { slug: 'fcc', label: 'FCC' },
  { slug: 'rohs', label: 'RoHS' },
  { slug: 'iso-9001', label: 'ISO 9001' },
  { slug: 'trade-assurance', label: 'Trade Assurance' },
  { slug: 'fast-dispatch', label: 'Fast Dispatch' },
  { slug: 'sample-available', label: 'Sample Available' },
];

export default function FilterSidebar({
  products,
  availableCategories,
  selectedCategory,
  onCategoryChange,
  showOnlyAvailable,
  onAvailableChange,
  showOnlyOffers,
  onOffersChange,
  allColors,
  selectedColorFilter,
  onColorFilterChange,
  priceRange,
  onPriceRangeChange,
  moqMax,
  onMoqMaxChange,
  selectedCertifications,
  onCertificationsChange,
  minRating,
  onMinRatingChange,
  onReset,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const currentProductCount = useMemo(() => products.length, [products]);

  const SECTION_CLASS = "border-b border-slate-100 pb-4";
  const LABEL_CLASS = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3";
  const TOGGLE_CLASS = "flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-3 text-sm transition hover:bg-slate-50 cursor-pointer";

  const content = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Filtres</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{currentProductCount} produits</span>
          {onClose && (
            <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 lg:hidden">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className={SECTION_CLASS}>
        <p className={LABEL_CLASS}>Catégorie</p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={() => onCategoryChange('All')}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
              selectedCategory === 'All' ? 'bg-[var(--brand-100)] font-medium text-[var(--brand-700)]' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Toutes les catégories
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                selectedCategory === cat ? 'bg-[var(--brand-100)] font-medium text-[var(--brand-700)]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className={SECTION_CLASS}>
        <p className={LABEL_CLASS}>Disponibilité</p>
        <div className="space-y-2">
          <label className={TOGGLE_CLASS}>
            <input
              type="checkbox"
              checked={showOnlyAvailable}
              onChange={e => onAvailableChange(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[var(--brand-600)] focus:ring-[var(--brand-300)]"
            />
            <span className="text-sm font-medium text-slate-700">En stock uniquement</span>
          </label>
          <label className={TOGGLE_CLASS}>
            <input
              type="checkbox"
              checked={showOnlyOffers}
              onChange={e => onOffersChange(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[var(--brand-600)] focus:ring-[var(--brand-300)]"
            />
            <span className="text-sm font-medium text-slate-700">En promotion</span>
          </label>
        </div>
      </div>

      {/* Price range */}
      <div className={SECTION_CLASS}>
        <p className={LABEL_CLASS}>Prix</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={priceRange.min}
            onChange={e => onPriceRangeChange({ ...priceRange, min: e.target.value })}
            className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[var(--brand-300)]"
          />
          <span className="text-slate-400">—</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={priceRange.max}
            onChange={e => onPriceRangeChange({ ...priceRange, max: e.target.value })}
            className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[var(--brand-300)]"
          />
        </div>
      </div>

      {/* MOQ */}
      <div className={SECTION_CLASS}>
        <p className={LABEL_CLASS}>Quantité min. de commande</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="MOQ max"
            value={moqMax}
            onChange={e => onMoqMaxChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[var(--brand-300)]"
          />
          <span className="text-xs text-slate-400">ou moins</span>
        </div>
      </div>

      {/* Colors */}
      {allColors.length > 0 && (
        <div className={SECTION_CLASS}>
          <p className={LABEL_CLASS}>Couleur</p>
          <div className="flex flex-wrap gap-2">
            {allColors.map((c) => {
              const isSelected = selectedColorFilter.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    const next = new Set(selectedColorFilter);
                    if (next.has(c.id)) next.delete(c.id);
                    else next.add(c.id);
                    onColorFilterChange(next);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                    isSelected
                      ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                      : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="h-3.5 w-3.5 rounded-full border border-slate-200" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Certifications */}
      <div className={SECTION_CLASS}>
        <p className={LABEL_CLASS}>Certifications</p>
        <div className="flex flex-wrap gap-2">
          {CERTIFICATION_OPTIONS.map((cert) => {
            const selected = selectedCertifications.includes(cert.slug);
            return (
              <button
                key={cert.slug}
                type="button"
                onClick={() => {
                  onCertificationsChange(
                    selected
                      ? selectedCertifications.filter(s => s !== cert.slug)
                      : [...selectedCertifications, cert.slug]
                  );
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  selected
                    ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cert.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rating */}
      <div className={SECTION_CLASS}>
        <p className={LABEL_CLASS}>Note minimum</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onMinRatingChange(minRating === star ? 0 : star)}
              className={`p-1 transition ${
                star <= minRating ? 'text-amber-400' : 'text-slate-200'
              }`}
            >
              <Star className={`h-5 w-5 ${star <= minRating ? 'fill-current' : ''}`} />
            </button>
          ))}
          {minRating > 0 && (
            <span className="ml-2 text-xs text-slate-400">& up</span>
          )}
        </div>
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={onReset}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <RotateCcw className="h-4 w-4" />
        Réinitialiser les filtres
      </button>
    </div>
  );

  if (!isOpen) return null;

  // Mobile: overlay
  return (
    <>
      {/* Mobile overlay */}
      <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto border-r border-slate-200 bg-white p-5 shadow-xl lg:sticky lg:top-24 lg:z-0 lg:block lg:h-[calc(100vh-8rem)] lg:w-full lg:overflow-y-auto lg:rounded-2xl lg:border lg:shadow-sm">
        {content}
      </aside>
    </>
  );
}
