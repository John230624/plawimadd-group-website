'use client';

import React, { ReactNode } from 'react';

import Sidebar from '@/components/seller/Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(239,246,255,0.88))]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1720px]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-4 md:px-6 md:py-6 xl:px-8">
          <div className="min-h-[calc(100vh-3rem)] rounded-[2rem] border border-white/60 bg-white/62 px-4 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] backdrop-blur md:px-6 md:py-6 xl:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
