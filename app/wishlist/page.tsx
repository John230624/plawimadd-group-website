'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import { toast } from 'react-toastify';

import HomeFooter from '@/components/home/HomeFooter';
import { useAppContext } from '@/context/AppContext';

function getDisplayPrice(price: number, offerPrice: number | null): number {
  if (offerPrice !== null && offerPrice !== undefined && offerPrice < price) {
    return offerPrice;
  }

  return price;
}

export default function WishlistPage(): React.ReactElement {
  const { products, wishlistItems, toggleWishlist, addToCart, formatPrice, router, colors } = useAppContext();

  const favoriteProducts = useMemo(
    () => products.filter((product) => wishlistItems.includes(product.id)),
    [products, wishlistItems]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-0 pt-6 md:px-6 lg:px-8">
        <section className="px-2 pb-2 md:px-0">
          <div className="px-3 py-4 md:px-0 md:py-0">
            <p className="text-sm text-slate-500">Accueil / Favoris</p>
            <h1 className="mt-4 text-[2.2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[3rem]">
              Ma liste de favoris
            </h1>
          </div>
        </section>

        <section className="px-2 pb-12 pt-8 md:px-0">
          <div className="px-3 py-4 md:px-0 md:py-0">
            {favoriteProducts.length === 0 ? (
              <div className="rounded-[1.9rem] bg-white p-10 text-center shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-700)]">
                  <Heart className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-[1.6rem] font-semibold text-slate-950">
                  Aucun produit favori pour le moment
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Ajoutez des produits a votre liste pour les retrouver rapidement plus tard.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {favoriteProducts.map((product) => {
                  const imageSrc = product.imgUrl?.[0] || '/images/default_product_image.png';
                  const displayPrice = getDisplayPrice(product.price, product.offerPrice);
                  const productColorIds: string[] = (() => {
                    if (!product.color) return [];
                    try { const p = JSON.parse(product.color); return Array.isArray(p) ? p : []; } catch { return []; }
                  })();

                  return (
                    <article
                      key={product.id}
                      className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
                    >
                      <div className="relative rounded-[1.75rem] bg-slate-100 p-5">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm"
                        >
                          <Heart className="h-5 w-5 fill-current stroke-[1.8]" />
                        </button>

                        <button
                          type="button"
                          className="relative mx-auto block h-[290px] w-full cursor-pointer"
                          onClick={() => router.push(`/product/${product.id}`)}
                        >
                          <Image src={imageSrc} alt={product.name} fill className="object-contain" />
                        </button>
                      </div>

                      <div className="px-5 pb-4 pt-3">
                        <h2 className="min-h-[54px] text-[1.05rem] font-semibold leading-6 text-slate-950">
                          {product.name}
                        </h2>
                        {productColorIds.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {productColorIds.map((id) => {
                              const c = colors.find((col) => col.id === id);
                              if (!c) return null;
                              return (
                                <div key={id} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500">
                                  <span className="h-2 w-2 rounded-full border border-slate-200" style={{ backgroundColor: c.hex }} />
                                  {c.name}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <p className="mt-2 text-sm text-slate-500">{product.brand || 'Plawimadd'}</p>
                        <p className="mt-3 text-[1.15rem] font-semibold text-slate-950">
                          {formatPrice(displayPrice)}
                        </p>

                        <button
                          type="button"
                          onClick={async () => {
                            const success = await addToCart(product.id);
                            if (success) {
                              toast.success('Ajoute au panier');
                            }
                          }}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-950)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-900)]"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Ajouter au panier
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
