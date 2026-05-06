'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronUp,
  Package,
  ShoppingBag,
  Truck,
} from 'lucide-react';

import HomeFooter from '@/components/home/HomeFooter';
import { useAppContext } from '@/context/AppContext';
import { OrderStatus, PaymentStatus } from '@/lib/types';

function getBadgeClasses(status: OrderStatus | PaymentStatus | null): string {
  if (!status) return 'bg-slate-100 text-slate-600';

  switch (status) {
    case OrderStatus.DELIVERED:
    case PaymentStatus.COMPLETED:
      return 'bg-emerald-100 text-emerald-700';
    case OrderStatus.SHIPPED:
    case OrderStatus.PROCESSING:
      return 'bg-[rgba(191,219,254,0.24)] text-[var(--brand-700)]';
    case OrderStatus.PENDING:
    case PaymentStatus.PENDING:
      return 'bg-amber-100 text-amber-700';
    case OrderStatus.CANCELLED:
    case OrderStatus.PAYMENT_FAILED:
    case PaymentStatus.FAILED:
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-600';
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
  } = useAppContext();
  const router = useRouter();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn && currentUser?.id) {
      fetchUserOrders();
    }
  }, [currentUser?.id, fetchUserOrders, isLoggedIn]);

  const totalSpent = useMemo(() => {
    return userOrders.reduce((sum, order) => {
      return order.paymentStatus === PaymentStatus.COMPLETED ? sum + order.totalAmount : sum;
    }, 0);
  }, [userOrders]);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-0 pt-8 md:px-6 lg:px-8">
        <section className="px-2 pb-2 md:px-0">
          <div className="px-3 py-4 md:px-0 md:py-0">
            <p className="text-sm text-slate-500">Accueil / Mes commandes</p>
            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-[2.2rem] font-semibold tracking-[-0.05em] text-slate-950 md:text-[3rem]">
                  Mes commandes
                </h1>
                <p className="mt-3 max-w-[68ch] text-sm leading-7 text-slate-500">
                  Retrouvez l&apos;historique de vos achats, suivez la livraison et consultez
                  les details importants de chaque commande.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.45rem] bg-white px-5 py-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                  <p className="text-sm text-slate-500">Commandes</p>
                  <p className="mt-2 text-[1.4rem] font-semibold text-slate-950">
                    {userOrders.length}
                  </p>
                </div>
                <div className="rounded-[1.45rem] bg-white px-5 py-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                  <p className="text-sm text-slate-500">En cours</p>
                  <p className="mt-2 text-[1.4rem] font-semibold text-slate-950">
                    {
                      userOrders.filter((order) =>
                        [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED].includes(
                          order.status
                        )
                      ).length
                    }
                  </p>
                </div>
                <div className="rounded-[1.45rem] bg-white px-5 py-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                  <p className="text-sm text-slate-500">Total depense</p>
                  <p className="mt-2 text-[1.4rem] font-semibold text-slate-950">
                    {formatPrice(totalSpent)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-2 pb-10 pt-8 md:px-0">
          <div className="space-y-5 px-3 py-4 md:px-0 md:py-0">
            {loadingOrders ? (
              <div className="rounded-[1.85rem] bg-white p-10 text-center shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                <p className="text-sm text-slate-500">Chargement de vos commandes...</p>
              </div>
            ) : errorFetchingOrders ? (
              <div className="rounded-[1.85rem] bg-white p-10 text-center shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                <h2 className="text-[1.5rem] font-semibold text-slate-950">Chargement impossible</h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">{errorFetchingOrders}</p>
              </div>
            ) : !isLoggedIn ? (
              <div className="rounded-[1.85rem] bg-white p-10 text-center shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-700)]">
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-[1.6rem] font-semibold text-slate-950">
                  Connectez-vous pour voir vos commandes
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Votre historique d&apos;achats apparaitra ici une fois la connexion effectuee.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--brand-600)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)]"
                >
                  Se connecter
                </button>
              </div>
            ) : userOrders.length === 0 ? (
              <div className="rounded-[1.85rem] bg-white p-10 text-center shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-700)]">
                  <Package className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-[1.6rem] font-semibold text-slate-950">
                  Aucune commande pour le moment
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Explorez le catalogue et passez votre premiere commande pour commencer votre historique.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/all-products')}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--brand-600)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)]"
                >
                  Voir le catalogue
                </button>
              </div>
            ) : (
              userOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;

                return (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-[1.9rem] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.05)]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOrderId((current) => (current === order.id ? null : order.id))
                      }
                      className="flex w-full flex-col gap-5 px-6 py-6 text-left md:px-7 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-[var(--brand-50)] p-3 text-[var(--brand-700)]">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Commande</p>
                          <h2 className="mt-1 text-[1.3rem] font-semibold text-slate-950">
                            #{order.id.slice(0, 8)}
                          </h2>
                          <p className="mt-2 text-sm text-slate-500">
                            {new Date(order.orderDate).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                        <div className="min-w-[140px]">
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Total</p>
                          <p className="mt-2 text-[1.2rem] font-semibold text-slate-950">
                            {formatPrice(order.totalAmount)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getBadgeClasses(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getBadgeClasses(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded ? (
                      <div className="border-t border-slate-100 px-6 py-6 md:px-7">
                        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
                          <div>
                            <h3 className="text-[1.15rem] font-semibold text-slate-950">
                              Produits de la commande
                            </h3>
                            <div className="mt-5 grid gap-4">
                              {order.orderItems.map((item, index) => {
                                const imageSrc =
                                  item.product.imgUrl?.[0] || '/images/default_product_image.png';

                                return (
                                  <div
                                    key={`${item.productId}-${index}`}
                                    className="flex gap-4 rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4"
                                  >
                                    <div className="flex h-[92px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-white">
                                      <Image
                                        src={imageSrc}
                                        alt={item.product.name}
                                        width={100}
                                        height={100}
                                        className="max-h-[74px] w-auto object-contain"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-slate-950">
                                        {item.product.name}
                                      </p>
                                      <p className="mt-2 text-sm text-slate-500">
                                        Quantite: {item.quantity}
                                      </p>
                                      <p className="mt-1 text-sm text-slate-500">
                                        Prix unitaire: {formatPrice(item.priceAtOrder)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-5">
                            <div className="rounded-[1.4rem] bg-slate-50 p-5">
                              <h3 className="text-[1.05rem] font-semibold text-slate-950">
                                Livraison
                              </h3>
                              <div className="mt-4 space-y-1 text-sm leading-7 text-slate-600">
                                <p>{order.shippingAddressLine1}</p>
                                {order.shippingAddressLine2 ? <p>{order.shippingAddressLine2}</p> : null}
                                <p>
                                  {order.shippingCity}, {order.shippingState}
                                </p>
                                {order.shippingZipCode ? <p>{order.shippingZipCode}</p> : null}
                                <p>{order.shippingCountry}</p>
                              </div>
                            </div>

                            <div className="rounded-[1.4rem] bg-slate-50 p-5">
                              <h3 className="text-[1.05rem] font-semibold text-slate-950">
                                Paiement et contact
                              </h3>
                              <div className="mt-4 space-y-2 text-sm leading-7 text-slate-600">
                                <p>Email: {order.userEmail}</p>
                                {order.userPhoneNumber ? (
                                  <p>Telephone: {order.userPhoneNumber}</p>
                                ) : null}
                                <p>Methode: {order.paymentMethod || 'Non precisee'}</p>
                                <p>Statut paiement: {order.paymentStatus}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
