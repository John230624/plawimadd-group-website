'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowRight, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface HomeHeroProps {
  onBrowseCatalog: (category?: string) => void;
  onContact: () => void;
}

export interface HeroSlideItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  video?: string | null;
  category: string;
  bgColor: string;
  accentColor: string;
  layout: string;
  order?: number;
}

const HERO_CACHE_KEY = 'plawimadd_hero_slides_cache';

const defaultSlides: HeroSlideItem[] = [
  {
    id: '1',
    title: 'Téléviseurs intelligents',
    tagline: 'IMMERSION TOTALE',
    description: 'Expérimentez des détails ultra-précis, des couleurs éclatantes et une luminosité extraordinaire pour votre salon.',
    image: '/images/header_tv_image.png',
    category: 'Televiseurs',
    bgColor: '#e2e7f3',
    accentColor: '#3b82f6',
    layout: 'left',
  },
  {
    id: '2',
    title: 'Ordinateurs de pointe',
    tagline: 'PRODUCTIVITÉ MAXIMALE',
    description: 'Des performances exceptionnelles pour vos études, votre travail et vos projets créatifs avec une autonomie record.',
    image: '/images/header_ordi_hp_probook_image.png',
    category: 'Ordinateurs',
    bgColor: '#e8edf5',
    accentColor: '#10b981',
    layout: 'right',
  },
  {
    id: '3',
    title: 'Galaxy S23 Series',
    tagline: 'GALAXY AI ✦',
    description: "Entrez dans une nouvelle ère technologique. L'intelligence artificielle repensée pour simplifier chacun de vos gestes.",
    image: '/images/samsung_s23phone_image.png',
    category: 'Smartphones',
    bgColor: '#ebdffd',
    accentColor: '#8b5cf6',
    layout: 'center',
  },
  {
    id: '4',
    title: 'Écouteurs Premium',
    tagline: 'STYLE & PERFORMANCE',
    description: "Profitez d'un son immersif haute fidélité et d'une réduction de bruit active tout au long de la journée.",
    image: '/images/apple_earphone_image.png',
    category: 'Audio',
    bgColor: '#f7ebd9',
    accentColor: '#f97316',
    layout: 'right',
  },
];

