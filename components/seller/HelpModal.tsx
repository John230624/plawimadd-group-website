'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquareText, HelpCircle, Mail, ExternalLink } from 'lucide-react';

import SellerModal from '@/components/seller/SellerModal';
import { useLanguage } from '@/context/LanguageContext';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps): React.ReactElement {
  const { t } = useLanguage();

  return (
    <SellerModal isOpen={isOpen} onClose={onClose} title={t('help.title')} description={t('help.description')} size="sm">
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
    </SellerModal>
  );
}
