'use client';

import React, { useMemo } from 'react';

import HomeFooter from '@/components/home/HomeFooter';
import HomeHero from '@/components/home/HomeHero';
import ProductCarouselSection from '@/components/home/ProductCarouselSection';
import StudentOfferPopup from '@/components/home/StudentOfferPopup';
import { useAppContext } from '@/context/AppContext';
import type { Product } from '@/lib/types';

function getNewArrivals(products: Product[]): Product[] {
  return [...products]
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, 12);
}

function getBestSellers(products: Product[]): Product[] {
  return [...products]
    .sort((first, second) => {
      const secondRating = second.rating ?? 0;
      const firstRating = first.rating ?? 0;

      if (secondRating !== firstRating) {
        return secondRating - firstRating;
      }

      const secondCreatedAt = new Date(second.createdAt).getTime();
      const firstCreatedAt = new Date(first.createdAt).getTime();
      return secondCreatedAt - firstCreatedAt;
    })
    .slice(0, 12);
}

function getStudentOffers(products: Product[]): Product[] {
  const discountedProducts = products.filter(
    (product) =>
      product.offerPrice !== null &&
      product.offerPrice !== undefined &&
      product.offerPrice < product.price
  );

  if (discountedProducts.length >= 4) {
    return discountedProducts.slice(0, 12);
  }

  return [...products].slice(0, 12);
}

export default function HomePage(): React.ReactElement {
  const { products, router } = useAppContext();

  const newArrivals = useMemo(() => getNewArrivals(products), [products]);
  const bestSellers = useMemo(() => getBestSellers(products), [products]);
  const studentOffers = useMemo(() => getStudentOffers(products), [products]);

  const handleBrowseCatalog = (category?: string) => {
    if (category) {
      router.push(`/all-products?category=${encodeURIComponent(category)}`);
    } else {
      router.push('/all-products');
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col bg-[#f5f5f5] px-4 pb-0 pt-4 md:px-6 lg:px-8">
      <StudentOfferPopup onExploreOffer={() => router.push('/offer')} />

      <HomeHero
        onBrowseCatalog={handleBrowseCatalog}
        onContact={() => router.push('/contact')}
      />

      <ProductCarouselSection
        title="Nouveautés"
        actionLabel="Voir plus"
        products={newArrivals}
        onAction={() => router.push('/all-products?sortBy=newest')}
      />

      <ProductCarouselSection
        title="Hits de ventes"
        actionLabel="Voir plus"
        products={bestSellers}
        onAction={() => router.push('/all-products')}
      />

      <ProductCarouselSection
        title="Offres etudiantes"
        actionLabel="Voir plus"
        products={studentOffers}
        mode="student-offers"
        subtitle="Des offres pensees pour les etudiants, avec une selection utile pour les cours, les projets et le quotidien, et des possibilites de paiement par tranche selon les modalites."
        onAction={() => router.push('/offer')}
      />

      <HomeFooter />
    </main>
  );
}
