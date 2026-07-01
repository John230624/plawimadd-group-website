'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface SellerAlertProps {
  title: string;
  description?: string;
  tone?: 'info' | 'success' | 'warning' | 'error';
  icon?: LucideIcon;
  action?: React.ReactNode;
}

const toneMap = {
  info: {
    icon: Info,
    className: 'border-sky-100 bg-sky-50 text-sky-700',
    iconClassName: 'bg-white text-sky-600',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    iconClassName: 'bg-white text-emerald-600',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-100 bg-amber-50 text-amber-700',
    iconClassName: 'bg-white text-amber-600',
  },
  error: {
    icon: XCircle,
    className: 'border-rose-100 bg-rose-50 text-rose-700',
    iconClassName: 'bg-white text-rose-600',
  },
};

export default function SellerAlert({
  title,
  description,
  tone = 'info',
  icon,
  action,
}: SellerAlertProps): React.ReactElement {
  const config = toneMap[tone];
  const Icon = icon || config.icon;

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${config.className}`}>
      <div className={`rounded-xl p-2 ${config.iconClassName}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="mt-1 text-sm leading-6 opacity-80">{description}</p> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}
