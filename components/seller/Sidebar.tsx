'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  BarChart3,
  Box,
  CreditCard,
  FileText,
  History,
  Layers3,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  Package2,
  Search,
  Settings,
  ShoppingCart,
  Tag,
  Upload,
  Users,
  Home,
  ChevronUp,
  ChevronDown,
  Languages,
  User,
} from 'lucide-react';

import SellerBrand from '@/components/seller/SellerBrand';
import SellerNotifications from '@/components/seller/SellerNotifications';
import { useLanguage } from '@/context/LanguageContext';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  color?: string;
  hasArrow?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: 'sidebar.admin',
    items: [
      { name: 'sidebar.dashboard', path: '/seller', icon: LayoutGrid },
      { name: 'sidebar.users', path: '/seller/users', icon: Users },
      { name: 'sidebar.orders', path: '/seller/orders', icon: ShoppingCart },
    ],
  },
  {
    title: 'sidebar.products',
    items: [
      { name: 'sidebar.products', path: '/seller/product-list', icon: Box },
      { name: 'sidebar.categories', path: '/seller/categories', icon: Layers3 },
      { name: 'sidebar.stocks', path: '/seller/stocks', icon: Package2 },
    ],
  },
  {
    title: 'sidebar.sales',
    items: [
      { name: 'sidebar.promotions', path: '/seller/promotions', icon: Tag },
      { name: 'sidebar.reviews', path: '/seller/reviews', icon: MessageSquareText },
      { name: 'sidebar.payments', path: '/seller/payments', icon: CreditCard },
    ],
  },
  {
    title: 'sidebar.content',
    items: [
      { name: 'sidebar.cmsPages', path: '/seller/pages', icon: FileText },
      { name: 'sidebar.importExport', path: '/seller/import-export', icon: Upload },
    ],
  },
  {
    title: 'sidebar.config',
    items: [
      { name: 'sidebar.settings', path: '/seller/settings', icon: Settings },
      { name: 'sidebar.reports', path: '/seller/reports', icon: BarChart3 },
      { name: 'sidebar.activityLog', path: '/seller/activity-logs', icon: History },
    ],
  },
];

// Export flat list for mobile nav compatibility
export const sellerMenuItems: MenuItem[] = menuSections.flatMap((section) => section.items);

export default function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { locale, toggleLocale, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return menuSections;

    return menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          t(item.name).toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchQuery, t]);

  const user = session?.user || {
    name: 'Utilisateur',
    email: 'contact@plawimadd.com',
    image: null,
  };

  return (
    <aside className="hidden h-screen w-[240px] shrink-0 flex-col lg:sticky lg:top-0 lg:flex p-0 bg-[var(--bg-outer)]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4 pt-1">
        <div className="min-w-0 flex-1">
          <SellerBrand compact />
        </div>
        <SellerNotifications compact tone="dark" />
      </div>

      {/* Barre de Recherche */}
      <div className="relative mx-3 mb-3 mt-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder={t('sidebar.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-hover)] px-3 py-2 pl-9 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
        />
      </div>

      {/* Sections de Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-5 px-3">
        {filteredSections.map((section) => (
          <div key={section.title}>
            <p className="px-2 py-1.5 text-xs font-600 uppercase tracking-wider text-[var(--text-tertiary)]">
              {t(section.title)}
            </p>
            <div className="mt-2 space-y-0.5">
              {section.items.map(({ name, path, icon: Icon }) => {
                const isActive = pathname === path;

                return (
                  <Link
                    key={path}
                    href={path}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-500 transition-smooth ${
                      isActive
                        ? 'bg-[var(--accent-blue)] text-white'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t(name)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Section Profil Pop-up */}
      <div className="relative mt-auto px-3 pb-3 pt-4 border-t border-[var(--border)]" ref={profileRef}>
        {/* Pop-up Menu */}
        {isProfileOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] py-1 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* User Info Header */}
            <div className="flex items-center gap-3 px-3 py-3 border-b border-[var(--border)]">
              <div className="h-9 w-9 overflow-hidden rounded-full bg-[var(--bg-hover)] flex items-center justify-center border border-[var(--border)]">
                {user.image ? (
                  <img src={user.image} alt={user.name || ''} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-[var(--text-tertiary)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-600 text-[var(--text-primary)]">{user.name}</p>
                <p className="truncate text-[10px] text-[var(--text-tertiary)]">{user.email}</p>
              </div>
            </div>

            {/* Menu Items Group 1 */}
            <div className="py-1 border-b border-[var(--border)]">
              <Link href="/seller/settings" className="flex items-center gap-3 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-smooth">
                <Settings className="h-4 w-4" />
                <span>{t('profile.settings')}</span>
              </Link>
              <button
                onClick={toggleLocale}
                className="flex w-full items-center justify-between px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-smooth"
              >
                <div className="flex items-center gap-3">
                  <Languages className="h-4 w-4" />
                  <span>{t('profile.language')}</span>
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {locale === 'fr' ? t('lang.french') : t('lang.english')}
                </span>
              </button>
            </div>

            {/* Menu Items Group 2 */}
            <div className="py-1 border-b border-[var(--border)]">
              <Link href="/" className="flex items-center gap-3 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-smooth">
                <Home className="h-4 w-4" />
                <span>{t('profile.home')}</span>
              </Link>
            </div>

            {/* Logout */}
            <div className="py-1">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex w-full items-center gap-3 px-3 py-2 text-xs text-[var(--accent-red)] hover:bg-[var(--bg-hover)] transition-smooth"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('profile.logout')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Profile Trigger Button */}
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={`flex w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-transparent p-2.5 transition-smooth hover:bg-[var(--bg-hover)] ${isProfileOpen ? 'bg-[var(--bg-hover)]' : ''}`}
        >
          <div className="h-8 w-8 overflow-hidden rounded-full bg-[var(--bg-hover)] flex items-center justify-center border border-[var(--border)]">
            {user.image ? (
              <img src={user.image} alt={user.name || ''} className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-[var(--text-tertiary)]" />
            )}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[11px] font-600 text-[var(--text-primary)]">{user.name}</p>
            <p className="truncate text-[10px] text-[var(--text-tertiary)]">{user.email}</p>
          </div>
          {isProfileOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          ) : (
            <div className="flex flex-col -space-y-1">
              <ChevronUp className="h-3 w-3 text-[var(--text-tertiary)]" />
              <ChevronDown className="h-3 w-3 text-[var(--text-tertiary)]" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
