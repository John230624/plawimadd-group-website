'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Box,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerInput from '@/components/seller/SellerInput';
import SellerModal from '@/components/seller/SellerModal';
import SellerPagination from '@/components/seller/SellerPagination';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import StatCard from '@/components/seller/StatCard';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';
import Loading from '@/components/Loading';
import { useAppContext } from '@/context/AppContext';
import type { Product } from '@/lib/types';

const pageSize = 8;

type SortField = 'name' | 'category' | 'brand' | 'price' | 'stock' | 'createdAt';
type SortDir = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  dir: SortDir;
}

function getDisplayPrice(product: Product): number {
  if (product.offerPrice !== null && product.offerPrice !== undefined && product.offerPrice < product.price) {
    return product.offerPrice;
  }
  return product.price;
}

function getColorDisplay(color: string | null | undefined, colorMap: Record<string, { name: string; hex: string }>): string {
  if (!color) return 'Standard';
  try {
    const ids = JSON.parse(color);
    if (Array.isArray(ids) && ids.length > 0) {
      return ids.map((id: string) => colorMap[id]?.name || id).join(', ');
    }
  } catch {}
  return color;
}

function parseColorIds(color: string | null | undefined): string[] {
  if (!color) return [];
  try { const ids = JSON.parse(color); return Array.isArray(ids) ? ids : []; } catch { return []; }
}

function getStockBadge(stock: number): { label: string; color: 'success' | 'warning' | 'error' } {
  if (stock <= 0) return { label: 'Rupture', color: 'error' };
  if (stock <= 5) return { label: `${stock} stock faible`, color: 'warning' };
  return { label: `${stock} en stock`, color: 'success' };
}

