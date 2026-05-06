'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SellerEmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: React.ReactNode;
}

export default function SellerEmptyState({
  title,
  description,
  icon: Icon,
  action,
}: SellerEmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[rgba(148,163,184,0.28)] bg-white px-6 py-14 text-center">
      <div className="rounded-full bg-[rgba(191,219,254,0.26)] p-4 text-[var(--brand-700)]">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-[1.35rem] font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 max-w-[56ch] text-sm leading-7 text-slate-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
