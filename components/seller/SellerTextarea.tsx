'use client';

import React from 'react';

interface SellerTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export default function SellerTextarea({
  label,
  hint,
  error,
  className = '',
  id,
  ...props
}: SellerTextareaProps): React.ReactElement {
  const inputId = id || props.name;

  return (
    <label className="block" htmlFor={inputId}>
      {label ? <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">{label}</span> : null}
      <textarea
        id={inputId}
        className={`w-full rounded-lg border bg-[var(--bg-outer)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20 ${
          error ? 'border-[var(--accent-red)] text-[var(--accent-red)] focus:border-[var(--accent-red)] focus:ring-[var(--accent-red)]/20' : 'border-[var(--border)]'
        } ${className}`}
        {...props}
      />
      {error ? <span className="mt-1.5 block text-xs text-[var(--accent-red)]">{error}</span> : null}
      {!error && hint ? <span className="mt-1.5 block text-xs text-[var(--text-tertiary)]">{hint}</span> : null}
    </label>
  );
}
