'use client';

import React from 'react';

interface SellerSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function SellerSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: SellerSectionHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--accent-blue)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-[2.9rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-[68ch] text-sm leading-7 text-[var(--text-secondary)] md:text-[0.97rem]">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
