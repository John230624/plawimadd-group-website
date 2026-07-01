'use client';

import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CountryData {
  code: string;
  name: string;
  flag: string;
  customers: number;
  percentage: number;
}

interface CustomerDemographicProps {
  data?: CountryData[];
}

export default function CustomerDemographic({
  data = [
    { code: 'US', name: 'USA', flag: '🇺🇸', customers: 2379, percentage: 79 },
    { code: 'FR', name: 'France', flag: '🇫🇷', customers: 589, percentage: 23 },
  ],
}: CustomerDemographicProps): React.ReactElement {
  return (
    <div className="rounded-[10px] bg-[var(--bg-outer)] p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-700 text-[var(--text-primary)]">Démographie des clients</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Nombre de clients par pays</p>
        </div>
        <button className="rounded-lg p-2 transition-all duration-300 hover:bg-[var(--bg-hover)]">
          <MoreVertical className="h-5 w-5 text-[var(--text-secondary)]" />
        </button>
      </div>

      {/* Map Container */}
      <div className="relative h-[280px] rounded-lg bg-[var(--bg-hover)]/50 mb-6 overflow-hidden">
        {/* Simplified World Map SVG */}
        <svg
          viewBox="0 0 960 600"
          className="w-full h-full"
          style={{ filter: 'invert(0.1)' }}
        >
          {/* World map background - simplified */}
          <rect width="960" height="600" fill="transparent" />
          
          {/* Continents outline (simplified) */}
          <g stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" fill="rgba(100, 120, 150, 0.15)">
            {/* North America */}
            <path d="M 100 150 L 200 100 L 250 150 L 200 250 L 100 200 Z" />
            {/* South America */}
            <path d="M 180 280 L 220 250 L 240 400 L 180 420 Z" />
            {/* Europe */}
            <path d="M 400 100 L 500 80 L 520 200 L 420 220 Z" />
            {/* Africa */}
            <path d="M 450 200 L 550 180 L 580 400 L 480 420 Z" />
            {/* Asia */}
            <path d="M 550 100 L 750 80 L 800 300 L 600 350 Z" />
            {/* Australia */}
            <path d="M 750 400 L 800 380 L 820 480 L 770 500 Z" />
          </g>

          {/* Location dots */}
          {/* USA */}
          <circle cx="150" cy="180" r="8" fill="rgb(12, 140, 232)" opacity="0.8" />
          {/* France */}
          <circle cx="440" cy="130" r="6" fill="rgb(12, 140, 232)" opacity="0.6" />
          {/* India */}
          <circle cx="600" cy="250" r="5" fill="rgb(12, 140, 232)" opacity="0.4" />
          {/* Australia */}
          <circle cx="780" cy="430" r="5" fill="rgb(12, 140, 232)" opacity="0.4" />
        </svg>
      </div>

      {/* Country List */}
      <div className="space-y-3">
        {data.map((country) => (
          <div key={country.code} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{country.flag}</span>
              <div>
                <p className="text-sm font-600 text-[var(--text-primary)]">{country.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{country.customers.toLocaleString()} Clients</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Progress Bar */}
              <div className="w-24 h-1.5 rounded-full bg-[var(--bg-hover)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-blue)]/60"
                  style={{ width: `${country.percentage}%` }}
                />
              </div>
              <span className="text-sm font-600 text-[var(--text-primary)] w-8 text-right">{country.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
