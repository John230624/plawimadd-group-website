'use client';

import React, { useState } from 'react';

import type { NewsletterContent } from './data';

interface NewsletterSectionProps {
  content: NewsletterContent;
}

export default function NewsletterSection({
  content,
}: NewsletterSectionProps): React.ReactElement {
  const [email, setEmail] = useState('');

  return (
    <section className="px-2 pb-2 pt-12 md:px-0 md:pt-14">
      <div className="grid overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="px-7 py-8 md:px-10 md:py-10">
          <h3 className="max-w-[14ch] text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-slate-950 md:text-[2.5rem]">
            {content.title}
          </h3>
          <p className="mt-4 max-w-[46ch] text-sm leading-7 text-slate-600 md:text-base">
            {content.description}
          </p>

          <div className="mt-8 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Entrez votre email"
              className="w-full rounded-full border border-slate-200 px-5 py-4 text-sm text-slate-800 outline-none transition focus:border-[var(--brand-300)]"
            />

            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-950)] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-900)]"
            >
              Laisser ma demande
            </button>

            <label className="flex items-center gap-3 text-sm text-slate-500">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
              J&apos;accepte le traitement de mes donnees.
            </label>
          </div>
        </div>

        <div
          className="min-h-[280px] bg-cover bg-center"
          style={{ backgroundImage: `url(${content.image})` }}
        />
      </div>
    </section>
  );
}
