'use client';

import React, { useMemo } from 'react';

import HomeFooter from '@/components/home/HomeFooter';
import HomeHero from '@/components/home/HomeHero';
import CatalogSection from '@/components/home/CatalogSection';
import NewsletterSection from '@/components/home/NewsletterSection';
import ProductCarouselSection from '@/components/home/ProductCarouselSection';
import StudentOfferPopup from '@/components/home/StudentOfferPopup';
import WhyChooseUsSection from '@/components/home/WhyChooseUsSection';
import {
  bestSellerShowcaseProducts,
  newsletterContent,
  studentOfferShowcaseProducts,
} from '@/components/home/data';
import { useAppContext } from '@/context/AppContext';
import type { Product } from '@/lib/types';

function getNewArrivals(products: Product[]): Product[] {
  return [...products]
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, 8);
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
    .slice(0, 8);
}

function getStudentOffers(products: Product[]): Product[] {
  const discountedProducts = products.filter(
    (product) =>
      product.offerPrice !== null &&
      product.offerPrice !== undefined &&
      product.offerPrice < product.price
  );

  if (discountedProducts.length >= 4) {
    return discountedProducts.slice(0, 8);
  }

  return [...products].slice(0, 8);
}

export default function HomePage(): React.ReactElement {
  const { products, router } = useAppContext();

  const newArrivals = useMemo(() => getNewArrivals(products), [products]);
  const bestSellers = useMemo(() => getBestSellers(products), [products]);
  const studentOffers = useMemo(() => getStudentOffers(products), [products]);

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col px-4 pb-0 pt-4 md:px-6 lg:px-8">
      <StudentOfferPopup onExploreOffer={() => router.push('/offer')} />

      <HomeHero
        onBrowseCatalog={() => router.push('/all-products')}
        onContact={() => router.push('/contact')}
      />

      <WhyChooseUsSection />

      <CatalogSection onBrowseCatalog={() => router.push('/all-products')} />

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
        showcaseItems={bestSellerShowcaseProducts}
        onAction={() => router.push('/all-products')}
      />

      <ProductCarouselSection
        title="Offres etudiantes"
        actionLabel="Voir plus"
        products={studentOffers}
        showcaseItems={studentOfferShowcaseProducts}
        mode="student-offers"
        subtitle="Des offres pensees pour les etudiants, avec une selection utile pour les cours, les projets et le quotidien, et des possibilites de paiement par tranche selon les modalites."
        onAction={() => router.push('/offer')}
      />

      <NewsletterSection content={newsletterContent} />

      <HomeFooter />
    </main>
  );
}
