'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { MessageSquareText, HelpCircle, Mail, ExternalLink, X } from 'lucide-react';

import { useLanguage } from '@/context/LanguageContext';
import SellerButton from '@/components/seller/SellerButton';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps): React.ReactElement | null {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return createPortal(
    <div className="dark-theme fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_30px_90px_rgba(0,0,0,0.3)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 md:px-6">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t('help.title')}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{t('help.description')}</p>
          </div>
          <SellerButton variant="ghost" size="icon" icon={X} onClick={onClose}>
            Fermer
          </SellerButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          <div className="space-y-4">
            <Link
              href="/contact"
              onClick={onClose}
              className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] p-4 transition-smooth hover:bg-[var(--bg-outer)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-blue)]/10">
                <MessageSquareText className="h-5 w-5 text-[var(--accent-blue)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-600 text-[var(--text-primary)]">{t('help.contact')}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{t('help.contactDesc')}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
            </Link>

            <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] p-4 opacity-60">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
                <HelpCircle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-600 text-[var(--text-primary)]">{t('help.faq')}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{t('help.faqDesc')}</p>
              </div>
              <span className="text-[10px] font-500 text-[var(--text-tertiary)]">Bientôt</span>
            </div>

            <a
              href="mailto:support@plawimadd.com"
              className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] p-4 transition-smooth hover:bg-[var(--bg-outer)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-green)]/10">
                <Mail className="h-5 w-5 text-[var(--accent-green)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-600 text-[var(--text-primary)]">{t('help.supportEmail')}</p>
                <p className="text-xs text-[var(--text-tertiary)]">support@plawimadd.com</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
