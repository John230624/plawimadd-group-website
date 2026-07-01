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
    <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[var(--border)] bg-[var(--bg-outer)]/50 px-6 py-14 text-center">
      <div className="rounded-full bg-[var(--accent-blue)]/10 p-4 text-[var(--accent-blue)]">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-[1.35rem] font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-3 max-w-[56ch] text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
