'use client';

import React from 'react';

interface SellerFilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export default function SellerFilterBar({
  children,
  className = '',
}: SellerFilterBarProps): React.ReactElement {
  return (
    <div
      className={`rounded-[10px] border border-[var(--border)] bg-[var(--bg-outer)] p-4 md:p-5 ${className}`}
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">{children}</div>
    </div>
  );
}
