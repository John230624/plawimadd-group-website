'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Search,
  Copy,
  ExternalLink,
  Truck,
  RotateCcw,
  Star,
  X,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';

import HomeFooter from '@/components/home/HomeFooter';
import { useAppContext } from '@/context/AppContext';
import { OrderStatus, PaymentStatus } from '@/lib/types';

// Badges minimalistes pour l'en-tête de commande
function getBadgeClasses(status: OrderStatus | PaymentStatus | null): string {
  if (!status) return 'bg-slate-50 text-slate-600 border border-slate-200/65';

  switch (status) {
    case OrderStatus.DELIVERED:
    case PaymentStatus.COMPLETED:
      return 'bg-emerald-50 text-emerald-700 border border-emerald-250';
    case OrderStatus.SHIPPED:
    case OrderStatus.PROCESSING:
      return 'bg-blue-50 text-blue-700 border border-blue-250';
    case OrderStatus.PENDING:
    case PaymentStatus.PENDING:
      return 'bg-amber-50 text-amber-700 border border-amber-250';
    case OrderStatus.CANCELLED:
    case OrderStatus.PAYMENT_FAILED:
    case PaymentStatus.FAILED:
      return 'bg-rose-50 text-rose-700 border border-rose-250';
    default:
      return 'bg-slate-50 text-slate-600 border border-slate-200/65';
  }
}

// Libellés lisibles pour le statut de livraison
function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.DELIVERED:
      return 'Livré';
    case OrderStatus.SHIPPED:
      return 'Expédié (En cours de route)';
    case OrderStatus.PROCESSING:
      return 'En cours de préparation';
    case OrderStatus.PENDING:
      return 'Commande reçue / Attente validation';
    case OrderStatus.CANCELLED:
      return 'Annulé';
    case OrderStatus.PAYMENT_FAILED:
      return 'Paiement échoué';
    default:
      return status;
  }
}

// Fonction de parsing d'images robuste
function parseProductImage(imgUrl: any): string {
  if (!imgUrl) return '/images/default_product_image.png';
  if (Array.isArray(imgUrl)) {
    return imgUrl[0] || '/images/default_product_image.png';
  }
  if (typeof imgUrl === 'string') {
    const trimmed = imgUrl.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0] || '/images/default_product_image.png';
        }
      } catch {}
    }
    return trimmed || '/images/default_product_image.png';
  }
  return '/images/default_product_image.png';
}

