'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Factory,
  Heart,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

import { ProductDetailSkeleton } from '@/components/Skeleton';
import { assets } from '@/assets/assets';
import HomeFooter from '@/components/home/HomeFooter';
import ProductCarouselSection from '@/components/home/ProductCarouselSection';
import VariantSelector from '@/components/product/VariantSelector';
import { useAppContext } from '@/context/AppContext';
import type { Product, ProductVariant } from '@/lib/types';
import MiniCustomOfferWidget from '@/components/MiniCustomOfferWidget';
import Markdown from '@/components/Markdown';

type ProductReview = {
  id: string;
  name: string;
  date: string;
  text: string;
  avatar: string;
  rating: number;
};

type Tab = 'details' | 'specifications' | 'shipping' | 'reviews';

function buildGallery(product: Product): string[] {
  const ownImages = product.imgUrl?.filter(Boolean) || [];
  return ownImages.length > 0 ? ownImages : ['/images/default_product_image.png'];
}

function getDisplayPrice(product: Product, selectedVariant: ProductVariant | null): number {
  if (selectedVariant) return selectedVariant.price;
  if (
    product.offerPrice !== null &&
    product.offerPrice !== undefined &&
    product.offerPrice < product.price
  ) {
    return product.offerPrice;
  }

  return product.price;
}

