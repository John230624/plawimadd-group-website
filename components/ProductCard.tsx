'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import { toast } from 'react-toastify';

import { assets } from '@/assets/assets';
import { useAppContext } from '@/context/AppContext';
import type { Product } from '@/lib/types';
import CountryFlag from '@/components/CountryFlag';

interface ProductCardProps {
  product: Product;
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

function getDiscountPercent(product: Product): number | null {
  if (
    product.offerPrice !== null &&
    product.offerPrice !== undefined &&
    product.offerPrice < product.price
  ) {
    return Math.round(((product.price - product.offerPrice) / product.price) * 100);
  }

  return null;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    addToCart,
    cartItems,
    formatPrice,
    isInWishlist,
    isLoggedIn,
    router,
    toggleWishlist,
  } = useAppContext();
  const toastShownRef = useRef<boolean>(false);

  if (!product) return null;

  const displayPrice = getDisplayPrice(product);
  const discountPercent = getDiscountPercent(product);
  const imageUrl = product.imgUrl?.[0] || assets.default_product_image.src;
  const isInCart = Boolean(cartItems[product.id]);
  const soldCount = product.soldCount ?? 0;

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.info('Connectez-vous pour ajouter au panier.');
      router.push('/login');
      return;
    }

    if (isInCart) {
      if (!toastShownRef.current) {
        toast.info('Ce produit est deja dans votre panier.');
        toastShownRef.current = true;
        setTimeout(() => (toastShownRef.current = false), 1000);
      }
      return;
    }

    const success = await addToCart(product.id);
    if (success) {
      toast.success('Ajoute au panier !');
    }
  };

  const handleCardClick = () => {
    router.push(`/product/${product.id}`);
  };

  const handleWishlistClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-transparent bg-white p-2.5 shadow-none transition duration-300 lg:h-[370px]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#f7f7f7]">
        <Image
          src={imageUrl}
          alt={product.name || 'Produit'}
          fill
          sizes="(min-width: 1536px) 190px, (min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
          className="object-contain transition duration-500 group-hover:scale-[1.04]"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = assets.default_product_image.src;
          }}
        />

        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {discountPercent ? (
            <span className="rounded-full bg-[#ff6a00] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              -{discountPercent}%
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleWishlistClick}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:text-[#ff6a00] ${
            isInWishlist(product.id) ? 'text-[#ff6a00]' : 'text-[#666]'
          }`}
          aria-label="Ajouter aux favoris"
        >
          <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
        </button>

        <div className="absolute inset-x-2 bottom-2 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isInCart}
            className={`inline-flex h-9 w-full items-center justify-center gap-2 rounded-full text-[11px] font-bold shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition ${
              isInCart
                ? 'bg-[#ecfdf3] text-[#238a43]'
                : 'bg-[#ff6a00] text-white hover:bg-[#e65f00]'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {isInCart ? 'Dans le panier' : 'Ajouter au panier'}
          </button>
        </div>
      </div>

        <div className="flex flex-1 flex-col pt-2.5">
        <h3 className="h-9 overflow-hidden text-[13px] font-semibold leading-4.5 text-[#222] line-clamp-2">
          {product.name}
        </h3>

        {product.description ? (
          <p className="mt-1 h-8 overflow-hidden text-[11px] leading-4 text-[#777] line-clamp-2">
            {product.description}
          </p>
        ) : (
          <div className="mt-1 h-8" />
        )}

        <div className="mt-auto pt-1">
          <div>
            <p className="text-[16px] font-extrabold leading-tight text-[#e60012]">
              {formatPrice(displayPrice)}
            </p>
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#666]">
            <span className="truncate">MOQ: 1 piece{soldCount ? ` - ${soldCount} vendus` : ''}</span>
          </div>

          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#1473e6]">
            <span>Verified</span>
            <CountryFlag country="US" className="h-3 w-4.5" />
            <span className="font-normal text-[#777]">- 1 an - BJ</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
