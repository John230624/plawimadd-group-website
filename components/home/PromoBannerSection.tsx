'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

import type { PromoBannerContent } from './data';

interface PromoBannerSectionProps {
  content: PromoBannerContent;
  onAction: () => void;
}

export default function PromoBannerSection({
  content,
  onAction,
}: PromoBannerSectionProps): React.ReactElement {
  return (
    <section className="px-2 pb-2 pt-12 md:px-0 md:pt-14">
      <div className="relative overflow-hidden rounded-[2.1rem]">
        <Image
          src={content.image}
          alt={content.title}
          width={1600}
          height={720}
          className="h-[320px] w-full object-cover md:h-[360px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,32,0.72)_0%,rgba(8,15,32,0.38)_42%,rgba(8,15,32,0.08)_100%)]" />

        <div className="absolute inset-0 flex items-center px-8 py-8 md:px-12">
          <div className="max-w-[520px] text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-200)]">
              {content.eyebrow}
            </p>
            <h3 className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">
              {content.title}
            </h3>
            <p className="mt-4 max-w-[44ch] text-sm leading-7 text-slate-200 md:text-base">
              {content.description}
            </p>

            <button
              type="button"
              onClick={onAction}
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              {content.buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
