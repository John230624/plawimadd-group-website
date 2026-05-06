'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SellerStatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: 'blue' | 'emerald' | 'amber' | 'slate';
}

const toneMap = {
  blue: 'bg-[rgba(59,130,246,0.10)] text-[var(--brand-700)]',
  emerald: 'bg-[rgba(16,185,129,0.10)] text-emerald-600',
  amber: 'bg-[rgba(245,158,11,0.12)] text-amber-600',
  slate: 'bg-slate-100 text-slate-700',
};

export default function SellerStatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = 'blue',
}: SellerStatCardProps): React.ReactElement {
  return (
    <div className="rounded-[1.6rem] border border-[rgba(148,163,184,0.18)] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-slate-950">
            {value}
          </p>
        </div>
        <div className={`rounded-2xl p-3 ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-500">{description}</p>
    </div>
  );
}
