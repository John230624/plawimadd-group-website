'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Heart, Star, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
import HomeFooter from '@/components/home/HomeFooter';
import ProductCarouselSection from '@/components/home/ProductCarouselSection';
import SectionHeader from '@/components/home/SectionHeader';
import { useAppContext } from '@/context/AppContext';
import type { Product } from '@/lib/types';

type ProductReview = {
  id: string;
  name: string;
  date: string;
  text: string;
  avatar: string;
  rating: number;
};

const reviews: ProductReview[] = [
  {
    id: 'review-1',
    name: 'Anna S.',
    date: '23.08.2024',
    text: "Tres bonne experience. Le produit correspond bien aux photos et la livraison a ete rapide. Je recommande pour la qualite du service et le suivi.",
    avatar: '/images/girl_with_headphone_image.png',
    rating: 5,
  },
  {
    id: 'review-2',
    name: 'Dimitri K.',
    date: '15.07.2024',
    text: "Commande simple, produit bien emballe et excellent rapport qualite prix. Le magasin inspire confiance et je reviendrai pour d'autres achats.",
    avatar: '/images/boy_with_laptop_image.png',
    rating: 5,
  },
  {
    id: 'review-3',
    name: 'Tatiana V.',
    date: '10.07.2024',
    text: "Site clair, informations utiles et produit conforme. Le service client a ete reactif et l'ensemble de l'achat s'est passe sans difficulte.",
    avatar: '/images/girl_with_earphone_image.png',
    rating: 5,
  },
];

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

function parseStorageOptions(product: Product): string[] {
  const matches = product.name.match(/(\d+TB|\d+GB)/gi);
  const defaults = matches && matches.length ? matches.map((item) => item.toUpperCase()) : ['128GB'];
  const set = new Set<string>(defaults);
  if (!set.has('256GB')) set.add('256GB');
  if (!set.has('512GB')) set.add('512GB');
  return Array.from(set).slice(0, 3);
}

function getColorSwatches(color?: string | null): string[] {
  const normalized = (color || '').toLowerCase();

  if (normalized.includes('blanc')) return ['#d9d2c7', '#c5c0b8', '#efede8', '#4b4947'];
  if (normalized.includes('bleu')) return ['#bcd8d7', '#7fa8c3', '#d4e5ec', '#474b54'];
  if (normalized.includes('vert')) return ['#8db29a', '#57745e', '#dbe6d9', '#30352e'];
  if (normalized.includes('violet')) return ['#7d7690', '#b8adc4', '#e5e0ee', '#373540'];
  if (normalized.includes('titane') || normalized.includes('gris')) {
    return ['#c8b396', '#b7aea1', '#ece9e2', '#4f4c48'];
  }

  return ['#c8b396', '#d7d0c6', '#ece9e2', '#4f4c48'];
}

function getTechSpecs(product: Product): Array<{ label: string; value: string }> {
  const storage = parseStorageOptions(product)[0];

  return [
    { label: 'Categorie', value: product.category?.name || 'Catalogue' },
    { label: 'Marque', value: product.brand || 'Plawimadd' },
    { label: 'Stockage', value: storage },
    { label: 'Couleur', value: product.color || 'Standard' },
    { label: 'Stock', value: `${product.stock} disponible(s)` },
    { label: 'Evaluation', value: `${(product.rating ?? 4.8).toFixed(1)} / 5` },
  ];
}

