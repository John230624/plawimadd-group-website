'use client';

import React, { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  accentColor?: 'blue' | 'green' | 'red' | 'amber';
  sparklineData?: number[];
}

export default function StatCard({
  title,
  value,
  description,
  change,
  changeType = 'neutral',
  icon: Icon,
  accentColor = 'blue',
  sparklineData = [],
}: StatCardProps): React.ReactElement {
  const changeColor = {
    positive: 'text-[var(--accent-green)]',
    negative: 'text-[var(--accent-red)]',
    neutral: 'text-[var(--text-tertiary)]',
  };

  const iconColor = {
    blue: 'text-[var(--accent-blue)]',
    green: 'text-[var(--accent-green)]',
    red: 'text-[var(--accent-red)]',
    amber: 'text-amber-400',
  };

  const sparklineColor = {
    blue: 'rgb(12, 140, 232)',
    green: 'rgb(16, 185, 129)',
    red: 'rgb(239, 68, 68)',
    amber: 'rgb(245, 158, 11)',
  };

  // Générer le chemin SVG pour la sparkline
  const sparklinePath = useMemo(() => {
    if (!sparklineData || sparklineData.length === 0) {
      return '';
    }

    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const width = 100;
    const height = 40;

    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    });

    return points.join(' ');
  }, [sparklineData]);

  return (
    <div className="group rounded-[10px] bg-[var(--bg-outer)] p-6 transition-all duration-300 hover:bg-[var(--bg-outer)]/80 hover:shadow-lg hover:shadow-[var(--accent-blue)]/10">
      {/* Row 1: Titre + Icône */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">{title}</h3>
        {Icon && (
          <Icon className={`h-5 w-5 ${iconColor[accentColor]}`} />
        )}
      </div>

      {/* Row 2: Tendance */}
      {change && (
        <div className={`flex items-center gap-1.5 text-xs font-600 mb-4 ${changeColor[changeType]}`}>
          {changeType === 'negative' ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5" />
          )}
          <span>{change}</span>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="mb-3 text-xs text-[var(--text-tertiary)]">{description}</p>
      )}

      {/* Row 3: Valeur + Graphique */}
      <div className="flex items-end justify-between gap-4">
        <p className="text-3xl font-700 text-[var(--text-primary)]">
          {(() => {
            const parts = value.split(' ');
            if (parts.length <= 1) return value;
            const num = parts.slice(0, -1).join(' ');
            const currency = parts[parts.length - 1];
            return <>{num} <span className="text-xl font-500 text-[var(--text-tertiary)]">{currency}</span></>;
          })()}
        </p>

        {/* Mini-graphique (Sparkline) */}
        {sparklineData && sparklineData.length > 0 && (
          <svg
            width="80"
            height="35"
            viewBox="0 0 100 40"
            className="shrink-0"
          >
            <defs>
              <linearGradient id={`sparklineGradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={sparklineColor[accentColor]} stopOpacity="0.25" />
                <stop offset="100%" stopColor={sparklineColor[accentColor]} stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {/* Gradient fill - aspect estompé/gommé */}
            <path
              d={`${sparklinePath} L 100 40 L 0 40 Z`}
              fill={`url(#sparklineGradient-${title})`}
            />
            {/* Line - couleur estompée */}
            <path
              d={sparklinePath}
              fill="none"
              stroke={sparklineColor[accentColor]}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
