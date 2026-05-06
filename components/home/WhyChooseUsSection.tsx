'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { whyChooseUsItems } from './data';
import SectionHeader from './SectionHeader';

export default function WhyChooseUsSection(): React.ReactElement {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      className="px-2 pb-2 pt-10 md:px-0 md:pt-12"
    >
      <div className="px-3 py-4 md:px-0 md:py-0">
        <SectionHeader title="Pourquoi nous choisir ?" />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {whyChooseUsItems.map(({ title, icon: Icon }) => (
            <div
              key={title}
              className="flex min-h-[190px] flex-col items-center justify-between rounded-[1.5rem] bg-[rgba(255,255,255,0.52)] px-5 py-5 text-center shadow-[0_6px_16px_rgba(148,163,184,0.035)]"
            >
              <div className="flex flex-1 items-center justify-center">
                <div className="text-[var(--brand-500)]">
                  <Icon className="h-[5rem] w-[5rem] stroke-[1.3]" />
                </div>
              </div>
              <p className="max-w-[16ch] text-[0.95rem] leading-6 text-slate-800">{title}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
