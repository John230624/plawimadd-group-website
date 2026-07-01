'use client';

import React from 'react';

interface SellerPanelProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export default function SellerPanel({
  children,
  className = '',
  interactive = false,
}: SellerPanelProps): React.ReactElement {
  const baseClasses = `rounded-[10px] bg-[var(--bg-card)] transition-all duration-300`;
  const interactiveClasses = interactive ? 'hover:shadow-lg hover:shadow-[var(--accent-blue)]/10' : '';

  return (
    <section
      className={`${baseClasses} ${interactiveClasses} ${className}`}
    >
      {children}
    </section>
  );
}
