'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Heart, Star, ChevronLeft, ChevronRight, ShoppingCart, Truck, Shield, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
import HomeFooter from '@/components/home/HomeFooter';
import ProductCarouselSection from '@/components/home/ProductCarouselSection';
import SectionHeader from '@/components/home/SectionHeader';
import VariantSelector from '@/components/product/VariantSelector';
import { useAppContext } from '@/context/AppContext';
import type { Product, ProductVariant } from '@/lib/types';

type ProductReview = {
  id: string;
  name: string;
  date: string;
  text: string;
  avatar: string;
  rating: number;
};

type Tab = 'description' | 'specifications' | 'livraison' | 'avis';

function buildGallery(product: Product, products: Product[]): string[] {
  const ownImages = product.imgUrl?.filter(Boolean) || [];
  const relatedImages = products
    .filter((item) => item.id !== product.id && item.brand === product.brand)
    .flatMap((item) => item.imgUrl || [])
    .filter(Boolean);
  return Array.from(new Set([...ownImages, ...relatedImages])).slice(0, 6);
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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [variantImages, setVariantImages] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [productCharacteristics, setProductCharacteristics] = useState<{ characteristic: { id: string; name: string }; value: string }[]>([]);
  const [allColors, setAllColors] = useState<{ id: string; name: string; hex: string }[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('description');

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

        fetch(`/api/reviews?productId=${product.id}`)
          .then((r) => r.json())
          .then((data) => { if (Array.isArray(data)) setReviews(data); })
          .catch(() => {});
        fetch(`/api/product-characteristics?productId=${product.id}`)
          .then((r) => r.json())
          .then((chars) => { if (Array.isArray(chars)) setProductCharacteristics(chars); })
          .catch(() => {});
        fetch('/api/colors')
          .then((r) => r.json())
          .then((data) => { if (Array.isArray(data)) setAllColors(data); })
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

  const galleryImages = useMemo(() => {
    if (variantImages.length > 0) return variantImages;
    if (!productData) return [];
    return buildGallery(productData, products);
  }, [productData, products, variantImages]);

  const relatedAccessories = useMemo(() => {
    return products
      .filter((p) => p.id !== productData?.id && ['Audio', 'Montres connectees', 'Accessoires'].includes(p.category?.name || ''))
      .slice(0, 8);
  }, [productData?.id, products]);

  const sameCategory = useMemo(() => {
    return products
      .filter((p) => p.id !== productData?.id && p.category?.name === productData?.category?.name)
      .slice(0, 8);
  }, [productData, products]);

  const bestSellers = useMemo(() => {
    return [...products]
      .filter((p) => p.id !== productData?.id)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 8);
  }, [productData?.id, products]);

  const productColorIds: string[] = useMemo(() => {
    if (!productData?.color) return [];
    try { const p = JSON.parse(productData.color); return Array.isArray(p) ? p : []; } catch { return []; }
  }, [productData?.color]);

  const productColors = useMemo(() => {
    return allColors.filter((c) => productColorIds.includes(c.id));
  }, [allColors, productColorIds]);

  const techSpecs = useMemo(() => {
    if (!productData) return [];
    const dynamic = productCharacteristics.map((pc) => ({
      label: pc.characteristic.name,
      value: pc.value,
    }));
    return [
      { label: 'Categorie', value: productData.category?.name || 'Catalogue' },
      { label: 'Marque', value: productData.brand || 'Plawimadd' },
      { label: 'Couleur', value: productColors.map((c) => c.name).join(', ') || 'Standard' },
      ...dynamic,
    ];
  }, [productData, productCharacteristics, productColors]);

  const displayPrice = useMemo(() => {
    if (selectedVariant) return selectedVariant.price;
    if (productData) {
      if (productData.offerPrice !== null && productData.offerPrice !== undefined && productData.offerPrice < productData.price) {
        return productData.offerPrice;
      }
      return productData.price;
    }
    return 0;
  }, [selectedVariant, productData]);

  const displayStock = useMemo(() => {
    if (selectedVariant) return selectedVariant.stock;
    return productData?.stock ?? 0;
  }, [selectedVariant, productData]);

  const selectedImageIndex = galleryImages.findIndex((img) => img === selectedImage);

  const handleGalleryMove = (direction: 'prev' | 'next') => {
    if (!galleryImages.length) return;
    const currentIndex = selectedImageIndex === -1 ? 0 : selectedImageIndex;
    const nextIndex = direction === 'prev'
      ? (currentIndex - 1 + galleryImages.length) % galleryImages.length
      : (currentIndex + 1) % galleryImages.length;
    setSelectedImage(galleryImages[nextIndex]);
  };

  const handleAddToCart = useCallback(async () => {
    if (status !== 'authenticated') {
      toast.info('Connectez-vous pour ajouter au panier.');
      router.push('/login');
      return;
    }
    const success = await addToCart(productData!.id, selectedVariant?.id);
    if (success) toast.success('Ajoute au panier');
  }, [status, router, addToCart, productData, selectedVariant]);

  const handleQuickOrder = useCallback(async () => {
    if (status !== 'authenticated') {
      toast.info('Connectez-vous pour commander.');
      router.push('/login');
      return;
    }
    const cartKey = selectedVariant ? `${productData!.id}:${selectedVariant.id}` : productData!.id;
    if (!cartItems[cartKey]) {
      const success = await addToCart(productData!.id, selectedVariant?.id);
      if (!success) return;
    }
    router.push('/cart');
  }, [status, router, addToCart, productData, selectedVariant, cartItems]);

  const handleVariantChange = useCallback((variant: ProductVariant | null) => {
    setSelectedVariant(variant);
  }, []);

  const handleImagesChange = useCallback((images: string[]) => {
    setVariantImages(images);
    if (images.length > 0) setSelectedImage(images[0]);
  }, []);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'description', label: 'Description' },
    { key: 'specifications', label: 'Spécifications' },
    { key: 'livraison', label: 'Livraison & Délais' },
    { key: 'avis', label: `Avis (${reviews.length})` },
  ];

  if (loadingProduct) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-700">
        Produit introuvable.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-0 pt-6 md:px-6 lg:px-8">
        {/* Breadcrumb */}
        <section className="px-2 pb-2 md:px-0">
          <div className="px-3 py-4 md:px-0 md:py-0">
            <div className="flex flex-col gap-5">
              <p className="text-sm text-slate-500">
                <Link href="/" className="hover:text-[var(--brand-700)]">Accueil</Link>
                {' / '}
                <Link href="/all-products" className="hover:text-[var(--brand-700)]">Catalogue</Link>
                {' / '}
                <Link href={`/all-products?category=${encodeURIComponent(productData.category?.name || '')}`} className="hover:text-[var(--brand-700)]">
                  {productData.category?.name}
                </Link>
                {' / '}
                <Link href={`/all-products?category=${encodeURIComponent(productData.category?.name || '')}&brand=${encodeURIComponent(productData.brand || '')}`} className="hover:text-[var(--brand-700)]">
                  {productData.brand}
                </Link>
                {' / '}
                <span className="text-slate-400">{productData.name}</span>
              </p>
              <h1 className="text-[2.3rem] font-semibold tracking-[-0.045em] text-slate-950 md:text-[3.4rem]">
                {productData.name}
              </h1>
            </div>
          </div>
        </section>

        {/* Main product area */}
        <section className="px-2 pb-2 pt-8 md:px-0">
          <div className="grid gap-6 px-3 py-4 md:px-0 md:py-0 xl:grid-cols-[1fr_1.22fr]">
            {/* Gallery */}
            <div className="rounded-[2rem] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
              <div className="group relative flex min-h-[560px] items-center justify-center rounded-[1.75rem] bg-slate-100 p-8">
                <button
                  type="button"
                  onClick={() => toggleWishlist(productData.id)}
                  className={`absolute left-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ${
                    isInWishlist(productData.id) ? 'text-rose-500' : 'text-slate-300'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(productData.id) ? 'fill-current' : ''}`} />
                </button>
                <div className="relative overflow-hidden">
                  <Image
                    src={selectedImage}
                    alt={productData.name}
                    width={900}
                    height={900}
                    className="max-h-[460px] w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleGalleryMove('prev')}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--brand-300)] text-[var(--brand-700)]"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex flex-1 gap-3 overflow-x-auto">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`shrink-0 overflow-hidden rounded-[1.2rem] border bg-slate-100 p-2 transition ${
                        selectedImage === image
                          ? 'border-[var(--brand-400)] ring-2 ring-[rgba(96,165,250,0.16)]'
                          : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${productData.name} vue ${index + 1}`}
                        width={120}
                        height={120}
                        className="h-20 w-20 object-contain"
                      />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleGalleryMove('next')}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--brand-300)] text-[var(--brand-700)]"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Product info sidebar */}
            <div className="sticky top-8 self-start rounded-[2rem] bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[2.2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[3rem]">
                      {formatPrice(displayPrice)}
                    </p>
                    {productData.offerPrice !== null && productData.offerPrice < productData.price && !selectedVariant && (
                      <p className="mt-1 text-sm text-slate-400 line-through">
                        {formatPrice(productData.price)}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-slate-500">
                        {reviews.length} avis clients
                      </span>
                    </div>
                  </div>
                  <p className="pt-3 text-sm text-slate-400">Ref: {productData.id.slice(0, 8)}</p>
                </div>

                {/* VariantSelector */}
                {productData.variants && productData.variants.length > 0 && (
                  <VariantSelector
                    variants={productData.variants.filter(v => v.isActive)}
                    basePrice={productData.price}
                    baseImages={productData.imgUrl || []}
                    onVariantChange={handleVariantChange}
                    onImagesChange={handleImagesChange}
                  />
                )}

                {/* Stock indicator */}
                <div className="flex items-center gap-2 text-sm">
                  <span className={displayStock > 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>
                    {displayStock > 0 ? `✔ ${displayStock} en stock` : '✘ Épuisé'}
                  </span>
                  {productData.leadTimeRange && displayStock > 0 && (
                    <span className="text-slate-400">| Expédition sous {productData.leadTimeRange}</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={displayStock <= 0}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-600)] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)] disabled:opacity-50"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Ajouter au panier
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickOrder}
                    disabled={displayStock <= 0}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--brand-300)] bg-white px-6 py-4 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[rgba(191,219,254,0.18)] disabled:opacity-50"
                  >
                    Commande rapide
                  </button>
                </div>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4">
                  {[
                    { icon: Truck, label: 'Livraison rapide', sub: productData.leadTimeRange || '3-7 jours' },
                    { icon: Shield, label: 'Paiement securise', sub: 'Kkiapay & Mobile Money' },
                    { icon: RefreshCw, label: 'Retour facile', sub: 'Satisfait ou rembourse' },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-1 text-center">
                      <item.icon className="h-5 w-5 text-[var(--brand-600)]" />
                      <span className="text-xs font-medium text-slate-700">{item.label}</span>
                      <span className="text-[10px] text-slate-400">{item.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Quick specs */}
                <div className="space-y-3">
                  {techSpecs.slice(0, 4).map((spec) => (
                    <div key={spec.label} className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="shrink-0">{spec.label}</span>
                      <span className="h-px flex-1 bg-[radial-gradient(circle,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:10px_1px]" />
                      <span className="shrink-0 font-medium text-slate-900">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs section */}
        <section className="px-2 pb-2 pt-10 md:px-0">
          <div className="px-3 py-4 md:px-0 md:py-0">
            {/* Tab navigation */}
            <div className="flex gap-6 border-b border-slate-200">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 text-sm font-medium transition border-b-2 ${
                    activeTab === tab.key
                      ? 'border-[var(--brand-600)] text-[var(--brand-700)]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="mt-6">
              {activeTab === 'description' && (
                <div className="rounded-[1.8rem] bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                  <p className="text-sm leading-8 text-slate-600">
                    {productData.description || 'Aucune description disponible.'}
                  </p>
                </div>
              )}

              {activeTab === 'specifications' && (
                <div className="rounded-[1.8rem] bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {techSpecs.map((spec) => (
                      <div key={spec.label} className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="shrink-0">{spec.label}</span>
                        <span className="h-px flex-1 bg-[radial-gradient(circle,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:10px_1px]" />
                        <span className="shrink-0 font-medium text-slate-900">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'livraison' && (
                <div className="rounded-[1.8rem] bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Délais de livraison</h4>
                      <p className="mt-2 text-sm text-slate-600">
                        Expédition sous {productData.leadTimeRange || '3-7 jours ouvrés'}.
                        Livraison disponible dans tout le Benin et le Togo.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Paiement</h4>
                      <p className="mt-2 text-sm text-slate-600">
                        Paiement securise via Kkiapay (Mobile Money, Cartes bancaires).
                        Paiement a la livraison disponible.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Retours</h4>
                      <p className="mt-2 text-sm text-slate-600">
                        Retour possible sous 7 jours. Produit doit etre dans son emballage d&apos;origine.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Support</h4>
                      <p className="mt-2 text-sm text-slate-600">
                        Service client disponible 7j/7 par WhatsApp et email.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'avis' && (
                <div>
                  {reviews.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {reviews.map((review) => (
                        <article
                          key={review.id}
                          className="rounded-[1.75rem] bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <Image
                                src={review.avatar}
                                alt={review.name}
                                width={64}
                                height={64}
                                className="h-16 w-16 rounded-full object-cover"
                              />
                              <div>
                                <h4 className="text-[1.25rem] font-semibold text-slate-950">{review.name}</h4>
                                <div className="mt-2 flex gap-1 text-amber-400">
                                  {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-current" />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-slate-400">{review.date}</p>
                          </div>
                          <p className="mt-6 text-sm leading-8 text-slate-600">{review.text}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1.8rem] bg-white p-8 text-center shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                      <p className="text-sm text-slate-400">Aucun avis pour le moment.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related products - same category */}
        {sameCategory.length > 0 && (
          <ProductCarouselSection
            title="Produits similaires"
            actionLabel="Voir plus"
            products={sameCategory}
            onAction={() => router.push(`/all-products?category=${encodeURIComponent(productData.category?.name || '')}`)}
          />
        )}

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
