'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Banknote,
  CalendarRange,
  ExternalLink,
  Eye,
  FileText,
  Receipt,
  Search,
  ShoppingCart,
  Store,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';

import Loading from '@/components/Loading';
import SellerModal from '@/components/seller/SellerModal';
import SellerPagination from '@/components/seller/SellerPagination';
import SellerPanel from '@/components/seller/SellerPanel';
import StatCard from '@/components/seller/StatCard';
import { useAppContext } from '@/context/AppContext';

interface AdminPosItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface AdminPosTransaction {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail?: string | null;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paidAmount?: number;
  remainingBalance?: number;
  dueDate?: string | null;
  paymentMethod: string;
  createdAt: string;
  seller: {
    name: string;
    email: string | null;
  };
  items: AdminPosItem[];
}

interface AdminPosStats {
  transactions: number;
  todayTransactions: number;
  totalAmount: number;
  todayAmount: number;
  cashAmount: number;
}

interface AdminPosResponse {
  success: boolean;
  stats: AdminPosStats;
  data: AdminPosTransaction[];
  message?: string;
}

const pageSize = 10;

const methodLabels: Record<string, string> = {
  CASH: 'Espèces',
  TRANSFER: 'Virement',
  INSTALLMENT: 'Tranche',
  MOBILE_MONEY: 'Mobile Money',
  CARD: 'Carte',
};

function getMethodColor(method: string): string {
  if (method === 'CASH') return 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400';
  if (method === 'TRANSFER') return 'bg-gradient-to-r from-blue-500/20 to-indigo-600/20 text-blue-400';
  if (method === 'INSTALLMENT') return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400';
  if (method === 'MOBILE_MONEY') return 'bg-gradient-to-r from-blue-500/20 to-indigo-600/20 text-blue-400';
  if (method === 'CARD') return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400';
  return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400';
}