export default function HomeHero({
  onBrowseCatalog,
  onContact,
}: HomeHeroProps): React.ReactElement {
  const [slides, setSlides] = useState<HeroSlideItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(HERO_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Ignore localStorage read errors
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => slides.length === 0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(1);

  // Charger les slides depuis l'API de manière dynamique
  useEffect(() => {
    let active = true;
    fetch('/api/hero-slides', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && Array.isArray(data.slides) && data.slides.length > 0) {
          setSlides(data.slides);
          try {
            localStorage.setItem(HERO_CACHE_KEY, JSON.stringify(data.slides));
          } catch {
            // Ignore localStorage write errors
          }
        }
      })
      .catch((err) => console.error('Erreur chargement slides:', err))
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const displaySlides = slides.length > 0 ? slides : defaultSlides;
  const activeIndex = displaySlides.length > 0 ? currentSlide % displaySlides.length : 0;

  // Rotation automatique toutes les 6 secondes avec pause au survol
  useEffect(() => {
    if (isHovered || displaySlides.length <= 1) return;

    const timer = setTimeout(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentSlide, isHovered, displaySlides.length]);

  const handleNext = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);
  };

  const handleDotClick = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setCurrentSlide(index);
  };

  if (isLoading && slides.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-none shadow-none min-h-[500px] md:min-h-[550px] bg-slate-100/70 animate-pulse flex items-center justify-center">
        <div className="w-full max-w-xl p-8 space-y-4 text-center">
          <div className="h-4 w-36 bg-slate-200 rounded-full mx-auto" />
          <div className="h-9 w-3/4 bg-slate-200 rounded-lg mx-auto" />
          <div className="h-4 w-5/6 bg-slate-200 rounded mx-auto" />
          <div className="h-10 w-32 bg-slate-300 rounded-full mx-auto mt-6" />
        </div>
      </div>
    );
  }

  const slide = displaySlides[activeIndex] || defaultSlides[0];

  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 },
      },
    }),
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95, x: 20 },
    visible: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.6, delay: 0.2 } },
  };

  return (
    <motion.section
        animate={{ backgroundColor: slide.bgColor }}
        transition={{ duration: 0.6 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative overflow-hidden rounded-none shadow-none min-h-[500px] md:min-h-[550px]"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/[0.01] via-transparent to-white/15 pointer-events-none" />

        <div className="relative w-full h-full flex flex-col md:flex-row min-h-[500px] md:min-h-[550px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
            >
              {slide.layout === 'center' ? (
                <div className="flex flex-col items-center justify-between w-full h-full text-center px-6 pt-10 pb-6 md:px-16 select-none z-10">
                  <div className="flex flex-col items-center justify-center max-w-[650px] mt-4">
                    <motion.div
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-900/8 bg-zinc-900/5 px-3 py-1 text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-zinc-650 backdrop-blur w-fit"
                    >
                      <MapPin className="h-3 w-3" />
                      Plawimadd Group - Abomey-Calavi, Benin
                    </motion.div>

                    <motion.span
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      className="text-xs font-medium tracking-[0.18em] text-zinc-700 uppercase block mb-2"
                    >
                      {slide.tagline}
                    </motion.span>

                    <motion.h1
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-zinc-900 leading-[1.15] max-w-[20ch]"
                    >
                      {slide.title}
                    </motion.h1>

                    <motion.p
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      className="mt-4 text-xs sm:text-sm md:text-base font-light text-zinc-600 max-w-[50ch] leading-relaxed mx-auto"
                    >
                      {slide.description}
                    </motion.p>

                    <motion.div
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      className="mt-6 flex items-center justify-center gap-6"
                    >
                      <button
                        type="button"
                        onClick={() => onBrowseCatalog(slide.category)}
                        className="rounded-full bg-zinc-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-zinc-800 transition duration-300 shadow-sm border border-transparent"
                      >
                        Acheter
                      </button>

                      <button
                        type="button"
                        onClick={onContact}
                        className="group/link relative py-1 text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-1 hover:text-zinc-700 transition duration-200"
                      >
                        En savoir plus
                        <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-1 transition-transform" />
                        <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-zinc-900 transform scale-x-0 origin-left transition-transform duration-300 group-hover/link:scale-x-100" />
                      </button>
                    </motion.div>
                  </div>

                  <div className="relative w-full h-[180px] sm:h-[220px] md:h-[240px] flex items-center justify-center pb-4">
                    <motion.div
                      variants={imageVariants}
                      initial="hidden"
                      animate="visible"
                      className="relative w-full h-full max-w-[260px] sm:max-w-[320px] md:max-w-[450px]"
                    >
                      {slide.video ? (
                        <video
                          src={slide.video}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="h-full w-full rounded-xl object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.03)]"
                        />
                      ) : (
                        <Image
                          src={slide.image}
                          alt={slide.title}
                          fill
                          priority
                          className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.03)]"
                          sizes="(max-width: 768px) 100vw, 40vw"
                        />
                      )}
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 items-center h-full w-full">
                  <div
                    className={`col-span-1 md:col-span-7 flex flex-col justify-center h-full px-6 pt-12 pb-6 md:py-12 select-none z-10 ${
                      slide.layout === 'right'
                        ? 'md:pl-8 md:pr-16 order-1 md:order-2'
                        : 'md:pl-16 md:pr-4 order-1 md:order-1'
                    }`}
                  >
                    <motion.div
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-900/8 bg-zinc-900/5 px-3 py-1 text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-zinc-600 backdrop-blur w-fit"
                    >
                      <MapPin className="h-3 w-3" />
                      Plawimadd Group - Abomey-Calavi, Benin
                    </motion.div>

                    <motion.span
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      className="text-xs font-medium tracking-[0.18em] text-zinc-700 uppercase block mb-2"
                    >
                      {slide.tagline}
                    </motion.span>

                    <motion.h1
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-zinc-900 leading-[1.15] max-w-[18ch]"
                    >
                      {slide.title}
                    </motion.h1>

                    <motion.p
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      className="mt-4 text-xs sm:text-sm md:text-base font-light text-zinc-600 max-w-[45ch] leading-relaxed"
                    >
                      {slide.description}
                    </motion.p>

                    <motion.div
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      className="mt-8 flex items-center gap-6"
                    >
                      <button
                        type="button"
                        onClick={() => onBrowseCatalog(slide.category)}
                        className="rounded-full bg-zinc-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-zinc-800 transition duration-300 shadow-sm border border-transparent"
                      >
                        Acheter
                      </button>

                      <button
                        type="button"
                        onClick={onContact}
                        className="group/link relative py-1 text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-1 hover:text-zinc-700 transition duration-200"
                      >
                        En savoir plus
                        <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-1 transition-transform" />
                        <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-zinc-900 transform scale-x-0 origin-left transition-transform duration-300 group-hover/link:scale-x-100" />
                      </button>
                    </motion.div>
                  </div>

                  <div
                    className={`col-span-1 md:col-span-5 relative flex items-center justify-center h-[240px] sm:h-[280px] md:h-full w-full px-6 pb-8 md:py-6 select-none ${
                      slide.layout === 'right'
                        ? 'md:pl-16 md:pr-8 order-2 md:order-1'
                        : 'md:pl-8 md:pr-16 order-2 md:order-2'
                    }`}
                  >
                    <motion.div
                      variants={imageVariants}
                      initial="hidden"
                      animate="visible"
                      className="relative w-full h-full max-w-[300px] md:max-w-none flex items-center justify-center"
                    >
                      <div className="relative w-full h-full aspect-video md:aspect-square lg:aspect-video">
                        {slide.video ? (
                          <video
                            src={slide.video}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="h-full w-full rounded-2xl object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.04)]"
                          />
                        ) : (
                          <Image
                            src={slide.image}
                            alt={slide.title}
                            fill
                            priority
                            className="object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.04)] md:scale-105 lg:scale-110 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, 40vw"
                          />
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/40 hover:bg-white/70 text-zinc-900 flex items-center justify-center backdrop-blur-sm transition duration-200 cursor-pointer shadow-sm opacity-0 group-hover:opacity-100"
          aria-label="Diapositive précédente"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/40 hover:bg-white/70 text-zinc-900 flex items-center justify-center backdrop-blur-sm transition duration-200 cursor-pointer shadow-sm opacity-0 group-hover:opacity-100"
          aria-label="Diapositive suivante"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className="h-1.5 rounded-full bg-zinc-950/15 overflow-hidden transition-all duration-300 relative cursor-pointer"
              style={{ width: currentSlide === index ? '48px' : '8px' }}
              aria-label={`Aller à la diapositive ${index + 1}`}
            >
              {currentSlide === index && (
                <motion.div
                  key={index}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 6, ease: 'linear' }}
                  className="h-full bg-zinc-900"
                />
              )}
            </button>
          ))}
        </div>
      </motion.section>
  );
}
