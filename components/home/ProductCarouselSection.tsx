'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, Heart, ShoppingCart } from 'lucide-react';
import { toast } from 'react-toastify';

import { assets } from '@/assets/assets';
import { useAppContext } from '@/context/AppContext';
import type { Product } from '@/lib/types';
import type { HomeShowcaseProduct } from './data';
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

function getDisplayPrice(product: Product): number {
  if (
    product.offerPrice !== null &&
    product.offerPrice !== undefined &&
    product.offerPrice < product.price
  ) {
    return product.offerPrice;
  }

  return product.price;
}

function getDiscountPercent(product: Product): number | null {
  if (
    product.offerPrice !== null &&
    product.offerPrice !== undefined &&
    product.offerPrice < product.price
  ) {
    return Math.round(((product.price - product.offerPrice) / product.price) * 100);
  }

  return null;
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
  const { addToCart, formatPrice, router, toggleWishlist, isInWishlist, colors } = useAppContext();

  const isStudentOffers = mode === 'student-offers';
  const hasRealProducts = products.length > 0;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const visibleItems = hasRealProducts ? products : showcaseItems;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || visibleItems.length <= 1) return;

    const updateProgress = () => {
      const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
      const progress = maxScroll > 0 ? (element.scrollLeft / maxScroll) * 100 : 0;
      setScrollProgress(progress);
    };

    updateProgress();
    element.addEventListener('scroll', updateProgress);

    return () => {
      element.removeEventListener('scroll', updateProgress);
    };
  }, [visibleItems.length]);

  if (!hasRealProducts && !showcaseItems.length) return null;

  return (
    <section className="px-2 pb-2 pt-12 md:px-0 md:pt-14">
      <div className="px-3 py-4 md:px-0 md:py-0">
        <SectionHeader title={title} actionLabel={actionLabel} onAction={onAction} />

        {subtitle ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{subtitle}</p>
        ) : null}

        <div ref={scrollRef} className="catalog-scroll mt-8 pb-4">
          <div className="grid min-w-full auto-cols-[88%] grid-flow-col gap-5 md:auto-cols-[calc((100%-20px)/2)] xl:auto-cols-[calc((100%-60px)/4)]">
            {hasRealProducts
              ? products.map((product) => {
                  const price = getDisplayPrice(product);
                  const discountPercent = getDiscountPercent(product);
                  const imageSrc = product.imgUrl?.[0] || assets.default_product_image.src;
                  const productColorIds: string[] = (() => {
                    if (!product.color) return [];
                    try { const p = JSON.parse(product.color); return Array.isArray(p) ? p : []; } catch { return []; }
                  })();

                  return (
                    <article
                      key={product.id}
                      className="min-w-0 overflow-hidden rounded-[1.75rem] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
                    >
                      <div className="relative rounded-[1.75rem] bg-slate-100 p-5">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product.id)}
                          className={`absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 shadow-sm transition ${
                            isInWishlist(product.id)
                              ? 'text-rose-500'
                              : 'text-slate-400 hover:text-[var(--brand-700)]'
                          }`}
                        >
                          <Heart
                            className={`h-5 w-5 stroke-[1.8] ${isInWishlist(product.id) ? 'fill-current' : ''}`}
                          />
                        </button>

                        {discountPercent ? (
                          <div className="absolute bottom-5 right-5 z-10 rounded-full bg-[var(--brand-500)] px-3 py-1 text-xs font-semibold text-white">
                            -{discountPercent}%
                          </div>
                        ) : null}

                        <button
                          type="button"
                          className="relative mx-auto block h-[290px] w-full cursor-pointer"
                          onClick={() => router.push(`/product/${product.id}`)}
                        >
                          <Image
                            src={imageSrc}
                            alt={product.name}
                            fill
                            className="object-contain"
                          />
                        </button>
                      </div>

                      <div className="px-5 pb-3.5 pt-2.5">
                        <div className="mb-1.5 flex justify-center gap-2">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <span
                              key={index}
                              className={`h-2.5 w-2.5 rounded-full ${
                                index === 1 ? 'bg-slate-300' : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>

                        <h3 className="min-h-[44px] text-[1.05rem] font-semibold leading-6 text-slate-900">
                          {product.name}
                        </h3>

                        {productColorIds.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {productColorIds.map((id) => {
                              const c = colors.find((col) => col.id === id);
                              if (!c) return null;
                              return (
                                <div key={id} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500">
                                  <span className="h-2 w-2 rounded-full border border-slate-200" style={{ backgroundColor: c.hex }} />
                                  {c.name}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Disponible</span>
                        </div>

                        {isStudentOffers ? (
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            Paiement par tranche disponible pour etudiants selon modalites.
                          </p>
                        ) : null}

                        <div className="mt-2 flex items-end gap-2">
                          <p className="text-[1.15rem] font-semibold text-slate-950">
                            {formatPrice(price)}
                          </p>
                          {discountPercent ? (
                            <p className="text-sm text-slate-400 line-through">
                              {formatPrice(product.price)}
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (isStudentOffers) {
                              router.push(`/product/${product.id}`);
                              return;
                            }

                            const success = await addToCart(product.id);
                            if (success) {
                              toast.success('Ajoute au panier');
                            }
                          }}
                          className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-950)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-900)]"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {isStudentOffers ? "Voir l'offre" : 'Ajouter au panier'}
                        </button>
                      </div>
                    </article>
                  );
                })
              : showcaseItems.map((item) => (
                  <article
                    key={item.id}
                    className="min-w-0 overflow-hidden rounded-[1.75rem] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
                  >
                    <div className="relative rounded-[1.75rem] bg-slate-100 p-5">
                      <button
                        type="button"
                        className="absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-slate-400 shadow-sm transition hover:text-[var(--brand-700)]"
                      >
                        <Heart className="h-5 w-5 stroke-[1.8]" />
                      </button>

                      {item.discountLabel ? (
                        <div className="absolute bottom-5 right-5 z-10 rounded-full bg-[var(--brand-500)] px-3 py-1 text-xs font-semibold text-white">
                          {item.discountLabel}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        className="relative mx-auto block h-[290px] w-full cursor-pointer"
                        onClick={onAction}
                      >
                        <Image src={item.image} alt={item.name} fill className="object-contain" />
                      </button>
                    </div>

                    <div className="px-5 pb-3.5 pt-2.5">
                      <div className="mb-1.5 flex justify-center gap-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span
                            key={index}
                            className={`h-2.5 w-2.5 rounded-full ${
                              index === 1 ? 'bg-slate-300' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>

                      <h3 className="min-h-[44px] text-[1.05rem] font-semibold leading-6 text-slate-900">
                        {item.name}
                      </h3>

                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>{item.availabilityLabel}</span>
                      </div>

                      {isStudentOffers ? (
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Paiement par tranche disponible pour etudiants selon modalites.
                        </p>
                      ) : null}

                      <div className="mt-2 flex items-end gap-2">
                        <p className="text-[1.15rem] font-semibold text-slate-950">
                          {item.priceLabel}
                        </p>
                        {item.oldPriceLabel ? (
                          <p className="text-sm text-slate-400 line-through">
                            {item.oldPriceLabel}
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={onAction}
                        className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-950)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-900)]"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {isStudentOffers ? "Voir l'offre" : 'Voir le produit'}
                      </button>
                    </div>
                  </article>
                ))}
          </div>
        </div>

        <div className="mt-5 h-[4px] w-full overflow-hidden rounded-full bg-slate-200/60">
          <div
            className="h-full w-24 rounded-full bg-[var(--brand-500)] transition-all duration-300"
            style={{ transform: `translateX(${scrollProgress * 3.05}px)` }}
          />
        </div>
      </div>
    </section>
  );
}
