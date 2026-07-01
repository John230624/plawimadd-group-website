'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

import SellerButton from '@/components/seller/SellerButton';

interface SellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

export default function SellerModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: SellerModalProps): React.ReactElement | null {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <div
        className={`relative flex max-h-[calc(100vh-2rem)] w-full ${sizeClasses[size]} flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_30px_90px_rgba(0,0,0,0.3)]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 md:px-6">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
          </div>
          <SellerButton variant="ghost" size="icon" icon={X} onClick={onClose}>
            Fermer
          </SellerButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">{children}</div>
        {footer ? <div className="border-t border-[var(--border)] px-5 py-4 md:px-6">{footer}</div> : null}
      </div>
    </div>
  );
}
