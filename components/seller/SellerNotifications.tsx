'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2 } from 'lucide-react';

import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';

interface DashboardAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  href: string;
}

interface SellerNotificationsProps {
  compact?: boolean;
  tone?: 'light' | 'dark';
  className?: string;
}

const severityColor = {
  info: 'info',
  warning: 'warning',
  error: 'error',
  success: 'success',
} as const;

export default function SellerNotifications({
  compact = false,
  tone = 'light',
  className = '',
}: SellerNotificationsProps): React.ReactElement {
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = tone === 'dark';

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        if (response.ok && data.success && Array.isArray(data.alerts)) {
          setAlerts(data.alerts);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadAlerts();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const unreadCount = alerts.length;
  const hasAlerts = unreadCount > 0;
  const previewText = useMemo(
    () => (hasAlerts ? `${unreadCount} alerte(s) à traiter` : 'Aucune alerte active'),
    [hasAlerts, unreadCount]
  );

  const buttonClassName = compact
    ? `relative h-8 w-8 rounded-full ${
        isDark
          ? 'border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          : ''
      }`
    : 'relative rounded-full';

  const panelClassName = compact
    ? `absolute right-0 z-50 mt-2 w-[220px] overflow-hidden rounded-xl border shadow-2xl ${
        isDark ? 'border-[var(--border)] bg-[var(--bg-dark)]' : 'border-slate-200 bg-white'
      }`
    : 'absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <SellerButton
        variant="outline"
        size="icon"
        icon={Bell}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label="Afficher les notifications"
        className={buttonClassName}
      >
        Notifications
      </SellerButton>
      {hasAlerts ? (
        <span
          className={`absolute right-0 top-0 flex h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ${
            isDark ? 'ring-[var(--bg-outer)]' : 'ring-white'
          }`}
        />
      ) : null}

      {isOpen ? (
        <div className={panelClassName}>
          <div className={`border-b px-3 py-3 ${isDark ? 'border-[var(--border)]' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-950'}`}>
                  Notifications
                </p>
                <p className={`mt-1 truncate text-xs ${isDark ? 'text-[var(--text-tertiary)]' : 'text-slate-500'}`}>
                  {previewText}
                </p>
              </div>
              {hasAlerts ? <SellerBadge color="warning">{unreadCount}</SellerBadge> : null}
            </div>
          </div>

          <div className={`${compact ? 'max-h-[300px]' : 'max-h-[360px]'} overflow-y-auto p-2`}>
            {hasAlerts ? (
              alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  onClick={() => setIsOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 transition ${
                    isDark ? 'hover:bg-[var(--bg-hover)]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-xs font-medium ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>
                        {alert.title}
                      </p>
                      <p className={`mt-1 text-[11px] leading-4 ${isDark ? 'text-[var(--text-tertiary)]' : 'text-slate-500'}`}>
                        {alert.description}
                      </p>
                    </div>
                    <SellerBadge color={severityColor[alert.severity]} className="shrink-0 px-2 py-0.5 text-[10px]">
                      {alert.severity}
                    </SellerBadge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <div className={`rounded-full p-3 ${isDark ? 'bg-[var(--bg-hover)] text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className={`mt-3 text-sm font-medium ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>
                  Tout est calme
                </p>
                <p className={`mt-1 text-xs leading-5 ${isDark ? 'text-[var(--text-tertiary)]' : 'text-slate-500'}`}>
                  Aucune alerte urgente pour le moment.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
