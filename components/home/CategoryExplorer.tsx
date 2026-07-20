'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft,
  ChevronRight, 
  Box, 
  ArrowRight,
  Sparkles,
  X,
  Flame,
  TrendingUp,
  ArrowRightCircle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { Product, Category } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';

interface CategoryExplorerProps {
  products: Product[];
  loadingProducts: boolean;
  activeCategoryId: string;
  setActiveCategoryId: (id: string) => void;
}

interface CustomOffer {
  id: string;
  title: string;
  description: string;
  badgeText: string;
  image: string;
  buttonText: string;
  buttonUrl: string;
  isActive: boolean;
  isStudent: boolean;
}

export function getCategoryIcon(iconNameOrCatName: string | null): any {
  if (!iconNameOrCatName) return LucideIcons.Folder;
  
  const IconComponent = (LucideIcons as Record<string, any>)[iconNameOrCatName];
  if (IconComponent) return IconComponent;
  
  const norm = iconNameOrCatName.toLowerCase();
  if (norm.includes('ordinateur') || norm.includes('laptop') || norm.includes('pc')) return LucideIcons.Laptop;
  if (norm.includes('phone') || norm.includes('smart')) return LucideIcons.Smartphone;
  if (norm.includes('tablet')) return LucideIcons.Tablet;
  if (norm.includes('tv') || norm.includes('télé') || norm.includes('televis')) return LucideIcons.Tv;
  if (norm.includes('casque') || norm.includes('écouteur') || norm.includes('audio')) return LucideIcons.Headphones;
  if (norm.includes('haut-parleur') || norm.includes('volume') || norm.includes('son')) return LucideIcons.Volume2;
  if (norm.includes('photo') || norm.includes('camera')) return LucideIcons.Camera;
  if (norm.includes('caf') || norm.includes('machi') || norm.includes('électro')) return LucideIcons.Layers;
  if (norm.includes('câble') || norm.includes('charge')) return LucideIcons.Zap;
  if (norm.includes('clavier') || norm.includes('keyboard')) return LucideIcons.Keyboard;
  if (norm.includes('usb') || norm.includes('stock') || norm.includes('drive') || norm.includes('disque')) return LucideIcons.HardDrive;
  if (norm.includes('drone')) return LucideIcons.Plane;
  if (norm.includes('gadget') || norm.includes('accessoire') || norm.includes('cadeau')) return LucideIcons.Gift;
  if (norm.includes('imprim')) return LucideIcons.Printer;
  if (norm.includes('montre') || norm.includes('watch')) return LucideIcons.Watch;
  if (norm.includes('vélo') || norm.includes('transport') || norm.includes('véhicule')) return LucideIcons.Car;
  
  return LucideIcons.Folder;
}

