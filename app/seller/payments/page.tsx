'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Search,
  Eye,
  DollarSign,
  ArrowUpRight,
  Undo2,
} from 'lucide-react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerInput from '@/components/seller/SellerInput';
import SellerModal from '@/components/seller/SellerModal';
import SellerPagination from '@/components/seller/SellerPagination';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import SellerBadge from '@/components/seller/SellerBadge';
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

export default function PaymentsPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      toast.error('Impossible de charger les paiements.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setPage(1); }, [searchTerm, statusFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return payments.slice(start, start + pageSize);
  }, [payments, page]);

  const stats = useMemo(() => {
    const totalReceived = payments.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);
    const pendingTotal = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
    const refundedTotal = payments.filter((p) => p.status === 'REFUNDED').reduce((s, p) => s + p.amount, 0);
    return { totalReceived, pendingTotal, refundedTotal };
  }, [payments]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader title="Journal des paiements" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total reçu" value={formatPrice(stats.totalReceived)} description="Paiements complétés" icon={DollarSign} accentColor="green" />
        <StatCard title="En attente" value={formatPrice(stats.pendingTotal)} description="Paiements en attente" icon={ArrowUpRight} accentColor="blue" />
        <StatCard title="Remboursé" value={formatPrice(stats.refundedTotal)} description="Montant remboursé" icon={Undo2} accentColor="red" />
      </div>

      <SellerFilterBar>
        <SellerInput
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par ID transaction"
        />
        <div className="flex items-center gap-3">
          <SellerSelect
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={[
              { value: 'ALL', label: 'Tous' },
              { value: 'COMPLETED', label: 'Complétés' },
              { value: 'PENDING', label: 'En attente' },
              { value: 'FAILED', label: 'Échoués' },
              { value: 'REFUNDED', label: 'Remboursés' },
            ]}
          />
          <div className="rounded-lg bg-[var(--bg-hover)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            {payments.length} résultat(s)
          </div>
        </div>
      </SellerFilterBar>

      {payments.length === 0 ? (
        <SellerEmptyState
          title="Aucun paiement"
          description="Aucun paiement trouvé."
          icon={CreditCard}
        />
      ) : (
        <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader>ID Transaction</SellerTableCell>
              <SellerTableCell isHeader>Commande</SellerTableCell>
              <SellerTableCell isHeader>Client</SellerTableCell>
              <SellerTableCell isHeader>Méthode</SellerTableCell>
              <SellerTableCell isHeader>Montant</SellerTableCell>
              <SellerTableCell isHeader>Statut</SellerTableCell>
              <SellerTableCell isHeader>Date</SellerTableCell>
              <SellerTableCell isHeader>Actions</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {paginated.map((payment) => (
              <SellerTableRow key={payment.id}>
                <SellerTableCell>
                  <span className="font-mono text-xs text-[var(--text-primary)]">
                    {payment.transactionId}
                  </span>
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)]">
                  #{payment.orderId.slice(0, 8)}
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-primary)]">
                  {payment.client}
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)]">
                  {payment.method}
                </SellerTableCell>
                <SellerTableCell className="font-medium text-[var(--text-primary)]">
                  {formatPrice(payment.amount)}
                </SellerTableCell>
                <SellerTableCell>
                  <SellerBadge color={statusBadge[payment.status] || 'slate'}>
                    {statusLabels[payment.status] || payment.status}
                  </SellerBadge>
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)]">
                  {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                </SellerTableCell>
                <SellerTableCell>
                  <SellerButton variant="outline" size="sm" icon={Eye} onClick={() => setSelectedPayment(payment)}>
                    Détail
                  </SellerButton>
                </SellerTableCell>
              </SellerTableRow>
            ))}
          </SellerTableBody>
          <tfoot>
            <tr>
              <td colSpan={8}>
                <SellerPagination page={page} pageSize={pageSize} totalItems={payments.length} onPageChange={setPage} />
              </td>
            </tr>
          </tfoot>
        </SellerTable>
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
                <p className="text-sm text-[var(--text-primary)]">{selectedPayment.method}</p>
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
