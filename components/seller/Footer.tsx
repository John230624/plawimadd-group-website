'use client';

import React from 'react';

import SellerBrand from '@/components/seller/SellerBrand';

export default function Footer(): React.ReactElement {
  return (
    <footer className="mt-10 border-t border-[rgba(148,163,184,0.14)] pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <SellerBrand compact />
          <p className="mt-2 text-sm text-slate-500">
            Administration du catalogue, des commandes et du suivi client.
          </p>
        </div>

        <div className="text-sm text-slate-500 md:text-right">
          <p>Dashboard Plawimadd Group</p>
          <p className="mt-1">© {new Date().getFullYear()} Tous droits reserves.</p>
        </div>
      </div>
    </footer>
  );
}
