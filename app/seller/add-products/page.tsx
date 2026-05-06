'use client';

import React, { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

import Footer from '@/components/seller/Footer';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';

interface CategoryOption {
  id: string;
  name: string;
}

export default function AddProductPage(): React.ReactElement {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        const normalized = Array.isArray(data) ? data : [];
        setCategories(normalized);
        if (normalized[0]?.id) {
          setCategoryId(normalized[0].id);
        }
      } catch (error) {
        console.error(error);
        toast.error('Impossible de charger les categories.');
      }
    };

    fetchCategories();
  }, []);

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

    const validFiles = imageFiles.filter(Boolean);
    if (validFiles.length === 0) {
      toast.error('Ajoutez au moins une image pour ce produit.');
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await Promise.all(
        validFiles.map(async (file) => {
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

      const selectedCategory = categories.find((category) => category.id === categoryId);

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          category: selectedCategory?.name || '',
          price: parseFloat(price),
          offerPrice: offerPrice ? parseFloat(offerPrice) : null,
          stock: parseInt(stock, 10),
          imgUrl: imageUrls,
          brand: brand || null,
          color: color || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible d'ajouter le produit.");
      }

      toast.success('Produit ajoute avec succes.');
      router.push('/seller/product-list');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la creation du produit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <SellerSectionHeader
        eyebrow="Catalogue"
        title="Ajouter un produit"
        description="Creez une fiche produit propre avec images, prix, marque, couleur et stock pour garder un catalogue net et facile a maintenir."
      />

      <SellerPanel className="mt-8 p-5 md:p-8">
        <form onSubmit={handleSubmit} className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-medium text-slate-500">Galerie produit</p>
            <h2 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">
              Ajoutez jusqu&apos;a 4 images
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <label
                  key={index}
                  htmlFor={`product-image-${index}`}
                  className="group flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 transition hover:border-[var(--brand-300)] hover:bg-[rgba(191,219,254,0.14)]"
                >
                  <input
                    id={`product-image-${index}`}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(event) => handleFileChange(event, index)}
                  />

                  {previews[index] ? (
                    <Image
                      src={previews[index]}
                      alt={`Apercu ${index + 1}`}
                      width={220}
                      height={220}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="rounded-full bg-white p-3 text-[var(--brand-700)] shadow-sm">
                        <ImagePlus className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-700">Ajouter une image</p>
                      <p className="mt-1 px-4 text-xs leading-6 text-slate-400">
                        JPG, PNG ou WebP
                      </p>
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
                  placeholder="Ex : MacBook Air 13 pouces"
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
                  placeholder="Apple, Samsung, JBL..."
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
                  placeholder="250000"
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
                  placeholder="Optionnel"
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
                  placeholder="20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Couleur</label>
                <input
                  type="text"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="w-full rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--brand-300)]"
                  placeholder="Titanium, Noir, Bleu..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--brand-300)]"
                  placeholder="Decrivez clairement le produit, ses points forts et son usage."
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 md:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand-600)] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {loading ? 'Enregistrement...' : 'Enregistrer le produit'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/seller/product-list')}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-6 py-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Retour au catalogue
              </button>
            </div>
          </div>
        </form>
      </SellerPanel>

      <Footer />
    </div>
  );
}
