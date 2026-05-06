'use client';

import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Grid2x2, Heart, LayoutList, SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';

import HomeFooter from '@/components/home/HomeFooter';
import ProductCarouselSection from '@/components/home/ProductCarouselSection';
import SellerSelect from '@/components/seller/SellerSelect';
import { useAppContext } from '@/context/AppContext';
import type { Product } from '@/lib/types';

const preferredCategoryOrder = [
  'Ordinateurs',
  'Ordinateur',
  'Laptops',
  'Laptop',
  'Audio',
  'Ecouteurs',
  'Casques',
  'Smartphones',
  'Telephones',
  'Montres connectees',
  'Montres',
  'Televiseurs',
  'Televisions',
  'Tablettes',
  'Gaming',
  'Accessoires',
  'Electromenager',
];

const sortOptions = [
  { value: 'popular', label: 'Popularite' },
  { value: 'newest', label: 'Plus recent' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix decroissant' },
];

function normalizeLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function formatCategoryTitle(label: string): string {
  const cleaned = normalizeLabel(label);

  if (/ordinateur|laptop/i.test(cleaned)) return 'Ordinateurs et laptops';
  if (/audio|ecouteur|casque/i.test(cleaned)) return 'Audio';
  if (/telephone|smartphone/i.test(cleaned)) return 'Smartphones';
  if (/montre/i.test(cleaned)) return 'Montres connectees';
  if (/televi/i.test(cleaned)) return 'Televiseurs';
  if (/accessoire/i.test(cleaned)) return 'Accessoires';
  if (/electro|menager/i.test(cleaned)) return 'Electromenager';

  return cleaned;
}

function sortCategories(categories: string[]): string[] {
  return [...categories].sort((first, second) => {
    const firstIndex = preferredCategoryOrder.findIndex((item) =>
      normalizeLabel(item).toLowerCase() === normalizeLabel(first).toLowerCase()
    );
    const secondIndex = preferredCategoryOrder.findIndex((item) =>
      normalizeLabel(item).toLowerCase() === normalizeLabel(second).toLowerCase()
    );

    if (firstIndex === -1 && secondIndex === -1) {
      return first.localeCompare(second);
    }

    if (firstIndex === -1) return 1;
    if (secondIndex === -1) return -1;
    return firstIndex - secondIndex;
  });
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

function buildQueryString(
  searchParams: URLSearchParams,
  updates: Record<string, string | null>
): string {
  const params = new URLSearchParams(searchParams.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (!value || value === 'All') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `/all-products?${query}` : '/all-products';
}

export default function AllProductsPage(): React.ReactElement {
  const {
    products,
    loadingProducts,
    errorProducts,
    searchTerm,
    setSearchTerm,
    formatPrice,
    addToCart,
    toggleWishlist,
    isInWishlist,
  } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get('category') || 'All';
  const brandParam = searchParams.get('brand');
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyOffers, setShowOnlyOffers] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryParam, brandParam, searchTerm, sortBy]);

  const availableCategories = useMemo(() => {
    const values = new Set(
      products
        .map((product) => product.category?.name)
        .filter((value): value is string => Boolean(value))
    );

    return sortCategories(Array.from(values));
  }, [products]);

  const searchFilteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      if (!normalizedSearch) return true;

      return (
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description?.toLowerCase().includes(normalizedSearch) ||
        product.brand?.toLowerCase().includes(normalizedSearch) ||
        product.category?.name.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [products, searchTerm]);

  const groupedProducts = useMemo(() => {
    const sourceProducts =
      categoryParam === 'All'
        ? searchFilteredProducts
        : searchFilteredProducts.filter((product) => product.category?.name === categoryParam);

    const groups = new Map<string, Product[]>();

    sourceProducts.forEach((product) => {
      const categoryName = product.category?.name || 'Catalogue';
      const existing = groups.get(categoryName) || [];
      existing.push(product);
      groups.set(categoryName, existing);
    });

    return sortCategories(Array.from(groups.keys())).map((category) => ({
      category,
      title: formatCategoryTitle(category),
      products: groups.get(category) || [],
    }));
  }, [searchFilteredProducts, categoryParam]);

  const categoryProducts = useMemo(() => {
    if (categoryParam === 'All') return [];

    return searchFilteredProducts.filter((product) => product.category?.name === categoryParam);
  }, [searchFilteredProducts, categoryParam]);

  const brandGroups = useMemo(() => {
    const groups = new Map<string, Product[]>();

    categoryProducts.forEach((product) => {
      const brandName = product.brand || 'Autres';
      const existing = groups.get(brandName) || [];
      existing.push(product);
      groups.set(brandName, existing);
    });

    return Array.from(groups.entries())
      .map(([brand, items]) => ({
        brand,
        items: items.sort((first, second) => (second.rating ?? 0) - (first.rating ?? 0)),
      }))
      .sort((first, second) => second.items.length - first.items.length);
  }, [categoryProducts]);

  const selectedBrandProducts = useMemo(() => {
    const scopedProducts =
      brandParam && brandParam !== 'All'
        ? categoryProducts.filter((product) => product.brand === brandParam)
        : categoryProducts;

    const filtered = scopedProducts.filter((product) => {
      const matchesAvailability = !showOnlyAvailable || product.stock > 0;
      const matchesOffer =
        !showOnlyOffers ||
        (product.offerPrice !== null &&
          product.offerPrice !== undefined &&
          product.offerPrice < product.price);

      return matchesAvailability && matchesOffer;
    });

    const sorted = [...filtered].sort((first, second) => {
      if (sortBy === 'price-asc') return getDisplayPrice(first) - getDisplayPrice(second);
      if (sortBy === 'price-desc') return getDisplayPrice(second) - getDisplayPrice(first);
      if (sortBy === 'newest') {
        return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
      }

      return (second.rating ?? 0) - (first.rating ?? 0);
    });

    return sorted;
  }, [brandParam, categoryProducts, showOnlyAvailable, showOnlyOffers, sortBy]);

  const totalPages = Math.max(1, Math.ceil(selectedBrandProducts.length / 8));
  const paginatedProducts = selectedBrandProducts.slice((currentPage - 1) * 8, currentPage * 8);
  const categoryOptions = [
    { value: 'All', label: 'Toutes les categories' },
    ...availableCategories.map((category) => ({
      value: category,
      label: formatCategoryTitle(category),
    })),
  ];
  const catalogSortOptions = sortOptions.map((option) => ({
    value: option.value,
    label: `Trier: ${option.label}`,
  }));

  if (loadingProducts) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xl font-semibold text-slate-700">
        <p>Chargement des produits...</p>
      </div>
    );
  }

  if (errorProducts) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center text-lg font-semibold text-red-600">
        <p>Erreur lors du chargement des produits: {errorProducts}</p>
        <p className="mt-4">Veuillez rafraichir la page ou verifier votre connexion.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-0 pt-6 md:px-6 lg:px-8">
        <section className="px-2 pb-2 md:px-0">
          <div className="px-3 py-4 md:px-0 md:py-0">
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-sm text-slate-500">
                  Accueil / Catalogue
                  {categoryParam !== 'All' ? ` / ${formatCategoryTitle(categoryParam)}` : ''}
                  {brandParam ? ` / ${brandParam}` : ''}
                </p>
                <h1 className="mt-4 text-[2.2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[3.25rem]">
                  {brandParam || (categoryParam !== 'All' ? formatCategoryTitle(categoryParam) : 'Catalogue')}
                </h1>
              </div>

              <div className="flex flex-col gap-4 rounded-[1.75rem] bg-white/75 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)] md:flex-row md:items-center">
                <input
                  type="text"
                  placeholder="Rechercher un produit"
                  value={searchTerm}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-300)] md:flex-1"
                  aria-label="Rechercher des produits"
                />

                <SellerSelect
                  value={categoryParam}
                  onChange={(value) =>
                    router.push(
                      buildQueryString(new URLSearchParams(searchParams.toString()), {
                        category: value,
                        brand: null,
                      })
                    )
                  }
                  options={categoryOptions}
                  className="w-full md:w-[260px]"
                />
              </div>
            </div>
          </div>
        </section>

        {categoryParam === 'All' ? (
          groupedProducts.length === 0 ? (
            <section className="px-2 pb-12 pt-10 md:px-0">
              <div className="rounded-[1.75rem] bg-white/70 px-6 py-10 text-center text-slate-600 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
                Aucun produit ne correspond a votre recherche ou a vos filtres.
              </div>
            </section>
          ) : (
            groupedProducts.map((group) => (
              <ProductCarouselSection
                key={group.category}
                title={group.title}
                actionLabel="Voir plus"
                products={group.products}
                onAction={() =>
                  router.push(
                    buildQueryString(new URLSearchParams(searchParams.toString()), {
                      category: group.category,
                      brand: null,
                    })
                  )
                }
              />
            ))
          )
        ) : (
          <>
            {brandGroups.length > 0 ? (
              <section className="px-2 pb-2 pt-8 md:px-0">
                <div className="catalog-scroll pb-4">
                  <div className="grid min-w-full auto-cols-[220px] grid-flow-col gap-5">
                    {brandGroups.map((group) => {
                      const cover = group.items[0];
                      const imageSrc = cover.imgUrl?.[0] || '/images/default_product_image.png';
                      const isActive = brandParam === group.brand || (!brandParam && group === brandGroups[0]);

                      return (
                        <button
                          key={group.brand}
                          type="button"
                          onClick={() =>
                            router.push(
                              buildQueryString(new URLSearchParams(searchParams.toString()), {
                                category: categoryParam,
                                brand: group.brand,
                              })
                            )
                          }
                          className={`overflow-hidden rounded-[1.9rem] border bg-white text-left shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition ${
                            isActive
                              ? 'border-[var(--brand-300)] ring-2 ring-[rgba(96,165,250,0.18)]'
                              : 'border-transparent'
                          }`}
                        >
                          <div className="relative h-[210px] bg-slate-100">
                            <Image src={imageSrc} alt={group.brand} fill className="object-contain p-5" />
                          </div>
                          <div className="px-4 pb-4 pt-3">
                            <p className="text-lg font-semibold text-slate-950">{group.brand}</p>
                            <p className="mt-1 text-sm text-slate-500">{group.items.length} produits</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 h-[4px] w-full overflow-hidden rounded-full bg-slate-200/60">
                  <div className="h-full w-24 rounded-full bg-[var(--brand-500)]" />
                </div>
              </section>
            ) : null}

            <section className="px-2 pb-12 pt-10 md:px-0">
              <div className="px-3 py-4 md:px-0 md:py-0">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <h2 className="text-[2.1rem] font-semibold tracking-[-0.04em] text-slate-950">
                      {brandParam || formatCategoryTitle(categoryParam)}
                    </h2>

                    <SellerSelect
                      value={sortBy}
                      onChange={setSortBy}
                      options={catalogSortOptions}
                      className="w-full md:w-[220px]"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsFiltersOpen((current) => !current)}
                      className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm transition ${
                        isFiltersOpen || showOnlyAvailable || showOnlyOffers
                          ? 'border-[var(--brand-300)] bg-[rgba(191,219,254,0.18)] text-[var(--brand-700)]'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtres
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
                        viewMode === 'list'
                          ? 'border-[var(--brand-300)] bg-[rgba(191,219,254,0.18)] text-[var(--brand-700)]'
                          : 'border-slate-200 bg-white text-slate-400'
                      }`}
                    >
                      <LayoutList className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                        viewMode === 'grid'
                          ? 'bg-[var(--brand-600)] text-white'
                          : 'border border-slate-200 bg-white text-slate-400'
                      }`}
                    >
                      <Grid2x2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {isFiltersOpen ? (
                  <div className="mt-5 grid gap-4 rounded-[1.6rem] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] md:grid-cols-3">
                    <label className="flex items-start gap-3 rounded-[1.2rem] border border-slate-100 bg-slate-50 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={showOnlyAvailable}
                        onChange={(event) => setShowOnlyAvailable(event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--brand-600)] focus:ring-[var(--brand-300)]"
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-900">Disponibles</span>
                        <span className="mt-1 block text-xs leading-6 text-slate-500">
                          Afficher uniquement les produits encore en stock.
                        </span>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-[1.2rem] border border-slate-100 bg-slate-50 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={showOnlyOffers}
                        onChange={(event) => setShowOnlyOffers(event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--brand-600)] focus:ring-[var(--brand-300)]"
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-900">Promotions</span>
                        <span className="mt-1 block text-xs leading-6 text-slate-500">
                          N&apos;afficher que les produits avec un prix promo actif.
                        </span>
                      </span>
                    </label>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setShowOnlyAvailable(false);
                          setShowOnlyOffers(false);
                        }}
                        className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        Reinitialiser
                      </button>
                    </div>
                  </div>
                ) : null}

                {paginatedProducts.length === 0 ? (
                  <div className="mt-8 rounded-[1.75rem] bg-white/70 px-6 py-10 text-center text-slate-600 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
                    Aucun produit ne correspond a cette selection.
                  </div>
                ) : (
                  <>
                    <div
                      className={`mt-8 ${
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'
                          : 'flex flex-col gap-5'
                      }`}
                    >
                      {paginatedProducts.map((product) => {
                        const displayPrice = getDisplayPrice(product);
                        const imageSrc = product.imgUrl?.[0] || '/images/default_product_image.png';
                        const discountPercent =
                          product.offerPrice && product.offerPrice < product.price
                            ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
                            : null;

                        return (
                          <article
                            key={product.id}
                            className={`overflow-hidden rounded-[1.75rem] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)] ${
                              viewMode === 'list' ? 'md:grid md:grid-cols-[280px_1fr]' : ''
                            }`}
                          >
                            <div className="relative rounded-[1.75rem] bg-slate-100 p-5">
                              <button
                                type="button"
                                onClick={() => toggleWishlist(product.id)}
                                className={`absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/88 shadow-sm transition ${
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

                            <div className={`px-5 pb-4 pt-3 ${viewMode === 'list' ? 'md:flex md:flex-col md:justify-center md:px-7' : ''}`}>
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

                              <h3 className="min-h-[54px] text-[1.05rem] font-semibold leading-6 text-slate-900">
                                {product.name}
                              </h3>

                              <div className="mt-1 text-sm text-emerald-600">Disponible</div>

                              <div className="mt-2 flex items-end gap-2">
                                <p className="text-[1.15rem] font-semibold text-slate-950">
                                  {formatPrice(displayPrice)}
                                </p>
                                {product.offerPrice && product.offerPrice < product.price ? (
                                  <p className="text-sm text-slate-400 line-through">
                                    {formatPrice(product.price)}
                                  </p>
                                ) : null}
                              </div>

                              <button
                                type="button"
                                onClick={async () => {
                                  const success = await addToCart(product.id);
                                  if (success) {
                                    toast.success('Ajoute au panier');
                                  }
                                }}
                                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-950)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-900)]"
                              >
                                Ajouter au panier
                              </button>

                              <button
                                type="button"
                                onClick={() => router.push(`/product/${product.id}`)}
                                className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-[var(--brand-300)] bg-white px-6 py-3.5 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[rgba(191,219,254,0.16)]"
                              >
                                Voir le produit
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {totalPages > 1 ? (
                      <div className="mt-8 flex items-center justify-center gap-3 text-sm text-slate-500">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          className="px-2 py-1"
                        >
                          &lt;
                        </button>
                        {Array.from({ length: totalPages }).map((_, index) => {
                          const pageNumber = index + 1;
                          const isActive = pageNumber === currentPage;

                          return (
                            <button
                              key={pageNumber}
                              type="button"
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`min-w-[32px] border-b-2 px-2 py-1 ${
                                isActive
                                  ? 'border-[var(--brand-500)] text-[var(--brand-700)]'
                                  : 'border-transparent'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                          className="px-2 py-1"
                        >
                          &gt;
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <HomeFooter />
    </div>
  );
}
