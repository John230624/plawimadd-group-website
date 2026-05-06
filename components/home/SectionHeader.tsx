'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-slate-950 md:text-[2.15rem]">
        {title}
      </h2>

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--brand-300)] bg-white/60 px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-[var(--brand-400)] hover:bg-[rgba(191,219,254,0.22)] hover:text-[var(--brand-700)]"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
