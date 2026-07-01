'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SellerStatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}

const toneMap = {
  blue: 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]',
  emerald: 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]',
  amber: 'bg-amber-500/10 text-amber-400',
  rose: 'bg-[var(--accent-red)]/10 text-[var(--accent-red)]',
  slate: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
};

export default function SellerStatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = 'blue',
}: SellerStatCardProps): React.ReactElement {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-outer)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
          <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
            {value}
          </p>
        </div>
        <div className={`rounded-[10px] p-3 ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}
