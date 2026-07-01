'use client';

import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Loader2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

import AddressCheckoutModal from '@/components/cart/AddressCheckoutModal';
import HomeFooter from '@/components/home/HomeFooter';
import ProductCarouselSection from '@/components/home/ProductCarouselSection';
import { useAppContext } from '@/context/AppContext';
import type { Address, Product, StudentInstallmentRequest } from '@/lib/types';
import type { KkiapayErrorResponse, KkiapaySuccessResponse } from '@/types/kkiapay';

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
    window.openKkiapayWidget({
      amount: subtotal,
      api_key: KKIAPAY_PUBLIC_API_KEY,
      callback: `${window.location.origin}/api/kkiapay-callback?transactionId=${transactionIdForKkiapay}`,
      email: currentUser.email,
      phone: selectedAddress.phoneNumber || '',
      position: 'center',
      sandbox: false,
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
                <h1 className="mt-4 text-[2.2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[3rem]">
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
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Vider le panier
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="px-2 pb-2 pt-8 md:px-0">
          <div className="grid gap-6 px-3 py-4 md:px-0 md:py-0 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              {cartProducts.length === 0 ? (
                <div className="rounded-[1.9rem] bg-white p-10 text-center shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-700)]">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 text-[1.6rem] font-semibold text-slate-950">
                    Votre panier est vide
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Ajoutez quelques produits pour continuer votre commande.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/all-products')}
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--brand-300)] px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-[rgba(191,219,254,0.22)] hover:text-[var(--brand-700)]"
                  >
                    Continuer mes achats
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                cartProducts.map(({ product, quantity }) => {
                  const imageSrc = product.imgUrl?.[0] || '/images/default_product_image.png';
                  const displayPrice = getDisplayPrice(product);

                  return (
                    <article
                      key={product.id}
                      className="grid gap-5 rounded-[1.75rem] bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] md:grid-cols-[120px_1fr_auto]"
                    >
                      <div className="relative flex h-[120px] items-center justify-center overflow-hidden rounded-[1.25rem] bg-slate-100">
                        <Image
                          src={imageSrc}
                          alt={product.name}
                          width={180}
                          height={180}
                          className="max-h-[100px] w-auto object-contain"
                        />
                      </div>

                      <div className="flex flex-col justify-between gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="max-w-[34ch] text-[1.15rem] font-semibold leading-7 text-slate-950">
                              {product.name}
                            </h2>
                            <div className="mt-3 space-y-1 text-sm text-slate-500">
                              <p>Marque: {product.brand || 'Plawimadd'}</p>
                              <p>Couleur: {product.color || 'Standard'}</p>
                              <p>Stock: {product.stock}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteFromCart(product.id)}
                            className="text-slate-300 transition hover:text-slate-500"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeFromCart(product.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                updateCartQuantity(product.id, Math.max(1, Number(event.target.value) || 1))
                              }
                              className="w-10 bg-transparent text-center text-sm font-medium text-slate-800 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => addToCart(product.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="text-left md:text-right">
                            <p className="text-sm text-slate-500">Prix</p>
                            <p className="mt-1 text-[1.2rem] font-semibold text-slate-950">
                              {formatPrice(displayPrice * quantity)}
                            </p>
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
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-300)] bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-[rgba(191,219,254,0.22)] hover:text-[var(--brand-700)]"
                >
                  Continuer mes achats
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <aside className="h-fit rounded-[1.75rem] bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] xl:sticky xl:top-6">
              <h2 className="text-[1.2rem] font-semibold text-slate-950">Votre commande</h2>

              <div className="mt-6 space-y-4 text-sm text-slate-500">
                <div className="flex items-center justify-between">
                  <span>{getCartCount()} produit(s)</span>
                  <span>{formatPrice(oldSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reduction</span>
                  <span className="text-emerald-600">-{formatPrice(savings)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Livraison</span>
                  <span>{cartProducts.length > 0 ? 'Offerte' : formatPrice(0)}</span>
                </div>
              </div>

              <div className="mt-6 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
                <label className="text-sm text-slate-500">Code promo</label>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(event) => setPromoCode(event.target.value)}
                    placeholder="Entrez votre code"
                    className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-600)] text-white"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <div className="mb-4 rounded-[1.2rem] bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">Adresse de livraison</p>
                  {selectedAddress ? (
                    <div className="mt-2 text-sm leading-7 text-slate-600">
                      <p className="font-semibold text-slate-900">{selectedAddress.fullName}</p>
                      <p>{selectedAddress.phoneNumber}</p>
                      <p>
                        {selectedAddress.area}, {selectedAddress.city}, {selectedAddress.state}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      Aucune adresse selectionnee pour le moment.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="text-[1.35rem] font-semibold text-slate-950">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-[1.2rem] border border-[rgba(148,163,184,0.14)] bg-[rgba(237,244,253,0.55)] p-4">
                <p className="text-sm font-semibold text-slate-900">Paiement par tranche etudiant</p>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  {studentRequest?.status === 'APPROVED'
                    ? `Votre dossier est approuve. Plan applique: 50% maintenant (${formatPrice(
                        subtotal / 2
                      )}), puis 25% le 2e mois (${formatPrice(subtotal / 4)}) et 25% le 3e mois (${formatPrice(
                        subtotal - subtotal / 2 - subtotal / 4
                      )}).`
                    : studentRequest?.status === 'PENDING'
                      ? 'Votre dossier est en cours de verification. Le plan etudiant reste bloque tant que la validation admin n est pas faite.'
                      : studentRequest?.status === 'REJECTED'
                        ? 'Votre precedent dossier a ete refuse. Vous pouvez en soumettre un nouveau depuis la page Offres.'
                        : 'Soumettez d abord votre dossier etudiant depuis la page Offres. Le plan est fixe a 3 tranches: 50%, puis 25%, puis 25%.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!currentUser?.id) {
                    toast.info('Connectez-vous pour finaliser la commande.');
                    router.push('/login');
                    return;
                  }

                  setIsAddressModalOpen(true);
                  setCheckoutMode('standard');
                }}
                disabled={cartProducts.length === 0 || isPaymentLoading}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-600)] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPaymentLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ouverture du paiement...
                  </>
                ) : (
                  'Finaliser la commande'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!currentUser?.id) {
                    toast.info('Connectez-vous pour continuer.');
                    router.push('/login');
                    return;
                  }

                  if (!studentRequest || studentRequest.status !== 'APPROVED') {
                    router.push('/offer');
                    return;
                  }

                  setCheckoutMode('student');
                  setIsAddressModalOpen(true);
                }}
                disabled={cartProducts.length === 0 || isPaymentLoading}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-[var(--brand-300)] bg-white px-6 py-4 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[rgba(191,219,254,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {studentRequest?.status === 'APPROVED'
                  ? 'Commander en paiement par tranche'
                  : 'Activer mon dossier etudiant'}
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
