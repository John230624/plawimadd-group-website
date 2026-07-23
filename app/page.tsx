'use client';

import React, { useState } from 'react';

import HomeFooter from '@/components/home/HomeFooter';
import HomeHero from '@/components/home/HomeHero';
import StudentOfferPopup from '@/components/home/StudentOfferPopup';
import CategoryExplorer from '@/components/home/CategoryExplorer';
import ProductCard from '@/components/ProductCard';
import { useAppContext } from '@/context/AppContext';

export default function HomePage(): React.ReactElement {
  const { products, loadingProducts, router } = useAppContext();
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');

  const handleBrowseCatalog = (category?: string) => {
    if (category) {
      router.push(`/all-products?category=${encodeURIComponent(category)}`);
    } else {
      router.push('/all-products');
    }
  };

  const displayedProducts = activeCategoryId
    ? products.filter((p) => p.category.id === activeCategoryId)
    : products;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col bg-[#f5f5f5] px-4 pb-0 pt-4 md:px-6 lg:px-8">
      <StudentOfferPopup onExploreOffer={() => router.push('/offer')} />

      <HomeHero
        onBrowseCatalog={handleBrowseCatalog}
        onContact={() => router.push('/contact')}
      />

      {/* Category Explorer section (Alibaba style) */}
      <div className="mt-6 shrink-0">
        <CategoryExplorer
          products={products}
          loadingProducts={loadingProducts}
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
        />
      </div>

      {/* Unified Product Catalog Section */}
      <section className="mt-8 mb-12">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Nos Produits ({displayedProducts.length})
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              Découvrez notre large sélection d&apos;équipements et d&apos;accessoires.
            </p>
          </div>
          {displayedProducts.length > 150 && (
            <button
              type="button"
              onClick={() => router.push('/all-products')}
              className="text-xs sm:text-sm font-semibold text-[#3b82f6] hover:underline"
            >
              Voir tout le catalogue ({displayedProducts.length}) &rarr;
            </button>
          )}
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg bg-white p-3 h-[360px]">
                <div className="aspect-square w-full rounded bg-slate-100" />
                <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-sm text-slate-500">Aucun produit disponible pour le moment.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {displayedProducts.slice(0, 150).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {displayedProducts.length > 150 && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => router.push('/all-products')}
                  className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 shadow-sm"
                >
                  Voir tout le catalogue ({displayedProducts.length} produits)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <HomeFooter />
    </main>
  );
}
