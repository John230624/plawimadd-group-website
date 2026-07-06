'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Package, History, LogOut, Store } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

export default function SellerPosLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: 'Vente', path: '/seller-pos', icon: ShoppingCart },
    { name: 'Produits', path: '/seller-pos/products', icon: Package },
    { name: 'Transactions', path: '/seller-pos/transactions', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/seller-pos" className="flex items-center gap-2 font-bold text-gray-900">
              <Store className="h-5 w-5 text-blue-600" />
              <span>POS Plawimadd</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    pathname === item.path
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{session?.user?.name || 'Vendeur'}</span>
            <Link href="/seller" className="text-xs text-gray-400 underline hover:text-gray-600">
              Admin
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-4">{children}</main>
    </div>
  );
}
