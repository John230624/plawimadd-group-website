'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Wrench, ShieldCheck, RefreshCw, Mail } from 'lucide-react';

export default function MaintenancePage(): React.ReactElement {
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

  const gearVariants: Variants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 12,
        repeat: Infinity,
        ease: 'linear' as const,
      },
    },
  };

  const pulseVariants: Variants = {
    animate: {
      scale: [1, 1.15, 1],
      opacity: [0.5, 0.9, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  const handleRefresh = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0c0c0e] via-[#0b1612] to-[#08080a] text-white p-6 relative overflow-hidden font-sans">
      
      {/* Éléments de fond lumineux émeraude/turquoise */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Grille de fond */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl w-full text-center z-10 flex flex-col items-center"
      >
        {/* Logo/Icône engrenages/maintenance animés */}
        <motion.div
          variants={itemVariants}
          className="relative w-32 h-32 flex items-center justify-center mb-8"
        >
          {/* Engrenage principal */}
          <motion.div
            variants={gearVariants}
            animate="animate"
            className="absolute text-emerald-500 opacity-80"
          >
            <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </motion.div>

          {/* Petit engrenage secondaire */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute top-4 right-4 text-teal-400 opacity-60"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </motion.div>

          {/* Outil central */}
          <div className="absolute z-10 p-3 bg-[#0c0c0e] rounded-2xl border border-white/10 text-emerald-400">
            <Wrench className="w-8 h-8" />
          </div>
        </motion.div>

        {/* Titre */}
        <motion.h1
          variants={itemVariants}
          id="maintenance-title"
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-zinc-100"
        >
          Maintenance en cours
        </motion.h1>

        {/* Paragraphe d'explication */}
        <motion.p
          variants={itemVariants}
          className="text-zinc-400 text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed"
        >
          Nous améliorons Plawimadd Group pour vous offrir une expérience encore plus rapide et agréable. Nos équipes travaillent pour un retour à la normale très rapide.
        </motion.p>

        {/* Indicateur de statut en boîte vitrée */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-md p-4 mb-8 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-zinc-300">Intégrité des données sécurisée</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              variants={pulseVariants}
              animate="animate"
              className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            />
            <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">En cours</span>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_4px_20px_rgba(16,185,129,0.2)] transition-all cursor-pointer w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 animate-spin-reverse" />
            Vérifier la disponibilité
          </motion.button>
        </motion.div>

        {/* Support mail */}
        <motion.div
          variants={itemVariants}
          className="mt-12 text-sm text-zinc-500 flex items-center gap-2"
        >
          <Mail className="w-4 h-4 text-emerald-400" />
          <span>Une urgence ? <a href="mailto:support@plawimadd.com" className="underline hover:text-emerald-400 transition-colors">support@plawimadd.com</a></span>
        </motion.div>
      </motion.div>
    </div>
  );
}
