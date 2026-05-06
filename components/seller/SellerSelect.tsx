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
        className="flex w-full items-center justify-between gap-3 rounded-full border border-[var(--brand-300)] bg-white px-4 py-3.5 text-sm font-medium text-slate-700 outline-none transition hover:bg-[rgba(191,219,254,0.12)]"
      >
        <span className="truncate">{activeOption?.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div
          className={`absolute z-30 mt-2 min-w-full overflow-hidden rounded-[1.2rem] border border-[rgba(148,163,184,0.18)] bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.12)] ${
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
                className={`flex w-full items-center justify-between rounded-[1rem] px-4 py-3 text-left text-sm transition ${
                  isActive
                    ? 'bg-[var(--brand-600)] text-white'
                    : 'text-slate-700 hover:bg-slate-50'
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
