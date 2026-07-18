'use client';

import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, ArrowRight, Bookmark, Clock, Loader2, Minus, Plus, ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

import AddressCheckoutModal from '@/components/cart/AddressCheckoutModal';
import HomeFooter from '@/components/home/HomeFooter';
import ProductCarouselSection from '@/components/home/ProductCarouselSection';
import { CartItemSkeleton } from '@/components/Skeleton';
import { useAppContext } from '@/context/AppContext';
import type { Address, Product, StudentInstallmentRequest } from '@/lib/types';
import type { KkiapayErrorResponse, KkiapaySuccessResponse } from '@/types/kkiapay';
import MiniCustomOfferWidget from '@/components/MiniCustomOfferWidget';

function getColorDisplay(color: string | null | undefined, colorMap: Record<string, string>): string {
  if (!color) return 'Standard';
  try {
    const ids = JSON.parse(color);
    if (Array.isArray(ids) && ids.length > 0) {
      return ids.map((id: string) => colorMap[id] || id).join(', ');
    }
  } catch {}
  return color;
}

function getDisplayPrice(product: Product): number {
  if (
    product.offerPrice !== null &&
    product.offerPrice !== undefined &&
    product.offerPrice < product.price
  ) {
    return product.offerPrice;
  }

  return product.price;
}

