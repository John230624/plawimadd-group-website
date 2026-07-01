'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SellerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
}

export default function SellerInput({
  label,
  hint,
  error,
  icon: Icon,
  className = '',
  id,
  ...props
}: SellerInputProps): React.ReactElement {
  const inputId = id || props.name;

  return (
    <label className="block" htmlFor={inputId}>
      {label ? <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">{label}</span> : null}
      <span className="relative block">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        ) : null}
        <input
          id={inputId}
          className={`h-11 w-full rounded-lg border bg-[var(--bg-outer)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20 ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-[var(--accent-red)] text-[var(--accent-red)] focus:border-[var(--accent-red)] focus:ring-[var(--accent-red)]/20' : 'border-[var(--border)]'} ${className}`}
          {...props}
        />
      </span>
      {error ? <span className="mt-1.5 block text-xs text-[var(--accent-red)]">{error}</span> : null}
      {!error && hint ? <span className="mt-1.5 block text-xs text-[var(--text-tertiary)]">{hint}</span> : null}
    </label>
  );
}
