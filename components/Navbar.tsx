'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  ChevronRight,
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

interface Product {
  id: string;
  name: string;
  price: number;
  imgUrl: string[];
  category?: { name: string };
}

interface MegaMenuCategory {
  id: string;
  name: string;
  level: number;
  children: { id: string; name: string }[];
  _count: { products: number };
}

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/all-products', label: 'Catalogue' },
  { href: '/offer', label: 'Offres' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar(): React.ReactElement {
  const { searchTerm, setSearchTerm, getCartCount, getWishlistCount, products } =
    useAppContext() as AppContextShape & { products: Product[] };
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [megaCategories, setMegaCategories] = useState<MegaMenuCategory[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMegaCategories(data.filter((c: MegaMenuCategory) => c.level === 0));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
      if (megaRef.current && !megaRef.current.contains(event.target as Node)) {
        setIsMegaOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
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

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = searchTerm.trim().toLowerCase();
    const matches = (products || []).filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q)
    ).slice(0, 6);
    setSearchSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }, [searchTerm, products]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(false);
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
          {navLinks.map((link) =>
            link.href === '/all-products' ? (
              <div key={link.href} className="relative" ref={megaRef}>
                <button
                  type="button"
                  onMouseEnter={() => setIsMegaOpen(true)}
                  onClick={() => setIsMegaOpen(prev => !prev)}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200',
                    pathname.startsWith('/all-products')
                      ? 'bg-[var(--brand-600)] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-[var(--brand-700)]',
                  ].join(' ')}
                >
                  {link.label}
                </button>

                {isMegaOpen && megaCategories.length > 0 && (
                  <div
                    className="fixed left-1/2 top-[72px] z-50 w-[min(90vw,1000px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.16)]"
                    onMouseLeave={() => setIsMegaOpen(false)}
                  >
                    <div className="grid grid-cols-4 gap-6 p-6">
                      {megaCategories.slice(0, 8).map((cat) => (
                        <div key={cat.id}>
                          <Link
                            href={`/all-products?category=${encodeURIComponent(cat.name)}`}
                            onClick={() => setIsMegaOpen(false)}
                            className="block text-sm font-semibold text-slate-900 hover:text-[var(--brand-700)]"
                          >
                            {cat.name}
                            {cat._count.products > 0 && (
                              <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                                ({cat._count.products})
                              </span>
                            )}
                          </Link>
                          {cat.children.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {cat.children.slice(0, 6).map((child) => (
                                <Link
                                  key={child.id}
                                  href={`/all-products?category=${encodeURIComponent(child.name)}`}
                                  onClick={() => setIsMegaOpen(false)}
                                  className="block text-xs text-slate-500 transition hover:text-[var(--brand-700)] hover:pl-0.5"
                                >
                                  {child.name}
                                </Link>
                              ))}
                              {cat.children.length > 6 && (
                                <Link
                                  href={`/all-products?category=${encodeURIComponent(cat.name)}`}
                                  onClick={() => setIsMegaOpen(false)}
                                  className="block text-xs font-medium text-[var(--brand-600)] hover:underline"
                                >
                                  Voir tout ({cat.children.length})
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
                      <Link
                        href="/all-products"
                        onClick={() => setIsMegaOpen(false)}
                        className="flex items-center justify-center gap-1 text-xs font-medium text-slate-600 transition hover:text-[var(--brand-700)]"
                      >
                        Voir tous les produits <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link key={link.href} href={link.href} className={getLinkClassName(link.href)}>
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          <div className="relative w-full max-w-[440px]" ref={searchRef}>
            <label className="flex h-10 w-full items-center gap-3 rounded-full border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-500 shadow-inner transition duration-200 focus-within:border-[var(--brand-300)] focus-within:bg-white focus-within:shadow-[0_10px_30px_rgba(37,99,235,0.08)]">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onFocus={() => { if (searchSuggestions.length > 0) setShowSuggestions(true); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(searchTerm); }}
                placeholder="Rechercher parmi nos produits"
                className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 caret-[var(--brand-600)]"
              />
            </label>

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_52px_rgba(15,23,42,0.14)]">
                <div className="p-2">
                  {searchSuggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        router.push(`/product/${p.id}`);
                        setSearchTerm('');
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <Image
                          src={p.imgUrl?.[0] || '/images/default_product_image.png'}
                          alt={p.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-400">
                          {p.price?.toLocaleString()} CFA
                          {p.category?.name ? ` — ${p.category.name}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 p-2">
                  <button
                    type="button"
                    onClick={() => handleSearch(searchTerm)}
                    className="flex w-full items-center justify-center rounded-xl py-2 text-xs font-medium text-[var(--brand-600)] hover:bg-slate-50"
                  >
                    Voir tous les resultats
                  </button>
                </div>
              </div>
            )}
          </div>

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

            {megaCategories.length > 0 && (
              <div className="border-t border-slate-100 pt-2 mt-1">
                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Categories
                </p>
                {megaCategories.slice(0, 6).map((cat) => (
                  <div key={cat.id}>
                    <Link
                      href={`/all-products?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-white/70 hover:text-[var(--brand-700)]"
                    >
                      {cat.name}
                      {cat._count.products > 0 && (
                        <span className="text-[10px] text-slate-400">{cat._count.products}</span>
                      )}
                    </Link>
                  </div>
                ))}
                <Link
                  href="/all-products"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-1 rounded-2xl px-4 py-2.5 text-xs font-medium text-[var(--brand-600)] hover:underline"
                >
                  Toutes les categories <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            )}

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
