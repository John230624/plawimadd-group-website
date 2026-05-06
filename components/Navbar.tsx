'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Clock3,
  Heart,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

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
      'text-sm font-medium transition',
      isActive ? 'text-[var(--brand-600)]' : 'text-slate-700 hover:text-[var(--brand-800)]',
    ].join(' ');
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-[oklch(97%_0.014_254.604/0.94)] backdrop-blur transition-shadow duration-200 ${
        isScrolled ? 'shadow-[0_10px_30px_rgba(15,23,42,0.06)]' : ''
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3 text-xs text-slate-600 md:px-10 lg:px-12">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[var(--brand-600)]" />
          <span>Abomey-Calavi, en face du College Bakhita</span>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[var(--brand-600)]" />
            <span>Lundi-Samedi, 09h - 21h</span>
          </div>
          <a href="tel:+2290197747178" className="font-medium text-slate-800 transition hover:text-[var(--brand-700)]">
            +(229) 0197747178
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-6 py-4 md:px-10 lg:px-12">
        <Link href="/" className="shrink-0 whitespace-nowrap">
          <span className="inline-flex items-baseline whitespace-nowrap font-['Playwrite_PL',cursive] text-[0.96rem] font-[400] leading-none tracking-[-0.025em] md:text-[1.08rem] lg:text-[1.18rem]">
            <span className="text-slate-600">Plawimadd</span>
            <span className="ml-1 text-[var(--brand-800)]">Group</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 pl-6 lg:flex xl:pl-10">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={getLinkClassName(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          <label className="flex w-full max-w-[430px] items-center gap-3 rounded-full border border-[var(--brand-100)] bg-white/72 px-4 py-3 text-sm text-slate-500 shadow-sm transition duration-200 focus-within:border-[var(--brand-100)] focus-within:bg-white/92 focus-within:shadow-[0_10px_30px_rgba(148,163,184,0.10)]">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Rechercher parmi nos produits"
              className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 caret-[var(--brand-600)]"
            />
          </label>

          <div className="flex items-center gap-1 text-slate-700">
            <button
              type="button"
              onClick={() => router.push('/wishlist')}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-transparent transition hover:border-[var(--brand-100)] hover:bg-white/70 hover:text-[var(--brand-700)]"
              aria-label="Favoris"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 ? (
                <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-600)] px-1 text-[10px] font-semibold text-white">
                  {wishlistCount}
                </span>
              ) : null}
            </button>

            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setIsAccountOpen((previous) => !previous)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-transparent transition hover:border-[var(--brand-100)] hover:bg-white/70 hover:text-[var(--brand-700)]"
                aria-label="Compte"
              >
                <User className="h-5 w-5" />
              </button>

              {isAccountOpen ? (
                <div className="absolute right-0 top-[calc(100%+12px)] w-56 rounded-3xl border border-[var(--brand-100)] bg-white p-2 shadow-[0_25px_70px_rgba(15,23,42,0.12)]">
                  {isLoggedIn ? (
                    <>
                      <div className="rounded-2xl bg-[var(--brand-50)] px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{userLabel}</p>
                        <p className="mt-1 text-xs text-slate-500">{session?.user?.email}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          router.push('/my-orders');
                          setIsAccountOpen(false);
                        }}
                        className="mt-2 w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        Mes commandes
                      </button>

                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            router.push('/seller');
                            setIsAccountOpen(false);
                          }}
                          className="w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          Tableau de bord
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full rounded-2xl px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
                      >
                        Deconnexion
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsAccountOpen(false)}
                        className="block rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        Se connecter
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsAccountOpen(false)}
                        className="block rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        Creer un compte
                      </Link>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => router.push('/cart')}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-transparent transition hover:border-[var(--brand-100)] hover:bg-white/70 hover:text-[var(--brand-700)]"
              aria-label="Panier"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-600)] px-1 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => router.push('/cart')}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--brand-100)] bg-white/80 text-slate-700"
            aria-label="Panier"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-600)] px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setIsMenuOpen((previous) => !previous)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--brand-100)] bg-white/80 text-slate-700"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="bg-[oklch(97%_0.014_254.604)] px-6 py-5 md:hidden">
          <label className="flex items-center gap-3 rounded-full border border-[var(--brand-100)] bg-white/72 px-4 py-3 text-sm text-slate-500 transition duration-200 focus-within:border-[var(--brand-100)] focus-within:bg-white/92 focus-within:shadow-[0_10px_30px_rgba(148,163,184,0.10)]">
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
