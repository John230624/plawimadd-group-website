'use client';

import React from 'react';

import HomeFooter from '@/components/home/HomeFooter';
import HomeHero from '@/components/home/HomeHero';
import ProductCard from '@/components/ProductCard';
import { useAppContext } from '@/context/AppContext';

export default function HomePage(): React.ReactElement {
  const { products, loadingProducts, router } = useAppContext();

  const handleBrowseCatalog = (category?: string) => {
    if (category) {
      router.push(`/all-products?category=${encodeURIComponent(category)}`);
    } else {
      router.push('/all-products');
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col bg-[#f5f5f5] px-4 pb-0 pt-4 md:px-6 lg:px-8">
      <HomeHero
        onBrowseCatalog={handleBrowseCatalog}
        onContact={() => router.push('/contact')}
      />

      {/* Unified Product Catalog Section */}
      <section className="mt-8 mb-12">
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              Notre Catalogue
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Découvrez notre sélection tech moderne, claire et accessible.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/all-products')}
            className="text-xs font-bold uppercase tracking-wider text-[#ff6a00] hover:text-[#e65f00] transition"
          >
            Voir tout le catalogue &rarr;
          </button>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg bg-white p-3 h-[370px]">
                <div className="aspect-square w-full rounded bg-slate-100" />
                <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-sm text-slate-500">Aucun produit disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {products.slice(0, 24).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <HomeFooter />
    </main>
  );
}
