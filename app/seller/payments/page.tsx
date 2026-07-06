'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  RefreshCw,
  Search,
  Undo2,
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

interface Payment {
  id: string;
  transactionId: string;
  orderId: string;
  client: string;
  method: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  order?: {
    id: string;
    total: number;
    status: string;
    items: number;
  };
}

interface PaymentsResponse {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SortField = 'transactionId' | 'amount' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

const pageSize = 15;

const statusBadge: Record<string, 'success' | 'primary' | 'error' | 'warning'> = {
  COMPLETED: 'success',
  PENDING: 'primary',
  FAILED: 'error',
  REFUNDED: 'warning',
};

const statusLabels: Record<string, string> = {
  COMPLETED: 'Complété',
  PENDING: 'En attente',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
};

const methodLabels: Record<string, string> = {
  CARTE: 'Carte',
  MOBILE_MONEY: 'Mobile Money',
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement',
  KKIA_PAY: 'KkiaPay',
};

export default function PaymentsPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'createdAt', dir: 'desc' });
  const [refunding, setRefunding] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      params.set('sortBy', sort.field);
      params.set('sortOrder', sort.dir);
      const res = await fetch(`/api/admin/payments?${params}`);
      const result: PaymentsResponse = await res.json();
      setPayments(result.data ?? []);
      setTotal(result.total ?? 0);
      setTotalPages(result.totalPages ?? 1);
    } catch {
      toast.error('Impossible de charger les paiements.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, dateFrom, dateTo, page, sort]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const totalReceived = payments.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);
    const pendingTotal = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
    const refundedTotal = payments.filter((p) => p.status === 'REFUNDED').reduce((s, p) => s + p.amount, 0);
    return { totalReceived, pendingTotal, refundedTotal };
  }, [payments]);

  const breakdownByMethod = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach((p) => {
      const method = methodLabels[p.method] || p.method;
      map[method] = (map[method] || 0) + p.amount;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [payments]);

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

  const handleRefund = async (payment: Payment) => {
    setRefunding(payment.id);
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REFUNDED' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Erreur');
      toast.success('Paiement remboursé avec succès.');
      fetchPayments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du remboursement.');
    } finally {
      setRefunding(null);
    }
  };

  function exportCSV() {
    const header = 'Transaction ID;Commande;Client;Methode;Montant;Statut;Date\n';
    const rows = payments.map((p) =>
      [
        p.transactionId || '',
        `#${p.orderId.slice(0, 8)}`,
        p.client,
        methodLabels[p.method] || p.method,
        formatPrice(p.amount),
        statusLabels[p.status] || p.status,
        new Date(p.createdAt).toLocaleDateString('fr-FR'),
      ].join(';')
    ).join('\n');
    const csv = '\uFEFF' + header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paiements_${new Date().toISOString().slice(0, 10)}.csv`;
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
    doc.text('Journal des paiements', 20, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 32);
    doc.text(`${total} paiement(s)`, 20, 40);
    const statsY = 60;
    const statWidth = (pageW - 40) / 3;
    const boxes = [
      { label: 'Total recu', value: formatPrice(stats.totalReceived), color: [16, 185, 129] },
      { label: 'En attente', value: formatPrice(stats.pendingTotal), color: [59, 130, 246] },
      { label: 'Rembourse', value: formatPrice(stats.refundedTotal), color: [239, 68, 68] },
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
      head: [['Transaction ID', 'Commande', 'Client', 'Methode', 'Montant', 'Statut', 'Date']],
      body: payments.map((p) => [
        p.transactionId || 'N/A',
        `#${p.orderId.slice(0, 8)}`,
        p.client,
        methodLabels[p.method] || p.method,
        formatPrice(p.amount),
        statusLabels[p.status] || p.status,
        new Date(p.createdAt).toLocaleDateString('fr-FR'),
      ]),
      startY: statsY + 32,
      styles: { fontSize: 7, textColor: [241, 245, 249], fillColor: [18, 18, 18], lineColor: [30, 41, 59], lineWidth: 0.3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [24, 24, 24] },
      margin: { top: statsY + 32, bottom: 20 },
    });
    doc.save(`paiements_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const getRowClass = (status: string) => {
    if (status === 'FAILED') return 'bg-red-50/50';
    if (status === 'PENDING') return 'bg-amber-50/50';
    if (status === 'REFUNDED') return 'bg-slate-50/30';
    return '';
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
      <SellerSectionHeader
        title="Journal des paiements"
        action={
          <div className="flex gap-2">
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportCSV}>CSV</SellerButton>
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportPDF}>PDF</SellerButton>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total reçu" value={formatPrice(stats.totalReceived)} description="Paiements complétés" icon={DollarSign} accentColor="green" />
        <StatCard title="En attente" value={formatPrice(stats.pendingTotal)} description="Paiements en attente" icon={RefreshCw} accentColor="blue" />
        <StatCard title="Remboursé" value={formatPrice(stats.refundedTotal)} description="Montant remboursé" icon={Undo2} accentColor="red" />
      </div>

      <SellerFilterBar>
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Rechercher par transaction ou client"
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            />
          </div>
          <SellerSelect
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: 'ALL', label: 'Tous' },
              { value: 'COMPLETED', label: 'Complétés' },
              { value: 'PENDING', label: 'En attente' },
              { value: 'FAILED', label: 'Échoués' },
              { value: 'REFUNDED', label: 'Remboursés' },
            ]}
            className="[&_button]:!h-9 [&_button]:!py-1.5 [&_button]:!px-3 w-[180px] shrink-0"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 w-[135px] shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2.5 text-xs text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)] [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
            title="jj/mm/aaaa"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 w-[135px] shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2.5 text-xs text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)] [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
            title="jj/mm/aaaa"
          />
          <div className="rounded-lg bg-[var(--bg-hover)] px-3 py-1.5 text-xs text-[var(--text-secondary)] shrink-0">
            {total} résultat(s)
          </div>
        </div>
      </SellerFilterBar>

      {payments.length === 0 ? (
        <SellerEmptyState
          title="Aucun paiement"
          description="Aucun paiement trouvé pour les filtres en cours."
          icon={CreditCard}
        />
      ) : (
        <>
          <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
            <SellerTableHeader>
              <SellerTableRow>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('transactionId')}>
                  <span className="flex items-center">ID Transaction <SortIcon field="transactionId" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center">Commande</SellerTableCell>
                <SellerTableCell isHeader className="text-center">Client</SellerTableCell>
                <SellerTableCell isHeader className="text-center">Méthode</SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('amount')}>
                  <span className="flex items-center">Montant <SortIcon field="amount" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  <span className="flex items-center">Statut <SortIcon field="status" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
                  <span className="flex items-center">Date <SortIcon field="createdAt" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
              </SellerTableRow>
            </SellerTableHeader>
            <SellerTableBody>
              {payments.map((payment) => (
                <SellerTableRow key={payment.id} className={getRowClass(payment.status)}>
                  <SellerTableCell className="text-center">
                    <span className="font-mono text-xs text-[var(--text-primary)]">
                      {payment.transactionId}
                    </span>
                  </SellerTableCell>
                  <SellerTableCell className="text-[var(--text-secondary)] text-center">
                    #{payment.orderId.slice(0, 8)}
                  </SellerTableCell>
                  <SellerTableCell className="text-[var(--text-primary)] text-center">
                    {payment.client}
                  </SellerTableCell>
                  <SellerTableCell className="text-[var(--text-secondary)] text-center">
                    {methodLabels[payment.method] || payment.method}
                  </SellerTableCell>
                  <SellerTableCell className="font-medium text-[var(--text-primary)] text-center">
                    {formatPrice(payment.amount)}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <SellerBadge color={statusBadge[payment.status] || 'slate'}>
                      {statusLabels[payment.status] || payment.status}
                    </SellerBadge>
                  </SellerTableCell>
                  <SellerTableCell className="text-[var(--text-secondary)] text-center">
                    {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <SellerButton variant="outline" size="sm" icon={Eye} onClick={() => setSelectedPayment(payment)}>
                        Détail
                      </SellerButton>
                      {payment.status === 'COMPLETED' && (
                        <SellerButton
                          variant="outline"
                          size="sm"
                          icon={Undo2}
                          onClick={() => handleRefund(payment)}
                          disabled={refunding === payment.id}
                        >
                          {refunding === payment.id ? '...' : 'Rembourser'}
                        </SellerButton>
                      )}
                    </div>
                  </SellerTableCell>
                </SellerTableRow>
              ))}
            </SellerTableBody>
            <tfoot>
              <tr>
                <td colSpan={8}>
                  <SellerPagination page={page} pageSize={pageSize} totalItems={total} onPageChange={setPage} />
                </td>
              </tr>
            </tfoot>
          </SellerTable>

          {breakdownByMethod.length > 0 && (
            <SellerPanel className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Ventilation par méthode de paiement</h3>
              <div className="space-y-2">
                {breakdownByMethod.map(([method, amount]) => {
                  const maxVal = breakdownByMethod[0]?.[1] || 1;
                  const pct = (amount / maxVal) * 100;
                  return (
                    <div key={method} className="flex items-center gap-3">
                      <span className="w-40 text-xs text-[var(--text-secondary)] truncate shrink-0">{method}</span>
                      <div className="flex h-6 flex-1 overflow-hidden rounded-md bg-[var(--bg-hover)]">
                        <div className="h-full rounded-md bg-[var(--accent-green)]/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-28 text-right text-xs font-medium text-[var(--text-primary)] shrink-0">{formatPrice(amount)}</span>
                    </div>
                  );
                })}
              </div>
            </SellerPanel>
          )}
        </>
      )}

      <SellerModal
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        title="Détail du paiement"
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <SellerButton variant="outline" onClick={() => setSelectedPayment(null)}>
              Fermer
            </SellerButton>
          </div>
        }
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Transaction ID</p>
                <p className="font-mono text-sm text-[var(--text-primary)]">{selectedPayment.transactionId}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Méthode</p>
                <p className="text-sm text-[var(--text-primary)]">{methodLabels[selectedPayment.method] || selectedPayment.method}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Montant</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{formatPrice(selectedPayment.amount)}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Statut</p>
                <SellerBadge color={statusBadge[selectedPayment.status] || 'slate'}>
                  {statusLabels[selectedPayment.status] || selectedPayment.status}
                </SellerBadge>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Client</p>
                <p className="text-sm text-[var(--text-primary)]">{selectedPayment.client}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Date</p>
                <p className="text-sm text-[var(--text-primary)]">
                  {new Date(selectedPayment.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>

            {selectedPayment.order && (
              <div>
                <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">Informations commande</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                    <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Commande</p>
                    <p className="font-mono text-sm text-[var(--text-primary)]">#{selectedPayment.order.id.slice(0, 8)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                    <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Total</p>
                    <p className="text-sm text-[var(--text-primary)]">{formatPrice(selectedPayment.order.total)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                    <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Articles</p>
                    <p className="text-sm text-[var(--text-primary)]">{selectedPayment.order.items}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </SellerModal>
    </div>
  );
}
