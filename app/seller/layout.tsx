'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import Sidebar from '@/components/seller/Sidebar';
import SellerMobileNav from '@/components/seller/SellerMobileNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps): React.ReactElement {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (!session) return;
    if (session.user?.role !== 'ADMIN' && session.user?.role !== 'SELLER') {
      router.replace('/login');
    }
  }, [session, status, router]);

  return (
    <div className="dark-theme min-h-screen bg-[var(--bg-outer)]">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--bg-dark)] my-2 mr-2">
          <SellerMobileNav />
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
