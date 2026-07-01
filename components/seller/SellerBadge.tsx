'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SellerBadgeProps {
  children: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'slate' | 'info';
  variant?: 'light' | 'solid';
  icon?: LucideIcon;
  className?: string;
}

const lightClasses = {
  primary: 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]',
  success: 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]',
  warning: 'bg-amber-500/10 text-amber-400',
  error: 'bg-[var(--accent-red)]/10 text-[var(--accent-red)]',
  slate: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
  info: 'bg-sky-500/10 text-sky-400',
};

const solidClasses = {
  primary: 'bg-[var(--accent-blue)] text-white',
  success: 'bg-[var(--accent-green)] text-white',
  warning: 'bg-amber-500 text-white',
  error: 'bg-[var(--accent-red)] text-white',
  slate: 'bg-[var(--text-secondary)] text-[var(--bg-dark)]',
  info: 'bg-sky-500 text-white',
};

export default function SellerBadge({
  children,
  color = 'primary',
  variant = 'light',
  icon: Icon,
  className = '',
}: SellerBadgeProps): React.ReactElement {
  const toneClasses = variant === 'solid' ? solidClasses[color] : lightClasses[color];

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses} ${className}`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}
