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

  const isStaff = session?.user?.role === 'ADMIN' || session?.user?.role === 'SELLER';

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (!session) return;
    // Connecté mais sans rôle staff : retour à l'accueil, pas au login.
    if (!isStaff) {
      router.replace('/');
    }
  }, [session, status, router, isStaff]);

  // Ne jamais rendre le contenu protégé tant que le rôle n'est pas confirmé
  // (évite le flash de l'interface admin pendant la redirection).
  if (status === 'loading' || !isStaff) {
    return (
      <div className="dark-theme flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-outer)] text-center">
        {status === 'loading' ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
        ) : (
          <>
            <p className="text-6xl font-extrabold text-[var(--text-tertiary)]">403</p>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Accès refusé</h1>
            <p className="max-w-sm text-sm text-[var(--text-secondary)]">
              Vous n&apos;avez pas les droits nécessaires pour accéder à cet espace.
              Redirection vers l&apos;accueil…
            </p>
          </>
        )}
      </div>
    );
  }

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
