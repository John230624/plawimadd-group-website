'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

interface EntertainmentSlide {
  id: string;
  category: string;
  description: string;
  image: string;
  actionText: string;
  link: string;
}

const slides: EntertainmentSlide[] = [
  {
    id: 'f1',
    category: 'F1 on Apple TV',
    description: 'Every Grand Prix™, live and on demand—all in one place, all year long.',
    image: '/images/entertainment/f1_grand_prix.jpg',
    actionText: 'Stream now',
    link: '/all-products?category=Televiseurs',
  },
  {
    id: 'mystery',
    category: 'Mystery',
    description: '19 Emmy® Nominations Including Best Comedy',
    image: '/images/entertainment/mystery_neon.jpg',
    actionText: 'Stream now',
    link: '/all-products',
  },
  {
    id: 'drama',
    category: 'Drama',
    description: '18 Emmy® Nominations Including Best Drama',
    image: '/images/entertainment/drama_cinema.jpg',
    actionText: 'Stream now',
    link: '/all-products',
  },
  {
    id: 'scifi',
    category: 'Sci-Fi',
    description: 'New season.',
    image: '/images/entertainment/scifi_space.jpg',
    actionText: 'Stream now',
    link: '/all-products?category=Televiseurs',
  },
  {
    id: 'mls',
    category: 'MLS on Apple TV',
    description: 'Watch every club, every match, live—all season long.',
    image: '/images/entertainment/mls_football.jpg',
    actionText: 'Stream now',
    link: '/all-products?category=Televiseurs',
  },
  {
    id: 'comedy-new',
    category: 'Comedy',
    description: 'New season.',
    image: '/images/entertainment/comedy_show.jpg',
    actionText: 'Stream now',
    link: '/all-products',
  },
  {
    id: 'mlb',
    category: 'MLB on Apple TV',
    description: 'Live MLB games, every Friday.',
    image: '/images/entertainment/baseball_mlb.jpg',
    actionText: 'See the schedule',
    link: '/all-products?category=Televiseurs',
  },
  {
    id: 'comedy-emmy',
    category: 'Comedy',
    description: '9 Emmy® Nominations Including Best Comedy',
    image: '/images/entertainment/mystery_neon.jpg',
    actionText: 'Stream now',
    link: '/all-products',
  },
];

export default function EntertainmentSection(): React.ReactElement {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [cardWidth, setCardWidth] = useState(980);
  const [gap, setGap] = useState(24);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Gérer la taille réactive des cartes pour le centrage exact
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width < 768) {
        setCardWidth(width * 0.88);
        setGap(16);
      } else if (width < 1024) {
        setCardWidth(width * 0.78);
        setGap(20);
      } else {
        setCardWidth(980);
        setGap(24);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gérer le défilement automatique (auto-play)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setActiveIdx((prev) => (prev + 1) % slides.length);
      }, 5000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying]);

  // Fonctions de contrôle
  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % slides.length);
  };

  const handleDotClick = (idx: number) => {
    setActiveIdx(idx);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Mathématique de décalage pour centrer la diapositive active
  const offsetX = windowWidth / 2 - cardWidth / 2 - activeIdx * (cardWidth + gap);

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#000000] py-14 text-white select-none">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 mb-8 flex items-baseline justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white/90 md:text-2xl lg:text-3xl">
            Plawimadd Entertainment
          </h2>
          <p className="text-xs text-white/50 mt-1 md:text-sm">
            Une expérience immersive unique sur tous vos écrans.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/75 transition hover:bg-white/20 hover:text-white"
            aria-label="Diapositive précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/75 transition hover:bg-white/20 hover:text-white"
            aria-label="Diapositive suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Track du Carrousel avec framer-motion */}
      <div className="relative overflow-visible px-4">
        <motion.div
          className="flex items-center"
          animate={{ x: offsetX }}
          transition={{ type: 'spring', stiffness: 150, damping: 20 }}
          style={{ gap: `${gap}px`, width: `${slides.length * cardWidth + (slides.length - 1) * gap}px` }}
        >
          {slides.map((slide, idx) => {
            const isActive = idx === activeIdx;

            return (
              <motion.div
                key={slide.id}
                onClick={() => {
                  if (!isActive) setActiveIdx(idx);
                }}
                className={`relative overflow-hidden rounded-[1.5rem] cursor-pointer shadow-[0_24px_50px_rgba(0,0,0,0.5)] ${
                  isActive ? 'pointer-events-auto' : 'pointer-events-auto filter brightness-50 contrast-75'
                }`}
                style={{
                  width: `${cardWidth}px`,
                  minWidth: `${cardWidth}px`,
                  height: 'auto',
                  aspectRatio: windowWidth < 768 ? '16/11' : '16/9',
                }}
                animate={{
                  scale: isActive ? 1.0 : 0.95,
                  opacity: isActive ? 1 : 0.45,
                }}
                transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-out hover:scale-105"
                  style={{ backgroundImage: `url(${slide.image})` }}
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Card Content Overlay - Fades in ONLY on the active card */}
                <motion.div
                  className="absolute inset-x-0 bottom-0 p-6 md:p-10 lg:p-12 flex flex-col justify-end bg-gradient-to-t from-black via-black/75 to-transparent"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{
                    opacity: isActive ? 1 : 0,
                    y: isActive ? 0 : 15,
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}
                  transition={{ duration: 0.4, delay: isActive ? 0.25 : 0 }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 w-full">
                    {/* Stream Button */}
                    <div className="flex-shrink-0">
                      <Link
                        href={slide.link}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold text-black transition hover:bg-white/95 hover:scale-105 active:scale-95 md:px-7 md:py-3.5 md:text-sm whitespace-nowrap shadow-lg"
                        onClick={(e) => {
                          if (!isActive) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <Play className="h-4 w-4 fill-black" />
                        {slide.actionText}
                      </Link>
                    </div>

                    {/* Text Details in Row */}
                    <div className="flex flex-wrap items-baseline gap-1 md:gap-2 text-left">
                      <span className="text-xs md:text-sm lg:text-base font-bold text-white tracking-wide">
                        {slide.category}
                      </span>
                      <span className="hidden md:inline text-white/50 font-bold">•</span>
                      <span className="text-xs md:text-sm lg:text-base text-white/90 font-medium leading-relaxed">
                        {slide.description}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Commandes inférieures (Indicateurs points et bouton Pause/Lecture) */}
      <div className="mt-10 flex items-center justify-center gap-6">
        {/* Points Indicateurs */}
        <div className="flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeIdx ? 'w-6 bg-white' : 'w-2 bg-white/35 hover:bg-white/50'
              }`}
              aria-label={`Aller à la diapositive ${idx + 1}`}
            />
          ))}
        </div>

        {/* Bouton Play/Pause */}
        <button
          onClick={togglePlay}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
        </button>
      </div>
    </section>
  );
}
