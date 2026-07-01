'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown, ArrowUp, Calendar, CheckSquare, ChevronDown,
  Clock, Clock3, Download, Eye, FileText, Search, ShoppingCart, Square, Trash2, Truck, XCircle, CalendarRange
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';

import SellerModal from '@/components/seller/SellerModal';
import SellerPagination from '@/components/seller/SellerPagination';
import SellerPanel from '@/components/seller/SellerPanel';
import StatCard from '@/components/seller/StatCard';
import Loading from '@/components/Loading';
import { useAppContext } from '@/context/AppContext';
import { Order, OrderStatus, PaymentStatus, UserRole } from '@/lib/types';

const pageSize = 8;
type SortKey = 'orderDate' | 'totalAmount' | 'status' | 'userName' | 'id';


function getStatusColor(status: string): string {
  if ([OrderStatus.DELIVERED, PaymentStatus.COMPLETED].includes(status as never)) return 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400';
  if ([OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED, PaymentStatus.FAILED].includes(status as never)) return 'bg-gradient-to-r from-red-500/20 to-rose-600/20 text-red-400';
  if ([OrderStatus.SHIPPED, OrderStatus.PROCESSING].includes(status as never)) return 'bg-gradient-to-r from-blue-500/20 to-indigo-600/20 text-blue-400';
  if ([OrderStatus.ON_HOLD].includes(status as never)) return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400';
  return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400';
}

const statusLabels: Record<string, string> = {
  ALL: 'Tous statuts',
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  ON_HOLD: 'En attente',
  PAID_SUCCESS: 'Payée',
  PAYMENT_FAILED: 'Paiement échoué',
};

const paymentLabels: Record<string, string> = {
  ALL: 'Tous paiements',
  PENDING: 'En attente',
  COMPLETED: 'Payé',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
};

