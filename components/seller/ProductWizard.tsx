'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, Check, ImagePlus, Loader2, Plus, X, GripVertical,
  Package, Truck, Award, Eye, Settings, DollarSign, Layers,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAppContext } from '@/context/AppContext';
import SellerButton from '@/components/seller/SellerButton';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSelect from '@/components/seller/SellerSelect';

interface Category { id: string; name: string; level: number; }
interface CharValue { id: string; value: string; valueSlug: string | null; colorCode: string | null; imageUrl: string | null; sortOrder: number; }
interface Characteristic { id: string; name: string; attributeType: string; isVariant: boolean; displayOrder: number; values: CharValue[]; }
interface GeneratedVariant { sku: string; variantName: string; price: number; stock: number; attributes: { attributeId: string; attributeValueId: string; priceModifier: number | null; stockAdjustment: number | null; }[]; }
interface VariantConfig { id: string; attributeId: string; attributeName: string; attributeType: string; selectedValues: string[]; modifications: Record<string, { priceModifier: number; stockAdjustment: number; }>; }

const STEPS = [
  { num: 1, label: 'Catégorie', icon: Layers },
  { num: 2, label: 'Infos produit', icon: Package },
  { num: 3, label: 'Variantes', icon: Settings },
  { num: 4, label: 'Prix & MOQ', icon: DollarSign },
  { num: 5, label: 'Livraison', icon: Truck },
  { num: 6, label: 'Certifications', icon: Award },
  { num: 7, label: 'Révision', icon: Eye },
];

const CERTIFICATION_OPTIONS = [
  { slug: 'ce', label: 'CE' },
  { slug: 'fcc', label: 'FCC' },
  { slug: 'rohs', label: 'RoHS' },
  { slug: 'iso-9001', label: 'ISO 9001' },
  { slug: 'trade-assurance', label: 'Trade Assurance' },
  { slug: 'fast-dispatch', label: 'Fast Dispatch' },
  { slug: 'sample-available', label: 'Sample Available' },
];

interface ProductWizardProps {
  productId?: string;
}

