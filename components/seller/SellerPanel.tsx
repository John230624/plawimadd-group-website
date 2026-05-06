'use client';

import React from 'react';

interface SellerPanelProps {
  children: React.ReactNode;
  className?: string;
}

export default function SellerPanel({
  children,
  className = '',
}: SellerPanelProps): React.ReactElement {
  return (
    <section
      className={`rounded-[1.75rem] border border-[rgba(148,163,184,0.18)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}
