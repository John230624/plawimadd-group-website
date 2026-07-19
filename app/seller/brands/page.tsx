'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Search, Package, AlertTriangle, ArrowRight } from 'lucide-react';

import Loading from '@/components/Loading';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import StatCard from '@/components/seller/StatCard';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';
import { useAppContext } from '@/context/AppContext';

interface BrandRow {
  brand: string;
  productCount: number;
  totalStock: number;
  stockValue: number;
  outOfStock: number;
  lowStock: number;
}

// Vue "Marques" : agrégat du catalogue par marque pour vérifier d'un coup d'œil
// les produits disponibles d'une marque donnée.
export default function BrandsPage(): React.ReactElement {
  const router = useRouter();
  const { products, loadingProducts, formatPrice } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const rows = useMemo<BrandRow[]>(() => {
    const map = new Map<string, BrandRow>();
    for (const p of products) {
      const brand = (p.brand || '').trim() || 'Sans marque';
      const stock = Number(p.stock) || 0;
      const price = Number(p.offerPrice ?? p.price) || 0;
      const threshold = Number(p.lowStockThreshold ?? 5);
      const row = map.get(brand) || {
        brand,
        productCount: 0,
        totalStock: 0,
        stockValue: 0,
        outOfStock: 0,
        lowStock: 0,
      };
      row.productCount += 1;
      row.totalStock += stock;
      row.stockValue += stock * price;
      if (stock <= 0) row.outOfStock += 1;
      else if (stock <= threshold) row.lowStock += 1;
      map.set(brand, row);
    }
    return Array.from(map.values())
      .filter((r) => r.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.productCount - a.productCount);
  }, [products, searchTerm]);

  const totalBrands = useMemo(
    () => rows.filter((r) => r.brand !== 'Sans marque').length,
    [rows]
  );
  const brandsWithIssues = useMemo(
    () => rows.filter((r) => r.outOfStock > 0 || r.lowStock > 0).length,
    [rows]
  );

  function openBrand(brand: string) {
    // La liste produits lit ?brand= au chargement pour pré-filtrer.
    // « Sans marque » n'est pas une vraie valeur : on ouvre la liste complète.
    if (brand === 'Sans marque') {
      router.push('/seller/product-list');
      return;
    }
    router.push(`/seller/product-list?brand=${encodeURIComponent(brand)}`);
  }

  if (loadingProducts) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loading /></div>;
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader
        title="Marques"
        description="Disponibilité des produits par marque"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Marques référencées" value={String(totalBrands)} icon={BadgeCheck} accentColor="blue" />
        <StatCard title="Produits au catalogue" value={String(products.length)} icon={Package} accentColor="green" />
        <StatCard
          title="Marques avec alertes stock"
          value={String(brandsWithIssues)}
          icon={AlertTriangle}
          accentColor={brandsWithIssues > 0 ? 'amber' : 'green'}
        />
      </div>

      <SellerFilterBar>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="search"
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une marque"
            className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
          />
        </div>
        <div className="rounded-lg bg-[var(--bg-hover)] px-3 py-1.5 text-xs text-[var(--text-secondary)] shrink-0">
          {rows.length} marque(s)
        </div>
      </SellerFilterBar>

      <SellerPanel className="overflow-hidden">
        <SellerTable>
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader>Marque</SellerTableCell>
              <SellerTableCell isHeader className="text-right">Produits</SellerTableCell>
              <SellerTableCell isHeader className="text-right">Stock total</SellerTableCell>
              <SellerTableCell isHeader className="text-right">Valeur stock</SellerTableCell>
              <SellerTableCell isHeader className="text-right">Ruptures</SellerTableCell>
              <SellerTableCell isHeader className="text-right">Stock bas</SellerTableCell>
              <SellerTableCell isHeader className="text-right"><span className="sr-only">Ouvrir</span></SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {rows.length === 0 && (
              <SellerTableRow>
                <SellerTableCell colSpan={7} className="py-10 text-center text-sm text-[var(--text-tertiary)]">
                  Aucune marque trouvée.
                </SellerTableCell>
              </SellerTableRow>
            )}
            {rows.map((row) => (
              <SellerTableRow
                key={row.brand}
                className="cursor-pointer transition hover:bg-[var(--bg-hover)]"
                onClick={() => openBrand(row.brand)}
              >
                <SellerTableCell className="font-600 text-[var(--text-primary)]">{row.brand}</SellerTableCell>
                <SellerTableCell className="text-right">{row.productCount}</SellerTableCell>
                <SellerTableCell className="text-right">{row.totalStock}</SellerTableCell>
                <SellerTableCell className="text-right">{formatPrice(row.stockValue)}</SellerTableCell>
                <SellerTableCell className={`text-right ${row.outOfStock > 0 ? 'font-700 text-[var(--accent-red)]' : ''}`}>
                  {row.outOfStock}
                </SellerTableCell>
                <SellerTableCell className={`text-right ${row.lowStock > 0 ? 'font-700 text-amber-400' : ''}`}>
                  {row.lowStock}
                </SellerTableCell>
                <SellerTableCell className="text-right">
                  <ArrowRight className="ml-auto h-4 w-4 text-[var(--text-tertiary)]" />
                </SellerTableCell>
              </SellerTableRow>
            ))}
          </SellerTableBody>
        </SellerTable>
      </SellerPanel>
    </div>
  );
}
