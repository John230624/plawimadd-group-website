'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
  ClipboardList,
  Loader2,
  PackageSearch,
  Scale,
  SlidersHorizontal,
} from 'lucide-react';

import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';

interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'INVENTORY';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string | null;
  reference: string | null;
  unitCost: number | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TYPE_META: Record<Movement['type'], { label: string; color: 'success' | 'error' | 'warning' | 'info'; icon: typeof ArrowUpCircle }> = {
  IN: { label: 'Entrée', color: 'success', icon: ArrowUpCircle },
  OUT: { label: 'Sortie', color: 'error', icon: ArrowDownCircle },
  ADJUSTMENT: { label: 'Ajustement', color: 'warning', icon: SlidersHorizontal },
  INVENTORY: { label: 'Inventaire', color: 'info', icon: Scale },
};

export default function StockMovementsPage(): React.ReactElement {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const fetchMovements = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stock/movements?page=${page}&limit=20`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setMovements(data.movements);
      setPagination(data.pagination);
    } catch {
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return (
    <div className="flex min-h-full flex-col gap-6">
      <SellerSectionHeader
        title="Mouvements de stock"
        action={
          <Link href="/seller/stocks">
            <SellerButton variant="outline" size="sm" icon={PackageSearch}>Retour au stock</SellerButton>
          </Link>
        }
      />
      <p className="-mt-4 text-sm text-[var(--text-secondary)]">
        Chaque entrée, sortie, ajustement ou inventaire est tracé ici avec son auteur et sa référence.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : movements.length === 0 ? (
        <SellerEmptyState
          title="Aucun mouvement"
          description="Les mouvements de stock (ventes, ajustements, inventaires) apparaîtront ici."
          icon={ClipboardList}
        />
      ) : (
        <>
          <SellerTable>
            <SellerTableHeader>
              <SellerTableRow>
                <SellerTableCell isHeader>Date</SellerTableCell>
                <SellerTableCell isHeader>Produit</SellerTableCell>
                <SellerTableCell isHeader className="text-center">Type</SellerTableCell>
                <SellerTableCell isHeader className="text-center">Quantité</SellerTableCell>
                <SellerTableCell isHeader className="text-center">Stock avant → après</SellerTableCell>
                <SellerTableCell isHeader>Motif</SellerTableCell>
                <SellerTableCell isHeader>Référence</SellerTableCell>
              </SellerTableRow>
            </SellerTableHeader>
            <SellerTableBody>
              {movements.map((m) => {
                const meta = TYPE_META[m.type];
                const Icon = meta.icon;
                return (
                  <SellerTableRow key={m.id}>
                    <SellerTableCell className="whitespace-nowrap text-xs text-[var(--text-tertiary)]">
                      {new Date(m.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </SellerTableCell>
                    <SellerTableCell>
                      <Link
                        href={`/seller/product-list/edit/${m.productId}`}
                        className="font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--accent-blue)]"
                      >
                        {m.productName}
                      </Link>
                    </SellerTableCell>
                    <SellerTableCell className="text-center">
                      <SellerBadge color={meta.color}>
                        <span className="inline-flex items-center gap-1">
                          <Icon className="h-3 w-3" /> {meta.label}
                        </span>
                      </SellerBadge>
                    </SellerTableCell>
                    <SellerTableCell className={`text-center font-bold ${m.quantity >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </SellerTableCell>
                    <SellerTableCell className="text-center text-sm text-[var(--text-secondary)]">
                      {m.stockBefore} → <span className="font-semibold text-[var(--text-primary)]">{m.stockAfter}</span>
                    </SellerTableCell>
                    <SellerTableCell className="text-xs text-[var(--text-secondary)]">{m.reason || '—'}</SellerTableCell>
                    <SellerTableCell className="text-xs text-[var(--text-tertiary)]">{m.reference || '—'}</SellerTableCell>
                  </SellerTableRow>
                );
              })}
            </SellerTableBody>
          </SellerTable>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => fetchMovements(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-[var(--text-secondary)]">
                Page {pagination.page} / {pagination.totalPages} — {pagination.total} mouvement(s)
              </span>
              <button
                onClick={() => fetchMovements(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] disabled:opacity-40"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
