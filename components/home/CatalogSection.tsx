'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

import { catalogItems } from './data';
import SectionHeader from './SectionHeader';

interface CatalogSectionProps {
  onBrowseCatalog: () => void;
}

const loopingCatalogItems = [...catalogItems, ...catalogItems];

export default function CatalogSection({
  onBrowseCatalog,
}: CatalogSectionProps): React.ReactElement {
  const catalogScrollRef = useRef<HTMLDivElement>(null);
  const [catalogScrollProgress, setCatalogScrollProgress] = useState(0);

  useEffect(() => {
    const element = catalogScrollRef.current;
    if (!element) return;

    const updateProgress = () => {
      const loopWidth = element.scrollWidth / 2;
      const currentScroll = loopWidth > 0 ? element.scrollLeft % loopWidth : 0;
      const progress = loopWidth > 0 ? (currentScroll / loopWidth) * 100 : 0;
      setCatalogScrollProgress(progress);
    };

    updateProgress();
    element.addEventListener('scroll', updateProgress);

    const interval = window.setInterval(() => {
      const loopWidth = element.scrollWidth / 2;
      if (loopWidth <= 0) return;

      const firstCard = element.querySelector<HTMLElement>('[data-catalog-card="true"]');
      const gap = 16;
      const step = firstCard ? firstCard.offsetWidth + gap : Math.min(320, Math.max(220, Math.round(element.clientWidth * 0.32)));
      const nextScroll = element.scrollLeft + step;

      if (nextScroll >= loopWidth) {
        element.scrollTo({ left: nextScroll - loopWidth, behavior: 'auto' });
        return;
      }

      element.scrollTo({ left: nextScroll, behavior: 'smooth' });
    }, 3200);

    return () => {
      element.removeEventListener('scroll', updateProgress);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      className="px-2 pb-2 pt-12 md:px-0 md:pt-14"
    >
      <div className="px-3 py-4 md:px-0 md:py-0">
        <SectionHeader
          title="Catalogue"
          actionLabel="Aller au catalogue"
          onAction={onBrowseCatalog}
        />

        <div ref={catalogScrollRef} className="catalog-scroll mt-8 pb-4">
          <div className="grid min-w-full auto-cols-[78vw] grid-flow-col gap-4 md:auto-cols-[calc((100%-16px)/2)] xl:auto-cols-[calc((100%-64px)/5)]">
            {loopingCatalogItems.map((item, index) => (
              <button
                key={`${item.title}-${index}`}
                type="button"
                onClick={onBrowseCatalog}
                data-catalog-card="true"
                className="group relative min-w-0 overflow-hidden rounded-[1.75rem] text-left"
              >
                <div className="relative min-h-[250px] overflow-hidden rounded-[1.75rem] md:min-h-[280px]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06)_0%,rgba(15,23,42,0.28)_100%)]" />
                  <div
                    className="absolute bottom-4 right-4 max-w-[190px] overflow-hidden rounded-[1rem] px-4 py-2 text-center text-sm font-medium leading-5 text-white whitespace-nowrap backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(143, 139, 136, 0.52)' }}
                  >
                    {item.title}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-5 h-[4px] w-full overflow-hidden rounded-full bg-slate-200/60">
          <div
            className="absolute top-0 h-full rounded-full bg-[var(--brand-500)] transition-all duration-500"
            style={{ width: '22%', left: `${catalogScrollProgress * 0.78}%` }}
          />
        </div>
      </div>
    </motion.section>
  );
}
