'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle2, ShoppingCart } from 'lucide-react';

import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/types';
import type { HomeShowcaseProduct } from './data';
import CountryFlag from '@/components/CountryFlag';
import SectionHeader from './SectionHeader';

interface ProductCarouselSectionProps {
  title: string;
  actionLabel: string;
  products: Product[];
  onAction: () => void;
  mode?: 'default' | 'student-offers';
  subtitle?: string;
  showcaseItems?: HomeShowcaseProduct[];
}

export default function ProductCarouselSection({
  title,
  actionLabel,
  products,
  onAction,
  mode = 'default',
  subtitle,
  showcaseItems = [],
}: ProductCarouselSectionProps): React.ReactElement | null {
  const isStudentOffers = mode === 'student-offers';
  const displayedProducts = products.slice(0, 12);
  const displayedShowcaseItems = showcaseItems.slice(0, 12);

  if (!displayedProducts.length && !displayedShowcaseItems.length) return null;

  return (
    <section className="pt-5 md:pt-6">
      <div>
        <SectionHeader title={title} actionLabel={actionLabel} onAction={onAction} />

        {subtitle ? (
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#666]">{subtitle}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {displayedProducts.length
            ? displayedProducts.map((product) => <ProductCard key={product.id} product={product} />)
            : displayedShowcaseItems.map((item) => (
                <article
                  key={item.id}
                  onClick={onAction}
                  className="group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-transparent bg-white p-2.5 shadow-none transition duration-300 lg:h-[348px]"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#f7f7f7]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(min-width: 1024px) 210px, (min-width: 640px) 33vw, 50vw"
                      className="object-contain transition duration-500 group-hover:scale-[1.04]"
                    />

                    {item.discountLabel ? (
                      <span className="absolute left-2 top-2 rounded-full bg-[#ff6a00] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                        {item.discountLabel}
                      </span>
                    ) : null}

                    <div className="absolute inset-x-2 bottom-2 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <button
                        type="button"
                        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-[#ff6a00] text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition hover:bg-[#e65f00]"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {isStudentOffers ? "Voir l'offre" : 'Voir le produit'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col pt-3">
                    <h3 className="h-10 overflow-hidden text-[13px] font-medium leading-5 text-[#222] line-clamp-2">
                      {item.name}
                    </h3>

                    <div className="mt-2 flex items-center gap-2 text-[11px] text-[#666]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#238a43]" />
                      <span className="line-clamp-1">{item.availabilityLabel}</span>
                    </div>

                    <div className="mt-auto pt-2">
                      <div>
                        <p className="text-[18px] font-bold leading-tight text-[#222]">
                          {item.priceLabel}
                        </p>
                        {item.oldPriceLabel ? (
                          <p className="text-[11px] leading-4 text-[#999] line-through">
                            {item.oldPriceLabel}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-2 text-[11px] text-[#666]">
                        MOQ: 1 piece
                        {isStudentOffers ? <span> - paiement flexible</span> : null}
                      </div>

                      <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#1473e6]">
                        <span>Verified</span>
                        <CountryFlag country="US" className="h-3 w-4.5" />
                        <span className="font-normal text-[#777]">- 1 an - BJ</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </section>
  );
}
