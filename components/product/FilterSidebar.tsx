'use client';

import { useMemo } from 'react';
import { RotateCcw, Star, X } from 'lucide-react';
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

const SECTION_CLASS = 'border-b border-[#eee] pb-4';
const LABEL_CLASS = 'mb-3 text-xs font-bold uppercase tracking-wide text-[#777]';
const TOGGLE_CLASS =
  'flex cursor-pointer items-center gap-3 rounded-lg border border-[#eee] bg-white px-3 py-3 text-sm transition hover:border-[#ff6a00] hover:bg-[#fff8f2]';
const INPUT_CLASS =
  'h-9 w-full rounded-lg border border-[#e5e5e5] px-3 text-sm outline-none focus:border-[#ff6a00]';

export default function FilterSidebar({
  products,
  availableCategories,
  selectedCategory,
  onCategoryChange,
  showOnlyAvailable,
  onAvailableChange,
  showOnlyOffers,
  onOffersChange,

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

  const content = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#222]">Filtres</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#777]">{currentProductCount} produits</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#555] hover:bg-[#f7f7f7] lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className={SECTION_CLASS}>
        <p className={LABEL_CLASS}>Categorie</p>
        <div className="max-h-48 space-y-1 overflow-y-auto">
          <button
            type="button"
            onClick={() => onCategoryChange('All')}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
              selectedCategory === 'All' ? 'bg-[#fff3e8] font-medium text-[#c25100]' : 'text-[#555] hover:bg-[#f7f7f7]'
            }`}
          >
            Toutes les categories
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                selectedCategory === cat ? 'bg-[#fff3e8] font-medium text-[#c25100]' : 'text-[#555] hover:bg-[#f7f7f7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className={SECTION_CLASS}>
        <p className={LABEL_CLASS}>Disponibilite</p>
        <div className="space-y-2">
          <label className={TOGGLE_CLASS}>
            <input
              type="checkbox"
              checked={showOnlyAvailable}
              onChange={(e) => onAvailableChange(e.target.checked)}
              className="h-4 w-4 rounded border-[#d8d8d8] text-[#ff6a00] focus:ring-[#ffb37a]"
            />
            <span className="text-sm font-medium text-[#444]">En stock uniquement</span>
          </label>
          <label className={TOGGLE_CLASS}>
            <input
              type="checkbox"
              checked={showOnlyOffers}
              onChange={(e) => onOffersChange(e.target.checked)}
              className="h-4 w-4 rounded border-[#d8d8d8] text-[#ff6a00] focus:ring-[#ffb37a]"
            />
            <span className="text-sm font-medium text-[#444]">En promotion</span>
          </label>
        </div>
      </div>

      <div className={SECTION_CLASS}>
        <p className={LABEL_CLASS}>Prix</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })}
            className={INPUT_CLASS}
          />
          <span className="text-[#999]">-</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className={SECTION_CLASS}>
        <p className={LABEL_CLASS}>Quantite min. de commande</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="MOQ max"
            value={moqMax}
            onChange={(e) => onMoqMaxChange(e.target.value)}
            className={INPUT_CLASS}
          />
          <span className="text-xs text-[#777]">ou moins</span>
        </div>
      </div>


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
                    selected ? selectedCertifications.filter((slug) => slug !== cert.slug) : [...selectedCertifications, cert.slug]
                  );
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  selected
                    ? 'border-[#ff6a00] bg-[#fff3e8] text-[#c25100]'
                    : 'border-[#e5e5e5] bg-white text-[#555] hover:bg-[#f7f7f7]'
                }`}
              >
                {cert.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={SECTION_CLASS}>
        <p className={LABEL_CLASS}>Note minimum</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onMinRatingChange(minRating === star ? 0 : star)}
              className={`p-1 transition ${star <= minRating ? 'text-[#ffb300]' : 'text-[#ddd]'}`}
            >
              <Star className={`h-5 w-5 ${star <= minRating ? 'fill-current' : ''}`} />
            </button>
          ))}
          {minRating > 0 && <span className="ml-2 text-xs text-[#777]">& up</span>}
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-[#d8d8d8] px-4 py-3 text-sm font-medium text-[#555] transition hover:border-[#ff6a00] hover:text-[#ff6a00]"
      >
        <RotateCcw className="h-4 w-4" />
        Reinitialiser les filtres
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto border-r border-[#eee] bg-white p-5 shadow-xl lg:sticky lg:top-24 lg:z-0 lg:block lg:h-[calc(100vh-8rem)] lg:w-full lg:overflow-y-auto lg:rounded-[20px] lg:border-transparent lg:shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {content}
      </aside>
    </>
  );
}