function parseColorIds(color: string | null | undefined): string[] {
  if (!color) return [];
  try {
    const ids = JSON.parse(color);
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function getDateFilterLabel(filterId: string): string {
  switch (filterId) {
    case '30days':
      return '30 derniers jours';
    case '3months':
      return '3 derniers mois';
    case '2026':
      return 'Année 2026';
    case '2025':
      return 'Année 2025';
    default:
      return 'Toutes les dates';
  }
}

export default function MyOrdersPage(): React.ReactElement {
  const {
    currentUser,
    fetchUserOrders,
    formatPrice,
    isLoggedIn,
    loadingOrders,
    errorFetchingOrders,
    userOrders,
    addToCart,
  } = useAppContext();
  const router = useRouter();
  
  // États de filtres et recherche
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState<boolean>(false);
  
  // États de couleur
  const [colorMap, setColorMap] = useState<Record<string, { name: string; hex: string }>>({});
  
  // État du modal de suivi de colis
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/colors')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map: Record<string, { name: string; hex: string }> = {};
          data.forEach((c: { id: string; name: string; hex: string }) => {
            map[c.id] = { name: c.name, hex: c.hex };
          });
          setColorMap(map);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentUser?.id) {
      fetchUserOrders();
    }
  }, [currentUser?.id, fetchUserOrders, isLoggedIn]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Numéro de commande copié !');
  };

  const handleBuyAgain = async (productId: string, quantity: number) => {
    try {
      const success = await addToCart(productId, undefined, quantity);
      if (success) {
        toast.success('Produit ajouté à votre panier avec succès !');
        router.push('/cart');
      } else {
        toast.error("Impossible d'ajouter le produit au panier.");
      }
    } catch {
      toast.error("Une erreur s'est produite lors de l'ajout.");
    }
  };

  const downloadInvoice = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/invoice?orderId=${orderId}`);
      if (!res.ok) {
        toast.error("Échec du téléchargement de la facture.");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${orderId.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Erreur lors de la récupération du fichier.");
    }
  };

  // Filtrer les commandes par onglet, date et recherche
  const filteredOrders = useMemo(() => {
    return userOrders.filter((order) => {
      // 1. Filtrage par onglet (Status)
      if (activeTab === 'pending') {
        if (![OrderStatus.PENDING, OrderStatus.PROCESSING].includes(order.status)) return false;
      } else if (activeTab === 'shipped') {
        if (order.status !== OrderStatus.SHIPPED) return false;
      } else if (activeTab === 'delivered') {
        if (order.status !== OrderStatus.DELIVERED) return false;
      } else if (activeTab === 'cancelled') {
        if (![OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED].includes(order.status)) return false;
      }

      // 2. Filtrage par date
      const orderDate = new Date(order.orderDate);
      const now = new Date();
      if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        if (orderDate < thirtyDaysAgo) return false;
      } else if (dateFilter === '3months') {
        const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
        if (orderDate < threeMonthsAgo) return false;
      } else if (dateFilter === '2026') {
        if (orderDate.getFullYear() !== 2026) return false;
      } else if (dateFilter === '2025') {
        if (orderDate.getFullYear() !== 2025) return false;
      }

      // 3. Recherche (par numéro ou nom de produit)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(query);
        const matchesProduct = order.orderItems.some((item) =>
          item.product.name.toLowerCase().includes(query)
        );
        if (!matchesId && !matchesProduct) return false;
      }

      return true;
    });
  }, [userOrders, activeTab, dateFilter, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/40">
      <main className="mx-auto flex w-full max-w-[1140px] flex-1 flex-col px-4 py-8 sm:px-6">
        
        {/* Navigation fil d'Ariane */}
        <nav className="mb-4">
          <ol className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <li><Link href="/" className="hover:text-[#ff6a00] transition-colors">Accueil</Link></li>
            <li>/</li>
            <li><Link href="/my-orders" className="text-slate-500">Mon compte</Link></li>
            <li>/</li>
            <li className="text-slate-650 font-bold">Mes commandes</li>
          </ol>
        </nav>

        {/* Titre et Intro */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200/60 pb-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Vos commandes
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Suivez, modifiez ou achetez à nouveau vos articles favoris.
            </p>
          </div>
          
          {/* Recherche & Filtre de date */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Barre de recherche */}
            <div className="relative min-w-[260px] h-10">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher un produit ou un N°..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-450 outline-none transition-all focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00]"
              />
            </div>
            
            {/* Custom Dropdown pour les dates */}
            <div className="relative h-10 min-w-[180px]">
              <button
                type="button"
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="flex w-full h-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-xs text-slate-700 outline-none transition-all hover:bg-slate-50 focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00]"
              >
                <span>{getDateFilterLabel(dateFilter)}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDateDropdownOpen && (
                <>
                  {/* Backdrop pour fermer le dropdown au clic extérieur */}
                  <div className="fixed inset-0 z-10" onClick={() => setIsDateDropdownOpen(false)} />
                  <ul className="absolute right-0 mt-1.5 z-20 w-full min-w-[180px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-100">
                    {[
                      { id: 'all', label: 'Toutes les dates' },
                      { id: '30days', label: '30 derniers jours' },
                      { id: '3months', label: '3 derniers mois' },
                      { id: '2026', label: 'Année 2026' },
                      { id: '2025', label: 'Année 2025' },
                    ].map((opt) => (
                      <li key={opt.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setDateFilter(opt.id);
                            setIsDateDropdownOpen(false);
                          }}
                          className={`flex w-full items-center px-4 py-2.5 text-left text-xs transition-colors ${
                            dateFilter === opt.id
                              ? 'bg-[#ff6a00]/5 text-[#ff6a00] font-semibold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Onglets style Amazon/Aliexpress */}
        <div className="border-b border-slate-200/60 mb-6 flex overflow-x-auto scrollbar-thin">
          <div className="flex gap-6 pb-0.5">
            {[
              { id: 'all', label: 'Commandes' },
              { id: 'pending', label: 'En cours' },
              { id: 'shipped', label: 'Expédiées' },
              { id: 'delivered', label: 'Livrées' },
              { id: 'cancelled', label: 'Annulées' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs font-bold uppercase tracking-wider relative whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#ff6a00]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#ff6a00]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des commandes */}
        <section className="flex-grow">
          {loadingOrders ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/60 bg-white py-20 text-center shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-250 border-t-[#ff6a00]"></div>
              <p className="mt-4 text-xs font-semibold text-slate-500">Chargement de vos commandes...</p>
            </div>
          ) : errorFetchingOrders ? (
            <div className="rounded-xl border border-slate-200/60 bg-white p-12 text-center shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Chargement impossible</h2>
              <p className="mt-2 text-sm text-slate-500">{errorFetchingOrders}</p>
            </div>
          ) : !isLoggedIn ? (
            <div className="rounded-xl border border-slate-200/60 bg-white py-16 px-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200/60 text-slate-400">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-base font-bold text-slate-900">Connectez-vous pour voir vos commandes</h2>
              <p className="mt-2 text-xs text-slate-500 max-w-[40ch] mx-auto">
                Consultez l'historique complet de vos achats en vous connectant à votre espace personnel.
              </p>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#ff6a00] hover:bg-[#e25c00] px-5 py-2.5 text-xs font-bold text-white transition-colors"
              >
                Se connecter
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-slate-200/60 bg-white py-16 px-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200/60 text-slate-400">
                <Package className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-base font-bold text-slate-900">Aucune commande trouvée</h2>
              <p className="mt-2 text-xs text-slate-500 max-w-[42ch] mx-auto">
                {searchQuery || dateFilter !== 'all' || activeTab !== 'all'
                  ? "Aucun résultat ne correspond à vos filtres et critères de recherche actuels."
                  : "Vous n'avez pas encore effectué de commande sur notre boutique."}
              </p>
              {(searchQuery || dateFilter !== 'all' || activeTab !== 'all') ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter('all');
                    setActiveTab('all');
                  }}
                  className="mt-6 inline-flex items-center justify-center rounded-lg border border-slate-300 hover:bg-slate-55 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/all-products')}
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#ff6a00] hover:bg-[#e25c00] px-5 py-2.5 text-xs font-bold text-white transition-colors"
                >
                  Découvrir les produits
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const orderFriendlyDate = new Date(order.orderDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });

                return (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* En-tête style Amazon */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border-b border-slate-100 p-4 sm:px-6">
                      <div className="flex flex-wrap items-center gap-6 sm:gap-10">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</p>
                          <p className="mt-1 text-xs font-bold text-slate-800">{orderFriendlyDate}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</p>
                          <p className="mt-1 text-xs font-bold text-slate-800">{formatPrice(order.totalAmount)}</p>
                        </div>
                        
                        {/* Adresse avec Tooltip au survol */}
                        <div className="relative group cursor-pointer">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            Livré à <MapPin className="h-3 w-3 text-slate-400" />
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#ff6a00] hover:underline flex items-center gap-0.5">
                            {order.shippingCity}
                          </p>
                          
                          {/* Tooltip */}
                          <div className="absolute left-0 mt-2 hidden group-hover:block z-20 w-[240px] rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs leading-5 text-slate-650">
                            <p className="font-bold text-slate-900 mb-1">Destinataire & Adresse</p>
                            <p className="font-semibold">{order.userEmail}</p>
                            {order.userPhoneNumber && <p>{order.userPhoneNumber}</p>}
                            <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-slate-500">
                              {order.shippingAddressLine1}<br />
                              {order.shippingAddressLine2 && <>{order.shippingAddressLine2}<br /></>}
                              {order.shippingCity}, {order.shippingState}<br />
                              {order.shippingCountry}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* N° Commande et Actions d'en-tête */}
                      <div className="text-left sm:text-right">
                        <div className="flex items-center gap-1.5 sm:justify-end text-[10px] font-semibold text-slate-450 uppercase tracking-wider">
                          <span>N° {order.id.slice(0, 8)}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.id)}
                            className="hover:text-slate-700"
                            title="Copier le numéro de commande complet"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        
                        <div className="mt-1.5 flex items-center gap-3 sm:justify-end">
                          <button
                            type="button"
                            onClick={() => downloadInvoice(order.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#ff6a00] transition-colors"
                          >
                            <FileText className="h-3.5 w-3.5" /> Facture PDF
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Contenu de la commande */}
                    <div className="p-5 sm:px-6 divide-y divide-slate-100">
                      {order.orderItems.map((item, index) => {
                        const imageSrc = parseProductImage(item.product.imgUrl);

                        return (
                          <div
                            key={`${item.productId}-${index}`}
                            className="flex flex-col py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between gap-5"
                          >
                            <div className="flex gap-4 items-start flex-1 min-w-0">
                              
                              {/* Image du produit cliquable */}
                              <Link
                                href={`/product/${item.productId}`}
                                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/60 bg-white p-1 hover:border-[#ff6a00] transition-colors"
                              >
                                <Image
                                  src={imageSrc}
                                  alt={item.product.name}
                                  width={80}
                                  height={80}
                                  className="h-auto max-h-full w-auto object-contain"
                                />
                              </Link>
                              
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/product/${item.productId}`}
                                  className="text-sm font-bold text-slate-900 hover:text-[#ff6a00] transition-colors line-clamp-2 flex items-center gap-1"
                                >
                                  {item.product.name} <ExternalLink className="h-3 w-3 inline text-slate-400" />
                                </Link>
                                
                                <p className="mt-1.5 text-xs text-slate-500">
                                  Quantité : <span className="font-semibold text-slate-700">{item.quantity}</span>
                                  &nbsp;•&nbsp; Prix unitaire : <span className="font-semibold text-slate-700">{formatPrice(item.priceAtOrder)}</span>
                                </p>

                                {/* Badges de couleur */}
                                {(() => {
                                  const ids = parseColorIds(item.product?.color);
                                  const resolved = ids.map((id) => colorMap[id]).filter(Boolean) as { name: string; hex: string }[];
                                  if (resolved.length === 0) return null;
                                  return (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {resolved.map((c, i) => (
                                        <span key={c.hex + i} className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 font-semibold">
                                          <span className="h-2 w-2 rounded-full border border-slate-300" style={{ backgroundColor: c.hex }} />
                                          {c.name}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}
                                
                                {/* Info livraison */}
                                <div className="mt-4 flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-[#ff6a00]" />
                                  <p className="text-xs font-semibold text-slate-700">
                                    Statut de l'article : &nbsp;
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                      order.status === OrderStatus.DELIVERED ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-[#ff6a00]'
                                    }`}>
                                      {getStatusLabel(order.status)}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Actions de droite (style Amazon) */}
                            <div className="flex flex-row flex-wrap sm:flex-col gap-2.5 shrink-0 self-start w-full sm:w-auto">
                              
                              {/* Suivre mon colis (ouvert dans un popup) */}
                              <button
                                type="button"
                                onClick={() => setTrackingOrder(order)}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ff6a00] hover:bg-[#e25c00] px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm"
                              >
                                <Truck className="h-3.5 w-3.5" /> Suivre le colis
                              </button>
                              
                              {/* Acheter à nouveau */}
                              <button
                                type="button"
                                onClick={() => handleBuyAgain(item.productId, item.quantity)}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Acheter à nouveau
                              </button>
                              
                              {/* Laisser un avis */}
                              <Link
                                href={`/product/${item.productId}`}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors text-center"
                              >
                                <Star className="h-3.5 w-3.5" /> Donner votre avis
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE SUIVI DE COLIS (Tracking Stepper) */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-[500px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Entête Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 px-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Suivi de la livraison</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Commande #{trackingOrder.id.slice(0, 8)}</p>
              </div>
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-650"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            {/* Contenu Modal */}
            <div className="p-5 px-6">
              
              {/* Statut Global */}
              <div className="mb-6 rounded-lg bg-slate-50 border border-slate-100 p-3.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Statut de la livraison</p>
                <p className="mt-1 text-base font-bold text-[#ff6a00]">
                  {getStatusLabel(trackingOrder.status)}
                </p>
              </div>

              {/* Stepper Vertical */}
              <div className="relative border-l border-slate-200 ml-3.5 pl-6 space-y-7 py-2.5">
                
                {/* Étape 1 : Commande passée */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0 flex h-5 w-5 items-center justify-center rounded-full border ${
                    ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(trackingOrder.status)
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  <p className="text-xs font-bold text-slate-900">Commande passée</p>
                  <p className="text-[10px] text-slate-450 mt-0.5">Votre commande a bien été reçue.</p>
                </div>

                {/* Étape 2 : Paiement validé */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0 flex h-5 w-5 items-center justify-center rounded-full border ${
                    trackingOrder.paymentStatus === PaymentStatus.COMPLETED
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  <p className="text-xs font-bold text-slate-900">Paiement validé</p>
                  <p className="text-[10px] text-slate-450 mt-0.5">
                    {trackingOrder.paymentStatus === PaymentStatus.COMPLETED
                      ? "Le paiement a été confirmé."
                      : "En attente de la validation du paiement."}
                  </p>
                </div>

                {/* Étape 3 : En cours de préparation */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0 flex h-5 w-5 items-center justify-center rounded-full border ${
                    ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(trackingOrder.status)
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : trackingOrder.status === 'PENDING'
                      ? 'bg-amber-100 border-[#ff6a00] text-[#ff6a00] animate-pulse'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    <Clock className="h-3 w-3" />
                  </span>
                  <p className="text-xs font-bold text-slate-900">Préparation</p>
                  <p className="text-[10px] text-slate-450 mt-0.5">Préparation de vos articles par notre équipe logistique.</p>
                </div>

                {/* Étape 4 : Expédié */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0 flex h-5 w-5 items-center justify-center rounded-full border ${
                    ['SHIPPED', 'DELIVERED'].includes(trackingOrder.status)
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : trackingOrder.status === 'PROCESSING'
                      ? 'bg-amber-100 border-[#ff6a00] text-[#ff6a00] animate-pulse'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    <Truck className="h-3 w-3" />
                  </span>
                  <p className="text-xs font-bold text-slate-900">Expédition</p>
                  <p className="text-[10px] text-slate-450 mt-0.5">Votre colis est remis au transporteur.</p>
                </div>

                {/* Étape 5 : Livré */}
                <div className="relative font-semibold">
                  <span className={`absolute -left-[31px] top-0 flex h-5 w-5 items-center justify-center rounded-full border ${
                    trackingOrder.status === OrderStatus.DELIVERED
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : trackingOrder.status === 'SHIPPED'
                      ? 'bg-amber-100 border-[#ff6a00] text-[#ff6a00] animate-pulse'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  <p className="text-xs font-bold text-slate-900">Livraison</p>
                  <p className="text-[10px] text-slate-450 mt-0.5">Votre commande a bien été reçue.</p>
                </div>

              </div>

            </div>

            {/* Pied Modal */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="w-full rounded-lg bg-white border border-slate-300 hover:bg-slate-50 py-2 text-xs font-bold text-slate-700 transition-colors"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      <HomeFooter />
    </div>
  );
}
