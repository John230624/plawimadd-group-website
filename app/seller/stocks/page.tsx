'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowRight,
  ArrowUpWideNarrow,
  Boxes,
  Download,
  ExternalLink,
  History as HistoryIcon,
  Minus,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Loading from '@/components/Loading';
import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerModal from '@/components/seller/SellerModal';
import SellerPanel from '@/components/seller/SellerPanel';
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
import { useAppContext } from '@/context/AppContext';
import type { Product } from '@/lib/types';

const pageSize = 10;

type SortField = 'name' | 'category' | 'stock' | 'price' | 'value';
type SortDir = 'asc' | 'desc';

type InventoryRow = Product & { stock: number; stockValue: number };

function getStockColor(stock: number): string {
  if (stock <= 0) return 'text-[var(--accent-red)]';
  if (stock <= 5) return 'text-amber-400';
  return 'text-[var(--accent-green)]';
}

function getStockBg(stock: number): string {
  if (stock <= 0) return 'bg-red-50';
  if (stock <= 5) return 'bg-amber-50';
  return '';
}

function parseColorIds(color: string | null | undefined): string[] {
  if (!color) return [];
  try { const ids = JSON.parse(color); return Array.isArray(ids) ? ids : []; } catch { return []; }
}

export default function StocksPage(): React.ReactElement {
  const { products, loadingProducts, fetchProducts, formatPrice } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [threshold, setThreshold] = useState(5);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'stock', dir: 'asc' });
  const [colorMap, setColorMap] = useState<Record<string, { name: string; hex: string }>>({});
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const editRef = useRef<HTMLDivElement>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchModal, setBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<'set' | 'add' | 'subtract'>('set');
  const [batchValue, setBatchValue] = useState('');

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
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  const inventoryRows = useMemo(() => {
    return products
      .filter((product) => {
        const haystack = [product.name, product.category?.name, product.brand || ''].join(' ').toLowerCase();
        if (!haystack.includes(searchTerm.toLowerCase())) return false;
        const stock = Number(product.stock);
        if (statusFilter === 'OUT_OF_STOCK' && stock > 0) return false;
        if (statusFilter === 'LOW_STOCK' && (stock <= 0 || stock > threshold)) return false;
        if (statusFilter === 'IN_STOCK' && stock <= threshold) return false;
        if (categoryFilter !== 'ALL' && product.category?.id !== categoryFilter) return false;
        return true;
      })
      .map((product) => {
        const stock = Number(product.stock);
        const stockValue = stock * (product.offerPrice ?? product.price);
        return { ...product, stock, stockValue };
      })
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1;
        switch (sort.field) {
          case 'name': return a.name.localeCompare(b.name) * dir;
          case 'category': return (a.category?.name || '').localeCompare(b.category?.name || '') * dir;
          case 'stock': return (a.stock - b.stock) * dir;
          case 'price': return ((a.offerPrice ?? a.price) - (b.offerPrice ?? b.price)) * dir;
          case 'value': return (a.stockValue - b.stockValue) * dir;
          default: return 0;
        }
      });
  }, [products, searchTerm, sort, statusFilter, categoryFilter, threshold]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return inventoryRows.slice(start, start + pageSize);
  }, [inventoryRows, page]);

  const maxStock = useMemo(() =>
    Math.max(...inventoryRows.map((p) => p.stock), 1), [inventoryRows]);

  const outOfStockCount = useMemo(() => products.filter((p) => Number(p.stock) <= 0).length, [products]);
  const lowStockCount = useMemo(() => products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5).length, [products]);
  const totalStockValue = useMemo(() =>
    products.reduce((sum, p) => sum + Number(p.stock) * (p.offerPrice ?? p.price), 0), [products]);

  const valueByCategory = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {};
    products.forEach((p) => {
      const catName = p.category?.name || 'Sans categorie';
      const catId = p.category?.id || 'none';
      const val = Number(p.stock) * (p.offerPrice ?? p.price);
      if (!map[catId]) map[catId] = { name: catName, value: 0 };
      map[catId].value += val;
    });
    return Object.entries(map).sort(([, a], [, b]) => b.value - a.value);
  }, [products]);

  const allSelected = paginatedRows.length > 0 && paginatedRows.every((p) => selectedIds.has(p.id));

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

  const adjustStock = async (product: Product, delta: number) => {
    // Empêche de descendre sous zéro sur les boutons rapides
    const applied = Math.max(delta, -Number(product.stock));
    if (applied === 0) return;
    try {
      // Passe par le service de mouvements pour la traçabilité (StockMovement)
      const res = await fetch('/api/admin/stock/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, mode: 'ADJUSTMENT', quantity: applied, reason: 'Ajustement rapide' }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Erreur');
      await fetchProducts();
      toast.success(`${product.name}: ${product.stock} → ${data.movement.stockAfter}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const saveThreshold = async (product: Product, value: number) => {
    const clean = Math.max(0, Math.round(value));
    if (clean === (product.lowStockThreshold ?? 5)) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lowStockThreshold: clean }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erreur');
      await fetchProducts();
      toast.success(`Seuil d'alerte de "${product.name}" fixé à ${clean}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleBatchAdjust = async () => {
    if (selectedIds.size === 0) return;
    const val = parseInt(batchValue, 10);
    if (isNaN(val) || val < 0) { toast.error('Valeur invalide.'); return; }
    try {
      const newStock = batchAction === 'set' ? val : batchAction === 'add' ? undefined : undefined;
      let data: { success: boolean; count: number; message?: string };
      if (batchAction === 'set') {
        const res = await fetch('/api/admin/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selectedIds), action: 'setStock', value: val }),
        });
        data = await res.json();
      } else {
        const ids = Array.from(selectedIds);
        const multiplier = batchAction === 'add' ? 1 : -1;
        let count = 0;
        for (const id of ids) {
          const product = products.find((p) => p.id === id);
          if (!product) continue;
          const newQty = Math.max(0, Number(product.stock) + val * multiplier);
          const res = await fetch(`/api/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: newQty }),
          });
          const resData = await res.json();
          if (resData.success) count++;
        }
        data = { success: true, count };
      }
      if (!data.success) throw new Error(data.message || 'Erreur');
      toast.success(`${data.count} produit(s) mis a jour.`);
      setBatchModal(false);
      setSelectedIds(new Set());
      setBatchValue('');
      await fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  function exportCSV() {
    const header = 'Produit;Categorie;Marque;Stock;Prix unitaire;Valeur stock;Etat\n';
    const rows = inventoryRows.map((p) =>
      [
        p.name,
        p.category?.name || '',
        p.brand || '',
        String(p.stock),
        formatPrice(p.offerPrice ?? p.price),
        formatPrice(p.stockValue),
        p.stock <= 0 ? 'Rupture' : p.stock <= threshold ? 'Stock faible' : 'OK',
      ].join(';')
    ).join('\n');
    const csv = '\uFEFF' + header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageW, 50, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(241, 245, 249);
    doc.text('Etat du stock', 20, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 32);
    doc.text(`${inventoryRows.length} produit(s)`, 20, 40);
    const statsY = 60;
    const statWidth = (pageW - 40) / 3;
    const boxes = [
      { label: 'En rupture', value: String(inventoryRows.filter((p) => p.stock <= 0).length), color: [239, 68, 68] },
      { label: 'Stock faible', value: String(inventoryRows.filter((p) => p.stock > 0 && p.stock <= threshold).length), color: [245, 158, 11] },
      { label: 'Valeur totale', value: formatPrice(inventoryRows.reduce((s, p) => s + p.stockValue, 0)), color: [16, 185, 129] },
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
    autoTable(doc, {
      head: [['Produit', 'Categorie', 'Stock', 'Prix unitaire', 'Valeur', 'Etat']],
      body: inventoryRows.map((p) => [
        p.name, p.category?.name || 'N/A', String(p.stock),
        formatPrice(p.offerPrice ?? p.price), formatPrice(p.stockValue),
        p.stock <= 0 ? 'Rupture' : p.stock <= threshold ? 'Stock faible' : 'OK',
      ]),
      startY: statsY + 32,
      styles: { fontSize: 7, textColor: [241, 245, 249], fillColor: [18, 18, 18], lineColor: [30, 41, 59], lineWidth: 0.3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [24, 24, 24] },
      margin: { top: statsY + 32, bottom: 20 },
    });
    doc.save(`stock_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (loadingProducts) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loading /></div>;
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader
        title="Suivi du stock"
        action={
          <div className="flex gap-2">
            <Link href="/seller/stocks/movements">
              <SellerButton variant="outline" size="sm" icon={HistoryIcon}>Mouvements</SellerButton>
            </Link>
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportCSV}>CSV</SellerButton>
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportPDF}>PDF</SellerButton>
          </div>
        }
      />

      <section className="grid gap-5 md:grid-cols-4">
        <StatCard title="En rupture" value={String(outOfStockCount)} description="Produits indisponibles" icon={AlertTriangle} accentColor="red" />
        <StatCard title="Stock faible" value={String(lowStockCount)} description={`≤ ${threshold} unites`} icon={Boxes} accentColor="amber" />
        <StatCard title="Valeur du stock" value={formatPrice(totalStockValue)} description="Estimation prix vente" icon={Boxes} accentColor="green" />
        <StatCard title="Produits" value={String(products.length)} description="Total references" icon={Boxes} accentColor="blue" />
      </section>

      <SellerFilterBar>
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Rechercher un produit ou une categorie"
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            />
          </div>
          <SellerSelect
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: 'ALL', label: 'Tous les stocks' },
              { value: 'OUT_OF_STOCK', label: 'En rupture' },
              { value: 'LOW_STOCK', label: `Stock faible (≤${threshold})` },
              { value: 'IN_STOCK', label: 'Disponible' },
            ]}
            className="[&_button]:!h-9 [&_button]:!py-1.5 [&_button]:!px-3 w-[180px] shrink-0"
          />
          <SellerSelect
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setPage(1); }}
            options={[
              { value: 'ALL', label: 'Toutes categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            className="[&_button]:!h-9 [&_button]:!py-1.5 [&_button]:!px-3 w-[180px] shrink-0"
          />
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 5))}
            className="h-9 w-16 shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 text-center text-xs text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            title="Seuil stock faible"
          />
          <div className="rounded-lg bg-[var(--bg-hover)] px-3 py-1.5 text-xs text-[var(--text-secondary)] shrink-0">
            {inventoryRows.length} resultat(s)
          </div>
        </div>
      </SellerFilterBar>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 rounded-[10px] bg-[var(--accent-blue)]/10 px-5 py-3">
          <span className="text-sm font-medium text-[var(--accent-blue)]">{selectedIds.size} selectionne(s)</span>
          <SellerButton variant="primary" size="sm" onClick={() => { setBatchAction('set'); setBatchValue(''); setBatchModal(true); }}>
            Fixer le stock
          </SellerButton>
          <SellerButton variant="outline" size="sm" onClick={() => { setBatchAction('add'); setBatchValue(''); setBatchModal(true); }}>
            Ajouter
          </SellerButton>
          <SellerButton variant="outline" size="sm" onClick={() => { setBatchAction('subtract'); setBatchValue(''); setBatchModal(true); }}>
            Retirer
          </SellerButton>
          <SellerButton variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            Annuler
          </SellerButton>
        </div>
      )}

      {inventoryRows.length === 0 ? (
        <SellerEmptyState title="Aucun produit" description="Stock vide pour les filtres en cours." icon={Boxes} />
      ) : (
        <>
          <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
            <SellerTableHeader>
              <SellerTableRow>
                <SellerTableCell isHeader className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) setSelectedIds(new Set());
                      else setSelectedIds(new Set(paginatedRows.map((p) => p.id)));
                    }}
                    className="h-4 w-4 accent-[var(--accent-green)]"
                  />
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('name')}>
                  <span className="flex items-center">Produit <SortIcon field="name" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('category')}>
                  <span className="flex items-center">Categorie <SortIcon field="category" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center">Couleur</SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('stock')}>
                  <span className="flex items-center">Stock <SortIcon field="stock" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center">Progression</SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('price')}>
                  <span className="flex items-center">Prix unit. <SortIcon field="price" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('value')}>
                  <span className="flex items-center">Valeur <SortIcon field="value" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
              </SellerTableRow>
            </SellerTableHeader>
            <SellerTableBody>
              {paginatedRows.map((product) => {
                const imageSrc = product.imgUrl?.[0] || '/images/default_product_image.png';
                const stock = product.stock;
                const pct = Math.min((stock / maxStock) * 100, 100);
                const rowThreshold = product.lowStockThreshold ?? threshold;
                const stockStatus = stock <= 0 ? 'rupture' : stock <= rowThreshold ? 'faible' : 'ok';

                return (
                  <SellerTableRow key={product.id} className={stockStatus === 'rupture' ? 'bg-red-50/50' : stockStatus === 'faible' ? 'bg-amber-50/50' : ''}>
                    <SellerTableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            next.has(product.id) ? next.delete(product.id) : next.add(product.id);
                            return next;
                          });
                        }}
                        className="h-4 w-4 accent-[var(--accent-green)]"
                      />
                    </SellerTableCell>
                    <SellerTableCell className="text-center">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-hover)]">
                          <Image src={imageSrc} alt={product.name} width={64} height={64} className="max-h-[40px] w-auto object-contain" />
                        </div>
                        <div className="text-left">
                          <Link href={`/seller/product-list/edit/${product.id}`} className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-green)] transition-colors">
                            {product.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{product.brand || 'Sans marque'}</p>
                        </div>
                      </div>
                    </SellerTableCell>
                    <SellerTableCell className="text-center text-[var(--text-secondary)] text-xs">
                      {product.category?.name || 'N/A'}
                      <SellerBadge color={stockStatus === 'rupture' ? 'error' : stockStatus === 'faible' ? 'warning' : 'success'} className="ml-1.5">
                        {stockStatus === 'rupture' ? 'Rupture' : stockStatus === 'faible' ? 'Faible' : 'OK'}
                      </SellerBadge>
                    </SellerTableCell>
                    <SellerTableCell className="text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {parseColorIds(product.color).map((id) => {
                          const c = colorMap[id];
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
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => adjustStock(product, -1)}
                          disabled={stock <= 0}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] disabled:opacity-30"
                          title="Retirer 1"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className={`min-w-[3rem] text-center text-sm font-bold ${getStockColor(stock)}`}>
                          {stock}
                        </span>
                        <button
                          onClick={() => adjustStock(product, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]"
                          title="Ajouter 1"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                        <span>Seuil</span>
                        <input
                          type="number"
                          min={0}
                          defaultValue={rowThreshold}
                          key={`${product.id}-${rowThreshold}`}
                          onBlur={(e) => saveThreshold(product, Number(e.target.value))}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                          className="h-5 w-11 rounded border border-[var(--border)] bg-[var(--bg-input)] px-1 text-center text-[10px] text-[var(--text-secondary)] outline-none focus:border-[var(--accent-blue)]"
                          title="Seuil d'alerte de ce produit"
                        />
                      </div>
                    </SellerTableCell>
                    <SellerTableCell className="text-center">
                      <div className="mx-auto flex h-2 w-20 items-center overflow-hidden rounded-full bg-[var(--bg-hover)]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            stockStatus === 'rupture' ? 'bg-[var(--accent-red)]' :
                            stockStatus === 'faible' ? 'bg-amber-400' : 'bg-[var(--accent-green)]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-tertiary)]">{Math.round(pct)}%</span>
                    </SellerTableCell>
                    <SellerTableCell className="text-center font-medium text-[var(--text-primary)]">
                      {formatPrice(product.offerPrice ?? product.price)}
                    </SellerTableCell>
                    <SellerTableCell className="text-center font-semibold text-[var(--text-primary)]">
                      {formatPrice(product.stockValue)}
                    </SellerTableCell>
                    <SellerTableCell className="text-center">
                      <div className="flex flex-wrap justify-center gap-2">
                        <Link href={`/product/${product.id}`} target="_blank">
                          <SellerButton variant="outline" size="sm" icon={ExternalLink}>Voir</SellerButton>
                        </Link>
                        <Link href={`/seller/product-list/edit/${product.id}`}>
                          <SellerButton variant="outline" size="sm" icon={ArrowRight}>Fiche</SellerButton>
                        </Link>
                      </div>
                    </SellerTableCell>
                  </SellerTableRow>
                );
              })}
            </SellerTableBody>
            <tfoot>
              <tr>
                <td colSpan={9}>
                  <SellerPagination page={page} pageSize={pageSize} totalItems={inventoryRows.length} onPageChange={setPage} />
                </td>
              </tr>
            </tfoot>
          </SellerTable>

          <SellerPanel className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Valeur du stock par categorie</h3>
            <div className="space-y-2">
              {valueByCategory.map(([id, { name, value }]) => {
                const maxVal = valueByCategory[0]?.[1]?.value || 1;
                const pct = (value / maxVal) * 100;
                return (
                  <div key={id} className="flex items-center gap-3">
                    <span className="w-40 text-xs text-[var(--text-secondary)] truncate shrink-0">{name}</span>
                    <div className="flex h-6 flex-1 overflow-hidden rounded-md bg-[var(--bg-hover)]">
                      <div className="h-full rounded-md bg-[var(--accent-blue)]/60 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-28 text-right text-xs font-medium text-[var(--text-primary)] shrink-0">{formatPrice(value)}</span>
                  </div>
                );
              })}
            </div>
          </SellerPanel>
        </>
      )}

      <SellerModal
        isOpen={batchModal}
        onClose={() => setBatchModal(false)}
        title={`${batchAction === 'set' ? 'Fixer' : batchAction === 'add' ? 'Ajouter' : 'Retirer'} le stock (${selectedIds.size} produit(s))`}
        footer={
          <div className="flex justify-end gap-3">
            <SellerButton variant="outline" onClick={() => setBatchModal(false)}>Annuler</SellerButton>
            <SellerButton onClick={handleBatchAdjust}>Appliquer</SellerButton>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            {batchAction === 'set'
              ? `Definir le stock a une valeur exacte pour ${selectedIds.size} produit(s).`
              : `${batchAction === 'add' ? 'Ajouter' : 'Retirer'} une quantite au stock actuel de ${selectedIds.size} produit(s).`}
          </p>
          <input
            type="number"
            value={batchValue}
            onChange={(e) => setBatchValue(e.target.value)}
            placeholder="Quantite"
            min={0}
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            autoFocus
          />
        </div>
      </SellerModal>
    </div>
  );
}
