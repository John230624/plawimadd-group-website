'use client';

import React, { ReactNode } from 'react';

import Sidebar from '@/components/seller/Sidebar';
import SellerMobileNav from '@/components/seller/SellerMobileNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps): React.ReactElement {
  return (
    <div className="dark-theme min-h-screen bg-[var(--bg-outer)]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--bg-dark)] my-2 mr-2">
          {/* Mobile Nav */}
          <SellerMobileNav />

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