export default function CategoryExplorer({ 
  products, 
  loadingProducts,
  activeCategoryId,
  setActiveCategoryId
}: CategoryExplorerProps): React.ReactNode {
  const { formatPrice } = useAppContext();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [offers, setOffers] = useState<CustomOffer[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        const rootCats = data.filter((c: any) => !c.parentId);
        setCategories(rootCats);
        setLoadingCategories(false);
      })
      .catch((err) => {
        console.error('Error fetching categories for explorer:', err);
        setLoadingCategories(false);
      });
  }, []);

  // Fetch real custom offers (offre étudiante, etc.) for the offers slider
  useEffect(() => {
    fetch('/api/custom-offer')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const list: CustomOffer[] = (data?.offers || []).filter((o: CustomOffer) => o.isActive);
        setOffers(list);
      })
      .catch((err) => {
        console.error('Error fetching custom offers for explorer:', err);
      });
  }, []);

  // Sort best selling / highly searched products (up to 14 products)
  const carouselProducts = [...products]
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 14);

  // Rotate offers automatically (only while the default view is shown)
  useEffect(() => {
    if (activeCategoryId || offers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % offers.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeCategoryId, offers.length]);

  // Keep the active index valid if the offers list changes
  useEffect(() => {
    if (currentBannerIndex >= offers.length) setCurrentBannerIndex(0);
  }, [offers.length, currentBannerIndex]);

  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const activeCategoryProducts = products.filter((p) => p.category.id === activeCategoryId);
  const mobileActiveCategory = categories.find((c) => c.id === activeCategoryId);
  const mobileCategoryProducts = products.filter((p) => p.category.id === activeCategoryId);

  const handleCategoryClick = (catId: string, categoryName: string) => {
    if (activeCategoryId === catId) {
      setActiveCategoryId(''); // Toggle off
    } else {
      setActiveCategoryId(catId);
    }
  };

  const handleCategoryNavigate = (categoryName: string) => {
    router.push(`/all-products?category=${encodeURIComponent(categoryName)}`);
  };

  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const handlePillClick = (catId: string) => {
    if (activeCategoryId === catId) {
      setActiveCategoryId(''); // Toggle off
    } else {
      setActiveCategoryId(catId);
    }
  };

  // Scroll function for horizontal products carousel
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (loadingCategories) {
    return (
      <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-[380px] animate-pulse gap-6">
          <div className="w-[240px] space-y-4 border-r border-slate-100 pr-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-slate-100 w-full" />
            ))}
          </div>
          <div className="flex-1 grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-2">
                <div className="h-16 w-16 rounded-full bg-slate-100" />
                <div className="mt-2 h-3 w-16 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* ----------------- DESKTOP LAYOUT (Borderless Panels) ----------------- */}
      <div className="hidden md:flex gap-4 w-full h-[320px] items-stretch select-none">
        
        {/* Left Panel Sidebar Card */}
        <div className="show-scrollbar w-[260px] border border-slate-200 bg-[#f8f8f8] rounded-lg flex flex-col py-4 overflow-y-auto shadow-sm shrink-0">
          <div className="px-4 mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-[#2563eb]" />
            Catégories pour vous
          </div>
          <div className="flex-1 space-y-0.5 px-2">
            {/* Custom static "Ventes à la Une" tab as default */}
            <div
              onClick={() => setActiveCategoryId('')}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                activeCategoryId === '' 
                  ? 'bg-blue-50 text-[#2563eb] border border-blue-100/50' 
                  : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Flame className={`h-4.5 w-4.5 shrink-0 ${activeCategoryId === '' ? 'text-[#2563eb]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="truncate">Ventes à la Une</span>
              </div>
              <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${
                activeCategoryId === '' ? 'text-[#2563eb] translate-x-0.5' : 'text-slate-300 group-hover:text-slate-400'
              }`} />
            </div>

            {/* DB categories */}
            {categories.map((cat) => {
              const isActive = cat.id === activeCategoryId;
              const Icon = getCategoryIcon(cat.imageUrl || cat.name);
              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id, cat.name)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-[#2563eb] border border-blue-100/50' 
                      : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#2563eb]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${
                    isActive ? 'text-[#2563eb] translate-x-0.5' : 'text-slate-300 group-hover:text-slate-400'
                  }`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel Main Area Container */}
        <div className="flex-1 flex gap-4 min-w-0 items-stretch">

          {/* ================= PRODUCTS CAROUSEL (relative : accueille l'overlay catégorie) ================= */}
          {/* 1. Products Horizontal Carousel (up to 14 products, transparent container) */}
          <div className="flex-1 relative group/carousel flex items-stretch min-w-0">
            {/* Left Scroll Button */}
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-slate-800 rounded-full h-9 w-9 shadow-md flex items-center justify-center border border-slate-200/60 z-10 transition opacity-0 group-hover/carousel:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Carousel Scroll Area */}
            <div
              ref={scrollRef}
              className="flex-1 flex gap-4 overflow-x-auto no-scrollbar scroll-smooth items-stretch py-0.5"
            >
              {carouselProducts.map((product, index) => {
                const img = product.imgUrl?.[0] || '/images/default_product_image.png';
                const cardTitle = index === 0 ? 'Historique de recherche' : 'Explorez des';
                const cardSubtitle = product.category.name || 'Sélections';
                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="flex-shrink-0 w-[200px] bg-[#f8f8f8] rounded-xl p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md border border-slate-100 transition-all duration-300 group select-none h-full"
                  >
                    <div className="flex flex-col flex-1 justify-between">
                      {/* Top Titles */}
                      <div className="mb-2">
                        <div className="text-[13px] font-extrabold text-slate-900 leading-tight">
                          {cardTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                          {cardSubtitle}
                        </div>
                      </div>

                      {/* Image and Price Overlay */}
                      <div className="relative w-full flex-1 min-h-[160px] bg-white rounded-xl flex items-center justify-center p-3 overflow-hidden group-hover:bg-slate-50 transition-colors duration-300">
                        <Image
                          src={img}
                          alt={product.name}
                          fill
                          sizes="180px"
                          className="object-contain p-1.5 transition-transform duration-500 group-hover:scale-105"
                        />
                        
                        {/* Price Badge Bubble */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-slate-900 font-extrabold text-[12px] px-3.5 py-1 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-slate-100/60 whitespace-nowrap z-10 transition-transform duration-300 group-hover:scale-105">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-slate-800 rounded-full h-9 w-9 shadow-md flex items-center justify-center border border-slate-200/60 z-10 transition opacity-0 group-hover/carousel:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

          {/* ================= PANEL OVERLAY (couvre UNIQUEMENT le carousel, garde le bloc offres visible) ================= */}
          {activeCategoryId !== '' && (
            <div className="absolute inset-0 bg-white border border-slate-200 rounded-lg p-6 shadow-md flex flex-col overflow-hidden z-20 animate-fade-in-up">
              {activeCategory && (
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {activeCategory.name}
                      <span className="text-xs font-normal text-slate-500">
                        ({activeCategoryProducts.length} produit{activeCategoryProducts.length > 1 ? 's' : ''})
                      </span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCategoryNavigate(activeCategory.name)}
                      className="text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] inline-flex items-center gap-1 transition"
                    >
                      Parcourir les sélections en vedette
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    {/* Close button X to return to default view */}
                    <button
                      onClick={() => setActiveCategoryId('')}
                      className="h-7 w-7 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition border border-slate-150"
                      title="Fermer et retourner aux Ventes"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Grid of circular products */}
              <div className="flex-1 overflow-y-auto pr-1">
                {activeCategoryProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    <Box className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">Aucun produit dans cette catégorie pour le moment.</p>
                    <p className="text-xs text-slate-400 mt-1">Revenez bientôt ou parcourez le catalogue général.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-x-4 gap-y-6">
                    {activeCategoryProducts.slice(0, 8).map((product) => {
                      const img = product.imgUrl?.[0] || '/images/default_product_image.png';
                      return (
                        <div
                          key={product.id}
                          onClick={() => handleProductClick(product.id)}
                          className="group flex flex-col items-center cursor-pointer select-none text-center"
                        >
                          <div className="relative w-18 h-18 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-2.5 overflow-hidden transition shadow-sm group-hover:shadow group-hover:border-[#2563eb]/30 group-hover:scale-105">
                            <Image
                              src={img}
                              alt={product.name}
                              fill
                              sizes="72px"
                              className="object-contain p-1 transition duration-500"
                            />
                          </div>
                          <span className="mt-2 text-xs font-semibold text-slate-800 line-clamp-1 max-w-[120px] transition-colors group-hover:text-[#2563eb]">
                            {product.name}
                          </span>
                          <span className="text-[11px] font-extrabold text-black mt-0.5">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
          {/* fin du carousel (l'overlay ci-dessus ne couvre que cette zone) */}

          {/* 2. Bandeau des offres personnalisées (offre étudiante, etc.) — toujours visible */}
          <div className="w-[300px] rounded-lg overflow-hidden border border-slate-200 shadow-sm relative group select-none shrink-0 h-full bg-slate-900">
            {offers.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <p className="text-xs font-medium text-white/70">Nos offres arrivent bientôt.</p>
              </div>
            ) : (
              offers.map((offer, index) => {
                const isActive = index === currentBannerIndex;
                return (
                  <div
                    key={offer.id}
                    className={`absolute inset-0 flex flex-col justify-between transition-all duration-700 ease-in-out ${
                      isActive ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-95 pointer-events-none'
                    }`}
                  >
                    {/* Image de fond de l'offre + voile sombre pour lisibilité */}
                    <Image
                      src={offer.image || '/images/background_etudiant2.jpg'}
                      alt={offer.title}
                      fill
                      sizes="300px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />

                    <div className="relative p-6">
                      <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest bg-white/20 text-white px-2.5 py-1 rounded-full mb-3 backdrop-blur-sm">
                        {offer.badgeText}
                      </span>
                      <h3 className="text-xl font-extrabold leading-tight tracking-tight max-w-[220px] text-white">
                        {offer.title}
                      </h3>
                      <p className="mt-2 text-xs text-white/85 font-medium leading-relaxed max-w-[220px] line-clamp-3">
                        {offer.description}
                      </p>
                    </div>
                    <div className="relative p-6 flex items-center justify-between">
                      <button
                        onClick={() => router.push(offer.buttonUrl || '/offer')}
                        className="bg-white text-slate-900 text-xs font-bold px-4 py-2 rounded-md hover:bg-slate-50 transition shadow-sm inline-flex items-center gap-1"
                      >
                        {offer.buttonText}
                        <ArrowRightCircle className="h-4 w-4 text-[#2563eb]" />
                      </button>

                      {offers.length > 1 && (
                        <div className="flex gap-1">
                          {offers.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              onClick={() => setCurrentBannerIndex(dotIdx)}
                              aria-label={`Offre ${dotIdx + 1}`}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                dotIdx === currentBannerIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* ----------------- MOBILE LAYOUT (Horizontal Scroll Categories) ----------------- */}
      <div className="md:hidden w-full">
        {/* Horizontal Category Pills Carousel */}
        <div className="flex overflow-x-auto gap-3 py-3 px-1 no-scrollbar shrink-0">
          {/* Custom static "Ventes" pill */}
          <button
            onClick={() => setActiveCategoryId('')}
            className="flex flex-col items-center gap-1.5 shrink-0 focus:outline-none"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition border ${
              activeCategoryId === '' 
                ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-sm' 
                : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <Flame className="h-5 w-5" />
            </div>
            <span className={`text-[10px] font-bold max-w-[70px] truncate text-center ${
              activeCategoryId === '' ? 'text-[#2563eb]' : 'text-slate-600'
            }`}>
              Ventes
            </span>
          </button>

          {/* Database categories */}
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            const Icon = getCategoryIcon(cat.imageUrl || cat.name);
            return (
              <button
                key={cat.id}
                onClick={() => handlePillClick(cat.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 focus:outline-none"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition border ${
                  isActive 
                    ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-bold max-w-[70px] truncate text-center ${
                  isActive ? 'text-[#2563eb]' : 'text-slate-600'
                }`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic products list for mobile filtered by active tab */}
        {mobileCategoryProducts.length > 0 && (
          <div className="mt-2 flex items-center justify-between border-b border-slate-200 pb-2 px-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {mobileActiveCategory?.name}
            </span>
            <button
              onClick={() => mobileActiveCategory && handleCategoryNavigate(mobileActiveCategory.name)}
              className="text-[10px] font-bold text-[#2563eb] flex items-center gap-0.5"
            >
              Voir tout
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
