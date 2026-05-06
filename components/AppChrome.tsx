'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

import Navbar from '@/components/Navbar';

interface AppChromeProps {
  children: React.ReactNode;
}

export default function AppChrome({ children }: AppChromeProps): React.ReactElement {
  const pathname = usePathname();
  const showNavbar = !pathname.startsWith('/seller');

  return (
    <>
      {showNavbar ? <Navbar /> : null}
      {children}
    </>
  );
}