export default function ProductWizard({ productId }: ProductWizardProps = {}) {
  const router = useRouter();
  const { fetchProducts } = useAppContext();
  const isEditMode = !!productId;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 1: Category
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([]);

  // Step 2: Product Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null, null, null]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Colors (edit page had this, wizard didn't)
  const [allColors, setAllColors] = useState<{ id: string; name: string; hex: string }[]>([]);
  const [selectedColorIds, setSelectedColorIds] = useState<Set<string>>(new Set());

  // Visible toggle
  const [visible, setVisible] = useState(true);

  // Step 3: Variants
  const [variantConfigs, setVariantConfigs] = useState<VariantConfig[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);

  // Step 4: Pricing
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [moqMin, setMoqMin] = useState('1');
  const [moqMax, setMoqMax] = useState('');

  // Step 5: Shipping
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [leadTimeRange, setLeadTimeRange] = useState('3-5 jours');

  // Step 6: Certifications
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCategories(data.filter((c: Category) => c.level === 0)); })
      .catch(() => toast.error('Erreur chargement catégories'));
  }, []);

  // Characteristics managed via state instead of DOM
  const [characteristicValues, setCharacteristicValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedCategoryId) { setCharacteristics([]); return; }
    fetch(`/api/categories/${selectedCategoryId}/attributes`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCharacteristics(data);
          const configs: VariantConfig[] = data
            .filter((c: Characteristic) => c.isVariant)
            .map((c: Characteristic) => ({
              id: c.id, attributeId: c.id, attributeName: c.name, attributeType: c.attributeType,
              selectedValues: [], modifications: {},
            }));
          setVariantConfigs(configs);
          setGeneratedVariants([]);
        }
      })
      .catch(() => {});
  }, [selectedCategoryId]);

  // Load colors for the color picker
  useEffect(() => {
    fetch('/api/colors')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllColors(data); })
      .catch(() => {});
  }, []);

  // Load product data in edit mode
  useEffect(() => {
    if (!productId) return;
    const loadProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error('Failed to load product');
        const product = await res.json();

        setName(product.name || '');
        setDescription(product.description || '');
        setBrand(product.brand || '');

        // Images
        const urls: string[] = Array.isArray(product.imgUrl) ? product.imgUrl : (product.imgUrl ? [product.imgUrl] : []);
        setExistingImageUrls(urls);

        // Category
        if (product.categoryId) {
          setSelectedCategoryId(product.categoryId);
        } else if (product.category) {
          const cat = categories.find(c => c.name === product.category);
          if (cat) setSelectedCategoryId(cat.id);
        }

        // Pricing
        setPrice(product.price?.toString() || '');
        setOfferPrice(product.offerPrice?.toString() || '');
        setCostPrice(product.costPrice?.toString() || '');
        setStock(product.stock?.toString() || '');
        setMoqMin(product.moqMin?.toString() || '1');
        setMoqMax(product.moqMax?.toString() || '');

        // Shipping
        setWeight(product.weight?.toString() || '');
        setLength(product.length?.toString() || '');
        setWidth(product.width?.toString() || '');
        setHeight(product.height?.toString() || '');
        setLeadTimeRange(product.leadTimeRange || '3-5 jours');

        // Certifications
        setSelectedCertifications(product.certifications || []);

        // Tags
        setTags(product.tags || []);

        // Visible
        setVisible(product.visible !== false);

        // Colors
        if (product.colorIds && Array.isArray(product.colorIds)) {
          setSelectedColorIds(new Set(product.colorIds));
        }
        // Legacy color field (string)
        if (!product.colorIds && product.color) {
          try {
            const parsed = JSON.parse(product.color);
            if (Array.isArray(parsed)) setSelectedColorIds(new Set(parsed));
          } catch {}
        }

        // Characteristics values
        try {
          const charsRes = await fetch(`/api/product-characteristics?productId=${productId}`);
          const charsData = await charsRes.json();
          if (Array.isArray(charsData)) {
            const values: Record<string, string> = {};
            charsData.forEach((pc: { characteristicId: string; value: string }) => {
              values[pc.characteristicId] = pc.value;
            });
            setCharacteristicValues(values);
          }
        } catch {}

        // Load existing variants
        try {
          const vRes = await fetch(`/api/products/${productId}/variants`);
          if (vRes.ok) {
            const variants = await vRes.json();
            if (Array.isArray(variants) && variants.length > 0) {
              const gVariants: GeneratedVariant[] = variants.map((v: { sku: string; variantName: string; price: number; stock: number; attributes: { attributeId: string; attributeValueId: string; priceModifier: number | null; stockAdjustment: number | null; }[]; }) => ({
                sku: v.sku,
                variantName: v.variantName,
                price: v.price,
                stock: v.stock,
                attributes: v.attributes || [],
              }));
              setGeneratedVariants(gVariants);

              // Pre-select variant attribute values in variantConfigs
              const attrValueIds = new Set<string>();
              variants.forEach((v: { attributes: { attributeValueId: string }[] }) => {
                (v.attributes || []).forEach(a => attrValueIds.add(a.attributeValueId));
              });
              setVariantConfigs(prev => prev.map(config => {
                const idsForAttr = new Set<string>();
                variants.forEach((v: { attributes: { attributeId: string; attributeValueId: string }[] }) => {
                  (v.attributes || []).forEach(a => {
                    if (a.attributeId === config.attributeId) idsForAttr.add(a.attributeValueId);
                  });
                });
                return { ...config, selectedValues: Array.from(idsForAttr) };
              }));
            }
          }
        } catch {}
      } catch (err) {
        toast.error('Erreur chargement produit');
      } finally {
        setInitialLoading(false);
      }
    };
    loadProduct();
  }, [productId, categories]);

  const previews = useMemo(() => imageFiles.map(f => (f ? URL.createObjectURL(f) : null)), [imageFiles]);
  useEffect(() => () => previews.forEach(p => { if (p) URL.revokeObjectURL(p); }), [previews]);

  const handleFileChange = (index: number, file: File | null) => {
    setImageFiles(prev => { const next = [...prev]; next[index] = file; return next; });
  };
  const removeImage = (index: number) => {
    setImageFiles(prev => { const next = [...prev]; next[index] = null; return next; });
    if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = '';
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); setTagInput(''); }
  };
  const removeTag = (i: number) => setTags(prev => prev.filter((_, idx) => idx !== i));

  const handleVariantValueToggle = (configId: string, valueId: string) => {
    setVariantConfigs(prev => prev.map(c => {
      if (c.id !== configId) return c;
      const selected = c.selectedValues.includes(valueId)
        ? c.selectedValues.filter(v => v !== valueId)
        : [...c.selectedValues, valueId];
      return { ...c, selectedValues: selected };
    }));
    setGeneratedVariants([]);
  };

  const updateModification = (configId: string, valueId: string, field: 'priceModifier' | 'stockAdjustment', val: string) => {
    setVariantConfigs(prev => prev.map(c => {
      if (c.id !== configId) return c;
      return {
        ...c,
        modifications: {
          ...c.modifications,
          [valueId]: { ...c.modifications[valueId] || { priceModifier: 0, stockAdjustment: 0 }, [field]: parseFloat(val) || 0 },
        },
      };
    }));
    setGeneratedVariants([]);
  };

  const generateVariants = async () => {
    if (!selectedCategoryId) return;
    try {
      const variantAttrs = variantConfigs.filter(c => c.selectedValues.length > 0);
      const selectedAttributes = variantAttrs.map(c => ({
        attributeId: c.attributeId,
        values: c.selectedValues.map(vId => ({
          attributeValueId: vId,
          priceModifier: c.modifications[vId]?.priceModifier || 0,
          stockAdjustment: c.modifications[vId]?.stockAdjustment || 0,
        })),
      }));

      // Create a temporary product to get the name for SKU generation
      const basePrice = parseFloat(price) || 0;

      // Generate locally
      const attrGroups = selectedAttributes.map(a =>
        a.values.map(v => ({
          attributeId: a.attributeId,
          attributeValueId: v.attributeValueId,
          priceModifier: v.priceModifier,
          stockAdjustment: v.stockAdjustment,
        }))
      );

      const cartesian = <T,>(arrays: T[][]): T[][] =>
        arrays.reduce<T[][]>((acc, curr) => acc.flatMap(c => curr.map(v => [...c, v])), [[]]);

      const combos = attrGroups.length > 0 ? cartesian(attrGroups) : [];

      // Fetch value names
      const allValIds = combos.flat().map(c => c.attributeValueId);
      const valRes = await fetch(`/api/categories/${selectedCategoryId}/attributes`);
      const chars: Characteristic[] = await valRes.json();
      const valMap = new Map<string, string>();
      chars.forEach(ch => ch.values.forEach(v => valMap.set(v.id, v.value)));

      const variants = combos.map((combo, idx) => {
        const modTotal = combo.reduce((s, a) => s + (a.priceModifier || 0), 0);
        const stAdjust = combo.reduce((s, a) => s + (a.stockAdjustment || 0), 0);
        const names = combo.map(c => valMap.get(c.attributeValueId) || '').filter(Boolean);
        const sku = `${(name || 'PROD').slice(0, 3).toUpperCase()}-${names.join('-').replace(/\s+/g, '')}-${idx + 1}`;
        return {
          sku: sku.toUpperCase(),
          variantName: names.join(' / '),
          price: Math.max(0, basePrice + modTotal),
          stock: Math.max(0, stAdjust),
          attributes: combo,
        };
      });

      setGeneratedVariants(variants);
      if (variants.length > 0) toast.success(`${variants.length} variantes générées`);
    } catch {
      toast.error('Erreur génération variantes');
    }
  };

  const canProceed = useCallback((s: number) => {
    const hasImages = imageFiles.some(Boolean) || existingImageUrls.length > 0;
    switch (s) {
      case 1: return !!selectedCategoryId;
      case 2: return !!name.trim() && !!description.trim() && hasImages;
      case 3: return true;
      case 4: return !!price && parseFloat(price) > 0;
      case 5: return true;
      case 6: return true;
      case 7: return true;
      default: return false;
    }
  }, [selectedCategoryId, name, description, imageFiles, existingImageUrls, price]);

  const submitProduct = async () => {
    setLoading(true);
    try {
      // Upload new images
      const validFiles = imageFiles.filter(Boolean) as File[];
      const uploadedUrls = await Promise.all(
        validFiles.map(file =>
          fetch('/api/upload-image', { method: 'POST', body: (() => { const fd = new FormData(); fd.append('image', file); return fd; })() })
            .then(r => r.json())
            .then(d => { if (!d.imageUrl) throw new Error('Upload failed'); return d.imageUrl as string; })
        )
      );

      // Keep existing images that haven't been removed
      const keptExistingUrls = existingImageUrls.filter(url => !removedImageUrls.includes(url));
      const finalImageUrls = [...keptExistingUrls, ...uploadedUrls];

      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        categoryId: selectedCategoryId,
        price: parseFloat(price),
        offerPrice: offerPrice ? parseFloat(offerPrice) : null,
        stock: parseInt(stock || '0', 10),
        imgUrl: finalImageUrls,
        brand: brand.trim() || null,
        visible,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        tags: tags.length > 0 ? tags : null,
        moqMin: parseInt(moqMin || '1', 10),
        moqMax: moqMax ? parseInt(moqMax, 10) : null,
        leadTimeRange,
        weight: weight ? parseFloat(weight) : null,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        certifications: selectedCertifications.length > 0 ? selectedCertifications : null,
        color: JSON.stringify(Array.from(selectedColorIds)) || null,
      };

      if (isEditMode) {
        // UPDATE
        const response = await fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Erreur mise à jour produit');

        // Update characteristics: delete all, re-create
        if (Object.keys(characteristicValues).length > 0) {
          await fetch(`/api/product-characteristics?productId=${productId}`, { method: 'DELETE' });
          await Promise.all(
            Object.entries(characteristicValues)
              .filter(([, value]) => value.trim())
              .map(([charId, value]) =>
                fetch('/api/product-characteristics', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productId, characteristicId: charId, value: value.trim() }),
                })
              )
          );
        }

        // Update variants: delete all, re-create
        if (generatedVariants.length > 0) {
          await fetch(`/api/admin/variants?productId=${productId}`, { method: 'DELETE' });
          for (const v of generatedVariants) {
            await fetch('/api/admin/variants', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...v, productId, stock: v.stock || parseInt(stock || '0', 10), moq: parseInt(moqMin || '1', 10) }),
            });
          }
        }

        toast.success('Produit mis à jour avec succès!');
      } else {
        // CREATE
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erreur création produit');
        const newProductId = data.product?.id;
        if (!newProductId) throw new Error('ID produit manquant');

        // Save characteristics
        if (Object.keys(characteristicValues).length > 0) {
          await Promise.all(
            Object.entries(characteristicValues)
              .filter(([, value]) => value.trim())
              .map(([charId, value]) =>
                fetch('/api/product-characteristics', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productId: newProductId, characteristicId: charId, value: value.trim() }),
                })
              )
          );
        }

        // Save variants
        if (generatedVariants.length > 0) {
          for (const v of generatedVariants) {
            await fetch('/api/admin/variants', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...v, productId: newProductId, stock: v.stock || parseInt(stock || '0', 10), moq: parseInt(moqMin || '1', 10) }),
            });
          }
        }

        toast.success('Produit créé avec succès!');
      }

      fetchProducts();
      router.push('/seller/product-list');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur soumission produit');
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Sélectionnez une catégorie</h3>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Les attributs et caractéristiques seront chargés automatiquement selon la catégorie choisie.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition hover:bg-[var(--bg-hover)] ${
              selectedCategoryId === cat.id
                ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/5'
                : 'border-[var(--border)] bg-[var(--bg-card)]'
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              selectedCategoryId === cat.id ? 'bg-[var(--accent-blue)] text-white' : 'bg-[var(--bg-outer)] text-[var(--text-secondary)]'
            }`}>
              <Layers className="h-5 w-5" />
            </div>
            <span className="font-medium text-[var(--text-primary)]">{cat.name}</span>
          </button>
        ))}
      </div>
      {characteristics.length > 0 && (
        <div className="rounded-xl bg-[var(--bg-outer)] p-5">
          <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Attributs disponibles ({characteristics.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {characteristics.map(c => (
              <span key={c.id} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                c.isVariant ? 'bg-purple-500/10 text-purple-400' : 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
              }`}>
                {c.isVariant ? <Settings className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                {c.name}
                <span className="opacity-60">({c.attributeType})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const removeExistingImage = (idx: number) => {
    const url = existingImageUrls[idx];
    if (url) {
      setRemovedImageUrls(prev => [...prev, url]);
      setExistingImageUrls(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const renderInfoStep = () => {
    const totalSlots = Math.max(6, existingImageUrls.length + 1);
    const slots: { type: 'existing' | 'new'; idx: number }[] = [];
    existingImageUrls.forEach((_, i) => slots.push({ type: 'existing', idx: i }));
    const newCount = imageFiles.length;
    for (let i = 0; i < newCount; i++) slots.push({ type: 'new', idx: i });

    return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Titre du produit *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20"
              placeholder="Ex: MacBook Air 13 pouces M2 2024" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Description *</label>
            <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20"
              placeholder="Description détaillée du produit..." />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Marque</label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)}
              className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
              placeholder="Apple, Samsung, HP..." />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Couleur</label>
            <div className="flex flex-wrap gap-2">
              {allColors.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)]">Aucune couleur disponible.</p>
              ) : allColors.map((c) => (
                <button key={c.id} type="button" onClick={() => setSelectedColorIds(prev => {
                  const next = new Set(prev);
                  if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                  return next;
                })}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    selectedColorIds.has(c.id)
                      ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                      : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }`}>
                  <span className="h-4 w-4 rounded-full border border-[var(--border)]" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Visibilité</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setVisible(true)}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  visible ? 'bg-[var(--accent-green)] text-white' : 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}>Publié</button>
              <button type="button" onClick={() => setVisible(false)}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  !visible ? 'bg-[var(--text-tertiary)] text-white' : 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}>Brouillon</button>
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Images * (6 max)</label>
          <div className="grid grid-cols-3 gap-3">
            {slots.map((slot, globalIdx) => {
              if (slot.type === 'existing') {
                const url = existingImageUrls[slot.idx];
                return (
                  <div key={`exist-${slot.idx}`} className="relative">
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-outer)]">
                      <Image src={url} alt="" width={200} height={200} className="h-full w-full object-cover" />
                    </div>
                    <button type="button" onClick={() => removeExistingImage(slot.idx)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-red)] text-white shadow">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              }
              const fileIdx = slot.idx;
              const file = imageFiles[fileIdx];
              return (
                <div key={`new-${fileIdx}`} className="relative">
                  <label htmlFor={`wiz-img-${globalIdx}`}
                    className={`group flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
                      file ? 'border-[var(--accent-green)]/40' : 'border-[var(--border)] hover:border-[var(--accent-blue)]'
                    } bg-[var(--bg-outer)]`}>
                    <input ref={el => { fileInputRefs.current[fileIdx] = el; }}
                      id={`wiz-img-${globalIdx}`} type="file" hidden accept="image/*"
                      onChange={e => handleFileChange(fileIdx, e.target.files?.[0] || null)} />
                    {file && previews[fileIdx] ? (
                      <Image src={previews[fileIdx]!} alt="" width={200} height={200} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center p-2 text-center">
                        <ImagePlus className="h-6 w-6 text-[var(--text-tertiary)]" />
                        <span className="mt-1 text-[10px] text-[var(--text-tertiary)]">Ajouter</span>
                      </div>
                    )}
                  </label>
                  {file && (
                    <button type="button" onClick={() => removeImage(fileIdx)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-red)] text-white shadow">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Tags */}
      <div className="rounded-xl bg-[var(--bg-outer)] p-5">
        <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Étiquettes</h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-blue)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent-blue)]">
              {t}
              <button type="button" onClick={() => removeTag(i)}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            className="h-9 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm outline-none focus:border-[var(--accent-blue)]"
            placeholder="Nouvel arrivage, promo..." />
          <SellerButton type="button" variant="outline" size="sm" onClick={addTag}>Ajouter</SellerButton>
        </div>
      </div>
    </div>
  );
  };

  const renderVariantStep = () => {
    const variantAttrs = characteristics.filter(c => c.isVariant);
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Configuration des variantes</h3>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Sélectionnez les attributs qui créent des variantes (couleur, taille, stockage, etc.)
          </p>
        </div>
        {variantAttrs.length === 0 ? (
          <div className="rounded-xl bg-[var(--bg-outer)] p-8 text-center">
            <Settings className="mx-auto h-8 w-8 text-[var(--text-tertiary)]" />
            <p className="mt-3 text-sm text-[var(--text-tertiary)]">
              Aucun attribut variant configuré pour cette catégorie.
            </p>
          </div>
        ) : (
          variantAttrs.map(attr => {
            const config = variantConfigs.find(c => c.attributeId === attr.id);
            return (
              <div key={attr.id} className="rounded-xl bg-[var(--bg-outer)] p-5">
                <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                  {attr.name}
                  <span className="ml-2 text-xs font-normal text-[var(--text-tertiary)]">({attr.attributeType})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {attr.values.map(v => {
                    const selected = config?.selectedValues.includes(v.id);
                    return (
                      <button key={v.id} type="button" onClick={() => handleVariantValueToggle(attr.id, v.id)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          selected
                            ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                            : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                        }`}>
                        {attr.attributeType === 'COLOR' && v.colorCode && (
                          <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: v.colorCode }} />
                        )}
                        {v.value}
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
                {config && config.selectedValues.map(vId => {
                  const val = attr.values.find(v => v.id === vId);
                  if (!val) return null;
                  return (
                    <div key={vId} className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-[var(--bg-card)] p-3">
                      <div>
                        <label className="text-xs text-[var(--text-tertiary)]">Majoration prix ({val.value})</label>
                        <input type="number" step="0.01" value={config.modifications[vId]?.priceModifier || 0}
                          onChange={e => updateModification(attr.id, vId, 'priceModifier', e.target.value)}
                          className="mt-1 h-8 w-full rounded border border-[var(--border)] bg-[var(--bg-outer)] px-2 text-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--text-tertiary)]">Ajustement stock</label>
                        <input type="number" value={config.modifications[vId]?.stockAdjustment || 0}
                          onChange={e => updateModification(attr.id, vId, 'stockAdjustment', e.target.value)}
                          className="mt-1 h-8 w-full rounded border border-[var(--border)] bg-[var(--bg-outer)] px-2 text-xs" />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
        {/* Caractéristiques non-variantes */}
        {characteristics.filter(c => !c.isVariant).length > 0 && (
          <div className="rounded-xl bg-[var(--bg-outer)] p-5">
            <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Caractéristiques</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {characteristics.filter(c => !c.isVariant).map(c => (
                <div key={c.id}>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">{c.name}</label>
                  {c.attributeType === 'SELECT' || c.attributeType === 'COLOR' || c.attributeType === 'SIZE' ? (
                    <select value={characteristicValues[c.id] || ''} onChange={e => setCharacteristicValues(prev => ({ ...prev, [c.id]: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)]">
                      <option value="">Sélectionner...</option>
                      {c.values.map(v => (
                        <option key={v.id} value={v.value}>{v.value}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={characteristicValues[c.id] || ''} onChange={e => setCharacteristicValues(prev => ({ ...prev, [c.id]: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)]"
                      placeholder={`Ex: ${c.name}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {variantConfigs.some(c => c.selectedValues.length > 0) && (
          <div className="flex items-center justify-between rounded-xl bg-[var(--accent-blue)]/5 p-4">
            <span className="text-sm text-[var(--text-primary)]">
              {generatedVariants.length > 0
                ? `${generatedVariants.length} variantes générées`
                : 'Cliquez pour générer les combinaisons'}
            </span>
            <SellerButton type="button" onClick={generateVariants}>
              Générer les variantes
            </SellerButton>
          </div>
        )}
        {generatedVariants.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-outer)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">SKU</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Variante</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">Prix</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {generatedVariants.map((v, i) => (
                  <tr key={i} className="hover:bg-[var(--bg-hover)]">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{v.sku}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{v.variantName}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-primary)]">{v.price.toLocaleString()} CFA</td>
                    <td className="px-4 py-3 text-right text-[var(--text-primary)]">{v.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderPricingStep = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Prix de vente *</label>
          <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)] focus:ring-4 focus:ring-[var(--accent-blue)]/20"
            placeholder="250000" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Prix promo</label>
          <input type="number" min="0" step="0.01" value={offerPrice} onChange={e => setOfferPrice(e.target.value)}
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)]"
            placeholder="Optionnel" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Prix d&apos;achat</label>
          <input type="number" min="0" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)}
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)]"
            placeholder="Pour marge" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Stock total *</label>
          <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)}
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)]"
            placeholder="50" />
        </div>
      </div>
      <div className="rounded-xl bg-[var(--bg-outer)] p-5">
        <h4 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Quantité minimale de commande (MOQ)</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">MOQ Min</label>
            <input type="number" min="1" value={moqMin} onChange={e => setMoqMin(e.target.value)}
              className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)]" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">MOQ Max</label>
            <input type="number" min="0" value={moqMax} onChange={e => setMoqMax(e.target.value)}
              className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)]"
              placeholder="Optionnel (commande max)" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderShippingStep = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Poids (kg)</label>
          <input type="number" min="0" step="0.001" value={weight} onChange={e => setWeight(e.target.value)}
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)]"
            placeholder="0.5" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Longueur (cm)</label>
          <input type="number" min="0" value={length} onChange={e => setLength(e.target.value)}
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Largeur (cm)</label>
          <input type="number" min="0" value={width} onChange={e => setWidth(e.target.value)}
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Hauteur (cm)</label>
          <input type="number" min="0" value={height} onChange={e => setHeight(e.target.value)}
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)]" />
        </div>
      </div>
      <div className="rounded-xl bg-[var(--bg-outer)] p-5">
        <h4 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Délai de livraison</h4>
        <div>
          <select value={leadTimeRange} onChange={e => setLeadTimeRange(e.target.value)}
            className="h-11 w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm outline-none focus:border-[var(--accent-blue)]">
            <option value="1-2 jours">1-2 jours</option>
            <option value="3-5 jours">3-5 jours</option>
            <option value="5-7 jours">5-7 jours</option>
            <option value="7-10 jours">7-10 jours</option>
            <option value="10-15 jours">10-15 jours</option>
            <option value="15-20 jours">15-20 jours</option>
            <option value="20-30 jours">20-30 jours</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderCertificationsStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Certifications & Badges</h3>
      <p className="text-sm text-[var(--text-tertiary)]">
        Ajoutez des certifications et badges pour renforcer la confiance des acheteurs.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CERTIFICATION_OPTIONS.map(cert => {
          const selected = selectedCertifications.includes(cert.slug);
          return (
            <button key={cert.slug} type="button" onClick={() => setSelectedCertifications(prev =>
              prev.includes(cert.slug) ? prev.filter(s => s !== cert.slug) : [...prev, cert.slug]
            )}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
                selected
                  ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/5'
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]'
              }`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                selected ? 'bg-[var(--accent-blue)] text-white' : 'bg-[var(--bg-outer)] text-[var(--text-secondary)]'
              }`}>
                <Award className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--text-primary)]">{cert.label}</p>
              </div>
              {selected && <Check className="h-5 w-5 text-[var(--accent-blue)]" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const totalImages = existingImageUrls.filter(u => !removedImageUrls.includes(u)).length + imageFiles.filter(Boolean).length;
    return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Révision du produit</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-[var(--bg-outer)] p-5">
          <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Informations</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--text-tertiary)]">Nom</dt><dd>{name || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-tertiary)]">Marque</dt><dd>{brand || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-tertiary)]">Catégorie</dt><dd>{categories.find(c => c.id === selectedCategoryId)?.name || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-tertiary)]">Prix</dt><dd>{price ? `${parseFloat(price).toLocaleString()} CFA` : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-tertiary)]">Stock</dt><dd>{stock || '0'}</dd></div>
          </dl>
        </div>
        <div className="rounded-xl bg-[var(--bg-outer)] p-5">
          <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Images ({totalImages})</h4>
          <div className="flex flex-wrap gap-2">
            {existingImageUrls.filter(u => !removedImageUrls.includes(u)).map((url, i) => (
              <div key={`exist-${i}`} className="relative h-16 w-16 overflow-hidden rounded-lg">
                <Image src={url} alt="" width={64} height={64} className="h-full w-full object-cover" />
              </div>
            ))}
            {imageFiles.filter(Boolean).map((f, i) => (
              <div key={`new-${i}`} className="relative h-16 w-16 overflow-hidden rounded-lg">
                <Image src={URL.createObjectURL(f!)} alt="" width={64} height={64} className="h-full w-full object-cover" />
              </div>
            ))}
            {totalImages === 0 && <p className="text-sm text-[var(--text-tertiary)]">Aucune image</p>}
          </div>
        </div>
      </div>
      {generatedVariants.length > 0 && (
        <div className="rounded-xl bg-[var(--bg-outer)] p-5">
          <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Variantes ({generatedVariants.length})
          </h4>
          <div className="text-sm text-[var(--text-secondary)]">
            {generatedVariants.slice(0, 5).map((v, i) => (
              <div key={i} className="flex justify-between py-1">
                <span className="font-mono text-xs">{v.sku}</span>
                <span>{v.variantName}</span>
                <span>{v.price.toLocaleString()} CFA</span>
              </div>
            ))}
            {generatedVariants.length > 5 && <p className="mt-2 text-xs text-[var(--text-tertiary)]">...et {generatedVariants.length - 5} autres</p>}
          </div>
        </div>
      )}
      {selectedCertifications.length > 0 && (
        <div className="rounded-xl bg-[var(--bg-outer)] p-5">
          <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Certifications</h4>
          <div className="flex flex-wrap gap-2">
            {selectedCertifications.map(s => (
              <span key={s} className="rounded-full bg-[var(--accent-green)]/10 px-3 py-1 text-xs font-medium text-[var(--accent-green)]">
                {CERTIFICATION_OPTIONS.find(c => c.slug === s)?.label || s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  };

  const renderStep = () => {
    switch (step) {
      case 1: return renderCategoryStep();
      case 2: return renderInfoStep();
      case 3: return renderVariantStep();
      case 4: return renderPricingStep();
      case 5: return renderShippingStep();
      case 6: return renderCertificationsStep();
      case 7: return renderReviewStep();
      default: return null;
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-blue)]" />
          <p className="text-sm text-[var(--text-tertiary)]">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.04em] text-[var(--text-primary)]">{isEditMode ? 'Modifier le produit' : 'Ajouter un produit'}</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Étape {step} sur 7 — {STEPS.find(s => s.num === step)?.label}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STEPS.map(s => (
          <React.Fragment key={s.num}>
            <div className={`flex items-center gap-2 ${
              s.num === step ? 'text-[var(--accent-blue)]' : s.num < step ? 'text-[var(--accent-green)]' : 'text-[var(--text-tertiary)]'
            }`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                s.num === step ? 'bg-[var(--accent-blue)] text-white' :
                s.num < step ? 'bg-[var(--accent-green)] text-white' :
                'bg-[var(--bg-outer)] text-[var(--text-tertiary)]'
              }`}>
                {s.num < step ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className="hidden text-xs font-medium sm:inline">{s.label}</span>
            </div>
            {s.num < 7 && <div className={`h-0.5 flex-1 rounded-full ${
              s.num < step ? 'bg-[var(--accent-green)]' : 'bg-[var(--border)]'
            }`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <SellerPanel className="p-6 md:p-8">
        {renderStep()}
      </SellerPanel>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <SellerButton type="button" variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
          <ChevronLeft className="h-4 w-4" /> Précédent
        </SellerButton>
        <div className="flex gap-3">
          {step < 7 ? (
            <SellerButton type="button" onClick={() => setStep(s => s + 1)} disabled={!canProceed(step)}>
              Suivant <ChevronRight className="h-4 w-4" />
            </SellerButton>
          ) : (
            <SellerButton type="button" onClick={submitProduct} disabled={loading || !canProceed(7)}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {isEditMode ? 'Mise à jour...' : 'Publication...'}</> : isEditMode ? 'Enregistrer les modifications' : 'Publier le produit'}
            </SellerButton>
          )}
        </div>
      </div>
    </div>
  );
}
