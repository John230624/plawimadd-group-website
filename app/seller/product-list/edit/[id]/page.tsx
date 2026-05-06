'use client';

import React, { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ImagePlus, Loader2, Save } from 'lucide-react';
import { toast } from 'react-toastify';

import Footer from '@/components/seller/Footer';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import Loading from '@/components/Loading';
import type { Product } from '@/lib/types';

interface CategoryOption {
  id: string;
  name: string;
}

export default function EditProductPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id || '';

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      if (!productId) {
        toast.error('Produit introuvable.');
        router.push('/seller/product-list');
        return;
      }

      try {
        const [productResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch('/api/categories'),
        ]);

        const productData = await productResponse.json();
        const categoriesData = await categoriesResponse.json();

        if (!productResponse.ok || !productData.success || !productData.product) {
          throw new Error(productData.message || 'Impossible de charger le produit.');
        }

        const product = productData.product as Product;
        const normalizedCategories = Array.isArray(categoriesData) ? categoriesData : [];

        setCategories(normalizedCategories);
        setName(product.name);
        setDescription(product.description || '');
        setCategoryId(product.category.id);
        setBrand(product.brand || '');
        setColor(product.color || '');
        setPrice(String(product.price));
        setOfferPrice(product.offerPrice ? String(product.offerPrice) : '');
        setStock(String(product.stock));
        setExistingImageUrls(Array.isArray(product.imgUrl) ? product.imgUrl : []);
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement du produit.');
        router.push('/seller/product-list');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [productId, router]);

  const previews = useMemo(() => {
    return imageFiles.map((file) => URL.createObjectURL(file));
  }, [imageFiles]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [previews]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, index: number): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFiles((current) => {
      const next = [...current];
      next[index] = file;
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!name || !description || !categoryId || !price || !stock) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedImageUrls = await Promise.all(
        imageFiles.filter(Boolean).map(async (file) => {
          const formData = new FormData();
          formData.append('image', file);

          const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          });

          const uploadData = await uploadResponse.json();

          if (!uploadResponse.ok || !uploadData.imageUrl) {
            throw new Error(uploadData.message || "Echec de l'upload d'une image.");
          }

          return uploadData.imageUrl as string;
        })
      );

      const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];

      if (finalImageUrls.length === 0) {
        throw new Error('Ajoutez au moins une image pour ce produit.');
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          categoryId,
          price: parseFloat(price),
          offerPrice: offerPrice ? parseFloat(offerPrice) : null,
          stock: parseInt(stock, 10),
          imgUrl: finalImageUrls,
          brand: brand || null,
          color: color || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Mise a jour impossible.');
      }

      toast.success('Produit mis a jour avec succes.');
      router.push('/seller/product-list');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise a jour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <SellerSectionHeader
        eyebrow="Catalogue"
        title="Modifier un produit"
        description="Mettez a jour les visuels, le prix, la categorie et les informations utiles sans casser la coherence du catalogue."
        action={
          <button
            type="button"
            onClick={() => router.push('/seller/product-list')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        }
      />

      <SellerPanel className="mt-8 p-5 md:p-8">
        <form onSubmit={handleSubmit} className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-medium text-slate-500">Galerie actuelle</p>
            <h2 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">
              Conservez ou remplacez les images
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {existingImageUrls.map((imageUrl, index) => (
                <div
                  key={`${imageUrl}-${index}`}
                  className="relative aspect-square overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50"
                >
                  <Image
                    src={imageUrl}
                    alt={`Image existante ${index + 1}`}
                    width={240}
                    height={240}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setExistingImageUrls((current) => current.filter((item) => item !== imageUrl))
                    }
                    className="absolute right-3 top-3 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm"
                  >
                    Retirer
                  </button>
                </div>
              ))}

              {Array.from({ length: Math.max(4 - existingImageUrls.length, 1) }).map((_, index) => (
                <label
                  key={`new-${index}`}
                  htmlFor={`product-edit-image-${index}`}
                  className="group flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 transition hover:border-[var(--brand-300)] hover:bg-[rgba(191,219,254,0.14)]"
                >
                  <input
                    id={`product-edit-image-${index}`}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(event) => handleFileChange(event, index)}
                  />

                  {previews[index] ? (
                    <Image
                      src={previews[index]}
                      alt={`Nouvel apercu ${index + 1}`}
                      width={240}
                      height={240}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="rounded-full bg-white p-3 text-[var(--brand-700)] shadow-sm">
                        <ImagePlus className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-700">Ajouter une image</p>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Nom du produit</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--brand-300)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Categorie</label>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="w-full rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--brand-300)]"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Marque</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className="w-full rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--brand-300)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Prix</label>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className="w-full rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--brand-300)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Prix promo</label>
                <input
                  type="number"
                  min="0"
                  value={offerPrice}
                  onChange={(event) => setOfferPrice(event.target.value)}
                  className="w-full rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--brand-300)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(event) => setStock(event.target.value)}
                  className="w-full rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--brand-300)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Couleur</label>
                <input
                  type="text"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="w-full rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--brand-300)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--brand-300)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 md:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand-600)] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)] disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSubmitting ? 'Mise a jour...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </form>
      </SellerPanel>

      <Footer />
    </div>
  );
}
