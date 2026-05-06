'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

import ConfirmationModal from '@/components/ConfirmationModal';
import Footer from '@/components/seller/Footer';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerStatCard from '@/components/seller/SellerStatCard';
import Loading from '@/components/Loading';
import { useAppContext } from '@/context/AppContext';
import type { Product } from '@/lib/types';

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

export default function ProductListPage(): React.ReactElement {
  const { products, loadingProducts, fetchProducts, formatPrice } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const haystack = [product.name, product.category?.name, product.brand || '']
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm.toLowerCase());
    });
  }, [products, searchTerm]);

  const inStockCount = useMemo(
    () => products.filter((product) => Number(product.stock) > 0).length,
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= 5).length,
    [products]
  );

  const executeDelete = async (): Promise<void> => {
    if (!productIdToDelete) return;

    try {
      const response = await fetch(`/api/products/${productIdToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Suppression impossible.');
      }

      toast.success('Produit supprime avec succes.');
      await fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression.');
    } finally {
      setProductIdToDelete(null);
    }
  };

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
        eyebrow="Catalogue"
        title="Gestion des produits"
        description="Pilotez votre catalogue, mettez a jour vos fiches et gardez une vue claire sur les references les plus sensibles."
        action={
          <Link
            href="/seller/add-products"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-600)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)]"
          >
            <Plus className="h-4 w-4" />
            Ajouter un produit
          </Link>
        }
      />

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <SellerStatCard
          title="References"
          value={String(products.length)}
          description="Nombre total de fiches actuellement dans votre catalogue."
          icon={Box}
          tone="blue"
        />
        <SellerStatCard
          title="Disponibles"
          value={String(inStockCount)}
          description="Produits encore disponibles a la vente."
          icon={Box}
          tone="emerald"
        />
        <SellerStatCard
          title="Stock faible"
          value={String(lowStockCount)}
          description="References a surveiller avant rupture."
          icon={Box}
          tone="amber"
        />
      </section>

      <SellerPanel className="mt-6 p-5 md:p-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un produit, une categorie ou une marque"
            className="w-full rounded-full border border-slate-200 bg-white px-11 py-3.5 text-sm text-slate-700 outline-none transition focus:border-[var(--brand-300)]"
          />
        </div>
      </SellerPanel>

      <SellerPanel className="mt-6 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-6">
            <SellerEmptyState
              title="Aucun produit trouve"
              description="Essayez une autre recherche ou ajoutez une nouvelle reference au catalogue."
              icon={Box}
              action={
                <Link
                  href="/seller/add-products"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-600)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)]"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un produit
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Produit</th>
                  <th className="px-6 py-4 font-medium">Categorie</th>
                  <th className="px-6 py-4 font-medium">Marque</th>
                  <th className="px-6 py-4 font-medium">Prix</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const imageSrc = product.imgUrl?.[0] || '/images/default_product_image.png';
                  const displayPrice = getDisplayPrice(product);
                  const isDiscounted = displayPrice !== product.price;
                  const stock = Number(product.stock);

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
                            <p className="mt-1 text-xs text-slate-400">#{product.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{product.category?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-600">{product.brand || 'Plawimadd'}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-950">{formatPrice(displayPrice)}</p>
                        {isDiscounted ? (
                          <p className="mt-1 text-xs text-slate-400 line-through">
                            {formatPrice(product.price)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            stock <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : stock <= 5
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {stock <= 0 ? 'Rupture' : `${stock} en stock`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/seller/product-list/edit/${product.id}`}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Modifier
                          </Link>
                          <button
                            type="button"
                            onClick={() => setProductIdToDelete(product.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Supprimer
                          </button>
                        </div>
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

      <ConfirmationModal
        isOpen={Boolean(productIdToDelete)}
        onClose={() => setProductIdToDelete(null)}
        onConfirm={executeDelete}
        title="Supprimer ce produit"
        message="Cette action retire la fiche produit du catalogue et ne peut pas etre annulee."
      />
    </div>
  );
}
