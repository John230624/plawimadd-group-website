'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Boxes, Search } from 'lucide-react';

import Footer from '@/components/seller/Footer';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerStatCard from '@/components/seller/SellerStatCard';
import Loading from '@/components/Loading';
import { useAppContext } from '@/context/AppContext';

export default function StocksPage(): React.ReactElement {
  const { products, loadingProducts, formatPrice } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const inventoryRows = useMemo(() => {
    return products
      .filter((product) => {
        const haystack = [product.name, product.category?.name, product.brand || '']
          .join(' ')
          .toLowerCase();
        return haystack.includes(searchTerm.toLowerCase());
      })
      .map((product) => {
        const stock = Number(product.stock);
        const stockValue = stock * (product.offerPrice ?? product.price);

        return {
          ...product,
          stock,
          stockValue,
        };
      });
  }, [products, searchTerm]);

  const outOfStockCount = useMemo(
    () => products.filter((product) => Number(product.stock) <= 0).length,
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= 5).length,
    [products]
  );
  const totalStockValue = useMemo(
    () =>
      products.reduce((sum, product) => {
        return sum + Number(product.stock) * (product.offerPrice ?? product.price);
      }, 0),
    [products]
  );

  if (loadingProducts) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <SellerSectionHeader
        eyebrow="Inventaire"
        title="Suivi du stock"
        description="Identifiez les references a reapprovisionner, estimez la valeur du stock et accedez rapidement aux fiches a corriger."
      />

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <SellerStatCard
          title="Ruptures"
          value={String(outOfStockCount)}
          description="Produits actuellement indisponibles a la vente."
          icon={AlertTriangle}
          tone="amber"
        />
        <SellerStatCard
          title="Stock faible"
          value={String(lowStockCount)}
          description="References a surveiller avant une rupture complete."
          icon={Boxes}
          tone="blue"
        />
        <SellerStatCard
          title="Valeur du stock"
          value={formatPrice(totalStockValue)}
          description="Estimation du stock basee sur les prix de vente actuels."
          icon={Boxes}
          tone="emerald"
        />
      </section>

      <SellerPanel className="mt-6 p-5 md:p-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un produit ou une categorie"
            className="w-full rounded-full border border-slate-200 bg-white px-11 py-3.5 text-sm text-slate-700 outline-none transition focus:border-[var(--brand-300)]"
          />
        </div>
      </SellerPanel>

      <SellerPanel className="mt-6 overflow-hidden">
        {inventoryRows.length === 0 ? (
          <div className="p-6">
            <SellerEmptyState
              title="Aucun produit a analyser"
              description="Le stock apparait vide pour les filtres en cours."
              icon={Boxes}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Produit</th>
                  <th className="px-6 py-4 font-medium">Categorie</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium">Prix unitaire</th>
                  <th className="px-6 py-4 font-medium">Valeur</th>
                  <th className="px-6 py-4 font-medium">Acces rapide</th>
                </tr>
              </thead>
              <tbody>
                {inventoryRows.map((product) => {
                  const imageSrc = product.imgUrl?.[0] || '/images/default_product_image.png';

                  return (
                    <tr key={product.id} className="border-t border-slate-100">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1rem] bg-slate-100">
                            <Image
                              src={imageSrc}
                              alt={product.name}
                              width={80}
                              height={80}
                              className="max-h-[58px] w-auto object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">{product.name}</p>
                            <p className="mt-1 text-xs text-slate-400">{product.brand || 'Sans marque'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{product.category?.name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            product.stock <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : product.stock <= 5
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {product.stock <= 0 ? 'Rupture' : `${product.stock} unite(s)`}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {formatPrice(product.offerPrice ?? product.price)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-950">
                        {formatPrice(product.stockValue)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/seller/product-list/edit/${product.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Ouvrir la fiche
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SellerPanel>

      <Footer />
    </div>
  );
}
