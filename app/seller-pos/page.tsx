'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Plus, Minus, Trash2, User, Percent, Printer, X, Package, ShoppingCart } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import type { Product } from '@/lib/types';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export default function SellerPosPage(): React.ReactElement {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showCheckout, setShowCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (data?.products) setProducts(data.products);
        else if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      const price = product.offerPrice ?? product.price;
      return [...prev, { productId: product.id, name: product.name, price: Number(price), quantity: 1, stock: product.stock }];
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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const maxDiscount = Math.min(discount, subtotal);
  const finalAmount = Math.max(0, subtotal - maxDiscount);

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Panier vide'); return; }
    if (!session?.user?.id) { toast.error('Non connecté'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.price })),
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          discount: maxDiscount,
          discountReason: discount > 0 ? (discountReason || 'Remise manuelle') : null,
          paymentMethod,
        }),
      });
      if (!res.ok) throw new Error('Erreur paiement');
      const data = await res.json();
      toast.success(`Vente enregistrée #${data.invoiceNumber}`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      setDiscountReason('');
      setShowCheckout(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Left: Products */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="relative border-b p-3">
          <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit par nom ou marque..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Aucun produit trouvé</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((product) => {
                const price = product.offerPrice ?? product.price;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="flex flex-col items-center gap-1 rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm transition hover:border-blue-200 hover:shadow disabled:opacity-40"
                  >
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                      {product.imgUrl?.[0] ? (
                        <img src={product.imgUrl[0]} alt={product.name} className="max-h-12 w-auto object-contain" />
                      ) : (
                        <Package className="h-6 w-6 text-gray-300" />
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs font-medium text-gray-800">{product.name}</p>
                    <p className="text-xs font-bold text-blue-700">{formatPrice(Number(price))}</p>
                    <p className="text-[10px] text-gray-400">Stock: {product.stock}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="flex w-96 flex-col overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b p-3">
          <h2 className="text-sm font-bold text-gray-800">Panier ({cart.length})</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Panier vide</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.productId, -1)} className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200"><Minus className="h-3 w-3" /></button>
                    <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, 1)} className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200"><Plus className="h-3 w-3" /></button>
                  </div>
                  <p className="w-16 text-right text-xs font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</p>
                  <button onClick={() => removeFromCart(item.productId)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Sous-total</span>
            <span className="text-sm font-bold text-gray-900">{formatPrice(subtotal)}</span>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => setShowCheckout(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
            Payer {formatPrice(finalAmount)}
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Finaliser la vente</h3>
              <button onClick={() => setShowCheckout(false)} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Client (optionnel)</label>
                <div className="flex gap-2">
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nom" className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                  <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Téléphone" className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Remise (max {formatPrice(subtotal)})</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input type="number" value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} min="0" max={subtotal} className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-8 text-sm outline-none focus:border-blue-400" />
                  </div>
                </div>
                {discount > 0 && (
                  <input type="text" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} placeholder="Motif de la remise" className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Mode de paiement</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'CASH', label: 'Espèces' },
                    { value: 'MOBILE_MONEY', label: 'Mobile Money' },
                    { value: 'CARD', label: 'Carte' },
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        paymentMethod === m.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex justify-between text-sm text-gray-600"><span>Sous-total</span><span>{formatPrice(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Remise</span><span>-{formatPrice(discount)}</span></div>}
                <div className="mt-2 flex justify-between text-base font-bold text-gray-900"><span>Total</span><span>{formatPrice(finalAmount)}</span></div>
              </div>

              <button
                type="button"
                disabled={submitting || cart.length === 0}
                onClick={handleCheckout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Traitement...' : (
                  <>
                    <Printer className="h-4 w-4" />
                    Valider et imprimer ({formatPrice(finalAmount)})
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
