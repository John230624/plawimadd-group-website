'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { Home, ShoppingCart, ArrowLeft, HelpCircle } from 'lucide-react';

export default function NotFound(): React.ReactElement {
  // Config des animations Framer Motion
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
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

  const floatVariants: Variants = {
    animate: {
      y: [0, -12, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0c0c0e] via-[#121217] to-[#08080a] text-white p-6 relative overflow-hidden font-sans">
      
      {/* Éléments de fond lumineux */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Grille de fond subtile */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl w-full text-center z-10 flex flex-col items-center"
      >
        {/* Code d'erreur 404 flottant */}
        <motion.div 
          variants={floatVariants}
          animate="animate"
          className="relative mb-6 cursor-default select-none"
        >
          <span className="text-[12rem] sm:text-[15rem] font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-emerald-400 opacity-90 filter drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            404
          </span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none z-[-1]" />
        </motion.div>

        {/* Contenu textuel */}
        <motion.h1 
          variants={itemVariants}
          id="not-found-title"
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-zinc-100"
        >
          Oups ! Page introuvable
        </motion.h1>

        <motion.p 
          variants={itemVariants}
          className="text-zinc-400 text-base sm:text-lg mb-10 max-w-md mx-auto leading-relaxed"
        >
          La page que vous recherchez semble avoir été déplacée, supprimée ou n&apos;a jamais existé. Laissez-nous vous ramener sur le bon chemin.
        </motion.p>

        {/* Boutons d'action dans une boîte vitrée dépolie */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md shadow-2xl"
        >
          <Link href="/" id="btn-back-home">
            <motion.div
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-white font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_4px_20px_rgba(124,58,237,0.25)] transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Retour à l&apos;accueil
            </motion.div>
          </Link>

          <Link href="/all-products" id="btn-browse-products">
            <motion.div
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-zinc-300 hover:text-white font-medium border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              Voir la boutique
            </motion.div>
          </Link>
        </motion.div>

        {/* Footer d'aide discret */}
        <motion.div 
          variants={itemVariants}
          className="mt-12 text-sm text-zinc-500 flex items-center gap-2 hover:text-zinc-400 transition-colors cursor-default"
        >
          <HelpCircle className="w-4 h-4 text-purple-400" />
          <span>Besoin d&apos;aide ? <Link href="/contact" className="underline hover:text-purple-400 transition-colors">Contactez le support</Link></span>
        </motion.div>
      </motion.div>
    </div>
  );
}
