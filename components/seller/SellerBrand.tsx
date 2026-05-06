'use client';

import React from 'react';
import Link from 'next/link';

interface SellerBrandProps {
  compact?: boolean;
}

export default function SellerBrand({
  compact = false,
}: SellerBrandProps): React.ReactElement {
  return (
    <Link
      href="/seller"
      className={`inline-flex items-baseline whitespace-nowrap font-['Playwrite_PL',cursive] leading-none tracking-[-0.025em] text-slate-950 ${
        compact ? 'text-[0.96rem]' : 'text-[1.08rem]'
      }`}
    >
      <span className="text-slate-600">Plawimadd</span>
      <span className="ml-1 text-[var(--brand-800)]">Group</span>
    </Link>
  );
}
