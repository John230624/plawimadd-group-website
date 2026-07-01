'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SellerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

const variantClasses = {
  primary:
    'border-transparent bg-[var(--accent-blue)] text-white hover:bg-[var(--accent-blue-light)] shadow-sm',
  outline:
    'border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
  ghost: 'border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
  danger: 'border-transparent bg-[var(--accent-red)] text-white hover:bg-[#dc2626] shadow-sm',
  success: 'border-transparent bg-[var(--accent-green)] text-white hover:bg-[#059669] shadow-sm',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
  icon: 'h-10 w-10 p-0 text-sm',
};

export default function SellerButton({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  disabled,
  ...props
}: SellerButtonProps): React.ReactElement {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border font-500 transition-smooth focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:ring-offset-2 focus:ring-offset-[var(--bg-dark)] disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' ? <Icon className="h-4 w-4" /> : null}
      {size === 'icon' ? <span className="sr-only">{children}</span> : children}
      {Icon && iconPosition === 'right' ? <Icon className="h-4 w-4" /> : null}
    </button>
  );
}
