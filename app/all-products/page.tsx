'use client';

import React, { ChangeEvent, Suspense, useEffect, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
import { Grid2x2, LayoutList, SlidersHorizontal, Check, ChevronDown, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import HomeFooter from '@/components/home/HomeFooter';
import ProductCarouselSection from '@/components/home/ProductCarouselSection';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/product/FilterSidebar';
import { useAppContext } from '@/context/AppContext';
import type { Product } from '@/lib/types';

interface CatalogSelectOption {
  value: string;
  label: string;
}

interface CatalogSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CatalogSelectOption[];
  className?: string;
  align?: 'left' | 'right';
}

function CatalogSelect({
  value,
  onChange,
  options,
  className = '',
  align = 'left',
}: CatalogSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeOption = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-[4px] border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 outline-none transition duration-300 hover:bg-slate-50 focus:border-slate-800"
      >
        <span className="truncate">{activeOption?.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-slate-750' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-40 mt-1.5 min-w-full overflow-hidden rounded-[4px] border border-slate-200 bg-white p-1 shadow-[0_4px_20px_rgba(0,0,0,0.08)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-[4px] px-3.5 py-2.5 text-left text-xs font-bold transition duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-655 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{option.label}</span>
                {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FilterPopoverProps {
  label: string;
  active?: boolean;
  children: React.ReactNode;
  onReset?: () => void;
}

function FilterPopover({ label, active = false, children, onReset }: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-11 items-center gap-1.5 rounded-[4px] border px-4.5 text-xs font-bold transition duration-200 focus:outline-none ${
          active
            ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
            : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
        }`}
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-250 ${
            isOpen ? 'rotate-180 text-slate-700' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 z-40 w-64 overflow-hidden rounded-[4px] border border-slate-200 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <div className="space-y-4">
            {children}
          </div>
          {onReset && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
                className="text-[9px] font-extrabold uppercase tracking-wider text-slate-450 hover:text-slate-750"
              >
                Réinitialiser
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

function getProductColorIds(product: Product): string[] {
  if (!product.color) return [];
  try { const p = JSON.parse(product.color); return Array.isArray(p) ? p : []; } catch { return []; }
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

export default function AllProductsPageWrapper(): React.ReactElement {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#ff6a00]" /></div>}>
      <AllProductsPage />
    </Suspense>
  );
}

function AllProductsPage(): React.ReactElement {
  const {
    products,
    loadingProducts,
    errorProducts,
    searchTerm,
    setSearchTerm,
  } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get('category') || 'All';
  const brandParam = searchParams.get('brand');
  const [sortBy, setSortBy] = useState('popular');
  const [visibleCount, setVisibleCount] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyOffers, setShowOnlyOffers] = useState(false);
  const [allColors, setAllColors] = useState<{ id: string; name: string; hex: string }[]>([]);
  const [selectedColorFilter, setSelectedColorFilter] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [moqMax, setMoqMax] = useState('');
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    setVisibleCount(12);
  }, [categoryParam, brandParam, searchTerm, sortBy]);

  useEffect(() => {
    fetch('/api/colors')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAllColors(data); })
      .catch(() => {});
  }, []);

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
      const matchesColor = selectedColorFilter.size === 0 ||
        getProductColorIds(product).some((id) => selectedColorFilter.has(id));
      const matchesPriceMin = !priceRange.min || getDisplayPrice(product) >= parseFloat(priceRange.min);
      const matchesPriceMax = !priceRange.max || getDisplayPrice(product) <= parseFloat(priceRange.max);
      const matchesCert = selectedCertifications.length === 0 ||
        (product.certifications && selectedCertifications.some(c => (product.certifications as string[]).includes(c)));
      const matchesRating = minRating === 0 || (product.rating ?? 0) >= minRating;
      const matchesMoq = !moqMax || (product.moqMin ?? 1) <= parseInt(moqMax, 10);

      return matchesAvailability && matchesOffer && matchesColor && matchesPriceMin && matchesPriceMax && matchesCert && matchesRating && matchesMoq;
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
  }, [brandParam, categoryProducts, showOnlyAvailable, showOnlyOffers, sortBy, selectedColorFilter, priceRange, moqMax, selectedCertifications, minRating]);

  const paginatedProducts = selectedBrandProducts.slice(0, visibleCount);
  const hasMore = visibleCount < selectedBrandProducts.length;
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
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] text-xl font-semibold text-[#333]">
        <p>Chargement des produits...</p>
      </div>
    );
  }

  if (errorProducts) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f5] p-4 text-center text-lg font-semibold text-red-600">
        <p>Erreur lors du chargement des produits: {errorProducts}</p>
        <p className="mt-4">Veuillez rafraichir la page ou verifier votre connexion.</p>
      </div>
    );
  }

  const hasActiveFilters =
    showOnlyAvailable ||
    showOnlyOffers ||
    selectedColorFilter.size > 0 ||
    priceRange.min !== '' ||
    priceRange.max !== '' ||
    moqMax !== '' ||
    selectedCertifications.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-0 pt-4 md:px-6 lg:px-8">        <section className="pb-4 pt-2">
          <div className="rounded-[4px] bg-white border border-slate-200 p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">
                  Accueil / Catalogue
                  {categoryParam !== 'All' ? ` / ${formatCategoryTitle(categoryParam)}` : ''}
                  {brandParam ? ` / ${brandParam}` : ''}
                </p>
                <h1 className="mt-1 text-xl sm:text-2xl font-extrabold leading-snug text-slate-900">
                  {brandParam || (categoryParam !== 'All' ? formatCategoryTitle(categoryParam) : 'Catalogue')}
                </h1>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="flex h-11 w-full items-center gap-3 rounded-[4px] border border-slate-200 bg-white px-4 text-xs text-slate-500 transition duration-200 focus-within:border-slate-800 lg:flex-1">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
                    className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 font-semibold text-xs"
                    aria-label="Rechercher des produits"
                  />
                </label>

                <CatalogSelect
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
                  className="w-full lg:w-[220px]"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <CatalogSelect
                    value={sortBy}
                    onChange={setSortBy}
                    options={catalogSortOptions}
                    className="w-full lg:w-[150px]"
                  />
                  <FilterPopover
                    label="Prix"
                    active={priceRange.min !== '' || priceRange.max !== ''}
                    onReset={() => setPriceRange({ min: '', max: '' })}
                  >
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tranche de prix</h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:border-slate-800 focus:bg-white"
                        />
                        <span className="text-slate-400 text-xs">-</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:border-slate-800 focus:bg-white"
                        />
                      </div>
                    </div>
                  </FilterPopover>

                  <FilterPopover
                    label="Disponibilité"
                    active={showOnlyAvailable || showOnlyOffers}
                    onReset={() => {
                      setShowOnlyAvailable(false);
                      setShowOnlyOffers(false);
                    }}
                  >
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOnlyAvailable}
                          onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                          className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4 border-slate-350"
                        />
                        <span>En stock uniquement</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOnlyOffers}
                          onChange={(e) => setShowOnlyOffers(e.target.checked)}
                          className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4 border-slate-350"
                        />
                        <span>En promotion</span>
                      </label>
                    </div>
                  </FilterPopover>

                  <FilterPopover
                    label="Couleurs"
                    active={selectedColorFilter.size > 0}
                    onReset={() => setSelectedColorFilter(new Set())}
                  >
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Couleurs</h4>
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                        {allColors.map((color) => {
                          const isSelected = selectedColorFilter.has(color.name);
                          return (
                            <button
                              key={color.id}
                              type="button"
                              onClick={() => {
                                const newSet = new Set(selectedColorFilter);
                                if (newSet.has(color.name)) {
                                  newSet.delete(color.name);
                                } else {
                                  newSet.add(color.name);
                                }
                                setSelectedColorFilter(newSet);
                              }}
                              className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold text-center truncate transition ${
                                isSelected
                                  ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
                                  : 'border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100'
                              }`}
                            >
                              {color.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </FilterPopover>



                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowOnlyAvailable(false);
                        setShowOnlyOffers(false);
                        setSelectedColorFilter(new Set());
                        setPriceRange({ min: '', max: '' });
                        setMoqMax('');
                        setSelectedCertifications([]);
                        setMinRating(0);
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-650 transition px-2 py-1.5"
                    >
                      Effacer
                    </button>
                  )}

                  {/* View mode toggle */}
                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 ml-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`flex h-9 w-9 items-center justify-center rounded-[4px] border transition focus:outline-none ${
                        viewMode === 'list'
                          ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                      aria-label="Vue Liste"
                    >
                      <LayoutList className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`flex h-9 w-9 items-center justify-center rounded-[4px] border transition focus:outline-none ${
                        viewMode === 'grid'
                          ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                      aria-label="Vue Grille"
                    >
                      <Grid2x2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {categoryParam === 'All' ? (
          groupedProducts.length === 0 ? (
            <section className="pb-12 pt-4">
              <div className="rounded-[20px] bg-white px-6 py-10 text-center text-[#666] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
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
              <section className="pb-2 pt-2">
                <div className="catalog-scroll pb-4">
                  <div className="grid min-w-full auto-cols-[180px] grid-flow-col gap-2">
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
                          className={`overflow-hidden rounded-lg border bg-white p-3 text-left shadow-none transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] ${
                            isActive
                              ? 'border-[#ff6a00] ring-2 ring-[#ff6a00]/10'
                              : 'border-transparent'
                          }`}
                        >
                          <div className="relative aspect-square rounded-md bg-[#f7f7f7]">
                            <Image src={imageSrc} alt={group.brand} fill sizes="180px" className="object-contain p-3" />
                          </div>
                          <div className="pt-3">
                            <p className="truncate text-sm font-semibold text-[#222]">{group.brand}</p>
                            <p className="mt-1 text-xs text-[#777]">{group.items.length} produits</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#e8e8e8]">
                  <div className="h-full w-24 rounded-full bg-[#ff6a00]" />
                </div>
              </section>
            ) : null}            <section className="pb-12 pt-3">
              <div className="w-full">
                {paginatedProducts.length === 0 ? (
                  <div className="mt-3 rounded-[4px] bg-white border border-slate-200 px-6 py-10 text-center text-slate-500 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                    Aucun produit ne correspond à cette sélection.
                  </div>
                ) : (
                  <>
                    <div
                      className={`mt-3 ${
                        viewMode === 'grid'
                          ? 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                          : 'grid grid-cols-1 gap-2'
                      }`}
                    >
                      {paginatedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    {hasMore ? (
                      <div className="mt-10 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setVisibleCount((prev) => prev + 12)}
                          className="inline-flex items-center gap-2 rounded-[4px] border border-slate-200 bg-white px-8 py-3.5 text-xs font-bold text-slate-700 transition hover:border-slate-850 hover:bg-slate-50"
                        >
                          Voir plus de produits
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