export default function OrdersPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>('orderDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchAllOrders = useCallback(async () => {
    if (status !== 'authenticated' || session?.user?.role !== UserRole.ADMIN) {
      setLoading(false);
      setError("Accès refusé. Vous devez être connecté en tant qu'administrateur.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Order[]>('/api/admin/orders');
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || 'Erreur lors du chargement des commandes.'
          : 'Erreur inconnue lors du chargement des commandes.'
      );
    } finally {
      setLoading(false);
    }
  }, [session?.user?.role, status]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === UserRole.ADMIN) {
      fetchAllOrders();
      return;
    }
    if (status === 'unauthenticated') router.push('/login');
  }, [fetchAllOrders, router, session?.user?.role, status]);

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, paymentFilter, rangeStart, rangeEnd]);

  const existingOrderIds = useMemo(() => new Set(orders.map((o) => o.id)), [orders]);
  useEffect(() => {
    setSelectedIds((prev) => new Set([...prev].filter((id) => existingOrderIds.has(id))));
  }, [existingOrderIds]);

  const isInPeriod = useCallback((date: string): boolean => {
    if (!rangeStart && !rangeEnd) return true;
    const orderDate = new Date(date);
    const start = rangeStart ? new Date(rangeStart + 'T00:00:00') : new Date(0);
    const end = rangeEnd ? new Date(rangeEnd + 'T23:59:59') : new Date(8640000000000000);
    return orderDate >= start && orderDate <= end;
  }, [rangeStart, rangeEnd]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'ALL' || order.paymentStatus === paymentFilter;
      const matchesPeriod = isInPeriod(order.orderDate);
      const haystack = [order.id, order.userName, order.userEmail, order.shippingCity, order.shippingCountry]
        .join(' ').toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase());
      return matchesStatus && matchesPayment && matchesPeriod && matchesSearch;
    });
  }, [orders, paymentFilter, isInPeriod, searchTerm, statusFilter]);

  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'orderDate': cmp = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(); break;
        case 'totalAmount': cmp = a.totalAmount - b.totalAmount; break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'userName': cmp = a.userName.localeCompare(b.userName); break;
        case 'id': cmp = a.id.localeCompare(b.id); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredOrders, sortKey, sortDir]);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, page]);

  const pendingCount = useMemo(() => orders.filter((o) => o.status === OrderStatus.PENDING).length, [orders]);
  const deliveredCount = useMemo(() => orders.filter((o) => o.status === OrderStatus.DELIVERED).length, [orders]);
  const totalRevenue = useMemo(() =>
    orders.reduce((sum, o) => o.paymentStatus === PaymentStatus.COMPLETED ? sum + o.totalAmount : sum, 0),
    [orders]
  );

  const allSelectedOnPage = useMemo(
    () => paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedIds.has(o.id)),
    [paginatedOrders, selectedIds]
  );

  function toggleSort(col: SortKey) {
    if (sortKey === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(col); setSortDir('asc'); }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelectedOnPage) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedOrders.forEach((o) => next.delete(o.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedOrders.forEach((o) => next.add(o.id));
        return next;
      });
    }
  }

  function clearSelection() { setSelectedIds(new Set()); }

  async function handleBulkUpdate() {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      const res = await axios.patch('/api/admin/orders/batch', { ids: Array.from(selectedIds), status: bulkStatus });
      toast.success(res.data.message || 'Commandes mises à jour.');
      clearSelection();
      setBulkStatus('');
      fetchAllOrders();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) toast.error(err.response.data.message);
      else toast.error('Erreur lors de la mise à jour groupée.');
    } finally {
      setBulkUpdating(false);
    }
  }

  const handleStatusChange = async (newStatus: OrderStatus, orderId: string) => {
    try {
      const response = await axios.put(`/api/admin/orders/${orderId}`, { status: newStatus });
      if (!response.data?.success) throw new Error(response.data?.message || 'Mise à jour impossible.');
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status: newStatus } : order));
      toast.success('Statut de commande mis à jour.');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour du statut.');
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      const response = await axios.delete(`/api/admin/orders/${orderToDelete.id}`, { data: { id: orderToDelete.id } });
      if (!response.data?.success) throw new Error(response.data?.message || 'Suppression impossible.');
      setOrders((current) => current.filter((order) => order.id !== orderToDelete.id));
      toast.success('Commande supprimée avec succès.');
      setOrderToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression de la commande.');
    } finally {
      setIsDeleting(false);
    }
  };

  function exportPDF() {

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // Couleurs
    const darkBg = '#121212';
    const accent = '#10b981';
    const textPrimary = '#f1f5f9';
    const textSecondary = '#94a3b8';

    // En-tête
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageW, 50, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(241, 245, 249);
    doc.text('Rapport des commandes', 20, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 32);
    doc.text(`${filteredOrders.length} commande(s) · Filtres actifs : ${statusFilter !== 'ALL' ? statusLabels[statusFilter] + ' / ' : ''}${paymentFilter !== 'ALL' ? paymentLabels[paymentFilter] + ' / ' : ''}${rangeStart || rangeEnd ? rangeStart + ' → ' + rangeEnd : 'Toutes dates'}`, 20, 40);

    // Resume stats
    const statsY = 60;
    const statWidth = (pageW - 40) / 4;
    const statBoxes = [
      { label: 'Total commandes', value: String(filteredOrders.length), color: [16, 185, 129] },
      { label: 'En attente', value: String(filteredOrders.filter((o) => o.status === OrderStatus.PENDING).length), color: [245, 158, 11] },
      { label: 'Livrées', value: String(filteredOrders.filter((o) => o.status === OrderStatus.DELIVERED).length), color: [59, 130, 246] },
      { label: 'CA total', value: formatPrice(filteredOrders.reduce((s, o) => s + o.totalAmount, 0)), color: [139, 92, 246] },
    ];

    statBoxes.forEach((box, i) => {
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

    // Tableau
    const tableBody = filteredOrders.map((o) => [
      o.id.slice(0, 8),
      o.userName,
      o.userEmail,
      `${o.totalAmount.toLocaleString('fr-FR')} ${o.currency || 'XOF'}`,
      statusLabels[o.status] || o.status,
      paymentLabels[o.paymentStatus] || o.paymentStatus,
      o.shippingCity,
      new Date(o.orderDate).toLocaleDateString('fr-FR'),
      String(o.orderItems.reduce((s, i) => s + i.quantity, 0)),
    ]);

    autoTable(doc, {
      head: [['N°', 'Client', 'Email', 'Montant', 'Statut', 'Paiement', 'Ville', 'Date', 'Articles']],
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
      columnStyles: {
        0: { cellWidth: 18 },
        3: { halign: 'right', cellWidth: 28 },
        6: { cellWidth: 20 },
        7: { cellWidth: 18, halign: 'center' },
        8: { cellWidth: 13, halign: 'center' },
      },
      margin: { top: statsY + 32, bottom: 20 },
      didDrawPage: () => {
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('Plawimadd Group — Rapport des commandes', 20, doc.internal.pageSize.getHeight() - 10);
      },
    });

    doc.save(`commandes_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('Export PDF téléchargé.');
  }

  // Status timeline data
  function buildTimeline(order: Order) {
    const events: { date: Date; label: string; type: 'created' | 'payment' | 'status' | 'update' }[] = [];
    events.push({ date: new Date(order.orderDate), label: 'Commande créée', type: 'created' });
    if (order.paymentDate) events.push({ date: new Date(order.paymentDate), label: `Paiement ${paymentLabels[order.paymentStatus] || order.paymentStatus}`, type: 'payment' });
    events.push({ date: new Date(order.updatedAt), label: `Statut : ${statusLabels[order.status] || order.status}`, type: 'status' });
    events.sort((a, b) => a.date.getTime() - b.date.getTime());
    return events;
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowDown className="ml-1 h-3 w-3 inline opacity-20" />;
    return sortDir === 'asc' ? <ArrowUp className="ml-1 h-3 w-3 inline text-emerald-400" /> : <ArrowDown className="ml-1 h-3 w-3 inline text-emerald-400" />;
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
          <h1 className="text-2xl font-700 text-[var(--text-primary)]">Commandes</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Suivi des commandes et paiements</p>
        </div>
        <button
          onClick={exportPDF}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-600 text-white shadow-lg transition-all duration-300 hover:from-emerald-400 hover:to-cyan-400 hover:shadow-xl"
        >
          <FileText className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Commandes totales" value={String(orders.length)} description="Toutes les commandes disponibles" icon={ShoppingCart} />
        <StatCard title="En attente" value={String(pendingCount)} description="À confirmer ou préparer" icon={Clock3} />
        <StatCard title="Livrées" value={String(deliveredCount)} description={`CA encaissé: ${formatPrice(totalRevenue)}`} icon={Truck} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Rechercher par client, email, ville ou numéro"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-4 py-2 pl-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ backgroundColor: '#121212' }}>
              <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{selectedIds.size} sélectionnée(s)</span>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              >
                <option value="">Changer statut</option>
                <option value={OrderStatus.PROCESSING}>En cours</option>
                <option value={OrderStatus.SHIPPED}>Expédiée</option>
                <option value={OrderStatus.DELIVERED}>Livrée</option>
                <option value={OrderStatus.CANCELLED}>Annulée</option>
              </select>
              <button
                onClick={handleBulkUpdate}
                disabled={!bulkStatus || bulkUpdating}
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-1.5 text-xs font-600 text-white transition-smooth hover:opacity-90 disabled:opacity-40"
              >
                {bulkUpdating ? '...' : 'Appliquer'}
              </button>
              <button onClick={clearSelection} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <CustomSelect
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as 'ALL' | OrderStatus)}
            options={[
              { value: 'ALL', label: 'Tous statuts' },
              { value: OrderStatus.PENDING, label: 'En attente' },
              { value: OrderStatus.PROCESSING, label: 'En cours' },
              { value: OrderStatus.SHIPPED, label: 'Expédiées' },
              { value: OrderStatus.DELIVERED, label: 'Livrées' },
              { value: OrderStatus.CANCELLED, label: 'Annulées' },
            ]}
          />
          <CustomSelect
            value={paymentFilter}
            onChange={(v) => setPaymentFilter(v as 'ALL' | PaymentStatus)}
            options={[
              { value: 'ALL', label: 'Tous paiements' },
              { value: PaymentStatus.PENDING, label: 'En attente' },
              { value: PaymentStatus.COMPLETED, label: 'Payés' },
              { value: PaymentStatus.FAILED, label: 'Échoués' },
              { value: PaymentStatus.REFUNDED, label: 'Remboursés' },
            ]}
          />
          <div className="flex items-center gap-2 rounded-xl px-2">
            <CalendarRange className="h-6 w-6 text-[var(--text-tertiary)]" />
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-2.5 py-2 text-xs text-[var(--text-primary)] outline-none transition-smooth focus:border-[var(--accent-blue)] [color-scheme:dark]"
            />
            <span className="text-xs text-[var(--text-tertiary)]">—</span>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-2.5 py-2 text-xs text-[var(--text-primary)] outline-none transition-smooth focus:border-[var(--accent-blue)] [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <SellerPanel className="overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="mb-4 h-12 w-12 text-[var(--accent-red)]" />
            <p className="text-[var(--text-secondary)]">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
            <p className="text-[var(--text-secondary)]">Aucune commande trouvée</p>
            <p className="text-xs text-[var(--text-tertiary)]">Aucun résultat ne correspond aux filtres appliqués</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="w-10 px-2 py-3 text-left">
                    <button onClick={toggleSelectAll} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                      {allSelectedOnPage ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="cursor-pointer px-6 py-3 text-left font-500 text-[var(--text-secondary)] select-none hover:text-[var(--text-primary)]" onClick={() => toggleSort('id')}>
                    Commande <SortIcon column="id" />
                  </th>
                  <th className="cursor-pointer px-6 py-3 text-left font-500 text-[var(--text-secondary)] select-none hover:text-[var(--text-primary)]" onClick={() => toggleSort('userName')}>
                    Client <SortIcon column="userName" />
                  </th>
                  <th className="cursor-pointer px-6 py-3 text-left font-500 text-[var(--text-secondary)] select-none hover:text-[var(--text-primary)]" onClick={() => toggleSort('totalAmount')}>
                    Montant <SortIcon column="totalAmount" />
                  </th>
                  <th className="px-6 py-3 text-left font-500 text-[var(--text-secondary)]">Paiement</th>
                  <th className="px-6 py-3 text-left font-500 text-[var(--text-secondary)]">Livraison</th>
                  <th className="cursor-pointer px-6 py-3 text-left font-500 text-[var(--text-secondary)] select-none hover:text-[var(--text-primary)]" onClick={() => toggleSort('orderDate')}>
                    Date <SortIcon column="orderDate" />
                  </th>
                  <th className="cursor-pointer px-6 py-3 text-left font-500 text-[var(--text-secondary)] select-none hover:text-[var(--text-primary)]" onClick={() => toggleSort('status')}>
                    Statut <SortIcon column="status" />
                  </th>
                  <th className="px-6 py-3 text-left font-500 text-[var(--text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-smooth">
                    <td className="px-2 py-4">
                      <button onClick={() => toggleSelect(order.id)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        {selectedIds.has(order.id) ? <CheckSquare className="h-4 w-4 text-emerald-400" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-500 text-[var(--text-primary)]">#{order.id.slice(0, 8)}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{order.orderItems.length} article(s)</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-500 text-[var(--text-primary)]">{order.userName}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{order.userEmail}</p>
                    </td>
                    <td className="px-6 py-4 font-500 text-[var(--text-primary)]">{formatPrice(order.totalAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-500 ${getStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-[var(--text-secondary)]">{order.shippingCity}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{order.shippingCountry}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--text-tertiary)]">
                      {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(e.target.value as OrderStatus, order.id)}
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
                      >
                        <option value={OrderStatus.PENDING}>En attente</option>
                        <option value={OrderStatus.PROCESSING}>En cours</option>
                        <option value={OrderStatus.SHIPPED}>Expédiée</option>
                        <option value={OrderStatus.DELIVERED}>Livrée</option>
                        <option value={OrderStatus.CANCELLED}>Annulée</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-2.5 py-1.5 text-xs font-500 text-indigo-400 transition-all duration-300 hover:from-indigo-500/30 hover:to-purple-500/30 hover:shadow-lg"
                          title="Détails"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setOrderToDelete(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-gray-500/20 to-slate-600/20 px-2.5 py-1.5 text-xs font-500 text-gray-400 transition-all duration-300 hover:from-gray-500/30 hover:to-slate-600/30 hover:shadow-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
            <p className="text-xs text-[var(--text-tertiary)]">
              {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
              {selectedIds.size > 0 && ` · ${selectedIds.size} sélectionnée(s)`}
            </p>
            <SellerPagination page={page} pageSize={pageSize} totalItems={filteredOrders.length} onPageChange={setPage} />
          </div>
        )}
      </SellerPanel>

      {/* Detail Modal */}
      <SellerModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Commande #${selectedOrder.id.slice(0, 8)}` : 'Commande'}
        description="Détails client, livraison, paiement, articles et historique."
        size="lg"
      >
        {selectedOrder ? (
          <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto lg:grid lg:grid-cols-2">
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-600 uppercase text-[var(--text-tertiary)]">Client</p>
              <div className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                <p className="text-[var(--text-primary)]">{selectedOrder.userName}</p>
                <p className="text-xs">{selectedOrder.userEmail}</p>
                <p className="text-xs">{selectedOrder.userPhoneNumber || 'Téléphone non renseigné'}</p>
              </div>
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-600 uppercase text-[var(--text-tertiary)]">Livraison</p>
              <div className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                <p className="text-[var(--text-primary)]">{selectedOrder.shippingAddressLine1}</p>
                <p className="text-xs">{selectedOrder.shippingCity}, {selectedOrder.shippingState}</p>
                <p className="text-xs">{selectedOrder.shippingCountry}</p>
              </div>
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-600 uppercase text-[var(--text-tertiary)]">Paiement</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-500 ${getStatusColor(selectedOrder.paymentStatus)}`}>
                  {selectedOrder.paymentStatus}
                </span>
                <span className="inline-flex items-center rounded-full bg-[var(--text-tertiary)]/10 px-2.5 py-0.5 text-xs font-500 text-[var(--text-tertiary)]">
                  {selectedOrder.paymentMethod || 'N/A'}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-600 uppercase text-[var(--text-tertiary)]">Montant</p>
              <p className="mt-3 text-2xl font-700 text-[var(--text-primary)]">{formatPrice(selectedOrder.totalAmount)}</p>
            </div>

            {/* Timeline */}
            <div className="lg:col-span-2">
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-4 text-xs font-600 uppercase text-[var(--text-tertiary)]">Chronologie</p>
                <div className="relative ml-2 space-y-0">
                  {buildTimeline(selectedOrder).map((event, i) => (
                    <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-[var(--bg-outer)] ${
                          event.type === 'created' ? 'bg-emerald-500' :
                          event.type === 'payment' ? 'bg-blue-500' : 'bg-amber-500'
                        }`}>
                          {event.type === 'created' ? <Clock className="h-2.5 w-2.5 text-white" /> :
                           event.type === 'payment' ? <ShoppingCart className="h-2.5 w-2.5 text-white" /> :
                           <Truck className="h-2.5 w-2.5 text-white" />}
                        </div>
                        {i < buildTimeline(selectedOrder).length - 1 && (
                          <div className="mt-0.5 h-full w-px bg-[var(--border)]" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-500 text-[var(--text-primary)]">{event.label}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {event.date.toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Articles */}
            <div className="lg:col-span-2">
              <p className="mb-3 text-xs font-600 uppercase text-[var(--text-tertiary)]">Articles</p>
              <div className="divide-y divide-[var(--border)] rounded-lg bg-[var(--bg-outer)]">
                {selectedOrder.orderItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <div>
                      <p className="font-500 text-[var(--text-primary)]">{item.product.name}</p>
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">Quantité: {item.quantity}</p>
                    </div>
                    <p className="font-500 text-[var(--text-primary)]">{formatPrice(item.priceAtOrder)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SellerModal>

      {/* Delete Modal */}
      <SellerModal
        isOpen={Boolean(orderToDelete)}
        onClose={() => setOrderToDelete(null)}
        title="Supprimer cette commande ?"
        description="Cette action retire la commande, ses lignes et ses informations de paiement."
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button onClick={() => setOrderToDelete(null)}
              className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-500 text-[var(--text-secondary)] transition-smooth hover:bg-[var(--bg-hover)]">
              Annuler
            </button>
            <button disabled={isDeleting} onClick={handleDeleteOrder}
              className="rounded-lg border border-[var(--accent-red)] bg-[var(--accent-red)]/10 px-4 py-2 text-sm font-500 text-[var(--accent-red)] transition-smooth hover:bg-[var(--accent-red)]/20 disabled:opacity-50">
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        }
      >
        <p className="rounded-lg border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/5 p-4 text-sm leading-6 text-[var(--accent-red)]">
          La commande #{orderToDelete?.id.slice(0, 8)} sera retirée de l'espace d'administration.
        </p>
      </SellerModal>
    </div>
  );
}

function CustomSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-600 transition-all duration-300 ${
          open
            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50'
        }`}
        style={!open ? { backgroundColor: '#121212' } : undefined}
      >
        {selected.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-outer)] shadow-xl">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-xs transition-smooth hover:bg-white/5 ${
                opt.value === value ? 'font-600 text-emerald-400' : 'font-400 text-[var(--text-secondary)]'
              }`}
            >
              {opt.value === value && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
              <span className={opt.value === value ? '' : 'ml-[14px]'}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
