'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  ChevronDown,
  ChevronRight,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  PackageCheck,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Ship,
  ShoppingBag,
  User,
  UserPlus,
  Wrench,
  X,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { assets } from "@/assets/assets";
import Image from "next/image";
import CountryFlag from '@/components/CountryFlag';
import { COUNTRIES, resolveCountry } from '@/lib/countries';
import type { Address } from '@/lib/types';

interface AppContextShape {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  getCartCount: () => number;
  getWishlistCount: () => number;
  userAddresses: Address[];
  fetchUserAddresses: () => Promise<void>;
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
  imageUrl?: string | null;
  children: { id: string; name: string }[];
  _count: { products: number };
}

const navLinks = [
  { href: '/all-products', label: 'Catalogue' },
  { href: '/offer', label: 'Offres' },
];

const tradeAssurance = [
  { icon: ShieldCheck, title: 'Paiements securises', body: 'Mobile Money, carte bancaire et suivi du paiement.' },
  { icon: RotateCcw, title: 'Satisfait ou Rembourse', body: 'Assistance si la commande ne correspond pas.' },
  { icon: Ship, title: 'Livraison dans les delais garantie', body: 'Expedition suivie et delais respectes.' },
  { icon: Wrench, title: 'Protections apres-vente', body: 'Support et garantie apres votre achat.' },
];

const megaMenuCategories = [
  {
    id: 'smartphones',
    title: 'Smartphones',
    image: '/images/catalog/catalog-smartphone.jpg',
    categoryName: 'Smartphones',
  },
  {
    id: 'ordinateurs',
    title: 'Ordinateurs',
    image: '/images/catalog/catalog-laptop.jpg',
    categoryName: 'Ordinateurs',
  },
  {
    id: 'televiseurs',
    title: 'Téléviseurs',
    image: '/images/catalog/catalog-tv.jpg',
    categoryName: 'Televiseurs',
  },
  {
    id: 'casques',
    title: 'Casques audio',
    image: '/images/catalog/catalog-headphones.jpg',
    categoryName: 'Audio',
  },
  {
    id: 'machines-cafe',
    title: 'Machines à café',
    image: '/images/catalog/catalog-coffee-machine.jpg',
    categoryName: 'Electromenager',
  },
  {
    id: 'montres',
    title: 'Montres connectées',
    image: '/images/catalog/catalog-smartwatch.jpg',
    categoryName: 'Montres connectees',
  },
];

const getCategoryFallbackImage = (name: string): string => {
  const norm = name.toLowerCase();
  if (norm.includes('phone') || norm.includes('smart')) return '/images/catalog/catalog-smartphone.jpg';
  if (norm.includes('ordinateur') || norm.includes('laptop') || norm.includes('pc')) return '/images/catalog/catalog-laptop.jpg';
  if (norm.includes('tv') || norm.includes('télé') || norm.includes('screen')) return '/images/catalog/catalog-tv.jpg';
  if (norm.includes('audio') || norm.includes('casque') || norm.includes('écouteur')) return '/images/catalog/catalog-headphones.jpg';
  if (norm.includes('caf') || norm.includes('machi') || norm.includes('électro')) return '/images/catalog/catalog-coffee-machine.jpg';
  if (norm.includes('montre') || norm.includes('watch')) return '/images/catalog/catalog-smartwatch.jpg';
  return '/images/catalog/catalog-smartphone.jpg';
};

