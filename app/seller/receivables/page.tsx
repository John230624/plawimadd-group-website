'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  GraduationCap,
  HandCoins,
  Loader2,
  Phone,
  Store,
  Wallet,
} from 'lucide-react';

import SellerBadge from '@/components/seller/SellerBadge';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
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

interface ReceivableItem {
  source: 'POS' | 'STUDENT';
  id: string;
  customer: string;
  phone: string | null;
  reference: string;
  total: number;
  paid: number;
  remaining: number;
  nextDueDate: string | null;
  overdue: boolean;
  createdAt: string;
}

interface Summary {
  totalOutstanding: number;
  posOutstanding: number;
  studentOutstanding: number;
  overdueCount: number;
  count: number;
}

export default function ReceivablesPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const [items, setItems] = useState<ReceivableItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/receivables');
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setItems(data.items || []);
      setSummary(data.summary || null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => items.filter((i) =>
      (sourceFilter === 'ALL' || i.source === sourceFilter) &&
      (overdueOnly === 'ALL' || (overdueOnly === 'OVERDUE' ? i.overdue : !i.overdue)),
    ),
    [items, sourceFilter, overdueOnly],
  );

  return (
    <div className="flex min-h-full flex-col gap-6">
      <SellerSectionHeader title="Créances clients" />
      <p className="-mt-4 text-sm text-[var(--text-secondary)]">
        Vue consolidée de tout ce que les clients doivent encore : crédits comptoir (caisse) et tranches étudiantes.
      </p>

      {summary && (
        <section className="grid gap-5 md:grid-cols-4">
          <StatCard title="Total à recouvrer" value={formatPrice(summary.totalOutstanding)} description={`${summary.count} dossier(s)`} icon={Wallet} accentColor="amber" />
          <StatCard title="Crédit comptoir" value={formatPrice(summary.posOutstanding)} description="Ventes caisse" icon={Store} accentColor="blue" />
          <StatCard title="Crédits étudiants" value={formatPrice(summary.studentOutstanding)} description="Tranches restantes" icon={GraduationCap} accentColor="green" />
          <StatCard title="En retard" value={String(summary.overdueCount)} description="Échéance dépassée" icon={AlertTriangle} accentColor="red" />
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <SellerSelect
          value={sourceFilter}
          onChange={setSourceFilter}
          options={[
            { value: 'ALL', label: 'Toutes les sources' },
            { value: 'POS', label: 'Crédit comptoir' },
            { value: 'STUDENT', label: 'Crédits étudiants' },
          ]}
          className="w-[190px]"
        />
        <SellerSelect
          value={overdueOnly}
          onChange={setOverdueOnly}
          options={[
            { value: 'ALL', label: 'Tous les statuts' },
            { value: 'OVERDUE', label: 'En retard' },
            { value: 'ONTIME', label: 'À jour' },
          ]}
          className="w-[160px]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : filtered.length === 0 ? (
        <SellerEmptyState title="Aucune créance" description="Tous les clients sont à jour. 🎉" icon={HandCoins} />
      ) : (
        <SellerTable>
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader>Client</SellerTableCell>
              <SellerTableCell isHeader>Référence</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Source</SellerTableCell>
              <SellerTableCell isHeader className="text-right">Total</SellerTableCell>
              <SellerTableCell isHeader className="text-right">Payé</SellerTableCell>
              <SellerTableCell isHeader className="text-right">Reste dû</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Échéance</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Action</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {filtered.map((item) => (
              <SellerTableRow key={`${item.source}-${item.id}`} className={item.overdue ? 'bg-red-50/40 dark:bg-red-950/10' : ''}>
                <SellerTableCell>
                  <div className="font-medium text-[var(--text-primary)]">{item.customer}</div>
                  {item.phone && (
                    <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                      <Phone className="h-3 w-3" /> {item.phone}
                    </div>
                  )}
                </SellerTableCell>
                <SellerTableCell className="text-xs text-[var(--text-secondary)]">{item.reference}</SellerTableCell>
                <SellerTableCell className="text-center">
                  {item.source === 'POS' ? (
                    <SellerBadge color="info"><span className="inline-flex items-center gap-1"><Store className="h-3 w-3" /> Comptoir</span></SellerBadge>
                  ) : (
                    <SellerBadge color="primary"><span className="inline-flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Étudiant</span></SellerBadge>
                  )}
                </SellerTableCell>
                <SellerTableCell className="text-right text-sm text-[var(--text-secondary)]">{formatPrice(item.total)}</SellerTableCell>
                <SellerTableCell className="text-right text-sm text-[var(--accent-green)]">{formatPrice(item.paid)}</SellerTableCell>
                <SellerTableCell className="text-right text-sm font-bold text-amber-400">{formatPrice(item.remaining)}</SellerTableCell>
                <SellerTableCell className="text-center">
                  {item.nextDueDate ? (
                    <span className={`text-xs ${item.overdue ? 'font-semibold text-[var(--accent-red)]' : 'text-[var(--text-secondary)]'}`}>
                      {new Date(item.nextDueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {item.overdue && ' ⚠'}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-tertiary)]">—</span>
                  )}
                </SellerTableCell>
                <SellerTableCell className="text-center">
                  <Link
                    href={item.source === 'POS' ? '/seller/invoices' : '/seller/student-installment/orders'}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    title={item.source === 'POS' ? 'Encaisser dans Factures' : 'Gérer dans Crédits étudiants'}
                  >
                    Encaisser <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </SellerTableCell>
              </SellerTableRow>
            ))}
          </SellerTableBody>
        </SellerTable>
      )}
    </div>
  );
}
