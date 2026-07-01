'use client';

import React, { useMemo, useRef, useState } from 'react';
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
  Minus,
  Plus,
  Search,
} from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerInput from '@/components/seller/SellerInput';
import SellerPagination from '@/components/seller/SellerPagination';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
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

const pageSize = 10;

type SortField = 'name' | 'category' | 'stock' | 'price' | 'value';
type SortDir = 'asc' | 'desc';

type InventoryRow = Product & {
  stock: number;
  stockValue: number;
};

function getStockColor(stock: number): string {
  if (stock <= 0) return 'text-[var(--accent-red)]';
  if (stock <= 5) return 'text-amber-400';
  return 'text-[var(--accent-green)]';
}

export default function StocksPage(): React.ReactElement {
  const { products, loadingProducts, fetchProducts, formatPrice } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'stock', dir: 'asc' });
  const editRef = useRef<HTMLDivElement>(null);

  const inventoryRows = useMemo(() => {
    return products
      .filter((product) => {
        const haystack = [product.name, product.category?.name, product.brand || '']
          .join(' ')
          .toLowerCase();
        return haystack.includes(searchTerm.toLowerCase());
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
  }, [products, searchTerm, sort]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return inventoryRows.slice(start, start + pageSize);
  }, [inventoryRows, page]);

  const outOfStockCount = useMemo(() => products.filter((p) => Number(p.stock) <= 0).length, [products]);
  const lowStockCount = useMemo(() => products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5).length, [products]);
  const totalStockValue = useMemo(() =>
    products.reduce((sum, p) => sum + Number(p.stock) * (p.offerPrice ?? p.price), 0), [products]);

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
    const newStock = Math.max(0, Number(product.stock) + delta);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erreur');
      await fetchProducts();
      toast.success(`${product.name}: ${product.stock} → ${newStock}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
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
    doc.text('Etat du stock', 20, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Genere le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      20, 32,
    );
    doc.text(`${inventoryRows.length} produit(s)`, 20, 40);

    const statsY = 60;
    const statWidth = (pageW - 40) / 3;
    const boxes = [
      { label: 'En rupture', value: String(inventoryRows.filter((p) => p.stock <= 0).length), color: [239, 68, 68] },
      { label: 'Stock faible', value: String(inventoryRows.filter((p) => p.stock > 0 && p.stock <= 5).length), color: [245, 158, 11] },
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

    const tableBody = inventoryRows.map((p) => [
      p.name,
      p.category?.name || 'N/A',
      String(p.stock),
      formatPrice(p.offerPrice ?? p.price),
      formatPrice(p.stockValue),
      p.stock <= 0 ? 'Rupture' : p.stock <= 5 ? 'Stock faible' : 'OK',
    ]);

    autoTable(doc, {
      head: [['Produit', 'Categorie', 'Stock', 'Prix unitaire', 'Valeur', 'Etat']],
      body: tableBody,
      startY: statsY + 32,
      styles: { fontSize: 7, textColor: [241, 245, 249], fillColor: [18, 18, 18], lineColor: [30, 41, 59], lineWidth: 0.3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [24, 24, 24] },
      margin: { top: statsY + 32, bottom: 20 },
      didDrawPage: () => {
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('Plawimadd Group — Etat du stock', 20, doc.internal.pageSize.getHeight() - 10);
      },
    });

    doc.save(`stock_${new Date().toISOString().slice(0, 10)}.pdf`);
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
        title="Suivi du stock"
        action={
          <SellerButton variant="outline" size="sm" icon={Download} onClick={exportPDF}>
            Exporter PDF
          </SellerButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="En rupture" value={String(outOfStockCount)} description="Produits indisponibles a la vente" icon={AlertTriangle} accentColor="red" />
        <StatCard title="Stock faible" value={String(lowStockCount)} description="References a surveiller" icon={Boxes} accentColor="amber" />
        <StatCard title="Valeur du stock" value={formatPrice(totalStockValue)} description="Estimation sur prix de vente" icon={Boxes} accentColor="green" />
      </div>

      <SellerFilterBar>
        <SellerInput
          icon={Search}
          value={searchTerm}
          onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }}
          placeholder="Rechercher un produit ou une categorie"
        />
        <div className="rounded-lg bg-[var(--bg-hover)] px-4 py-2 text-sm text-[var(--text-secondary)]">
          {inventoryRows.length} produit(s)
        </div>
      </SellerFilterBar>

      {inventoryRows.length === 0 ? (
        <SellerEmptyState
          title="Aucun produit a analyser"
          description="Le stock apparait vide pour les filtres en cours."
          icon={Boxes}
        />
      ) : (
        <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader className="cursor-pointer select-none" onClick={() => toggleSort('name')}>
                <span className="flex items-center">Produit <SortIcon field="name" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="cursor-pointer select-none" onClick={() => toggleSort('category')}>
                <span className="flex items-center">Categorie <SortIcon field="category" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="cursor-pointer select-none" onClick={() => toggleSort('stock')}>
                <span className="flex items-center">Stock <SortIcon field="stock" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="cursor-pointer select-none" onClick={() => toggleSort('price')}>
                <span className="flex items-center">Prix unitaire <SortIcon field="price" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="cursor-pointer select-none" onClick={() => toggleSort('value')}>
                <span className="flex items-center">Valeur <SortIcon field="value" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader>Actions</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {paginatedRows.map((product) => {
              const imageSrc = product.imgUrl?.[0] || '/images/default_product_image.png';

              return (
                <SellerTableRow key={product.id}>
                  <SellerTableCell>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-hover)]">
                        <Image
                          src={imageSrc}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="max-h-[40px] w-auto object-contain"
                        />
                      </div>
                      <div>
                        <Link href={`/seller/product-list/edit/${product.id}`} className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-green)] transition-colors">
                          {product.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{product.brand || 'Sans marque'}</p>
                      </div>
                    </div>
                  </SellerTableCell>
                  <SellerTableCell className="text-[var(--text-secondary)]">
                    {product.category?.name || 'N/A'}
                  </SellerTableCell>
                  <SellerTableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustStock(product, -1)}
                        disabled={product.stock <= 0}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] disabled:opacity-30"
                        title="Retirer 1"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className={`min-w-[4rem] text-center text-sm font-semibold ${getStockColor(product.stock)}`}>
                        {product.stock}
                      </span>
                      <button
                        onClick={() => adjustStock(product, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]"
                        title="Ajouter 1"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </SellerTableCell>
                  <SellerTableCell className="font-medium text-[var(--text-primary)]">
                    {formatPrice(product.offerPrice ?? product.price)}
                  </SellerTableCell>
                  <SellerTableCell className="font-semibold text-[var(--text-primary)]">
                    {formatPrice(product.stockValue)}
                  </SellerTableCell>
                  <SellerTableCell>
                    <div className="flex flex-wrap gap-2">
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
              <td colSpan={6}>
                <SellerPagination page={page} pageSize={pageSize} totalItems={inventoryRows.length} onPageChange={setPage} />
              </td>
            </tr>
          </tfoot>
        </SellerTable>
      )}
    </div>
  );
}