export default function Navbar(): React.ReactElement {
  const { searchTerm, setSearchTerm, getCartCount, getWishlistCount, products, userAddresses, fetchUserAddresses } =
    useAppContext() as AppContextShape & { products: Product[] };
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [megaCategories, setMegaCategories] = useState<MegaMenuCategory[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [shipCountry, setShipCountry] = useState('BJ');
  const [postalCode, setPostalCode] = useState('');
  const [isOfferBadgeVisible, setIsOfferBadgeVisible] = useState(false);
  const [isOfferMegaOpen, setIsOfferMegaOpen] = useState(false);
  const [activeOffer, setActiveOffer] = useState<{
    title: string;
    description: string;
    badgeText: string;
    image: string;
    detailsJson: string;
    buttonText: string;
    buttonUrl: string;
    bgColor: string;
    textColor: string;
  } | null>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const offerRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = status === 'authenticated';
  const canAccessDashboard = Boolean(
    isLoggedIn && (session?.user?.role === 'ADMIN' || session?.user?.role === 'SELLER')
  );
  const cartCount = mounted ? getCartCount() : 0;
  const wishlistCount = mounted ? getWishlistCount() : 0;

  const defaultAddress = isLoggedIn
    ? userAddresses.find((address) => address.isDefault) || userAddresses[0] || null
    : null;
  const savedCountryCode = defaultAddress
    ? resolveCountry(defaultAddress.country)?.code || defaultAddress.country
    : '';

  const userLabel =
    session?.user?.firstName ||
    session?.user?.name ||
    session?.user?.email?.split('@')[0] ||
    'Mon compte';

  useEffect(() => {
    setMounted(true);
  }, []);

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
    fetch('/api/custom-offer')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.offers)) {
          const activeList = data.offers.filter((o: any) => o.isActive);
          if (activeList.length > 0) {
            const studentOffer = activeList.find((o: any) => o.isStudent);
            setActiveOffer(studentOffer || activeList[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('plw_ship_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.country) setShipCountry(parsed.country);
        if (parsed?.postalCode) setPostalCode(parsed.postalCode);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') fetchUserAddresses();
  }, [status, fetchUserAddresses]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
      if (megaRef.current && !megaRef.current.contains(event.target as Node)) {
        setIsMegaOpen(false);
      }
      if (offerRef.current && !offerRef.current.contains(event.target as Node)) {
        setIsOfferMegaOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (addressRef.current && !addressRef.current.contains(event.target as Node)) {
        setIsAddressOpen(false);
      }
      if (whyRef.current && !whyRef.current.contains(event.target as Node)) {
        setIsWhyOpen(false);
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

  useEffect(() => {
    const checkBadgeStatus = () => {
      const status = localStorage.getItem('plw-student-offer-badge');
      setIsOfferBadgeVisible(status === 'pinned');
    };

    checkBadgeStatus();

    window.addEventListener('plw-student-offer-badge-changed', checkBadgeStatus);
    window.addEventListener('storage', checkBadgeStatus);

    return () => {
      window.removeEventListener('plw-student-offer-badge-changed', checkBadgeStatus);
      window.removeEventListener('storage', checkBadgeStatus);
    };
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(false);
    if (pathname !== '/all-products') {
      router.push('/all-products');
    }
  };

  const handleSaveLocation = () => {
    try {
      localStorage.setItem('plw_ship_location', JSON.stringify({ country: shipCountry, postalCode }));
    } catch {
      /* ignore */
    }
    setIsAddressOpen(false);
  };

  const getLinkClassName = (href: string) => {
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

    return [
      'relative py-2 text-sm font-semibold transition-all duration-200 border-b-2',
      isActive
        ? 'text-slate-900 font-bold border-slate-900'
        : 'text-slate-650 hover:text-slate-900 border-transparent',
    ].join(' ');
  };

  const displayedCategories = megaCategories.length > 0
    ? megaCategories.map((cat) => ({
        id: cat.id,
        title: cat.name,
        image: cat.imageUrl || getCategoryFallbackImage(cat.name),
        categoryName: cat.name,
      }))
    : megaMenuCategories;

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

        <nav className="hidden items-center gap-6 lg:flex ml-6">
          {navLinks.map((link) =>
            link.href === '/all-products' ? (
              <div key={link.href} className="relative flex items-center" ref={megaRef}>
                <button
                  type="button"
                  onMouseEnter={() => setIsMegaOpen(true)}
                  onClick={() => setIsMegaOpen(prev => !prev)}
                  className={[
                    'relative py-2 text-sm font-semibold transition-all duration-200 border-b-2',
                    pathname.startsWith('/all-products')
                      ? 'text-slate-900 font-bold border-slate-900'
                      : 'text-slate-650 hover:text-slate-900 border-transparent',
                  ].join(' ')}
                >
                  {link.label}
                </button>

                {isMegaOpen && (
                  <div
                    className="fixed left-1/2 top-[72px] z-50 w-[min(95vw,1100px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.16)]"
                    onMouseLeave={() => setIsMegaOpen(false)}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-5 bg-white">
                      {displayedCategories.slice(0, 12).map((item) => (
                        <Link
                          key={item.id}
                          href={`/all-products?category=${encodeURIComponent(item.categoryName)}`}
                          onClick={() => setIsMegaOpen(false)}
                          className="group relative flex flex-col justify-between items-center bg-[#efefef] hover:bg-[#f7f7f7] shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-none rounded-[1rem] p-4 text-center transition-all duration-300 min-h-[190px] focus:outline-none"
                        >
                          {/* Category Title */}
                          <div className="pt-1 pb-1">
                            <h4 className="font-extrabold text-slate-800 text-xs md:text-[0.9rem] tracking-tight group-hover:text-black transition-colors duration-200">
                              {item.title}
                            </h4>
                          </div>

                          {/* Product Image - Centered and Sharp */}
                          <div className="relative w-[90%] aspect-[4/3] max-h-[105px] md:max-h-[115px] mt-1 mb-1 flex items-center justify-center overflow-hidden">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="150px"
                              className="object-cover scale-105 group-hover:scale-100 transition-transform duration-500 ease-out"
                              priority
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
                      <Link
                        href="/all-products"
                        onClick={() => setIsMegaOpen(false)}
                        className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-650 transition hover:text-[var(--brand-700)]"
                      >
                        Voir tous les produits <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : link.href === '/offer' ? (
              <div
                key={link.href}
                className="relative flex items-center"
                ref={offerRef}
                onMouseEnter={() => setIsOfferMegaOpen(true)}
                onMouseLeave={() => setIsOfferMegaOpen(false)}
              >
                <Link
                  href={link.href}
                  className={`${getLinkClassName(link.href)} flex items-center gap-1`}
                >
                  <span>{link.label}</span>
                  {isOfferBadgeVisible && (
                    <span className="text-red-500 font-bold animate-pulse text-[14px]">★ 1</span>
                  )}
                </Link>

                {isOfferMegaOpen && (() => {
                  const offerImage = activeOffer?.image || "/images/background_etudiant2.jpg";
                  const offerBadgeText = activeOffer?.badgeText || "PROMO";
                  const offerTitle = activeOffer?.title || "Option Étudiante";
                  const offerDescription = activeOffer?.description || "Réglez 50% à la commande, puis 25% et 25% sur deux mois.";
                  const offerBgColor = activeOffer?.bgColor || "bg-slate-950";
                  const offerButtonText = activeOffer?.buttonText || "Voir l'offre";
                  const offerButtonUrl = activeOffer?.buttonUrl || "/offer";

                  let offerBullets = ["3 mensualités sans frais", "Validation de dossier rapide"];
                  if (activeOffer?.detailsJson) {
                    try {
                      const parsed = JSON.parse(activeOffer.detailsJson);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        offerBullets = parsed;
                      }
                    } catch {}
                  }

                  return (
                    <div
                      className="absolute left-1/2 top-full z-50 mt-1 w-[460px] -translate-x-[20%] overflow-hidden bg-white shadow-[0_12px_32px_rgba(15,23,42,0.12)] border border-slate-100 rounded-[2px]"
                    >
                      <div className="flex h-[200px]">
                        {/* Left slide preview */}
                        <div className={`relative w-[38%] overflow-hidden ${offerBgColor} flex flex-col justify-end p-4`}>
                          <Image
                            src={offerImage}
                            alt={offerTitle}
                            fill
                            sizes="175px"
                            className="object-cover object-center"
                            priority
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 text-white z-10">
                            <span className="text-[8px] font-bold uppercase tracking-widest bg-red-650 text-white px-1.5 py-0.5 rounded-[1px] inline-block mb-1">
                              {offerBadgeText}
                            </span>
                            <h4 className="text-xs font-extrabold leading-tight tracking-tight">
                              {offerTitle}
                            </h4>
                          </div>
                        </div>

                        {/* Right details */}
                        <div className="w-[62%] p-4 flex flex-col justify-between bg-white text-left">
                          <div>
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600">
                              Plawimadd Group
                            </span>
                            <h3 className="text-sm font-extrabold leading-tight text-slate-900 mt-0.5">
                              {offerTitle}
                            </h3>
                            <p className="mt-1 text-[11px] leading-[15px] text-slate-500 font-medium">
                              {offerDescription}
                            </p>

                            <div className="mt-2.5 flex flex-col gap-1">
                              {offerBullets.slice(0, 2).map((bullet, idx) => (
                                <div key={idx} className="flex items-center gap-1 text-[11px] text-slate-700 font-semibold truncate">
                                  <span className="text-red-500 font-bold">★</span>
                                  <span className="truncate">{bullet}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-3 flex justify-end">
                            <Link
                              href={offerButtonUrl}
                              onClick={() => setIsOfferMegaOpen(false)}
                              className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 text-[11px] font-bold transition rounded-[2px]"
                            >
                              {offerButtonText}
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <Link key={link.href} href={link.href} className={`${getLinkClassName(link.href)} flex items-center gap-1`}>
                <span>{link.label}</span>
                {link.href === '/offer' && isOfferBadgeVisible && (
                  <span className="text-red-500 font-bold animate-pulse text-[14px]">★ 1</span>
                )}
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
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(searchTerm); }}
                placeholder="Rechercher parmi nos produits"
                className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 caret-[var(--brand-600)]"
              />
            </label>

            {showSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_52px_rgba(15,23,42,0.14)] z-50">
                {searchTerm.trim() !== '' ? (
                  <div>
                    {searchSuggestions.length > 0 ? (
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
                    ) : (
                      <div className="p-4 text-center text-sm text-slate-400">
                        Aucun produit trouvé pour « {searchTerm} »
                      </div>
                    )}
                    <div className="border-t border-slate-100 p-2">
                      <button
                        type="button"
                        onClick={() => handleSearch(searchTerm)}
                        className="flex w-full items-center justify-center rounded-xl py-2 text-xs font-semibold text-[var(--brand-600)] hover:bg-slate-50 transition-colors"
                      >
                        Voir tous les résultats
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 space-y-5 bg-white">
                    {/* Recherches populaires */}
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-2">
                        Recherches populaires
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {['Ordinateur', 'Smartphones', 'Montre', 'Casque', 'Télévision'].map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setSearchTerm(term);
                              handleSearch(term);
                            }}
                            className="rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-semibold text-slate-650 transition hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] focus:outline-none"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Catégories suggérées */}
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-2">
                        Catégories suggérées
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {displayedCategories.slice(0, 4).map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              router.push(`/all-products?category=${encodeURIComponent(cat.categoryName)}`);
                              setShowSuggestions(false);
                            }}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[var(--brand-300)] hover:text-[var(--brand-600)] focus:outline-none"
                          >
                            {cat.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Produits recommandés */}
                    {products && products.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-2">
                          Produits recommandés
                        </h4>
                        <div className="space-y-2">
                          {products.slice(0, 3).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                router.push(`/product/${p.id}`);
                                setShowSuggestions(false);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl hover:bg-slate-50 p-1.5 transition text-left focus:outline-none"
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
                                <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                                <p className="text-xs text-slate-400">
                                  {p.price?.toLocaleString()} CFA
                                  {p.category?.name ? ` — ${p.category.name}` : ''}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <div className="relative hidden lg:block" ref={addressRef}>
              <button
                type="button"
                onClick={() => { setIsAddressOpen((v) => !v); setIsWhyOpen(false); }}
                className="flex items-center gap-2 rounded-full px-2.5 py-1.5 text-left transition hover:bg-slate-100"
                aria-label="Adresse de livraison"
              >
                {defaultAddress ? (
                  <>
                    <CountryFlag country={defaultAddress.country} className="h-4 w-6" />
                    <span className="leading-tight">
                      <span className="block text-[9px] font-medium uppercase tracking-wide text-slate-400">Livraison</span>
                      <span className="block text-xs font-bold text-slate-800">{savedCountryCode}</span>
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-slate-700">Adresse de livraison</span>
                )}
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${isAddressOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAddressOpen ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_64px_rgba(15,23,42,0.16)]">
                  <h3 className="text-base font-bold text-slate-900">Adresse de livraison</h3>

                  {isLoggedIn && defaultAddress ? (
                    <>
                      <div className="mt-3 rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center gap-2">
                          <CountryFlag country={defaultAddress.country} className="h-4 w-6" />
                          <span className="text-xs font-medium text-slate-500">{defaultAddress.country}</span>
                          <span className="ml-auto rounded-full bg-[var(--brand-50)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-700)]">
                            Par defaut
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{defaultAddress.fullName}</p>
                        <p className="text-xs text-slate-500">{defaultAddress.phoneNumber}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {defaultAddress.area}, {defaultAddress.city}, {defaultAddress.state}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIsAddressOpen(false); router.push('/addresses'); }}
                        className="mt-4 w-full rounded-full bg-[var(--brand-600)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-700)]"
                      >
                        Gerer mes adresses
                      </button>
                    </>
                  ) : isLoggedIn ? (
                    <>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">
                        Aucune adresse enregistree pour le moment.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setIsAddressOpen(false); router.push('/addresses'); }}
                        className="mt-4 w-full rounded-full bg-[var(--brand-600)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-700)]"
                      >
                        Ajouter une adresse
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">
                        Les options logistiques et les frais de port varient en fonction de votre emplacement.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setIsAddressOpen(false); router.push('/login'); }}
                        className="mt-4 w-full rounded-full bg-[var(--brand-600)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-700)]"
                      >
                        Connectez-vous pour ajouter une adresse
                      </button>

                      <div className="my-4 flex items-center gap-3">
                        <span className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs text-slate-400">Ou</span>
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
                          <CountryFlag country={shipCountry} className="h-4 w-6" />
                          <select
                            value={shipCountry}
                            onChange={(e) => setShipCountry(e.target.value)}
                            className="w-full bg-transparent text-sm text-slate-800 outline-none"
                          >
                            {COUNTRIES.map((c) => (
                              <option key={c.code} value={c.code}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="Saisissez un code postal"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[var(--brand-300)]"
                        />
                        <button
                          type="button"
                          onClick={handleSaveLocation}
                          className="w-full rounded-full bg-[var(--brand-600)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-700)]"
                        >
                          Sauvegarder
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <div className="relative hidden lg:block" ref={whyRef}>
              <button
                type="button"
                onClick={() => { setIsWhyOpen((v) => !v); setIsAddressOpen(false); }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-[var(--brand-700)]"
                aria-label="Pourquoi nous choisir"
              >
                <ShieldCheck className="h-[18px] w-[18px]" />
              </button>

              {isWhyOpen ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-[340px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_64px_rgba(15,23,42,0.16)]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff3e8] text-[var(--brand-600)]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Pourquoi nous choisir</h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Beneficiez d&apos;une protection du paiement a la livraison.
                  </p>

                  <div className="mt-4 space-y-3">
                    {tradeAssurance.map((item) => (
                      <div key={item.title} className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff3e8] text-[var(--brand-600)]">
                          <item.icon className="h-[18px] w-[18px]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-0.5 text-xs leading-4 text-slate-500">{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/contact"
                    onClick={() => setIsWhyOpen(false)}
                    className="mt-4 flex items-center gap-1 text-xs font-semibold text-[var(--brand-600)] hover:underline"
                  >
                    En savoir plus <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => router.push('/wishlist')}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-[var(--brand-700)]"
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
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-[var(--brand-700)]"
              aria-label="Panier"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cartCount > 0 ? (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-600)] px-1 text-[9px] font-semibold text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>

            <div className="relative ml-1" ref={accountRef}>
              <button
                type="button"
                onClick={() => setIsAccountOpen((previous) => !previous)}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-[var(--brand-700)] ${
                  isAccountOpen ? 'bg-slate-100 text-[var(--brand-700)]' : 'text-slate-700'
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

                        <button
                          type="button"
                          onClick={() => {
                            router.push('/settings');
                            setIsAccountOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                        >
                          <Settings className="h-3.5 w-3.5 text-slate-400" />
                          <span>Paramètres</span>
                        </button>

                        {canAccessDashboard ? (
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
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
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
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
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
                className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-1.5 ${
                  (link.href === '/' ? pathname === '/' : pathname.startsWith(link.href))
                    ? 'bg-white text-[var(--brand-700)]'
                    : 'text-slate-700 hover:bg-white/70 hover:text-[var(--brand-700)]'
                }`}
              >
                <span>{link.label}</span>
                {link.href === '/offer' && isOfferBadgeVisible && (
                  <span className="text-red-500 font-bold animate-pulse text-[14px]">★ 1</span>
                )}
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
                {canAccessDashboard ? (
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
