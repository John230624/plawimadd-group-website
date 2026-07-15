'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Minus,
  Package,
  Percent,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { useAppContext } from '@/context/AppContext';
import type { Product } from '@/lib/types';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
}

interface LastSale {
  transactionId: string;
  invoiceNumber: string;
  totalAmount: number;
}

function readProductsResponse(data: any): Product[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function PosCaissePage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
const [customerName, setCustomerName] = useState('');
const [customerPhone, setCustomerPhone] = useState('');
const [customerEmail, setCustomerEmail] = useState('');
const [customerIFU, setCustomerIFU] = useState('');
const [customerAddress, setCustomerAddress] = useState('');
const [paymentType, setPaymentType] = useState<'CASH' | 'TRANSFER' | 'INSTALLMENT'>('CASH');
const [paidAmount, setPaidAmount] = useState(0);
const [dueDate, setDueDate] = useState('');
const [discount, setDiscount] = useState(0);
const [discountReason, setDiscountReason] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState<LastSale | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setProducts(readProductsResponse(data)))
      .catch(() => toast.error('Impossible de charger les produits.'));
  }, []);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const visibleProducts = products.filter((product) => product.visible !== false);
    if (!query) return visibleProducts.slice(0, 40);
    return visibleProducts
      .filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.category?.name?.toLowerCase().includes(query)
      )
      .slice(0, 80);
  }, [products, searchQuery]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Stock insuffisant');
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      if (product.stock <= 0) {
        toast.error('Produit en rupture');
        return prev;
      }

      const price = Number(product.offerPrice ?? product.price);
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price,
          quantity: 1,
          stock: product.stock,
          image: product.imgUrl?.[0],
        },
      ];
    });
    setSearchQuery('');
    searchRef.current?.focus();
  }, []);

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock) {
            toast.error('Stock insuffisant');
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const openInvoice = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/pos/invoice?transactionId=${transactionId}`);
      if (!res.ok) throw new Error('Facture indisponible');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur facture');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const maxDiscount = Math.min(discount, subtotal);
  const finalAmount = Math.max(0, subtotal - maxDiscount);
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Panier vide');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Nom du client requis');
      return;
    }
    if (!session?.user?.id) {
      toast.error('Non connecté');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || null,
          customerEmail: customerEmail.trim() || null,
          customerIFU: customerIFU.trim() || null,
          customerAddress: customerAddress.trim() || null,
          discount: maxDiscount,
          discountReason: maxDiscount > 0 ? (discountReason || 'Remise manuelle') : null,
          paymentType,
          paidAmount: paymentType === 'INSTALLMENT' ? Math.max(0, Math.min(paidAmount || 0, maxDiscount > 0 ? finalAmount : subtotal)) : 0,
          dueDate: paymentType === 'INSTALLMENT' && dueDate ? dueDate : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Erreur paiement');

      toast.success(`Vente enregistrée #${data.invoiceNumber}`);
      setLastSale({
        transactionId: data.transactionId,
        invoiceNumber: data.invoiceNumber,
        totalAmount: data.totalAmount,
      });
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerIFU('');
      setCustomerAddress('');
      setPaymentType('CASH');
      setPaidAmount(0);
      setDueDate('');
      setDiscount(0);
      setDiscountReason('');
      setShowCheckout(false);
      await openInvoice(data.transactionId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-700 text-yellow-400">Boutique</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Sélectionnez les produits, renseignez le client, encaissez en espèces.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSale && (
            <button
              type="button"
              onClick={() => openInvoice(lastSale.transactionId)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-600 text-white shadow-lg transition hover:opacity-90"
            >
              <Receipt className="h-4 w-4" />
              Facture {lastSale.invoiceNumber}
            </button>
          )}
          <Link
            href="/seller/pos"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-xs font-500 text-[var(--text-primary)] transition hover:bg-[#121212] hover:text-white focus:bg-[#121212] focus:text-white active:bg-[#121212] active:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_400px] grid-rows-[auto_1fr] gap-x-6 gap-y-1">
        {/* Search zone */}
        <div className="rounded-[10px] bg-[var(--bg-card)] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par produit, marque ou catégorie..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 pl-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-yellow-400"
            />
          </div>
        </div>

        {/* Panier header */}
        <div className="rounded-[10px] bg-[var(--bg-card)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Panier</h2>
            <span className="rounded-full bg-yellow-400/20 px-2.5 py-1 text-xs font-600 text-yellow-400">
              {itemsCount} article(s)
            </span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[10px] bg-[var(--bg-card)]">
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <p className="py-16 text-center text-sm text-[var(--text-tertiary)]">Aucun produit trouvé</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filtered.map((product) => {
                  const price = Number(product.offerPrice ?? product.price);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className="group flex min-h-[154px] flex-col rounded-[10px] border border-transparent bg-[var(--bg-outer)] p-3 text-left transition hover:scale-[1.02] hover:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <div className="mb-2 flex h-16 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-hover)]">
                        {product.imgUrl?.[0] ? (
                          <img src={product.imgUrl[0]} alt={product.name} className="max-h-14 w-auto object-contain" />
                        ) : (
                          <Package className="h-7 w-7 text-[var(--text-tertiary)]" />
                        )}
                      </div>
                      <p className="line-clamp-2 min-h-[32px] text-xs font-600 text-[var(--text-primary)]">{product.name}</p>
                      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                        <p className="text-sm font-bold text-[var(--accent-blue)]">{formatPrice(price)}</p>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-600 ${
                          product.stock <= 5
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]'
                        }`}>
                          {product.stock}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart items + totals */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[10px] bg-[var(--bg-card)]">
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
                <ShoppingCart className="mb-3 h-8 w-8 text-[var(--text-tertiary)]" />
                <p className="text-sm font-500 text-[var(--text-secondary)]">Panier vide</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">Touchez un produit pour l'ajouter.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg-outer)] p-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--bg-hover)]">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="max-h-8 w-auto object-contain" />
                      ) : (
                        <Package className="h-5 w-5 text-[var(--text-tertiary)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-600 text-[var(--text-primary)]">{item.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => updateQty(item.productId, -1)} className="flex h-7 w-7 items-center justify-center rounded bg-[var(--bg-hover)] text-[var(--text-secondary)] transition hover:bg-[#121212] hover:text-white focus:bg-[#121212] focus:text-white active:bg-[#121212] active:text-white">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-[var(--text-primary)]">{item.quantity}</span>
                      <button type="button" onClick={() => updateQty(item.productId, 1)} className="flex h-7 w-7 items-center justify-center rounded bg-[var(--bg-hover)] text-[var(--text-secondary)] transition hover:bg-[#121212] hover:text-white focus:bg-[#121212] focus:text-white active:bg-[#121212] active:text-white">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.productId)} className="text-[var(--text-tertiary)] transition hover:text-[var(--accent-red)]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border)] p-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Sous-total</span>
                <span className="font-600 text-[var(--text-primary)]">{formatPrice(subtotal)}</span>
              </div>
              {maxDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Remise</span>
                  <span className="font-600">-{formatPrice(maxDiscount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 text-base font-bold text-[var(--text-primary)]">
                <span>Total</span>
                <span>{formatPrice(finalAmount)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
              className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-yellow-400 px-5 py-2.5 text-base font-bold text-blue-700 transition hover:bg-yellow-300 disabled:opacity-40"
            >
              <Banknote className="h-5 w-5" />
              Encaisser le paiement
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-yellow-400">Finaliser la vente</h3>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">Paiement physique en espèces.</p>
              </div>
              <button type="button" onClick={() => setShowCheckout(false)} className="text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Nom du client *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Jean Koffi"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Téléphone (optionnel)</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Numéro du client"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Email (pour facture)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@client.com"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">IFU (optionnel)</label>
                <input
                  type="text"
                  value={customerIFU}
                  onChange={(e) => setCustomerIFU(e.target.value)}
                  placeholder="Numéro IFU du client"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Adresse (optionnel)</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Adresse du client"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Mode de paiement *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'TRANSFER', 'INSTALLMENT'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type)}
                      className={`rounded-lg border px-3 py-2 text-xs font-600 transition ${
                        paymentType === type
                          ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-yellow-400/50'
                      }`}
                    >
                      {type === 'CASH' ? 'Espèces' : type === 'TRANSFER' ? 'Virement' : 'Tranche'}
                    </button>
                  ))}
                </div>
              </div>

              {paymentType === 'INSTALLMENT' && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Montant versé (acompte)</label>
                    <input
                      type="number"
                      value={paidAmount || ''}
                      onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value)))}
                      placeholder={`Max: ${formatPrice(finalAmount)}`}
                      max={finalAmount}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-yellow-400"
                    />
                    {paidAmount > 0 && paidAmount < finalAmount && (
                      <p className="mt-1 text-xs text-yellow-400">
                        Reste à payer: {formatPrice(finalAmount - paidAmount)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Date d'échéance</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-yellow-400"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Remise (max {formatPrice(subtotal)})</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    min="0"
                    max={subtotal}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 pl-8 text-sm text-[var(--text-primary)] outline-none transition focus:border-yellow-400"
                  />
                </div>
                {maxDiscount > 0 && (
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Motif de la remise"
                    className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-yellow-400"
                  />
                )}
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-600 text-emerald-400">Paiement en espèces</span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
              </div>

              <div className="rounded-lg bg-[var(--bg-outer)] p-3">
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>Sous-total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {maxDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Remise</span>
                    <span>-{formatPrice(maxDiscount)}</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between text-base font-bold text-[var(--text-primary)]">
                  <span>Total à encaisser</span>
                  <span>{formatPrice(finalAmount)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={submitting || cart.length === 0 || !customerName.trim()}
                onClick={handleCheckout}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-5 py-2.5 text-base font-bold text-blue-700 transition hover:bg-yellow-300 disabled:opacity-40"
              >
                {submitting ? (
                  'Traitement...'
                ) : (
                  <>
                    <Printer className="h-5 w-5" />
                    Valider et générer la facture
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
