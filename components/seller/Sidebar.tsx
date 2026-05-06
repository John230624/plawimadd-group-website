'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  BarChart3,
  Box,
  ChevronRight,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Package2,
  ShoppingCart,
  Users,
} from 'lucide-react';

import SellerBrand from '@/components/seller/SellerBrand';

const menuItems = [
  {
    name: 'Vue generale',
    path: '/seller',
    icon: LayoutGrid,
    description: 'Indicateurs et activite',
  },
  {
    name: 'Produits',
    path: '/seller/product-list',
    icon: Box,
    description: 'Catalogue et fiches',
  },
  {
    name: 'Commandes',
    path: '/seller/orders',
    icon: ShoppingCart,
    description: 'Suivi et traitement',
  },
  {
    name: 'Clients',
    path: '/seller/users',
    icon: Users,
    description: 'Comptes et profils',
  },
  {
    name: 'Demandes etudiantes',
    path: '/seller/student-installment',
    icon: GraduationCap,
    description: 'Verification et approbation',
  },
  {
    name: 'Stocks',
    path: '/seller/stocks',
    icon: Package2,
    description: 'Disponibilite et alertes',
  },
];

export default function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const activeItem = useMemo(
    () => menuItems.find((item) => pathname === item.path) || menuItems[0],
    [pathname]
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 border-r border-[rgba(148,163,184,0.16)] bg-white/94 px-6 py-6 backdrop-blur xl:flex xl:flex-col">
      <div>
        <div className="px-2 py-2">
          <SellerBrand />
        </div>

        <nav className="mt-6 space-y-2">
          {menuItems.map(({ name, path, icon: Icon, description }) => {
            const isActive = pathname === path;

            return (
              <Link
                key={path}
                href={path}
                className={`group flex items-center justify-between rounded-[1.35rem] px-4 py-3.5 transition ${
                  isActive
                    ? 'bg-[var(--brand-600)] text-white shadow-[0_16px_30px_rgba(37,99,235,0.18)]'
                    : 'text-slate-600 hover:bg-[rgba(191,219,254,0.16)] hover:text-slate-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-2xl p-2 ${
                      isActive
                        ? 'bg-white/18 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-white'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className={`text-xs ${isActive ? 'text-white/72' : 'text-slate-400'}`}>
                      {description}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 ${isActive ? 'text-white/80' : 'text-slate-300'}`} />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-3">
        <div className="rounded-[1.5rem] border border-[rgba(148,163,184,0.16)] bg-slate-50 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[rgba(191,219,254,0.28)] p-2 text-[var(--brand-700)]">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{activeItem.name}</p>
              <p className="text-xs text-slate-500">{activeItem.description}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex w-full items-center justify-between rounded-[1.35rem] border border-[rgba(244,63,94,0.16)] bg-white px-4 py-3.5 text-left text-rose-600 transition hover:bg-rose-50"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-50 p-2 text-rose-600">
              <LogOut className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Deconnexion</p>
              <p className="text-xs text-rose-400">Quitter l&apos;espace admin</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-rose-300" />
        </button>
      </div>
    </aside>
  );
}