export default function CartPage(): React.ReactElement {
  const {
    products,
    router,
    cartItems,
    loadingCart,
    addToCart,
    removeFromCart,
    deleteFromCart,
    updateCartQuantity,
    getCartCount,
    getCartAmount,
    formatPrice,
    clearCart,
    currentUser,
    userAddresses,
    fetchUserAddresses,
    currency,
    url,
  } = useAppContext();

  const [promoCode, setPromoCode] = useState('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/colors')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map: Record<string, string> = {};
          data.forEach((c: { id: string; name: string }) => { map[c.id] = c.name; });
          setColorMap(map);
        }
      })
      .catch(() => {});
  }, []);
  const [savedItems, setSavedItems] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('savedItems');
        return saved ? JSON.parse(saved) : [];
      } catch { return []; }
    }
    return [];
  });
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [showKkiapayWidget, setShowKkiapayWidget] = useState(false);
  const [transactionIdForKkiapay, setTransactionIdForKkiapay] = useState<string | null>(null);
  const [isKkiapayWidgetApiReady, setIsKkiapayWidgetApiReady] = useState(false);
  const [studentRequest, setStudentRequest] = useState<StudentInstallmentRequest | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<'standard' | 'student'>('standard');

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchUserAddresses();
  }, [currentUser?.id, fetchUserAddresses]);

  useEffect(() => {
    const fetchStudentRequest = async () => {
      if (!currentUser?.id) {
        setStudentRequest(null);
        return;
      }

      try {
        const response = await axios.get('/api/student-installment');
        const requests = response.data?.requests || [];
        const approved = requests.find(
          (request: StudentInstallmentRequest) => request.status === 'APPROVED'
        );
        setStudentRequest(approved || requests[0] || null);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStudentRequest();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!userAddresses.length) return;
    const defaultAddress = userAddresses.find((address) => address.isDefault) || userAddresses[0];
    setSelectedAddress(defaultAddress);
  }, [userAddresses]);

  const cartProducts = useMemo(() => {
    return Object.entries(cartItems)
      .map(([productId, quantity]) => {
        const product = products.find((item) => item.id === productId);
        if (!product || quantity <= 0) return null;
        return { product, quantity };
      })
      .filter((item): item is { product: Product; quantity: number } => Boolean(item));
  }, [cartItems, products]);

  const hasMoqWarning = useMemo(() => {
    return false;
  }, []);

  const earliestLeadTime = useMemo(() => {
    const times = cartProducts
      .map(({ product }) => product.leadTimeRange)
      .filter(Boolean) as string[];
    if (times.length === 0) return null;
    const short = times.reduce((a, b) => a.length <= b.length ? a : b);
    return short;
  }, [cartProducts]);

  const savedProducts = useMemo(() => {
    return savedItems
      .map(id => products.find(p => p.id === id))
      .filter(Boolean) as Product[];
  }, [savedItems, products]);

  const toggleSaved = (productId: string) => {
    setSavedItems(prev => {
      const next = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem('savedItems', JSON.stringify(next));
      return next;
    });
  };

  const subtotal = getCartAmount();
  const oldSubtotal = cartProducts.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const savings = Math.max(0, oldSubtotal - subtotal);
  const relatedProducts = useMemo(() => {
    const cartCategoryNames = new Set(cartProducts.map((item) => item.product.category?.name));

    return products
      .filter(
        (product) =>
          !cartItems[product.id] &&
          (cartCategoryNames.size === 0 || cartCategoryNames.has(product.category?.name))
      )
      .slice(0, 8);
  }, [cartItems, cartProducts, products]);

  const KKIAPAY_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_API_KEY;

  useEffect(() => {
    const isWidgetReady = () =>
      typeof window !== 'undefined' &&
      typeof window.openKkiapayWidget === 'function' &&
      typeof window.addSuccessListener === 'function' &&
      typeof window.addFailedListener === 'function';

    if (isWidgetReady()) {
      setIsKkiapayWidgetApiReady(true);
      return;
    }

    const intervalId = window.setInterval(() => {
      if (isWidgetReady()) {
        setIsKkiapayWidgetApiReady(true);
        window.clearInterval(intervalId);
      }
    }, 150);

    return () => window.clearInterval(intervalId);
  }, []);

  const createTransactionId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const handleProceedToCheckout = async (address: Address): Promise<void> => {
    if (!currentUser?.id || !currentUser.email) {
      toast.info('Connectez-vous pour finaliser la commande.');
      router.push('/login');
      return;
    }

    if (cartProducts.length === 0) {
      toast.info('Votre panier est vide.');
      return;
    }

    if (hasMoqWarning) {
      toast.warning('Certains produits n\'atteignent pas la quantite minimale de commande (MOQ).');
      return;
    }

    if (!KKIAPAY_PUBLIC_API_KEY) {
      toast.error("La configuration du paiement n'est pas encore disponible.");
      return;
    }

    if (!isKkiapayWidgetApiReady) {
      toast.info('Le module de paiement est en cours de chargement. Reessayez dans un instant.');
      return;
    }

    setSelectedAddress(address);
    setIsAddressModalOpen(false);
    setIsPaymentLoading(true);

    const nextTransactionId = createTransactionId();
    setTransactionIdForKkiapay(nextTransactionId);
    setShowKkiapayWidget(true);
  };

  const handleProceedToStudentInstallment = async (address: Address): Promise<void> => {
    if (!currentUser?.id || !currentUser.email) {
      toast.info('Connectez-vous pour finaliser la commande.');
      router.push('/login');
      return;
    }

    if (!studentRequest || studentRequest.status !== 'APPROVED') {
      toast.info("Votre dossier etudiant doit etre approuve avant d'utiliser cette option.");
      router.push('/offer');
      return;
    }

    const orderItems = cartProducts.map(({ product, quantity }) => ({
      productId: product.id,
      quantity,
      price: getDisplayPrice(product),
    }));

    if (!orderItems.length) {
      toast.info('Votre panier est vide.');
      return;
    }

    setIsPaymentLoading(true);

    try {
      const orderId = createTransactionId();
      const response = await axios.post(
        `${url}/api/orders/create-installment-request`,
        {
          id: orderId,
          items: orderItems,
          totalAmount: subtotal,
          shippingAddress: address,
          userEmail: currentUser.email,
          userPhoneNumber: address.phoneNumber || currentUser.phoneNumber || null,
          currency,
          installmentRequestId: studentRequest.id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Commande etudiante impossible.');
      }

      clearCart();
      setSelectedAddress(address);
      setIsAddressModalOpen(false);
      toast.success('Votre demande de commande etudiante a ete enregistree.');
      router.push(`/order-status?orderId=${response.data.orderId}&status=pending`);
    } catch (error) {
      console.error(error);
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : 'Erreur lors de la commande etudiante.'
      );
    } finally {
      setIsPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (!showKkiapayWidget || !transactionIdForKkiapay || !selectedAddress) {
      return;
    }

    if (!currentUser?.email || !KKIAPAY_PUBLIC_API_KEY || !window.openKkiapayWidget) {
      setIsPaymentLoading(false);
      setShowKkiapayWidget(false);
      return;
    }

    const successListener = async (response: KkiapaySuccessResponse) => {
      try {
        const orderItems = cartProducts.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
          price: getDisplayPrice(product),
        }));

        if (orderItems.length === 0) {
          toast.error('Le panier est vide.');
          router.push('/cart');
          return;
        }

        const orderResponse = await axios.post(
          `${url}/api/orders/create-after-payment`,
          {
            id: transactionIdForKkiapay,
            items: orderItems,
            totalAmount: subtotal,
            shippingAddress: selectedAddress,
            paymentMethod: 'Kkiapay',
            userEmail: currentUser.email,
            userPhoneNumber: selectedAddress.phoneNumber || currentUser.phoneNumber || null,
            currency,
            kkiapayTransactionId: response.transactionId,
            kkiapayPaymentMethod: response.paymentMethod,
            kkiapayAmount: response.amount,
            kkiapayStatus: response.status || 'SUCCESS',
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!orderResponse.data?.success) {
          throw new Error(orderResponse.data?.message || 'La commande n a pas pu etre finalisee.');
        }

        clearCart();
        toast.success('Paiement reussi. Votre commande est en cours de traitement.');
        router.push(`/order-status?orderId=${orderResponse.data.orderId}&status=success`);
      } catch (error) {
        console.error(error);
        const message =
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : 'Erreur lors de la finalisation de la commande.';

        toast.error(message);
        router.push(
          `/order-status?orderId=${transactionIdForKkiapay}&status=failed&message=${encodeURIComponent(
            message
          )}`
        );
      } finally {
        setIsPaymentLoading(false);
        setShowKkiapayWidget(false);
      }
    };

    const failedListener = (error: KkiapayErrorResponse) => {
      const message =
        error.reason?.message || error.message || 'Le paiement a ete annule ou a echoue.';
      toast.error(message);
      setIsPaymentLoading(false);
      setShowKkiapayWidget(false);
      router.push(
        `/order-status?orderId=${transactionIdForKkiapay}&status=failed&message=${encodeURIComponent(
          message
        )}`
      );
    };

    window.addSuccessListener?.(successListener);
    window.addFailedListener?.(failedListener);
    const isSandboxMode = process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX === 'true';

    window.openKkiapayWidget({
      amount: subtotal,
      api_key: KKIAPAY_PUBLIC_API_KEY,
      callback: `${window.location.origin}/api/kkiapay-callback?transactionId=${transactionIdForKkiapay}`,
      email: currentUser.email,
      phone: selectedAddress.phoneNumber || '',
      position: 'center',
      sandbox: isSandboxMode,
    });

    return () => {
      window.removeSuccessListener?.(successListener);
      window.removeFailedListener?.(failedListener);
    };
  }, [
    KKIAPAY_PUBLIC_API_KEY,
    cartProducts,
    clearCart,
    currency,
    currentUser?.email,
    currentUser?.phoneNumber,
    router,
    selectedAddress,
    showKkiapayWidget,
    subtotal,
    transactionIdForKkiapay,
    url,
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-0 pt-6 md:px-6 lg:px-8">
        <section className="px-2 pb-2 md:px-0">
          <div className="px-3 py-4 md:px-0 md:py-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">Accueil / Panier</p>
                <h1 className="mt-2 text-2.5xl font-extrabold tracking-tight text-slate-900">
                  Panier
                </h1>
              </div>

              {cartProducts.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    toast.success('Panier vide');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-650 transition hover:border-red-300 hover:bg-red-50/50"
                >
                  <Trash2 className="h-4 w-4" />
                  Vider le panier
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="px-2 pb-2 pt-6 md:px-0">
          <div className="grid gap-6 px-3 py-4 md:px-0 md:py-0 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              {loadingCart ? (
                <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-4">
                  <CartItemSkeleton />
                  <CartItemSkeleton />
                  <CartItemSkeleton />
                </div>
              ) : cartProducts.length === 0 ? (
                <div className="bg-white p-10 text-center rounded-lg border border-transparent shadow-none">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 text-slate-855 border border-transparent">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                    Votre panier est vide
                  </h2>
                  <p className="mt-2 text-xs leading-5 text-slate-500 font-medium">
                    Ajoutez quelques produits pour continuer votre commande.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/all-products')}
                    className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-slate-350 bg-white px-5 py-2.5 text-xs font-extrabold text-slate-850 hover:bg-slate-50 transition hover:border-slate-500 hover:text-slate-950"
                  >
                    Continuer mes achats
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                cartProducts.map(({ product, quantity }) => {
                  const imageSrc = product.imgUrl?.[0] || '/images/default_product_image.png';
                  const displayPrice = getDisplayPrice(product);
                  const moq = 1;
                  const belowMoq = false;

                  return (
                    <article
                      key={product.id}
                      className={`grid gap-5 bg-white p-5 border border-transparent rounded-lg shadow-none md:grid-cols-[120px_1fr_auto] ${
                        belowMoq ? 'ring-1 ring-amber-400' : ''
                      }`}
                    >
                      <div className="relative flex h-[120px] items-center justify-center overflow-hidden rounded-md bg-[#f7f7f7]">
                        <Image
                          src={imageSrc}
                          alt={product.name}
                          width={180}
                          height={180}
                          className="max-h-[100px] w-auto object-contain"
                        />
                      </div>

                      <div className="flex flex-col justify-between gap-4 text-left">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="max-w-[34ch] text-sm font-bold leading-5 text-slate-900">
                              {product.name}
                            </h2>
                            <div className="mt-2 space-y-1 text-xs text-slate-500 font-medium">
                              <p>Marque : {product.brand || 'Plawimadd'}</p>
                              <p>Couleur : {getColorDisplay(product.color, colorMap)}</p>
                              <p>Stock : {product.stock}</p>
                            </div>
                            {belowMoq && (
                              <div className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 border border-transparent">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                MOQ: minimum {moq} unité(s) requises
                              </div>
                            )}
                            {product.leadTimeRange && (
                              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
                                <Clock className="h-3 w-3" />
                                Expédié sous {product.leadTimeRange}
                              </div>
                            )}
                          </div>

                          <div className="flex items-start gap-1">
                            <button
                              type="button"
                              onClick={() => toggleSaved(product.id)}
                              className="text-slate-300 transition hover:text-slate-700 p-1"
                              title="Sauvegarder pour plus tard"
                            >
                              <Bookmark className={`h-4 w-4 ${savedItems.includes(product.id) ? 'fill-slate-800 text-slate-800' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteFromCart(product.id)}
                              className="text-slate-300 transition hover:text-slate-700 p-1"
                            >
                              <X className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="inline-flex w-fit items-center gap-2 border border-transparent bg-slate-100 p-1 rounded-md">
                            <button
                              type="button"
                              onClick={() => removeFromCart(product.id)}
                              className="flex h-7 w-7 items-center justify-center border border-transparent bg-white text-slate-700 font-bold rounded-md hover:bg-slate-50 transition"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              min={moq}
                              value={quantity}
                              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                updateCartQuantity(product.id, Math.max(moq, Number(event.target.value) || moq))
                              }
                              className="w-10 bg-transparent text-center text-xs font-bold text-slate-800 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => addToCart(product.id)}
                              className="flex h-7 w-7 items-center justify-center border border-transparent bg-white text-slate-700 font-bold rounded-md hover:bg-slate-50 transition"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3 text-left md:text-right">
                            {moq > 1 && (
                              <span className="text-[10px] text-slate-400">MOQ: {moq}</span>
                            )}
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prix</p>
                              <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                                {formatPrice(displayPrice * quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}

              {cartProducts.length > 0 ? (
                <button
                  type="button"
                  onClick={() => router.push('/all-products')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-350 bg-white px-5 py-2.5 text-xs font-extrabold text-slate-850 hover:bg-slate-50 transition hover:border-slate-500 hover:text-slate-950 text-left"
                >
                  Continuer mes achats
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : null}

              {/* Saved items */}
              {savedProducts.length > 0 && (
                <div className="text-left">
                  <h3 className="mb-4 text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark className="h-4 w-4 text-slate-500" />
                    Articles sauvegardés ({savedProducts.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {savedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="overflow-hidden rounded-lg border border-transparent bg-white shadow-none"
                      >
                        <div className="flex h-28 items-center justify-center bg-[#f7f7f7] p-3">
                          <Image
                            src={product.imgUrl?.[0] || '/images/default_product_image.png'}
                            alt={product.name}
                            width={80}
                            height={80}
                            className="max-h-20 w-auto object-contain"
                          />
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-bold text-slate-900 truncate">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500 font-semibold">{formatPrice(getDisplayPrice(product))}</p>
                          <div className="mt-2.5 flex gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                  await addToCart(product.id);
                                  toggleSaved(product.id);
                                  toast.success('Déplacé vers le panier');
                              }}
                              className="flex-1 bg-[#ff6a00] hover:bg-[#e25c00] px-2 py-1.5 text-[10px] font-bold text-white rounded-md transition"
                            >
                              Au panier
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSaved(product.id)}
                              className="border border-transparent bg-slate-100 hover:bg-slate-200 px-2 py-1.5 text-[10px] font-medium text-slate-500 rounded-md transition"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <aside className="h-fit bg-white p-6 border border-transparent rounded-lg shadow-none xl:sticky xl:top-6 text-left">
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Votre commande</h2>

              <div className="mt-6 space-y-4 text-xs text-slate-500 font-medium">
                <div className="flex items-center justify-between">
                  <span>{getCartCount()} produit(s)</span>
                  <span className="font-bold text-slate-850">{formatPrice(oldSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Réduction</span>
                  <span className="text-emerald-600 font-bold">-{formatPrice(savings)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-slate-400" />
                    Livraison
                  </span>
                  <span className="flex items-center gap-1.5">
                    {cartProducts.length > 0 ? (
                      <>
                        <span className="text-emerald-600 font-bold">Offerte</span>
                        {earliestLeadTime && (
                          <span className="text-[10px] text-slate-400">({earliestLeadTime})</span>
                        )}
                      </>
                    ) : formatPrice(0)}
                  </span>
                </div>
              </div>

              <div className="mt-5 border border-transparent bg-slate-50 p-4 rounded-lg">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Code promo</label>
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(event) => setPromoCode(event.target.value)}
                    placeholder="Entrez votre code"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#ff6a00] transition"
                  />
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-[#ff6a00] hover:bg-[#e25c00] text-white transition shrink-0"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="group relative mb-4 bg-slate-50 p-4 rounded-lg border border-transparent transition-all duration-300">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-850 flex items-center justify-between">
                    <span>Adresse de livraison</span>
                    {selectedAddress && (
                      <span className="text-[9px] text-[#ff6a00] font-bold uppercase tracking-normal animate-pulse group-hover:hidden">
                        (Survolez pour afficher)
                      </span>
                    )}
                  </p>
                  {selectedAddress ? (
                    <div className="mt-0 max-h-0 opacity-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:mt-2.5 group-hover:max-h-32 group-hover:opacity-100 text-xs leading-5 text-slate-600">
                      <p className="font-bold text-slate-900">{selectedAddress.fullName}</p>
                      <p className="font-medium">{selectedAddress.phoneNumber}</p>
                      <p className="font-medium text-slate-550">
                        {selectedAddress.area}, {selectedAddress.city}, {selectedAddress.state}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2.5">
                      <p className="text-[11px] leading-4 text-slate-500 font-medium">
                        Aucune adresse de livraison enregistrée.
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/add-address')}
                        className="mt-2.5 inline-flex w-full items-center justify-center bg-[#ff6a00] hover:bg-[#e25c00] text-white px-4 py-2 text-xs font-bold transition rounded-lg shadow-none"
                      >
                        Ajouter votre adresse
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Total</span>
                  <span className="text-[1.25rem] font-extrabold text-slate-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <MiniCustomOfferWidget />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!currentUser?.id) {
                    toast.info('Connectez-vous pour finaliser la commande.');
                    router.push('/login');
                    return;
                  }

                  if (!selectedAddress) {
                    toast.warn("Veuillez d'abord ajouter votre adresse de livraison dans la section 'Adresse de livraison' ci-dessus.");
                    return;
                  }

                  handleProceedToCheckout(selectedAddress);
                }}
                disabled={cartProducts.length === 0 || isPaymentLoading}
                className="mt-5 inline-flex w-full items-center justify-center bg-[#ff6a00] hover:bg-[#e25c00] text-white px-5 py-3 text-sm font-bold tracking-wider transition rounded-lg shadow-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPaymentLoading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Ouverture du paiement...
                  </>
                ) : (
                  'Finaliser la commande'
                )}
              </button>
            </aside>
          </div>
        </section>

        <ProductCarouselSection
          title="Avec ce produit, on achete aussi"
          actionLabel="Voir plus"
          products={relatedProducts}
          onAction={() => router.push('/all-products')}
        />
      </main>

      <HomeFooter />

      <AddressCheckoutModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onAddressSelected={
          checkoutMode === 'student' ? handleProceedToStudentInstallment : handleProceedToCheckout
        }
        selectedAddressId={selectedAddress?.id ?? null}
        selectActionLabel={
          checkoutMode === 'student'
            ? 'Utiliser cette adresse et soumettre'
            : 'Utiliser cette adresse et payer'
        }
        createActionLabel={
          checkoutMode === 'student'
            ? 'Enregistrer et soumettre'
            : 'Enregistrer et payer'
        }
      />
    </div>
  );
}