export default function ProductListPage(): React.ReactElement {
  const { products, loadingProducts, fetchProducts, formatPrice } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [sort, setSort] = useState<SortConfig>({ field: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState('');
  const [colorMap, setColorMap] = useState<Record<string, { name: string; hex: string }>>({});

  useEffect(() => {
    fetch('/api/colors')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map: Record<string, { name: string; hex: string }> = {};
          data.forEach((c: { id: string; name: string; hex: string }) => { map[c.id] = { name: c.name, hex: c.hex }; });
          setColorMap(map);
        }
      })
      .catch(() => {});
  }, []);
  const [batchValue, setBatchValue] = useState('');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const [editingField, setEditingField] = useState<{ id: string; type: 'price' | 'stock' } | null>(null);
  const [editStock, setEditStock] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const priceEditRef = useRef<HTMLDivElement>(null);
  const stockEditRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
        else if (data.categories) setCategories(data.categories);
        else if (data.data) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, stockFilter, brandFilter]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        editingField &&
        ((editingField.type === 'price' && priceEditRef.current && !priceEditRef.current.contains(target)) ||
         (editingField.type === 'stock' && stockEditRef.current && !stockEditRef.current.contains(target)))
      ) {
        setEditingField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingField]);

  const categoryOptions = useMemo(() => {
    const names = Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean)));
    return [
      { value: 'ALL', label: 'Toutes categories' },
      ...names.map((name) => ({ value: String(name), label: String(name) })),
    ];
  }, [products]);

  const brandOptions = useMemo(() => {
    const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
    return [
      { value: 'ALL', label: 'Toutes marques' },
      ...brands.map((b) => ({ value: String(b), label: String(b) })),
    ];
  }, [products]);

  const sortableProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const stock = Number(product.stock);
      const haystack = [product.name, product.category?.name, product.brand || ''].join(' ').toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || product.category?.name === categoryFilter;
      const matchesBrand = brandFilter === 'ALL' || product.brand === brandFilter;
      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'IN_STOCK' && stock > 5) ||
        (stockFilter === 'LOW_STOCK' && stock > 0 && stock <= 5) ||
        (stockFilter === 'OUT_OF_STOCK' && stock <= 0);
      return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    });

    return [...filtered].sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      switch (sort.field) {
        case 'name':
          return a.name.localeCompare(b.name) * dir;
        case 'category':
          return (a.category?.name || '').localeCompare(b.category?.name || '') * dir;
        case 'brand':
          return (a.brand || '').localeCompare(b.brand || '') * dir;
        case 'price':
          return (getDisplayPrice(a) - getDisplayPrice(b)) * dir;
        case 'stock':
          return (Number(a.stock) - Number(b.stock)) * dir;
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
    });
  }, [products, searchTerm, categoryFilter, brandFilter, stockFilter, sort]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortableProducts.slice(start, start + pageSize);
  }, [sortableProducts, page]);

  const inStockCount = useMemo(() => products.filter((p) => Number(p.stock) > 0).length, [products]);
  const lowStockCount = useMemo(() => products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5).length, [products]);
  const visibleCount = useMemo(() => products.filter((p) => p.visible !== false).length, [products]);

  const allSelected = paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.has(p.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  const toggleSort = (field: SortField) => {
    setSort((prev) => (prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ArrowUpWideNarrow className="ml-1 h-3 w-3 opacity-30" />;
    return sort.dir === 'asc' ? (
      <ArrowUpWideNarrow className="ml-1 h-3 w-3 text-[var(--accent-green)]" />
    ) : (
      <ArrowDownWideNarrow className="ml-1 h-3 w-3 text-[var(--accent-green)]" />
    );
  };

  const executeDelete = async (): Promise<void> => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Suppression impossible.');
      toast.success('Produit supprime avec succes.');
      await fetchProducts();
      setProductToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression.');
    } finally {
      setIsDeleting(false);
    }
  };

  const inlineUpdate = async (id: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erreur');
      await fetchProducts();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de mise a jour');
      return false;
    }
  };

  const saveInlineEdit = async (id: string, type: 'price' | 'stock') => {
    const updates: Record<string, unknown> = {};
    if (type === 'stock' && editStock !== '') updates.stock = parseInt(editStock, 10);
    if (type === 'price' && editPrice !== '') updates.price = parseFloat(editPrice);
    if (Object.keys(updates).length === 0) { setEditingField(null); return; }
    const ok = await inlineUpdate(id, updates);
    if (ok) toast.success('Produit mis a jour');
    setEditingField(null);
  };

  const startInlineEdit = (product: Product, type: 'price' | 'stock') => {
    setEditingField({ id: product.id, type });
    setEditStock(String(product.stock));
    setEditPrice(String(product.price));
  };

  const toggleVisibility = async (product: Product) => {
    const ok = await inlineUpdate(product.id, { visible: !(product.visible ?? true) });
    if (ok) toast.success(product.visible !== false ? 'Produit masque' : 'Produit visible');
  };

  const executeBatch = async () => {
    if (!batchAction || selectedIds.size === 0) return;
    setIsBatchProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      const body: { ids: string[]; action: string; value?: unknown } = { ids, action: batchAction };

      if (batchAction === 'setCategory') {
        body.value = batchValue;
      } else if (batchAction === 'setStock') {
        body.value = parseInt(batchValue, 10);
      } else if (batchAction === 'setVisible') {
        body.value = batchValue === 'true';
      }

      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erreur');
      toast.success(`${data.count} produit(s) mis a jour`);
      setSelectedIds(new Set());
      setBatchAction('');
      setBatchValue('');
      await fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur batch');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageW, 50, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(241, 245, 249);
    doc.text('Catalogue produits', 20, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Genere le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      20, 32,
    );
    doc.text(`${sortableProducts.length} produit(s)`, 20, 40);

    const statsY = 60;
    const statWidth = (pageW - 40) / 4;
    const boxes = [
      { label: 'Total produits', value: String(sortableProducts.length), color: [16, 185, 129] },
      { label: 'En stock', value: String(sortableProducts.filter((p) => Number(p.stock) > 0).length), color: [59, 130, 246] },
      { label: 'Stock faible', value: String(sortableProducts.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5).length), color: [245, 158, 11] },
      { label: 'En rupture', value: String(sortableProducts.filter((p) => Number(p.stock) <= 0).length), color: [239, 68, 68] },
    ];

    boxes.forEach((box, i) => {
      const x = 20 + i * (statWidth + 5);
      doc.setFillColor(24, 24, 24);
      doc.roundedRect(x, statsY, statWidth, 22, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(box.color[0], box.color[1], box.color[2]);
      doc.text(box.value, x + 4, statsY + 9);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(box.label, x + 4, statsY + 17);
    });

    const tableBody = sortableProducts.map((p) => [
      p.name,
      p.category?.name || 'N/A',
      p.brand || '—',
      `${formatPrice(getDisplayPrice(p))}`,
      String(p.stock),
      p.visible !== false ? 'Visible' : 'Masque',
    ]);

    autoTable(doc, {
      head: [['Produit', 'Categorie', 'Marque', 'Prix', 'Stock', 'Visibilite']],
      body: tableBody,
      startY: statsY + 32,
      styles: {
        fontSize: 7,
        textColor: [241, 245, 249],
        fillColor: [18, 18, 18],
        lineColor: [30, 41, 59],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [24, 24, 24],
      },
      margin: { top: statsY + 32, bottom: 20 },
      didDrawPage: () => {
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('Plawimadd Group — Catalogue produits', 20, doc.internal.pageSize.getHeight() - 10);
      },
    });

    doc.save(`produits_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (loadingProducts) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader
        title="Gestion des produits"
        action={
          <div className="flex items-center gap-3">
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportPDF}>
              Exporter PDF
            </SellerButton>
            <Link href="/seller/add-products">
              <SellerButton icon={Plus}>Ajouter un produit</SellerButton>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="References" value={String(products.length)} description="Fiches actives dans le catalogue" icon={Box} accentColor="blue" />
        <StatCard title="Disponibles" value={String(inStockCount)} description="Produits disponibles a la vente" icon={Box} accentColor="green" />
        <StatCard title="Stock faible" value={String(lowStockCount)} description="References a surveiller" icon={Box} accentColor="amber" />
        <StatCard title="Visibles" value={String(visibleCount)} description="Produits publies en boutique" icon={Eye} accentColor="blue" />
      </div>

      <SellerFilterBar>
        <SellerInput
          icon={Search}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Rechercher un produit, une categorie ou une marque"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:w-auto">
          <SellerSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions}
            className="min-w-[180px]"
          />
          <SellerSelect
            value={brandFilter}
            onChange={setBrandFilter}
            options={brandOptions}
            className="min-w-[180px]"
          />
          <SellerSelect
            value={stockFilter}
            onChange={setStockFilter}
            options={[
              { value: 'ALL', label: 'Tous les stocks' },
              { value: 'IN_STOCK', label: 'Disponible' },
              { value: 'LOW_STOCK', label: 'Stock faible' },
              { value: 'OUT_OF_STOCK', label: 'Rupture' },
            ]}
            className="min-w-[170px]"
          />
        </div>
      </SellerFilterBar>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 rounded-[10px] bg-[var(--accent-green)]/10 px-5 py-3">
          <span className="text-sm font-medium text-[var(--accent-green)]">{selectedIds.size} selectionne(s)</span>
          <div className="flex items-center gap-3">
            <SellerSelect
              value={batchAction}
              onChange={setBatchAction}
              options={[
                { value: '', label: 'Action groupée...' },
                { value: 'delete', label: 'Supprimer' },
                { value: 'setCategory', label: 'Changer catégorie' },
                { value: 'setStock', label: 'Fixer stock' },
                { value: 'setVisible', label: 'Visibilité' },
              ]}
              className="min-w-[200px]"
            />
            {batchAction === 'setCategory' && (
              <SellerSelect
                value={batchValue}
                onChange={setBatchValue}
                options={[
                  { value: '', label: 'Choisir...' },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                className="min-w-[200px]"
              />
            )}
            {batchAction === 'setStock' && (
              <SellerInput
                type="number"
                value={batchValue}
                onChange={(e) => setBatchValue(e.target.value)}
                placeholder="Quantité"
                className="w-24"
              />
            )}
            {batchAction === 'setVisible' && (
              <SellerSelect
                value={batchValue}
                onChange={setBatchValue}
                options={[
                  { value: '', label: 'Choisir...' },
                  { value: 'true', label: 'Visible' },
                  { value: 'false', label: 'Masqué' },
                ]}
                className="min-w-[160px]"
              />
            )}
            <SellerButton
              size="sm"
              icon={batchAction === 'delete' ? Trash2 : undefined}
              disabled={!batchAction || (batchAction !== 'delete' && !batchValue) || isBatchProcessing}
              onClick={executeBatch}
            >
              {isBatchProcessing ? 'En cours...' : 'Appliquer'}
            </SellerButton>
            <SellerButton variant="outline" size="sm" onClick={() => { setSelectedIds(new Set()); setBatchAction(''); setBatchValue(''); }}>
              Annuler
            </SellerButton>
          </div>
        </div>
      )}

      {sortableProducts.length === 0 ? (
        <SellerEmptyState
          title="Aucun produit trouve"
          description="Essayez un autre filtre ou ajoutez une nouvelle reference au catalogue."
          icon={Box}
          action={
            <Link href="/seller/add-products">
              <SellerButton icon={Plus}>Ajouter un produit</SellerButton>
            </Link>
          }
        />
      ) : (
        <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent [&_tr]:align-middle [&_td]:!px-3 [&_th]:!px-3">
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 accent-[var(--accent-green)]"
                />
              </SellerTableCell>
              <SellerTableCell isHeader className="cursor-pointer select-none text-center" onClick={() => toggleSort('name')}>
                <span className="inline-flex items-center">Produit <SortIcon field="name" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="cursor-pointer select-none text-center" onClick={() => toggleSort('category')}>
                <span className="inline-flex items-center">Categorie <SortIcon field="category" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="cursor-pointer select-none text-center" onClick={() => toggleSort('brand')}>
                <span className="inline-flex items-center">Marque <SortIcon field="brand" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center">Couleur</SellerTableCell>
              <SellerTableCell isHeader className="cursor-pointer select-none text-center" onClick={() => toggleSort('price')}>
                <span className="inline-flex items-center">Prix <SortIcon field="price" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="cursor-pointer select-none text-center" onClick={() => toggleSort('stock')}>
                <span className="inline-flex items-center">Stock <SortIcon field="stock" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center">Visibilite</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {paginatedProducts.map((product) => {
              const imageSrc = product.imgUrl?.[0] || '/images/default_product_image.png';
              const displayPrice = getDisplayPrice(product);
              const isDiscounted = displayPrice !== product.price;
              const stock = Number(product.stock);
              const badge = getStockBadge(stock);
              const isVisible = product.visible !== false;
              const isEditingPrice = editingField?.id === product.id && editingField.type === 'price';
              const isEditingStock = editingField?.id === product.id && editingField.type === 'stock';

              return (
                <SellerTableRow key={product.id}>
                  <SellerTableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="h-4 w-4 accent-[var(--accent-green)]"
                    />
                  </SellerTableCell>
                  <SellerTableCell>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-hover)]">
                        <Image src={imageSrc} alt={product.name} width={64} height={64} className="max-h-[40px] w-auto object-contain" />
                      </div>
                      <div>
                        <Link href={`/product/${product.id}`} target="_blank" className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-green)] transition-colors">
                          {product.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">#{product.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </SellerTableCell>
                  <SellerTableCell className="text-center text-[var(--text-secondary)]">{product.category?.name || 'N/A'}</SellerTableCell>
                  <SellerTableCell className="text-center text-[var(--text-secondary)]">{product.brand || 'Plawimadd'}</SellerTableCell>
                  <SellerTableCell className="text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {parseColorIds(product.color).map((id) => {
                        const c = colorMap[id] as { name: string; hex: string } | undefined;
                        return c ? (
                          <div key={id} className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
                            <span className="h-2 w-2 rounded-full border border-[var(--border)]" style={{ backgroundColor: c.hex }} />
                            {c.name}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    {isEditingPrice ? (
                      <div ref={priceEditRef} className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-20 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-sm text-[var(--text-primary)]"
                          step="0.01"
                          min="0"
                        />
                        <SellerButton size="sm" variant="outline" onClick={() => saveInlineEdit(product.id, 'price')}>OK</SellerButton>
                      </div>
                    ) : (
                      <div
                        className="inline-block cursor-pointer rounded px-2 py-1 transition hover:bg-[var(--bg-hover)]"
                        onClick={() => startInlineEdit(product, 'price')}
                        title="Cliquer pour modifier"
                      >
                        <p className="font-semibold text-[var(--text-primary)]">{formatPrice(displayPrice)}</p>
                        {isDiscounted && <p className="mt-0.5 text-xs text-[var(--text-tertiary)] line-through">{formatPrice(product.price)}</p>}
                      </div>
                    )}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    {isEditingStock ? (
                      <div ref={stockEditRef} className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="w-16 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-sm text-[var(--text-primary)]"
                          min="0"
                        />
                        <SellerButton size="sm" variant="outline" onClick={() => saveInlineEdit(product.id, 'stock')}>OK</SellerButton>
                      </div>
                    ) : (
                      <div
                        className="inline-block cursor-pointer rounded px-2 py-1 transition hover:bg-[var(--bg-hover)]"
                        onClick={() => startInlineEdit(product, 'stock')}
                        title="Cliquer pour modifier"
                      >
                        <span className={`font-semibold ${
                          stock <= 0 ? 'text-[var(--accent-red)]' : stock <= 5 ? 'text-[var(--accent-amber)]' : 'text-[var(--accent-green)]'
                        }`}>{stock}</span>
                      </div>
                    )}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <button
                      onClick={() => toggleVisibility(product)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        isVisible
                          ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] hover:bg-[#121212]'
                          : 'bg-[var(--text-tertiary)]/10 text-[var(--text-tertiary)] hover:bg-[#121212]'
                      }`}
                      title={isVisible ? 'Cliquer pour masquer' : 'Cliquer pour afficher'}
                    >
                      {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {isVisible ? 'Visible' : 'Masque'}
                    </button>
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                      <div className="inline-flex flex-wrap gap-2">
                        <Link href={`/product/${product.id}`} target="_blank">
                          <SellerButton variant="primary" size="icon" icon={ExternalLink} className="!h-9 !w-9">Voir</SellerButton>
                        </Link>
                        <SellerButton variant="outline" size="icon" icon={Eye} className="!h-9 !w-9" onClick={() => setSelectedProduct(product)}>Details</SellerButton>
                        <Link href={`/seller/product-list/edit/${product.id}`}>
                          <SellerButton variant="success" size="icon" icon={Pencil} className="!h-9 !w-9">Modifier</SellerButton>
                        </Link>
                        <SellerButton
                          variant="danger"
                          size="icon"
                          icon={Trash2}
                          className="!h-9 !w-9"
                          onClick={() => setProductToDelete(product)}
                        >Supprimer</SellerButton>
                    </div>
                  </SellerTableCell>
                </SellerTableRow>
              );
            })}
          </SellerTableBody>
          <tfoot>
            <tr>
              <td colSpan={9}>
                <SellerPagination page={page} pageSize={pageSize} totalItems={sortableProducts.length} onPageChange={setPage} />
              </td>
            </tr>
          </tfoot>
        </SellerTable>
      )}

      <SellerModal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || 'Produit'}
        description="Informations rapides sur la fiche catalogue."
        footer={
          <div className="flex justify-between">
            <Link href={`/product/${selectedProduct?.id}`} target="_blank">
              <SellerButton variant="outline" icon={ExternalLink}>Voir en boutique</SellerButton>
            </Link>
            {selectedProduct && (
              <Link href={`/seller/product-list/edit/${selectedProduct.id}`}>
                <SellerButton icon={Pencil}>Modifier la fiche</SellerButton>
              </Link>
            )}
          </div>
        }
      >
        {selectedProduct && (
          <div className="grid gap-5 md:grid-cols-[180px_1fr]">
            <div className="flex aspect-square items-center justify-center rounded-[10px] bg-[var(--bg-outer)]">
              <Image
                src={selectedProduct.imgUrl?.[0] || '/images/default_product_image.png'}
                alt={selectedProduct.name}
                width={180}
                height={180}
                className="max-h-[150px] w-auto object-contain"
              />
            </div>
            <div className="grid gap-3 text-sm">
              <div className="rounded-[10px] bg-[var(--bg-outer)] p-4">
                <p className="text-[var(--text-secondary)]">Description</p>
                <p className="mt-2 leading-6 text-[var(--text-primary)]">{selectedProduct.description || 'Aucune description'}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[10px] bg-[var(--bg-outer)] p-4">
                  <p className="text-[var(--text-secondary)]">Prix</p>
                  <p className="mt-2 font-semibold text-[var(--text-primary)]">{formatPrice(getDisplayPrice(selectedProduct))}</p>
                </div>
                <div className="rounded-[10px] bg-[var(--bg-outer)] p-4">
                  <p className="text-[var(--text-secondary)]">Categorie</p>
                  <p className="mt-2 font-semibold text-[var(--text-primary)]">{selectedProduct.category?.name || 'N/A'}</p>
                </div>
                <div className="rounded-[10px] bg-[var(--bg-outer)] p-4">
                  <p className="text-[var(--text-secondary)]">Marque</p>
                  <p className="mt-2 font-semibold text-[var(--text-primary)]">{selectedProduct.brand || 'Plawimadd'}</p>
                </div>
                <div className="rounded-[10px] bg-[var(--bg-outer)] p-4">
                  <p className="text-[var(--text-secondary)]">Couleur</p>
                  <p className="mt-2 font-semibold text-[var(--text-primary)]">{getColorDisplay(selectedProduct.color, colorMap)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SellerModal>

      <SellerModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        title="Supprimer ce produit ?"
        description="Cette action retire la fiche du catalogue."
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <SellerButton variant="outline" onClick={() => setProductToDelete(null)}>Annuler</SellerButton>
            <SellerButton variant="danger" icon={Trash2} disabled={isDeleting} onClick={executeDelete}>
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </SellerButton>
          </div>
        }
      >
        <p className="rounded-[10px] border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/10 p-4 text-sm leading-6 text-[var(--accent-red)]">
          {productToDelete?.name} sera retire du catalogue et ne sera plus visible dans la boutique.
        </p>
      </SellerModal>
    </div>
  );
}
