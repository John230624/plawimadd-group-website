'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface CatalogSectionProps {
  onBrowseCatalog: (category?: string) => void;
}

const catalogCategories = [
  {
    id: 'smartphones',
    title: 'Smartphones',
    image: '/images/catalog/catalog-smartphone.jpg',
    categoryName: 'Smartphones',
  },
  {
    id: 'ordinateurs',
    title: 'Ordinateurs',
    image: '/images/catalog/catalog-laptop.jpg',
    categoryName: 'Ordinateurs',
  },
  {
    id: 'televiseurs',
    title: 'Téléviseurs',
    image: '/images/catalog/catalog-tv.jpg',
    categoryName: 'Televiseurs',
  },
  {
    id: 'casques',
    title: 'Casques audio',
    image: '/images/catalog/catalog-headphones.jpg',
    categoryName: 'Audio',
  },
  {
    id: 'machines-cafe',
    title: 'Machines à café',
    image: '/images/catalog/catalog-coffee-machine.jpg',
    categoryName: 'Electromenager',
  },
  {
    id: 'montres',
    title: 'Montres connectées',
    image: '/images/catalog/catalog-smartwatch.jpg',
    categoryName: 'Montres connectees',
  },
];

export default function CatalogSection({
  onBrowseCatalog,
}: CatalogSectionProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    const container = scrollRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 5);
      setCanScrollRight(
        container.scrollLeft + container.clientWidth < container.scrollWidth - 5
      );
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      updateScrollButtons();
      container.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', updateScrollButtons);
      }
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, []);

  const handleScrollLeft = () => {
    const container = scrollRef.current;
    if (container) {
      const cardWidth = container.firstElementChild
        ? (container.firstElementChild as HTMLElement).offsetWidth
        : 280;
      const gap = 24; // gap-6
      container.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    const container = scrollRef.current;
    if (container) {
      const cardWidth = container.firstElementChild
        ? (container.firstElementChild as HTMLElement).offsetWidth
        : 280;
      const gap = 24; // gap-6
      container.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      className="px-2 pb-6 pt-12 md:px-0 md:pt-14 relative"
    >
      <div className="px-3 py-4 md:px-0 md:py-0">
        {/* Custom Section Header with Navigation Arrows */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 className="text-[1.35rem] font-semibold text-[#222] md:text-[1.55rem]">
            Catalogue
          </h2>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onBrowseCatalog()}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8d8d8] bg-white px-5 py-2.5 text-sm font-semibold text-[#333] transition hover:border-[#ff6a00] hover:text-[#ff6a00]"
            >
              Aller au catalogue
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Slider Navigation Arrows */}
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={handleScrollLeft}
                disabled={!canScrollLeft}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm focus:outline-none"
                aria-label="Catégories précédentes"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleScrollRight}
                disabled={!canScrollRight}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm focus:outline-none"
                aria-label="Catégories suivantes"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container showing exactly 4 items on desktop */}
        <div
          ref={scrollRef}
          className="catalog-scroll flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4 w-full scroll-smooth"
        >
          {catalogCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onBrowseCatalog(item.categoryName)}
              className="group relative flex flex-col items-center bg-[#efefef] hover:bg-[#f7f7f7] shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-none rounded-[1.25rem] p-6 text-center transition-all duration-300 snap-align-start w-[82vw] sm:w-[calc((100%-24px)/2)] md:w-[calc((100%-48px)/3)] lg:w-[calc((100%-72px)/4)] shrink-0 focus:outline-none"
            >
              {/* Category Title - Closer to the image */}
              <div className="pt-2 pb-2">
                <h3 className="font-extrabold text-slate-900 text-[1.1rem] md:text-[1.2rem] tracking-tight">
                  {item.title}
                </h3>
              </div>

              {/* Product Image - Centered and Sharp (no rounded corners) */}
              <div className="relative w-[90%] aspect-[4/3] max-h-[170px] md:max-h-[190px] mt-1 mb-2 flex items-center justify-center overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 200px, 280px"
                  className="object-cover scale-105 group-hover:scale-100 transition-transform duration-500 ease-out"
                  priority
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
