'use client';

import React, { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { GripVertical, ImagePlus, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';

import SellerButton from '@/components/seller/SellerButton';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerSelect from '@/components/seller/SellerSelect';

interface CategoryOption {
  id: string;
  name: string;
}

interface FieldError {
  field: string;
  message: string;
}

const initialErrors: FieldError[] = [];

export default function AddProductPage(): React.ReactElement {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stock, setStock] = useState('');
  const [visible, setVisible] = useState(true);
  const [costPrice, setCostPrice] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        const normalized = Array.isArray(data) ? data : [];
        setCategories(normalized);
        if (normalized[0]?.id) setCategoryId(normalized[0].id);
      } catch {
        toast.error('Impossible de charger les categories.');
      }
    };
    fetchCategories();
  }, []);

  const previews = useMemo(() => {
    return imageFiles.map((file) => (file ? URL.createObjectURL(file) : null));
  }, [imageFiles]);

  useEffect(() => {
    return () => previews.forEach((p) => { if (p) URL.revokeObjectURL(p); });
  }, [previews]);

  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const validate = useCallback((): boolean => {
    const errs: FieldError[] = [];
    if (!name.trim()) errs.push({ field: 'name', message: 'Nom requis' });
    if (!description.trim()) errs.push({ field: 'description', message: 'Description requise' });
    if (!price || parseFloat(price) <= 0) errs.push({ field: 'price', message: 'Prix invalide' });
    if (stock === '' || parseInt(stock, 10) < 0) errs.push({ field: 'stock', message: 'Stock invalide' });
    if (!categoryId) errs.push({ field: 'categoryId', message: 'Categorie requise' });
    if (imageFiles.filter(Boolean).length === 0) errs.push({ field: 'images', message: 'Ajoutez au moins une image' });
    setErrors(errs);
    return errs.length === 0;
  }, [name, description, price, stock, categoryId, imageFiles]);

  const handleFileChange = (index: number, file: File | null) => {
    setImageFiles((current) => {
      const next = [...current];
      next[index] = file;
      return next;
    });
    setErrors((prev) => prev.filter((e) => e.field !== 'images'));
  };

  const removeImage = (index: number) => {
    setImageFiles((current) => {
      const next = [...current];
      next[index] = null;
      return next;
    });
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const moveImage = (from: number, to: number) => {
    setImageFiles((current) => {
      const next = [...current];
      const temp = next[from];
      next[from] = next[to];
      next[to] = temp;
      return next;
    });
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
  };

  const submitProduct = async (): Promise<boolean> => {
    if (!validate()) return false;

    const validFiles = imageFiles.filter(Boolean) as File[];
    setLoading(true);

    try {
      const imageUrls = await Promise.all(
        validFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('image', file);
          const uploadResponse = await fetch('/api/upload-image', { method: 'POST', body: formData });
          const uploadData = await uploadResponse.json();
          if (!uploadResponse.ok || !uploadData.imageUrl) throw new Error(uploadData.message || "Echec de l'upload");
          return uploadData.imageUrl as string;
        })
      );

      const selectedCategory = categories.find((c) => c.id === categoryId);
      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        category: selectedCategory?.name || '',
        price: parseFloat(price),
        offerPrice: offerPrice ? parseFloat(offerPrice) : null,
        stock: parseInt(stock, 10),
        imgUrl: imageUrls,
        brand: brand.trim() || null,
        color: color.trim() || null,
        visible,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        tags: tags.length > 0 ? tags : null,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Impossible d'ajouter le produit.");

      toast.success('Produit ajoute avec succes.');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la creation du produit.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = await submitProduct();
    if (ok) router.push('/seller/product-list');
  };

  const handleSaveAndAdd = async () => {
    const ok = await submitProduct();
    if (ok) {
      setName('');
      setDescription('');
      setPrice('');
      setOfferPrice('');
      setStock('');
      setBrand('');
      setColor('');
      setCostPrice('');
      setTags([]);
      setTagInput('');
      setImageFiles([null, null, null, null]);
      setErrors([]);
      fileInputRefs.current.forEach((ref) => { if (ref) ref.value = ''; });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader
        title="Ajouter un produit"
        action={
          <SellerButton variant="outline" onClick={() => router.push('/seller/product-list')}>
            Retour au catalogue
          </SellerButton>
        }
      />

      <form onSubmit={handleSubmit}>
        <SellerPanel className="p-6 md:p-8">
          <div className="grid gap-8 xl:grid-cols-[1fr_1.1fr]">
            {/* Colonne gauche — Images */}
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Galerie produit</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                Ajoutez jusqu&apos;a 4 images
              </h2>
              {getError('images') && (
                <p className="mt-2 text-xs text-[var(--accent-red)]">{getError('images')}</p>
              )}
              <div className="mt-6 grid grid-cols-2 gap-4">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <label
                      htmlFor={`product-image-${index}`}
                      className={`group flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[10px] border-2 border-dashed transition ${
                        file
                          ? 'border-[var(--accent-green)]/40'
                          : 'border-[var(--border)] hover:border-[var(--accent-blue)]'
                      } bg-[var(--bg-outer)] hover:bg-[var(--bg-hover)]`}
                    >
                      <input
                        ref={(el) => { fileInputRefs.current[index] = el; }}
                        id={`product-image-${index}`}
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(event) => {
                          const f = event.target.files?.[0] || null;
                          handleFileChange(index, f);
                        }}
                      />
                      {file && previews[index] ? (
                        <Image
                          src={previews[index]!}
                          alt={`Apercu ${index + 1}`}
                          width={220}
                          height={220}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <div className="rounded-full bg-[var(--bg-card)] p-3 text-[var(--accent-blue)]">
                            <ImagePlus className="h-5 w-5" />
                          </div>
                          <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">Ajouter une image</p>
                          <p className="mt-1 text-xs leading-6 text-[var(--text-tertiary)]">JPG, PNG ou WebP</p>
                        </div>
                      )}
                    </label>
                    {file && (
                      <div className="absolute -right-2 -top-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (index > 0) moveImage(index, index - 1);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] shadow transition hover:text-[var(--text-primary)]"
                          title="Deplacer a gauche"
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-red)]/20 text-[var(--accent-red)] transition hover:bg-[var(--accent-red)]/30"
                          title="Retirer l'image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Colonne droite — Formulaire */}
            <div className="flex flex-col gap-5">
              {/* Infos de base */}
              <div className="rounded-[10px] bg-[var(--bg-outer)] p-5">
                <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Informations</h3>
                <div className="grid gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Nom du produit *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrors((p) => p.filter((x) => x.field !== 'name')); }}
                      className={`h-11 w-full rounded-lg border bg-[var(--bg-card)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20 ${
                        getError('name') ? 'border-[var(--accent-red)]' : 'border-[var(--border)]'
                      }`}
                      placeholder="Ex : MacBook Air 13 pouces"
                    />
                    {getError('name') && <p className="mt-1 text-xs text-[var(--accent-red)]">{getError('name')}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Description *</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); setErrors((p) => p.filter((x) => x.field !== 'description')); }}
                      className={`w-full rounded-lg border bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20 ${
                        getError('description') ? 'border-[var(--accent-red)]' : 'border-[var(--border)]'
                      }`}
                      placeholder="Decrivez clairement le produit, ses points forts et son usage."
                    />
                    {getError('description') && <p className="mt-1 text-xs text-[var(--accent-red)]">{getError('description')}</p>}
                  </div>
                </div>
              </div>

              {/* Prix et Stock */}
              <div className="rounded-[10px] bg-[var(--bg-outer)] p-5">
                <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Prix & Stock</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Prix *</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={price}
                      onChange={(e) => { setPrice(e.target.value); setErrors((p) => p.filter((x) => x.field !== 'price')); }}
                      className={`h-11 w-full rounded-lg border bg-[var(--bg-card)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20 ${
                        getError('price') ? 'border-[var(--accent-red)]' : 'border-[var(--border)]'
                      }`}
                      placeholder="250000"
                    />
                    {getError('price') && <p className="mt-1 text-xs text-[var(--accent-red)]">{getError('price')}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Prix promo</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20"
                      placeholder="Optionnel"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Stock *</label>
                    <input
                      type="number" min="0"
                      value={stock}
                      onChange={(e) => { setStock(e.target.value); setErrors((p) => p.filter((x) => x.field !== 'stock')); }}
                      className={`h-11 w-full rounded-lg border bg-[var(--bg-card)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20 ${
                        getError('stock') ? 'border-[var(--accent-red)]' : 'border-[var(--border)]'
                      }`}
                      placeholder="20"
                    />
                    {getError('stock') && <p className="mt-1 text-xs text-[var(--accent-red)]">{getError('stock')}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Prix d&apos;achat</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20"
                      placeholder="Pour calculer la marge"
                    />
                  </div>
                </div>
              </div>

              {/* Catégorisation */}
              <div className="rounded-[10px] bg-[var(--bg-outer)] p-5">
                <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Classification</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Categorie *</label>
                    <SellerSelect
                      value={categoryId}
                      onChange={(v) => { setCategoryId(v); setErrors((p) => p.filter((x) => x.field !== 'categoryId')); }}
                      options={categoryOptions}
                    />
                    {getError('categoryId') && <p className="mt-1 text-xs text-[var(--accent-red)]">{getError('categoryId')}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Marque</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20"
                      placeholder="Apple, Samsung..."
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Couleur</label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20"
                      placeholder="Titanium, Noir..."
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Visibilite</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setVisible(true)}
                        className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          visible
                            ? 'bg-[var(--accent-green)] text-white'
                            : 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        Publie
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisible(false)}
                        className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          !visible
                            ? 'bg-[var(--text-tertiary)] text-white'
                            : 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        Brouillon
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="rounded-[10px] bg-[var(--bg-outer)] p-5">
                <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Étiquettes</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-blue)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent-blue)]"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(i)} className="hover:text-[var(--accent-red)]">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="h-9 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-blue)]"
                    placeholder="Ex: nouvel-arrivage, promo"
                  />
                  <SellerButton type="button" variant="outline" size="sm" onClick={addTag}>Ajouter</SellerButton>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <SellerButton type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement...</>
                  ) : (
                    <><Plus className="h-4 w-4" />Enregistrer </>
                  )}
                </SellerButton>
                <SellerButton type="button" variant="outline" disabled={loading} onClick={handleSaveAndAdd} className="flex-1">
                  <Plus className="h-4 w-4" />Ajouter un autre
                </SellerButton>
                <SellerButton type="button" variant="ghost" onClick={() => router.push('/seller/product-list')} className="flex-1">
                  Retour au catalogue
                </SellerButton>
              </div>
            </div>
          </div>
        </SellerPanel>
      </form>
    </div>
  );
}