export default function AdminPosPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<AdminPosTransaction[]>([]);
  const [stats, setStats] = useState<AdminPosStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<AdminPosTransaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    try {
      if (session?.user?.role === 'ADMIN') {
        const res = await fetch('/api/admin/pos/transactions');
        const result: AdminPosResponse = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message || 'Chargement impossible');
        setTransactions(result.data || []);
        setStats(result.stats);
        return;
      }

      const res = await fetch('/api/pos/transactions');
      const ownTransactions = await res.json();
      if (!res.ok || !Array.isArray(ownTransactions)) throw new Error('Chargement impossible');
      const normalized: AdminPosTransaction[] = ownTransactions.map((transaction: any) => ({
        id: transaction.id,
        invoiceNumber: transaction.invoiceNumber,
        customerName: transaction.customerName,
        customerPhone: transaction.customerPhone,
        totalAmount: Number(transaction.totalAmount),
        discount: Number(transaction.discount),
        finalAmount: Number(transaction.finalAmount),
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
        seller: {
          name: session?.user?.name || 'Vendeur',
          email: session?.user?.email || null,
        },
        items: (transaction.items || []).map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || item.productName || 'Produit',
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
      }));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTransactions = normalized.filter((t) => new Date(t.createdAt) >= today);
      setTransactions(normalized);
      setStats({
        transactions: normalized.length,
        todayTransactions: todayTransactions.length,
        totalAmount: normalized.reduce((sum, t) => sum + t.finalAmount, 0),
        todayAmount: todayTransactions.reduce((sum, t) => sum + t.finalAmount, 0),
        cashAmount: normalized.filter((t) => t.paymentMethod === 'CASH').reduce((sum, t) => sum + t.finalAmount, 0),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de charger les ventes POS.');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email, session?.user?.name, session?.user?.role, status]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => { setPage(1); }, [search, rangeStart, rangeEnd]);

  const isInPeriod = useCallback((date: string): boolean => {
    if (!rangeStart && !rangeEnd) return true;
    const orderDate = new Date(date);
    const start = rangeStart ? new Date(rangeStart + 'T00:00:00') : new Date(0);
    const end = rangeEnd ? new Date(rangeEnd + 'T23:59:59') : new Date(8640000000000000);
    return orderDate >= start && orderDate <= end;
  }, [rangeStart, rangeEnd]);

  const filtered = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesPeriod = isInPeriod(transaction.createdAt);
      const query = search.trim().toLowerCase();
      if (!query) return matchesPeriod;
      const haystack = [
        transaction.invoiceNumber,
        transaction.customerName,
        transaction.customerPhone,
        transaction.seller.name,
        transaction.seller.email,
        ...transaction.items.map((item) => item.productName),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesPeriod && haystack.includes(query);
    });
  }, [search, transactions, isInPeriod]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, t) => sum + Number(t.finalAmount), 0),
    [filtered]
  );

  const openInvoice = (transactionId: string) => {
    window.open(`/api/pos/invoice?transactionId=${transactionId}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-700 text-[var(--text-primary)]">Ventes physiques</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Suivi des ventes physiques encaissées en magasin.
          </p>
        </div>
          <Link
            href="/seller/pos/caisse"
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-600 text-blue-700 transition hover:bg-yellow-300"
          >
            <Store className="h-4 w-4" />
            Nouvelle vente
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Ventes POS" value={String(stats?.transactions || 0)} description="Transactions physiques" icon={Receipt} />
        <StatCard title="Aujourd'hui" value={formatPrice(stats?.todayAmount || 0)} description={`${stats?.todayTransactions || 0} vente(s)`} icon={Store} />
        <StatCard title="Total encaissé" value={formatPrice(stats?.totalAmount || 0)} description="Toutes ventes POS" icon={Banknote} />
        <StatCard title="Espèces" value={formatPrice(stats?.cashAmount || 0)} description="Paiements cash" icon={Banknote} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Rechercher facture, client, vendeur ou produit"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-4 py-2 pl-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl px-2">
            <CalendarRange className="h-6 w-6 text-[var(--text-tertiary)]" />
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-2.5 py-2 text-xs text-[var(--text-primary)] outline-none transition-smooth focus:border-[var(--accent-blue)] [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
            />
            <span className="text-xs text-[var(--text-tertiary)]">—</span>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-2.5 py-2 text-xs text-[var(--text-primary)] outline-none transition-smooth focus:border-[var(--accent-blue)] [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
            />
          </div>
          <div className="rounded-lg bg-[var(--bg-hover)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            {filtered.length} vente(s) — {formatPrice(filteredTotal)}
          </div>
        </div>
      </div>

      {/* Table */}
      <SellerPanel className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
            <p className="text-[var(--text-secondary)]">Aucune vente physique trouvée</p>
            <p className="text-xs text-[var(--text-tertiary)]">Aucun résultat ne correspond aux filtres appliqués</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Facture</th>
                    <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Client</th>
                    <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Vendeur</th>
                    <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Articles</th>
                    <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Montant</th>
                    <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Paiement</th>
                    <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Date</th>
                    <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-smooth">
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-xs font-semibold text-[var(--accent-blue)]">
                          {transaction.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-500 text-[var(--text-primary)]">{transaction.customerName || '-'}</p>
                        {transaction.customerPhone && (
                          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{transaction.customerPhone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-500 text-[var(--text-primary)]">{transaction.seller.name}</p>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{transaction.seller.email || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-sm text-[var(--text-primary)]">
                          {transaction.items.reduce((sum, item) => sum + item.quantity, 0)} article(s)
                        </p>
                        <p className="mt-0.5 max-w-[220px] truncate text-xs text-[var(--text-tertiary)]">
                          {transaction.items.map((item) => item.productName).join(', ')}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-600 text-[var(--text-primary)]">{formatPrice(transaction.finalAmount)}</p>
                        {transaction.discount > 0 && (
                          <p className="mt-0.5 text-xs text-emerald-400">Remise {formatPrice(transaction.discount)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-500 ${getMethodColor(transaction.paymentMethod)}`}>
                          {methodLabels[transaction.paymentMethod] || transaction.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-[var(--text-tertiary)]">
                        {new Date(transaction.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedTransaction(transaction)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-2.5 py-1.5 text-xs font-500 text-indigo-400 transition-all duration-300 hover:from-indigo-500/30 hover:to-purple-500/30 hover:shadow-lg"
                            title="Détails"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openInvoice(transaction.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-emerald-500/20 to-teal-600/20 px-2.5 py-1.5 text-xs font-500 text-emerald-400 transition-all duration-300 hover:from-emerald-500/30 hover:to-teal-600/30 hover:shadow-lg"
                            title="Facture"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
              <p className="text-xs text-[var(--text-tertiary)]">
                {filtered.length} vente{filtered.length > 1 ? 's' : ''}
              </p>
              <SellerPagination page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />
            </div>
          </>
        )}
      </SellerPanel>

      {/* Detail Modal */}
      <SellerModal
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        title={selectedTransaction ? `Vente #${selectedTransaction.invoiceNumber}` : 'Vente physique'}
        description="Détails de la transaction, articles et informations client."
        size="lg"
      >
        {selectedTransaction ? (
          <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto lg:grid lg:grid-cols-2">
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-600 uppercase text-[var(--text-tertiary)]">Client</p>
              <div className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                <p className="text-[var(--text-primary)]">{selectedTransaction.customerName || 'Non renseigné'}</p>
                <p className="text-xs">{selectedTransaction.customerPhone || 'Téléphone non renseigné'}</p>
              </div>
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-600 uppercase text-[var(--text-tertiary)]">Vendeur</p>
              <div className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                <p className="text-[var(--text-primary)]">{selectedTransaction.seller.name}</p>
                <p className="text-xs">{selectedTransaction.seller.email || '-'}</p>
              </div>
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-600 uppercase text-[var(--text-tertiary)]">Paiement</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-500 ${getMethodColor(selectedTransaction.paymentMethod)}`}>
                  {methodLabels[selectedTransaction.paymentMethod] || selectedTransaction.paymentMethod}
                </span>
              </div>
              {selectedTransaction.paymentMethod === 'INSTALLMENT' && selectedTransaction.remainingBalance && selectedTransaction.remainingBalance > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-emerald-400">Versé: {formatPrice(selectedTransaction.paidAmount || 0)}</p>
                  <p className="text-amber-400">Reste: {formatPrice(selectedTransaction.remainingBalance)}</p>
                  {selectedTransaction.dueDate && (
                    <p className="text-[var(--text-tertiary)]">Échéance: {new Date(selectedTransaction.dueDate).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-600 uppercase text-[var(--text-tertiary)]">Montant</p>
              <p className="mt-3 text-2xl font-700 text-[var(--text-primary)]">{formatPrice(selectedTransaction.finalAmount)}</p>
              {selectedTransaction.discount > 0 && (
                <p className="mt-1 text-xs text-emerald-400">Remise : {formatPrice(selectedTransaction.discount)}</p>
              )}
            </div>

            {/* Articles */}
            <div className="lg:col-span-2">
              <p className="mb-3 text-xs font-600 uppercase text-[var(--text-tertiary)]">Articles</p>
              <div className="divide-y divide-[var(--border)] rounded-lg bg-[var(--bg-outer)]">
                {selectedTransaction.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <div>
                      <p className="font-500 text-[var(--text-primary)]">{item.productName}</p>
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        Qté: {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-500 text-[var(--text-primary)]">{formatPrice(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SellerModal>
    </div>
  );
}
