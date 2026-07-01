'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  PackageCheck,
  Search,
  ShoppingBag,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { assets } from "@/assets/assets";
import Image from "next/image";

interface AppContextShape {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  getCartCount: () => number;
  getWishlistCount: () => number;
}

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/all-products', label: 'Catalogue' },
  { href: '/offer', label: 'Offres' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar(): React.ReactElement {
  const { searchTerm, setSearchTerm, getCartCount, getWishlistCount } =
    useAppContext() as AppContextShape;
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = status === 'authenticated';
  const isAdmin = Boolean(isLoggedIn && session?.user?.role === 'ADMIN');
  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  const userLabel =
    session?.user?.firstName ||
    session?.user?.name ||
    session?.user?.email?.split('@')[0] ||
    'Mon compte';

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (pathname !== '/all-products') {
      router.push('/all-products');
    }
  };

  const getLinkClassName = (href: string) => {
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

    return [
      'rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200',
      isActive
        ? 'bg-[var(--brand-600)] text-white shadow-sm'
        : 'text-slate-600 hover:bg-white hover:text-[var(--brand-700)]',
    ].join(' ');
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-slate-200/70 bg-white/88 backdrop-blur-xl transition-shadow duration-200 ${
        isScrolled ? 'shadow-[0_14px_38px_rgba(15,23,42,0.08)]' : ''
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-5 px-4 pt-1 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <Link href="/" className="flex shrink-0 items-center whitespace-nowrap" aria-label="Accueil Plawimadd Group">
          <Image
            src={assets.logo}
            alt="Plawimadd Group Logo"
            width={600}
            height={150}
            className="h-auto w-[150px] md:w-[175px] lg:w-[190px]"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 p-1 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={getLinkClassName(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          <label className="flex h-10 w-full max-w-[440px] items-center gap-3 rounded-full border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-500 shadow-inner transition duration-200 focus-within:border-[var(--brand-300)] focus-within:bg-white focus-within:shadow-[0_10px_30px_rgba(37,99,235,0.08)]">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Rechercher parmi nos produits"
              className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 caret-[var(--brand-600)]"
            />
          </label>

          <div className="flex items-center gap-2 text-slate-700">
            <button
              type="button"
              onClick={() => router.push('/wishlist')}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 shadow-sm transition hover:border-[var(--brand-200)] hover:bg-white hover:text-[var(--brand-700)]"
              aria-label="Favoris"
            >
              <Heart className="h-[18px] w-[18px]" />
              {wishlistCount > 0 ? (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-600)] px-1 text-[9px] font-semibold text-white">
                  {wishlistCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => router.push('/cart')}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 shadow-sm transition hover:border-[var(--brand-200)] hover:bg-white hover:text-[var(--brand-700)]"
              aria-label="Panier"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cartCount > 0 ? (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-600)] px-1 text-[9px] font-semibold text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>

            <div className="relative ml-2 border-l border-slate-200 pl-3" ref={accountRef}>
              <button
                type="button"
                onClick={() => setIsAccountOpen((previous) => !previous)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border bg-white/85 shadow-sm transition hover:bg-white hover:text-[var(--brand-700)] ${
                  isAccountOpen
                    ? 'border-[var(--brand-300)] text-[var(--brand-700)] ring-2 ring-[var(--brand-100)]'
                    : 'border-slate-200'
                }`}
                aria-label="Compte"
              >
                <User className="h-[18px] w-[18px]" />
              </button>

              {isAccountOpen ? (
                <div className="fixed right-4 top-[78px] z-50 w-[min(220px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_18px_52px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:right-6 lg:right-10 xl:right-12">
                  {isLoggedIn ? (
                    <>
                      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[var(--brand-700)] shadow-sm ring-1 ring-slate-200">
                          {userLabel.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-950">{userLabel}</p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-500">{session?.user?.email}</p>
                        </div>
                      </div>

                      <div className="mt-1.5 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            router.push('/my-orders');
                            setIsAccountOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                        >
                          <PackageCheck className="h-3.5 w-3.5 text-slate-400" />
                          <span>Mes commandes</span>
                        </button>

                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              router.push('/seller');
                              setIsAccountOpen(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                          >
                            <LayoutDashboard className="h-3.5 w-3.5 text-slate-400" />
                            <span>Tableau de bord</span>
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-1.5 border-t border-slate-100 pt-1.5">
                        <button
                          type="button"
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-0.5">
                      <Link
                        href="/login"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                      >
                        <LogIn className="h-3.5 w-3.5 text-slate-400" />
                        <span>Se connecter</span>
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                      >
                        <UserPlus className="h-3.5 w-3.5 text-slate-400" />
                        <span>Créer un compte</span>
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => router.push('/cart')}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-700 shadow-sm"
            aria-label="Panier"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {cartCount > 0 ? (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-600)] px-1 text-[9px] font-semibold text-white">
                {cartCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setIsMenuOpen((previous) => !previous)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-700 shadow-sm"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-slate-200/70 bg-white/95 px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:hidden">
          <label className="flex h-11 items-center gap-3 rounded-full border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-500 transition duration-200 focus-within:border-[var(--brand-300)] focus-within:bg-white focus-within:shadow-[0_10px_30px_rgba(37,99,235,0.08)]">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Rechercher un produit"
              className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 caret-[var(--brand-600)]"
            />
          </label>

          <div className="mt-5 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                  (link.href === '/' ? pathname === '/' : pathname.startsWith(link.href))
                    ? 'bg-white text-[var(--brand-700)]'
                    : 'text-slate-700 hover:bg-white/70 hover:text-[var(--brand-700)]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isLoggedIn ? (
              <>
                <Link
                  href="/my-orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white/70 hover:text-[var(--brand-700)]"
                >
                  Mes commandes
                </Link>
                {isAdmin ? (
                  <Link
                    href="/seller"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white/70 hover:text-[var(--brand-700)]"
                  >
                    Tableau de bord
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Deconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white/70 hover:text-[var(--brand-700)]"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white/70 hover:text-[var(--brand-700)]"
                >
                  Creer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
