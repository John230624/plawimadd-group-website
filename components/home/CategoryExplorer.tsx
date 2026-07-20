'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  Folder, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Tv, 
  Headphones, 
  Volume2, 
  Camera, 
  Layers, 
  Box, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import type { Product, Category } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';

interface CategoryExplorerProps {
  products: Product[];
  loadingProducts: boolean;
  activeCategoryId: string;
  setActiveCategoryId: (id: string) => void;
}

const categoryIcons: Record<string, any> = {
  'Ordinateurs': Laptop,
  'Smartphones': Smartphone,
  'Tablettes': Tablet,
  'Télévisions': Tv,
  'Casques & Écouteurs': Headphones,
  'Haut-parleurs': Volume2,
  'Appareils photo': Camera,
  'Électroménager': Layers,
};

function getCategoryIcon(name: string) {
  return categoryIcons[name] || Folder;
}

export default function CategoryExplorer({ 
  products, 
  loadingProducts,
  activeCategoryId,
  setActiveCategoryId
}: CategoryExplorerProps): React.ReactNode {
  const { formatPrice } = useAppContext();
  const router = useRouter();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string>('');
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

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
        if (rootCats.length > 0) {
          setHoveredCategoryId(rootCats[0].id);
        }
        setLoadingCategories(false);
      })
      .catch((err) => {
        console.error('Error fetching categories for explorer:', err);
        setLoadingCategories(false);
      });
  }, []);

  const activeCategory = categories.find((c) => c.id === hoveredCategoryId);
  const activeCategoryProducts = products.filter((p) => p.category.id === hoveredCategoryId);
  const mobileActiveCategory = categories.find((c) => c.id === activeCategoryId);
  const mobileCategoryProducts = products.filter((p) => p.category.id === activeCategoryId);

  const handleCategoryClick = (categoryName: string) => {
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
      {/* ----------------- DESKTOP LAYOUT (Double Panel) ----------------- */}
      <div className="hidden md:flex w-full rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden h-[380px]">
        {/* Left Panel: Category Sidebar */}
        <div className="w-[260px] border-r border-slate-100 bg-[#fbfbfb] flex flex-col py-4 overflow-y-auto shrink-0 select-none">
          <div className="px-4 mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-[#2563eb]" />
            Catégories pour vous
          </div>
          <div className="flex-1 space-y-0.5 px-2">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              const isActive = cat.id === hoveredCategoryId;
              return (
                <div
                  key={cat.id}
                  onMouseEnter={() => setHoveredCategoryId(cat.id)}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-white text-[#2563eb] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100' 
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

        {/* Right Panel: Products preview */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden bg-white">
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
              <button
                onClick={() => handleCategoryClick(activeCategory.name)}
                className="text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] inline-flex items-center gap-1 transition"
              >
                Parcourir les sélections en vedette
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Dynamic grid of circular items */}
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
                      {/* Round image container like Alibaba */}
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
      </div>

      {/* ----------------- MOBILE LAYOUT (Horizontal Scroll Categories) ----------------- */}
      <div className="md:hidden w-full">
        {/* Horizontal Category Pills Carousel */}
        <div className="flex overflow-x-auto gap-3 py-3 px-1 no-scrollbar shrink-0">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            const isActive = cat.id === activeCategoryId;
            return (
              <button
                key={cat.id}
                onClick={() => handlePillClick(cat.id)}
                className={`flex flex-col items-center gap-1.5 shrink-0 focus:outline-none`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition border ${
                  isActive 
                    ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-500'
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
              onClick={() => mobileActiveCategory && handleCategoryClick(mobileActiveCategory.name)}
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
