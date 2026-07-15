'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useSellerMenuSections } from '@/components/seller/Sidebar';
import SellerBrand from '@/components/seller/SellerBrand';
import { useLanguage } from '@/context/LanguageContext';

export default function SellerMobileNav(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();
  const menuItems = useSellerMenuSections().flatMap((section) => section.items);

  return (
    <>
      {/* Mobile Header */}
      <div className="mb-6 flex items-center justify-between xl:hidden">
        <SellerBrand />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg border border-[var(--border)] bg-transparent p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 top-0 z-40 bg-[var(--bg-dark)]/80 backdrop-blur-sm xl:hidden">
          <nav className="absolute left-0 top-0 h-screen w-[280px] border-r border-[var(--border)] bg-[var(--bg-dark)] p-6">
            <div className="mb-8">
              <SellerBrand />
            </div>

            <div className="space-y-1">
              {menuItems.map(({ name, path, icon: Icon }) => {
                const isActive = pathname === path;

                return (
                  <Link
                    key={path}
                    href={path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-smooth ${
                      isActive
                        ? 'bg-[var(--accent-blue)] text-white'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <p className="text-sm font-500">{t(name)}</p>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
