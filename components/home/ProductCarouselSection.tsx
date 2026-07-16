'use client';

import React from 'react';

import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/types';
import SectionHeader from './SectionHeader';

interface ProductCarouselSectionProps {
  title: string;
  actionLabel: string;
  products: Product[];
  onAction: () => void;
  mode?: 'default' | 'student-offers';
  subtitle?: string;
}

export default function ProductCarouselSection({
  title,
  actionLabel,
  products,
  onAction,
  subtitle,
}: ProductCarouselSectionProps): React.ReactElement | null {
  const displayedProducts = products.slice(0, 12);

  if (!displayedProducts.length) return null;

  return (
    <section className="pt-5 md:pt-6">
      <div>
        <SectionHeader title={title} actionLabel={actionLabel} onAction={onAction} />

        {subtitle ? (
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#666]">{subtitle}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
