'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface SellerSelectOption {
  value: string;
  label: string;
}

interface SellerSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SellerSelectOption[];
  className?: string;
  align?: 'left' | 'right';
}

export default function SellerSelect({
  value,
  onChange,
  options,
  className = '',
  align = 'left',
}: SellerSelectProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeOption = options.find((option) => option.value === value) || options[0];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none transition hover:bg-[var(--bg-hover)] focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20"
      >
        <span className="truncate">{activeOption?.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div
          className={`absolute z-30 mt-2 min-w-full overflow-y-auto max-h-60 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((option) => {
            const isActive = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  isActive
                    ? 'bg-[var(--accent-blue)] text-white'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span>{option.label}</span>
                {isActive ? <Check className="h-4 w-4" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
