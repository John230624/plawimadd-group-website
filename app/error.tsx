'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps): React.ReactElement {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log de l'erreur dans la console pour débugger
    console.error('Next.js Error Boundary caught:', error);
  }, [error]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0c0c0e] via-[#1a0f12] to-[#08080a] text-white p-6 relative overflow-hidden font-sans">
      
      {/* Éléments de fond lumineux rouge/indigo */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grille de fond */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl w-full text-center z-10 flex flex-col items-center"
      >
        {/* Icône d'alerte animée */}
        <motion.div
          variants={itemVariants}
          className="relative mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-400 shadow-[0_0_50px_rgba(239,68,68,0.1)]"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <AlertCircle className="w-16 h-16" />
          </motion.div>
          <div className="absolute -inset-1 rounded-full border border-red-500/20 animate-pulse pointer-events-none" />
        </motion.div>

        {/* Titre */}
        <motion.h1
          variants={itemVariants}
          id="error-title"
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-zinc-100"
        >
          Une erreur est survenue
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-zinc-400 text-base sm:text-lg mb-10 max-w-md mx-auto leading-relaxed"
        >
          Une erreur technique inattendue s&apos;est produite. Nous nous excusons pour le désagrément. Veuillez réessayer ou retourner à l&apos;accueil.
        </motion.p>

        {/* Actions */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md shadow-2xl mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={reset}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-white font-medium bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-[0_4px_20px_rgba(239,68,68,0.2)] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer l&apos;action
          </motion.button>

          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-zinc-300 hover:text-white font-medium border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Retour à l&apos;accueil
            </motion.div>
          </Link>
        </motion.div>

        {/* Accordéon pour les détails de l'erreur (pour le débug) */}
        {error && (
          <motion.div
            variants={itemVariants}
            className="w-full max-w-md border border-white/5 bg-white/[0.01] rounded-xl overflow-hidden shadow-lg transition-all"
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full py-3 px-4 flex items-center justify-between text-sm text-zinc-400 hover:text-zinc-300 hover:bg-white/[0.02] transition-colors"
            >
              <span className="font-semibold">Détails techniques pour le support</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-t border-white/5 bg-black/30 p-4 text-left font-mono text-xs text-red-300 max-h-40 overflow-y-auto"
                >
                  <p className="font-semibold text-zinc-400 mb-1">Message :</p>
                  <p className="mb-3 whitespace-pre-wrap">{error.message || 'Aucun message fourni'}</p>
                  {error.digest && (
                    <>
                      <p className="font-semibold text-zinc-400 mb-1">Digest :</p>
                      <p className="whitespace-pre">{error.digest}</p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
