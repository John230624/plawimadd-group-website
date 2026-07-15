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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-[1.35rem] font-semibold text-[#222] md:text-[1.55rem]">
        {title}
      </h2>

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8d8d8] bg-white px-5 py-2.5 text-sm font-semibold text-[#333] transition hover:border-[#ff6a00] hover:text-[#ff6a00]"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