function readAttributesJson(attributesJson: Product['attributesJson']): { label: string; value: string }[] {
  if (!attributesJson) return [];

  const source = typeof attributesJson === 'string' ? (() => {
    try {
      return JSON.parse(attributesJson);
    } catch {
      return null;
    }
  })() : attributesJson;

  if (!source || typeof source !== 'object' || Array.isArray(source)) return [];

  return Object.entries(source)
    .map(([key, raw]) => {
      if (raw === null || raw === undefined) return null;
      if (typeof raw === 'object' && !Array.isArray(raw)) {
        const record = raw as Record<string, unknown>;
        const value = record.value || record.label || record.name || record.id;
        if (!value) return null;
        return { label: key, value: String(value) };
      }
      return { label: key, value: String(raw) };
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
}

export default function ProductPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();
  const { addToCart, cartItems, formatPrice, products, toggleWishlist, isInWishlist } =
    useAppContext();

  const [productData, setProductData] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('/images/default_product_image.png');
  const [mediaMode, setMediaMode] = useState<'photos' | 'video'>('photos');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [variantImages, setVariantImages] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [productCharacteristics, setProductCharacteristics] = useState<
    { characteristic: { id: string; name: string }; value: string }[]
  >([]);

  const [activeTab, setActiveTab] = useState<Tab>('specifications');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoadingProduct(true);

      try {
        const response = await fetch(`/api/products/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success || !data.product) {
          toast.error(data.message || 'Produit non trouve.');
          router.push('/all-products');
          return;
        }

        const product = data.product as Product;
        setProductData(product);
        setSelectedImage(product.imgUrl?.[0] || '/images/default_product_image.png');
        setQuantity(1);

        fetch(`/api/reviews?productId=${product.id}`)
          .then((res) => res.json())
          .then((reviewData) => {
            if (Array.isArray(reviewData)) setReviews(reviewData);
          })
          .catch(() => {});
        fetch(`/api/product-characteristics?productId=${product.id}`)
          .then((res) => res.json())
          .then((chars) => {
            if (Array.isArray(chars)) setProductCharacteristics(chars);
          })
          .catch(() => {});

      } catch (error) {
        console.error(error);
        toast.error('Erreur lors du chargement du produit.');
        router.push('/all-products');
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [id]);

  const galleryImages = useMemo(() => {
    if (variantImages.length > 0) return variantImages;
    if (!productData) return [];
    return buildGallery(productData);
  }, [productData, variantImages]);

  const relatedAccessories = useMemo(() => {
    return products
      .filter((product) =>
        product.id !== productData?.id &&
        ['Audio', 'Montres connectees', 'Accessoires'].includes(product.category?.name || '')
      )
      .slice(0, 12);
  }, [productData?.id, products]);

  const sameCategory = useMemo(() => {
    return products
      .filter((product) => product.id !== productData?.id && product.category?.name === productData?.category?.name)
      .slice(0, 12);
  }, [productData, products]);

  const bestSellers = useMemo(() => {
    return [...products]
      .filter((product) => product.id !== productData?.id)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 12);
  }, [productData?.id, products]);



  const techSpecs = useMemo(() => {
    if (!productData) return [];
    const dynamicCharacteristics = productCharacteristics.map((item) => ({
      label: item.characteristic.name,
      value: item.value,
    }));
    const attributes = readAttributesJson(productData.attributesJson);

    return [
      { label: 'Categorie', value: productData.category?.name || 'Catalogue' },
      { label: 'Marque', value: productData.brand || undefined },
      { label: 'Garantie', value: productData.warranty || undefined },
      { label: 'Disponibilite', value: productData.stock > 0 ? 'En stock' : 'Epuise' },
      ...dynamicCharacteristics,
      ...attributes,
    ].filter((spec) => spec.value);
  }, [productData, productCharacteristics]);

  const displayPrice = useMemo(() => {
    if (!productData) return 0;
    return getDisplayPrice(productData, selectedVariant);
  }, [selectedVariant, productData]);

  const displayStock = useMemo(() => {
    if (selectedVariant) return selectedVariant.stock;
    return productData?.stock ?? 0;
  }, [selectedVariant, productData]);

  const selectedImageIndex = galleryImages.findIndex((image) => image === selectedImage);

  const handleGalleryMove = (direction: 'prev' | 'next') => {
    if (!galleryImages.length) return;
    const currentIndex = selectedImageIndex === -1 ? 0 : selectedImageIndex;
    const nextIndex =
      direction === 'prev'
        ? (currentIndex - 1 + galleryImages.length) % galleryImages.length
        : (currentIndex + 1) % galleryImages.length;
    setSelectedImage(galleryImages[nextIndex]);
  };

  const handleAddToCart = useCallback(async () => {
    if (!productData) return;
    if (status !== 'authenticated') {
      toast.info('Connectez-vous pour ajouter au panier.');
      router.push('/login');
      return;
    }

    const success = await addToCart(productData.id, selectedVariant?.id, quantity);
    if (success) toast.success(`Ajoute au panier (x${quantity})`);
  }, [status, router, addToCart, productData, selectedVariant, quantity]);

  const handleQuickOrder = useCallback(async () => {
    if (!productData) return;
    if (status !== 'authenticated') {
      toast.info('Connectez-vous pour commander.');
      router.push('/login');
      return;
    }

    const cartKey = selectedVariant ? `${productData.id}:${selectedVariant.id}` : productData.id;
    if (!cartItems[cartKey]) {
      const success = await addToCart(productData.id, selectedVariant?.id, quantity);
      if (!success) return;
    }

    router.push('/cart');
  }, [status, router, addToCart, productData, selectedVariant, cartItems, quantity]);

  const handleVariantChange = useCallback((variant: ProductVariant | null) => {
    setSelectedVariant(variant);
  }, []);

  const handleImagesChange = useCallback((images: string[]) => {
    setVariantImages(images);
    if (images.length > 0) setSelectedImage(images[0]);
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'specifications', label: 'Caracteristiques' },
    { key: 'shipping', label: 'Livraison' },
    { key: 'reviews', label: `Avis (${reviews.length})` },
  ];

  if (loadingProduct) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] text-[#555]">
        Produit introuvable.
      </div>
    );
  }

  const hasDiscount =
    !selectedVariant &&
    productData.offerPrice != null &&
    productData.offerPrice < productData.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - (productData.offerPrice as number) / productData.price) * 100)
    : 0;
  const ratingValue = Math.round(productData.rating ?? 4);
  const minQty = 1;

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-0 pt-4 md:px-6 lg:px-8">
        <section className="pb-3 text-xs text-[#666]">
          <Link href="/" className="hover:text-[#ff6a00]">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/all-products" className="hover:text-[#ff6a00]">Catalogue</Link>
          <span className="mx-2">/</span>
          <Link
            href={`/all-products?category=${encodeURIComponent(productData.category?.name || '')}`}
            className="hover:text-[#ff6a00]"
          >
            {productData.category?.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#999]">{productData.name}</span>
        </section>

        <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-3">
            <div className="grid gap-3 xl:grid-cols-[430px_minmax(0,1fr)]">
              <div className="space-y-3">
            <div className="rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="grid gap-3 sm:grid-cols-[70px_1fr]">
                <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:max-h-[430px] sm:flex-col sm:overflow-y-auto">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => { setSelectedImage(image); setMediaMode('photos'); }}
                      className={`relative h-[70px] w-[70px] shrink-0 overflow-hidden rounded-lg border bg-[#f7f7f7] transition ${
                        selectedImage === image
                          ? 'border-[#ff6a00] ring-2 ring-[#ff6a00]/25'
                          : 'border-[#eee] hover:border-[#ff6a00]'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${productData.name} vue ${index + 1}`}
                        fill
                        sizes="70px"
                        className="object-contain p-1"
                      />
                    </button>
                  ))}
                  {galleryImages.length > 4 ? (
                    <button
                      type="button"
                      className="hidden h-9 items-center justify-center rounded-full border border-[#e5e5e5] text-[#555] sm:flex"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="group relative order-1 flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl bg-[#f7f7f7] sm:order-2 sm:min-h-[430px]">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(productData.id)}
                    className={`absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ${
                      isInWishlist(productData.id) ? 'text-[#ff6a00]' : 'text-[#666]'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isInWishlist(productData.id) ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGalleryMove('prev')}
                    className="absolute left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#333] shadow group-hover:flex"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {mediaMode === 'video' && productData.videoUrl ? (
                    <video
                      src={productData.videoUrl}
                      controls
                      autoPlay
                      playsInline
                      className="max-h-[260px] w-auto max-w-full rounded-lg object-contain sm:max-h-[370px]"
                    />
                  ) : (
                    <Image
                      src={selectedImage}
                      alt={productData.name}
                      width={720}
                      height={720}
                      priority
                      className="max-h-[260px] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.06] sm:max-h-[370px]"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleGalleryMove('next')}
                    className="absolute right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#333] shadow group-hover:flex"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {galleryImages.length > 1 ? (
                    <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                      {(selectedImageIndex === -1 ? 0 : selectedImageIndex) + 1}/{galleryImages.length}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setMediaMode('photos')}
                  className={`rounded-md px-4 py-2 text-sm ${
                    mediaMode === 'photos'
                      ? 'bg-[#f2f2f2] font-semibold text-[#222]'
                      : 'font-medium text-[#777] hover:bg-[#f7f7f7]'
                  }`}
                >
                  Photos
                </button>
                {productData.videoUrl ? (
                  <button
                    type="button"
                    onClick={() => setMediaMode('video')}
                    className={`rounded-md px-4 py-2 text-sm ${
                      mediaMode === 'video'
                        ? 'bg-[#f2f2f2] font-semibold text-[#222]'
                        : 'font-medium text-[#777] hover:bg-[#f7f7f7]'
                    }`}
                  >
                    Vidéo
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl bg-[#eef8ff] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-[#1473e6]">
                  <Factory className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-bold text-[#222]">Plawimadd Group</h2>
                    <BadgeCheck className="h-4 w-4 text-[#1473e6]" />
                  </div>
                  <p className="mt-1 text-xs text-[#555]">Abomey-Calavi, Benin - Fournisseur verifie</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg bg-white p-3 text-center">
                {[
                  { value: '4.7/5', label: 'Note' },
                  { value: '<3h', label: 'Reponse' },
                  { value: '99%', label: 'Livraison' },
                  { value: '8%', label: 'Reachat' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-sm font-bold text-[#222]">{item.value}</p>
                    <p className="mt-1 text-[10px] leading-3 text-[#666]">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#555]">
                <span className="rounded-full bg-white px-2 py-1">Personnalisation simple</span>
                <span className="rounded-full bg-white px-2 py-1">Modeles disponibles</span>
                <span className="rounded-full bg-white px-2 py-1">Marches: Benin, Togo</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="border-b border-[#eee] pb-4">
              <h1 className="text-[20px] font-bold leading-7 text-[#222] md:text-[22px]">
                {productData.name}
              </h1>
              {productData.shortDescription && (
                <p className="mt-2 text-sm leading-6 text-[#666]">
                  {productData.shortDescription}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#666]">
                <span className="flex items-center gap-0.5 text-[#ff6a00]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${index < ratingValue ? 'fill-current' : 'text-[#dcdcdc]'}`}
                    />
                  ))}
                </span>
                <span>{reviews.length ? `${reviews.length} avis` : "Aucun avis pour l'instant"}</span>
                <span className="h-4 w-px bg-[#ddd]" />
                <span>{productData.soldCount || 1} vendu</span>
                <span className="rounded bg-[#f3f7ff] px-2 py-1 text-xs text-[#1473e6]">
                  Materiau ignifuge
                </span>
              </div>
            </div>

            <div className="border-b border-[#eee] py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[#222]">Personnalisation</h2>
                  <ul className="mt-3 space-y-2 text-sm text-[#555]">
                    <li className="flex gap-2"><span>-</span>Design de logo / graphique disponible</li>
                    <li className="flex gap-2"><span>-</span>Configuration, accessoires et emballage sur demande</li>
                  </ul>
                </div>
                <ChevronRight className="h-5 w-5 text-[#555]" />
              </div>
            </div>

            <div className="py-5">
              <h2 className="text-base font-bold text-[#222]">Caracteristiques</h2>
              <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-lg bg-[#f7f7f7] md:grid-cols-3">
                {techSpecs.slice(0, 6).map((spec) => (
                  <div key={`${spec.label}-${spec.value}`} className="min-h-[84px] border-b border-r border-white p-3">
                    <p className="text-xs leading-4 text-[#777]">{spec.label}</p>
                    <p className="mt-2 line-clamp-2 text-sm font-bold text-[#222]">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#eee]">
              <MiniCustomOfferWidget />
            </div>
          </div>

            </div>

            <section className="rounded-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex overflow-x-auto border-b border-[#eee] px-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`shrink-0 border-b-2 px-5 py-4 text-sm font-bold transition ${
                      activeTab === tab.key
                        ? 'border-[#ff6a00] text-[#ff6a00]'
                        : 'border-transparent text-[#555] hover:text-[#222]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5 md:p-6">
                {activeTab === 'details' ? (
                  <div className="grid gap-5 xl:grid-cols-[1fr_260px]">
                    <div>
                      <h2 className="text-xl font-bold text-[#222]">Description du produit</h2>
                      {productData.description?.trim() ? (
                        <Markdown content={productData.description} className="mt-4 leading-8" />
                      ) : (
                        <p className="mt-4 text-sm leading-8 text-[#555]">
                          Aucune description disponible pour ce produit.
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg bg-[#f7f7f7] p-4">
                      <h3 className="text-sm font-bold text-[#222]">Capacite de personnalisation</h3>
                      <ul className="mt-3 space-y-2 text-sm text-[#555]">
                        <li className="flex gap-2"><span>-</span>Personnalisation simple</li>
                        <li className="flex gap-2"><span>-</span>Personnalisation a partir de modeles</li>
                        <li className="flex gap-2"><span>-</span>Personnalisation a partir d&apos;echantillons</li>
                        <li className="flex gap-2"><span>-</span>Personnalisation complete</li>
                      </ul>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'specifications' ? (
                  <div>
                    <h2 className="text-xl font-bold text-[#222]">Caracteristiques principales</h2>
                    <div className="mt-5 grid overflow-hidden rounded-lg border border-[#eee] xl:grid-cols-2">
                      {techSpecs.map((spec) => (
                        <div key={`${spec.label}-${spec.value}`} className="grid grid-cols-[150px_1fr] border-b border-[#eee] text-sm">
                          <div className="bg-[#f7f7f7] p-3 font-semibold text-[#555]">{spec.label}</div>
                          <div className="p-3 text-[#222]">{spec.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeTab === 'shipping' ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { icon: Truck, title: 'Delais', body: `Expedition sous ${productData.leadTimeRange || '3-7 jours ouvres'}.` },
                      { icon: ShieldCheck, title: 'Paiement', body: 'Paiement securise via Kkiapay, Mobile Money ou carte.' },
                      { icon: RotateCcw, title: 'Retours', body: "Retour possible sous 7 jours si l'article est intact." },
                      { icon: Clock3, title: 'Support', body: 'Assistance disponible par WhatsApp et email.' },
                    ].map((item) => (
                      <div key={item.title} className="rounded-lg border border-[#eee] p-4">
                        <item.icon className="h-6 w-6 text-[#ff6a00]" />
                        <h3 className="mt-3 text-sm font-bold text-[#222]">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#555]">{item.body}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {activeTab === 'reviews' ? (
                  <div>
                    {reviews.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {reviews.map((review) => (
                          <article key={review.id} className="rounded-lg border border-[#eee] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <Image
                                  src={review.avatar}
                                  alt={review.name}
                                  width={44}
                                  height={44}
                                  className="h-11 w-11 rounded-full object-cover"
                                />
                                <div>
                                  <h3 className="text-sm font-bold text-[#222]">{review.name}</h3>
                                  <div className="mt-1 flex gap-0.5 text-[#ffb300]">
                                    {Array.from({ length: review.rating }).map((_, index) => (
                                      <Star key={index} className="h-3.5 w-3.5 fill-current" />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-[#888]">{review.date}</p>
                            </div>
                            <p className="mt-4 text-sm leading-7 text-[#555]">{review.text}</p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg bg-[#f7f7f7] p-8 text-center">
                        <CheckCircle2 className="mx-auto h-8 w-8 text-[#238a43]" />
                        <p className="mt-3 text-sm text-[#555]">Aucun avis pour le moment.</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:sticky lg:top-24">
            <div className="border-b border-[#eee] pb-5">
              <div className="flex flex-wrap items-end gap-3">
                <p className="text-[30px] font-bold leading-none text-[#e60012]">
                  {formatPrice(displayPrice)}
                </p>
                {hasDiscount ? (
                  <span className="rounded bg-[#ffe9e9] px-2 py-1 text-xs font-bold text-[#e60012]">
                    -{discountPercent}%
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-[#777]">Prix unitaire, taxes comprises</p>
            </div>



            {productData.variants && productData.variants.length > 0 ? (
              <div className="border-b border-[#eee] py-5">
                <VariantSelector
                  variants={productData.variants.filter((variant) => variant.isActive)}
                  basePrice={productData.price}
                  baseImages={productData.imgUrl || []}
                  onVariantChange={handleVariantChange}
                  onImagesChange={handleImagesChange}
                />
              </div>
            ) : null}

            <div className="border-b border-[#eee] pb-5">
              <h2 className="text-lg font-bold text-[#222]">Expedition</h2>
              <p className="mt-3 text-sm leading-6 text-[#555]">
                Frais et delais a confirmer selon votre adresse. Contactez-nous pour une cotation rapide.
              </p>
            </div>

            <div className="space-y-4 border-b border-[#eee] py-5">
              <h2 className="text-lg font-bold text-[#222]">Protection des commandes</h2>
              {[
                { icon: ShieldCheck, title: 'Paiements securises', body: 'Mobile Money, carte bancaire et suivi de paiement.' },
                { icon: RotateCcw, title: 'Protection de remboursement', body: 'Assistance si la commande ne correspond pas.' },
                { icon: PackageCheck, title: 'Controle avant livraison', body: 'Verification produit avant remise au client.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#238a43]" />
                  <div>
                    <p className="text-sm font-bold text-[#222]">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#666]">{item.body}</p>
                    {item.title === 'Paiements securises' && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-slate-500">
                        {/* MTN */}
                        <div className="relative h-5 w-10 flex items-center justify-center">
                          <Image src={assets.mtn} alt="MTN MoMo" className="object-contain max-h-full max-w-full mix-blend-multiply" />
                        </div>
                        {/* Moov */}
                        <div className="relative h-5 w-10 flex items-center justify-center">
                          <Image src={assets.moov} alt="Moov Money" className="object-contain max-h-full max-w-full mix-blend-multiply" />
                        </div>
                        {/* Celtiis */}
                        <div className="relative h-5 w-10 flex items-center justify-center">
                          <Image src={assets.celtiis} alt="Celtiis Cash" className="object-contain max-h-full max-w-full mix-blend-multiply" />
                        </div>
                        {/* Visa */}
                        <div className="relative h-5 w-10 flex items-center justify-center text-[#1A1F71]">
                          <svg viewBox="0 0 24 15" className="h-5 w-8 object-contain mix-blend-multiply" fill="currentColor">
                            <path d="M8.8 13.5l1.6-9.7h2.6l-1.6 9.7H8.8zm8.6-9.3c-.4-.5-1.1-.7-2-.7-1.6 0-3 1-3.6 2.3h-.1c.3-1.4.3-2 .3-2.3h-2.5l-1.7 9.7h2.6l1-5.7c.3-.8.9-1.5 1.7-1.5.8 0 1.2.4 1 1.5l-1 5.7h2.6l1.6-9.7h-2.5l.3-.7zm-15 0L1 6.5C.8 5.7.5 5.5 0 5.2V5h4.2c.5 0 .9.3 1 .9l1 5.1 2.5-6.8H6.1l-3.7 9.3h2.6l4.2-9.7h-3.6z" />
                          </svg>
                        </div>
                        {/* Mastercard */}
                        <div className="relative h-5 w-10 flex items-center justify-center">
                          <svg viewBox="0 0 36 22" className="h-5 w-8 object-contain mix-blend-multiply" role="img">
                            <circle cx="13" cy="11" r="10" fill="#EB001B" />
                            <circle cx="23" cy="11" r="10" fill="#F79E1B" />
                            <path d="M18 3.2a10 10 0 0 1 0 15.6 10 10 0 0 1 0-15.6z" fill="#FF5F00" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-[#eee] py-5">
              <p className="text-sm font-bold text-[#222]">Quantite</p>
              <div className="inline-flex items-center rounded-full border border-[#ddd] bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(minQty, current - 1))}
                  disabled={quantity <= minQty}
                  className="flex h-10 w-10 items-center justify-center rounded-l-full text-[#333] transition hover:bg-[#f5f5f5] disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-base font-semibold text-[#222]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => current + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-r-full text-[#333] transition hover:bg-[#f5f5f5]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 py-5">
              <button
                type="button"
                onClick={handleQuickOrder}
                disabled={displayStock <= 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e35300] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#cf4b00] disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Envoyer demande
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={displayStock <= 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#222] bg-white px-5 py-3.5 text-sm font-bold text-[#222] transition hover:border-[#ff6a00] hover:text-[#ff6a00] disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" />
                Ajouter au panier
              </button>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#ddd] bg-white px-5 py-3.5 text-sm font-bold text-[#222] transition hover:border-[#ff6a00] hover:text-[#ff6a00]"
              >
                <MessageCircle className="h-4 w-4" />
                Discuter ici
              </button>
            </div>

            <div className="rounded-lg bg-[#fff7ed] p-3 text-xs leading-5 text-[#8a3a00]">
              Seules les commandes confirmees et payees via Plawimadd sont protegees.
            </div>
          </aside>
        </section>

        {sameCategory.length > 0 ? (
          <ProductCarouselSection
            title="Produits similaires"
            actionLabel="Voir plus"
            products={sameCategory}
            onAction={() => router.push(`/all-products?category=${encodeURIComponent(productData.category?.name || '')}`)}
          />
        ) : null}

        <ProductCarouselSection
          title="Accessoires"
          actionLabel="Voir plus"
          products={relatedAccessories}
          onAction={() => router.push('/all-products?category=Audio')}
        />

        <ProductCarouselSection
          title="Hits de ventes"
          actionLabel="Voir plus"
          products={bestSellers}
          onAction={() => router.push('/all-products')}
        />
      </main>

      <HomeFooter />
    </div>
  );
}