function buildGallery(product: Product, products: Product[]): string[] {
  const ownImages = product.imgUrl?.filter(Boolean) || [];
  const relatedImages = products
    .filter((item) => item.id !== product.id && item.brand === product.brand)
    .flatMap((item) => item.imgUrl || [])
    .filter(Boolean);

  return Array.from(new Set([...ownImages, ...relatedImages])).slice(0, 4);
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
  const [selectedStorage, setSelectedStorage] = useState<string>('128GB');

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
        setSelectedStorage(parseStorageOptions(product)[0]);
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
    if (!productData) return [];
    return buildGallery(productData, products);
  }, [productData, products]);

  const relatedAccessories = useMemo(() => {
    return products
      .filter(
        (product) =>
          product.id !== productData?.id &&
          ['Audio', 'Montres connectees', 'Accessoires'].includes(product.category?.name || '')
      )
      .slice(0, 8);
  }, [productData?.id, products]);

  const bestSellers = useMemo(() => {
    return [...products]
      .filter((product) => product.id !== productData?.id)
      .sort((first, second) => (second.rating ?? 0) - (first.rating ?? 0))
      .slice(0, 8);
  }, [productData?.id, products]);

  const storageOptions = productData ? parseStorageOptions(productData) : [];
  const colorSwatches = getColorSwatches(productData?.color);
  const techSpecs = productData ? getTechSpecs(productData) : [];
  const displayPrice = productData ? getDisplayPrice(productData) : 0;

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
        <section className="px-2 pb-2 md:px-0">
          <div className="px-3 py-4 md:px-0 md:py-0">
            <div className="flex flex-col gap-5">
              <p className="text-sm text-slate-500">
                <Link href="/" className="hover:text-[var(--brand-700)]">
                  Accueil
                </Link>{' '}
                /{' '}
                <Link href="/all-products" className="hover:text-[var(--brand-700)]">
                  Catalogue
                </Link>{' '}
                /{' '}
                <Link
                  href={`/all-products?category=${encodeURIComponent(productData.category?.name || '')}`}
                  className="hover:text-[var(--brand-700)]"
                >
                  {productData.category?.name}
                </Link>{' '}
                /{' '}
                <Link
                  href={`/all-products?category=${encodeURIComponent(productData.category?.name || '')}&brand=${encodeURIComponent(productData.brand || '')}`}
                  className="hover:text-[var(--brand-700)]"
                >
                  {productData.brand}
                </Link>{' '}
                / <span className="text-slate-400">{productData.name}</span>
              </p>

              <h1 className="max-w-[18ch] text-[2.3rem] font-semibold tracking-[-0.045em] text-slate-950 md:max-w-none md:text-[3.4rem]">
                {productData.name}
              </h1>
            </div>
          </div>
        </section>

        <section className="px-2 pb-2 pt-8 md:px-0">
          <div className="grid gap-6 px-3 py-4 md:px-0 md:py-0 xl:grid-cols-[1fr_1.22fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
              <div className="relative flex min-h-[560px] items-center justify-center rounded-[1.75rem] bg-slate-100 p-8">
                <button
                  type="button"
                  onClick={() => toggleWishlist(productData.id)}
                  className={`absolute left-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ${
                    isInWishlist(productData.id) ? 'text-rose-500' : 'text-slate-300'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(productData.id) ? 'fill-current' : ''}`} />
                </button>
                <Image
                  src={selectedImage}
                  alt={productData.name}
                  width={900}
                  height={900}
                  className="max-h-[460px] w-auto object-contain"
                />
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleGalleryMove('prev')}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--brand-300)] text-[var(--brand-700)]"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="grid flex-1 grid-cols-4 gap-3">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`overflow-hidden rounded-[1.2rem] border bg-slate-100 p-2 transition ${
                        selectedImage === image
                          ? 'border-[var(--brand-400)] ring-2 ring-[rgba(96,165,250,0.16)]'
                          : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${productData.name} vue ${index + 1}`}
                        width={160}
                        height={160}
                        className="h-20 w-full object-contain"
                      />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleGalleryMove('next')}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--brand-300)] text-[var(--brand-700)]"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[2.2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[3rem]">
                      {formatPrice(displayPrice)}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className="h-5 w-5 fill-current"
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-500">
                        {reviews.length} avis clients
                      </span>
                    </div>
                  </div>

                  <p className="pt-3 text-sm text-slate-400">Reference: {productData.id}</p>
                </div>

                <div className="grid gap-5 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="mb-3 text-sm font-medium text-slate-700">Stockage</p>
                    <div className="flex flex-wrap gap-3">
                      {storageOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSelectedStorage(option)}
                          className={`rounded-[0.9rem] border px-4 py-2 text-sm font-medium transition ${
                            selectedStorage === option
                              ? 'border-[var(--brand-600)] bg-[var(--brand-600)] text-white'
                              : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium text-slate-700">Couleur</p>
                    <div className="flex gap-3">
                      {colorSwatches.map((swatch) => (
                        <span
                          key={swatch}
                          className="h-10 w-10 rounded-[0.85rem] border border-slate-200"
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row">
                  <button
                    type="button"
                    onClick={async () => {
                      if (status !== 'authenticated') {
                        toast.info('Connectez-vous pour ajouter au panier.');
                        router.push('/login');
                        return;
                      }

                      const success = await addToCart(productData.id);
                      if (success) {
                        toast.success('Ajoute au panier');
                      }
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand-600)] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)]"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Ajouter au panier
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (status !== 'authenticated') {
                        toast.info('Connectez-vous pour commander.');
                        router.push('/login');
                        return;
                      }

                      if (!cartItems[productData.id]) {
                        const success = await addToCart(productData.id);
                        if (!success) return;
                      }

                      router.push('/cart');
                    }}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-[var(--brand-300)] bg-white px-6 py-4 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[rgba(191,219,254,0.18)]"
                  >
                    Commande rapide
                  </button>
                </div>

                <div>
                  <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-slate-950">
                    Caracteristiques essentielles
                  </h2>

                  <div className="mt-5 space-y-4">
                    {techSpecs.map((spec) => (
                      <div key={spec.label} className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="shrink-0">{spec.label}</span>
                        <span className="h-px flex-1 bg-[radial-gradient(circle,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:10px_1px]" />
                        <span className="shrink-0 font-medium text-slate-900">{spec.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="mt-6 text-sm font-medium text-[var(--brand-700)] underline underline-offset-4"
                  >
                    Voir toutes les caracteristiques
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-2 pb-2 pt-10 md:px-0">
          <div className="grid gap-6 px-3 py-4 md:px-0 md:py-0 xl:grid-cols-2">
            <div className="rounded-[1.8rem] bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
              <h3 className="text-[1.4rem] font-semibold tracking-[-0.03em] text-slate-950">
                Description
              </h3>
              <p className="mt-4 text-sm leading-8 text-slate-600">
                {productData.description ||
                  'Produit soigneusement selectionne pour offrir une experience fiable, elegante et utile au quotidien.'}
              </p>
            </div>

            <div className="rounded-[1.8rem] bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
              <h3 className="text-[1.4rem] font-semibold tracking-[-0.03em] text-slate-950">
                Pourquoi ce modele ?
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>Concu pour un usage confortable au travail, en etudes et a la maison.</li>
                <li>Positionnement premium avec finitions propres et navigation fluide.</li>
                <li>Compatible avec les accessoires et produits phares de son ecosysteme.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="px-2 pb-2 pt-12 md:px-0 md:pt-14">
          <div className="px-3 py-4 md:px-0 md:py-0">
            <SectionHeader title="Lisez les avis de nos clients" actionLabel="Tous les avis" onAction={() => {}} />

            <div className="mt-8 grid gap-5 xl:grid-cols-3">
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
                          {Array.from({ length: review.rating }).map((_, index) => (
                            <Star key={index} className="h-4 w-4 fill-current" />
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
          </div>
        </section>

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
