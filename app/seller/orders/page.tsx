'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown, ArrowUp, Calendar, CheckSquare, ChevronDown,
  Clock, Clock3, DollarSign, Download, Eye, FileText, Search, ShoppingCart, Square, Trash2, Truck, XCircle, CalendarRange
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

function parseColorIds(color: string | null | undefined): string[] {
  if (!color) return [];
  try { const ids = JSON.parse(color); return Array.isArray(ids) ? ids : []; } catch { return []; }
}

function getColorDisplay(color: string | null | undefined, map: Record<string, { name: string; hex: string }>): string {
  if (!color) return '';
  try {
    const ids = JSON.parse(color);
    if (Array.isArray(ids) && ids.length > 0) {
      return ids.map((id: string) => map[id]?.name || id).join(', ');
    }
  } catch {}
  return color;
}

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
  const [colorMap, setColorMap] = useState<Record<string, { name: string; hex: string }>>({});

  const [sortKey, setSortKey] = useState<SortKey>('orderDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recording, setRecording] = useState(false);
  const [orderPayments, setOrderPayments] = useState<Record<string, any[]>>({});

  const downloadInvoice = async (order: Order) => {
    try {
      const invoiceUrl = order.isPosOrder && order.posTransactionId
        ? `/api/pos/invoice?transactionId=${order.posTransactionId}`
        : `/api/orders/invoice?orderId=${order.id}`;
      const res = await fetch(invoiceUrl);
      if (!res.ok) { toast.error('Erreur generation facture'); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = order.isPosOrder && order.posInvoiceNumber
        ? `facture-${order.posInvoiceNumber}.pdf`
        : `facture-${order.id.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Erreur'); }
  };

  const openPaymentModal = async (order: Order) => {
    setPaymentOrderId(order.id);
    // Pré-remplit avec le reste à payer pour une commande à crédit
    setPaymentAmount((order.remainingBalance ?? 0) > 0 ? String(Math.round(order.remainingBalance ?? 0)) : '');
    setPaymentMethod('CASH');
    setPaymentRef('');
    setPaymentNotes('');
    setShowPaymentModal(true);
    try {
      const res = await axios.get(`/api/orders/${order.id}/payments`);
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setOrderPayments((prev) => ({ ...prev, [order.id]: list }));
    } catch {}
  };

  const recordPayment = async () => {
    if (!paymentOrderId || !paymentAmount) return;
    setRecording(true);
    try {
      const res = await axios.post(`/api/orders/${paymentOrderId}/payments`, {
        amount: Number(paymentAmount),
        paymentMethod,
        reference: paymentRef || null,
        notes: paymentNotes || null,
      });
      toast.success(res.data?.message || 'Paiement enregistré.');
      setShowPaymentModal(false);
      fetchAllOrders();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) toast.error(err.response.data.message);
      else toast.error('Erreur lors de l\'enregistrement du paiement.');
    } finally {
      setRecording(false);
    }
  };

  const isStaffRole = Boolean(
    session?.user?.role && ['ADMIN', 'ADMINSUPRA', 'SELLER'].includes(session.user.role)
  );

  const fetchAllOrders = useCallback(async () => {
    if (status !== 'authenticated' || !isStaffRole) {
      setLoading(false);
      setError("Accès refusé. Vous devez être connecté en tant qu'administrateur ou vendeur.");
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
  }, [isStaffRole, status]);

  useEffect(() => {
    if (status === 'authenticated' && isStaffRole) {
      fetchAllOrders();
      return;
    }
    if (status === 'unauthenticated') router.push('/login');
  }, [fetchAllOrders, isStaffRole, router, status]);

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
      const haystack = [
        order.id,
        order.userName,
        order.userEmail,
        order.shippingCity,
        order.shippingCountry,
        order.posInvoiceNumber,
        order.posSellerName,
      ]
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
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, 50, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(24, 24, 27);
    doc.text('Rapport des commandes', 20, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(113, 113, 122);
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
      doc.setFillColor(247, 247, 248);
      doc.roundedRect(x, statsY, statWidth, 22, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(box.color[0], box.color[1], box.color[2]);
      doc.text(box.value, x + 4, statsY + 9);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(113, 113, 122);
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
        textColor: [39, 39, 42],
        fillColor: [255, 255, 255],
        lineColor: [228, 228, 231],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [244, 244, 245],
        textColor: [24, 24, 27],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
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
        doc.setTextColor(113, 113, 122);
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
              autoComplete="off" placeholder="Rechercher par client, email, ville ou numéro"
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
                  <th className="w-10 px-2 py-3 text-center">
                    <button onClick={toggleSelectAll} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                      {allSelectedOnPage ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="cursor-pointer px-6 py-3 text-center font-500 text-[var(--text-secondary)] select-none hover:text-[var(--text-primary)]" onClick={() => toggleSort('id')}>
                    Commande <SortIcon column="id" />
                  </th>
                  <th className="cursor-pointer px-6 py-3 text-center font-500 text-[var(--text-secondary)] select-none hover:text-[var(--text-primary)]" onClick={() => toggleSort('userName')}>
                    Client <SortIcon column="userName" />
                  </th>
                  <th className="cursor-pointer px-6 py-3 text-center font-500 text-[var(--text-secondary)] select-none hover:text-[var(--text-primary)]" onClick={() => toggleSort('totalAmount')}>
                    Montant <SortIcon column="totalAmount" />
                  </th>
                  <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Paiement</th>
                  <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Livraison</th>
                  <th className="cursor-pointer px-6 py-3 text-center font-500 text-[var(--text-secondary)] select-none hover:text-[var(--text-primary)]" onClick={() => toggleSort('orderDate')}>
                    Date <SortIcon column="orderDate" />
                  </th>
                  <th className="cursor-pointer px-6 py-3 text-center font-500 text-[var(--text-secondary)] select-none hover:text-[var(--text-primary)]" onClick={() => toggleSort('status')}>
                    Statut <SortIcon column="status" />
                  </th>
                  <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-smooth">
                    <td className="px-2 py-4 text-center">
                      <button onClick={() => toggleSelect(order.id)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        {selectedIds.has(order.id) ? <CheckSquare className="h-4 w-4 text-emerald-400" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-500 text-[var(--text-primary)]">#{order.isPosOrder && order.posInvoiceNumber ? order.posInvoiceNumber : order.id.slice(0, 8)}</p>
                      {order.isPosOrder && (
                        <p className="mt-1 inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-600 text-emerald-400">
                          Vente physique
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{order.orderItems.length} article(s)</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-500 text-[var(--text-primary)]">{order.userName}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{order.userEmail}</p>
                      {order.isPosOrder && order.posSellerName && (
                        <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">Vendeur: {order.posSellerName}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-500 text-[var(--text-primary)]">
                      {formatPrice(order.totalAmount)}
                      {(order.remainingBalance ?? 0) > 0 && (order.paidAmount ?? 0) > 0 && (
                        <div className="mt-1 space-y-0.5 text-[10px] font-500 leading-tight">
                          <div className="text-emerald-400">Payé {formatPrice(order.paidAmount ?? 0)}</div>
                          <div className="text-amber-400">Reste {formatPrice(order.remainingBalance ?? 0)}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-500 ${getStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-xs text-[var(--text-secondary)]">{order.shippingCity}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{order.shippingCountry}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-[var(--text-tertiary)]">
                      {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-center">
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
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-2.5 py-1.5 text-xs font-500 text-indigo-400 transition-all duration-300 hover:from-indigo-500/30 hover:to-purple-500/30 hover:shadow-lg"
                          title="Détails"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => downloadInvoice(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-emerald-500/20 to-teal-600/20 px-2.5 py-1.5 text-xs font-500 text-emerald-400 transition-all duration-300 hover:from-emerald-500/30 hover:to-teal-600/30 hover:shadow-lg"
                          title="Facture"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openPaymentModal(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-amber-500/20 to-yellow-600/20 px-2.5 py-1.5 text-xs font-500 text-amber-400 transition-all duration-300 hover:from-amber-500/30 hover:to-yellow-600/30 hover:shadow-lg"
                          title="Paiement"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
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
              {(orderPayments[selectedOrder.id]?.length ?? 0) > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-500 text-[var(--text-tertiary)]">Paiements enregistrés</p>
                  {orderPayments[selectedOrder.id].map((pmt: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-[var(--bg-card)] px-3 py-2 text-xs">
                      <div>
                        <span className="text-[var(--text-primary)]">{pmt.paymentMethod}</span>
                        {pmt.reference && <span className="ml-2 text-[var(--text-tertiary)]">#{pmt.reference}</span>}
                      </div>
                      <span className="font-500 text-emerald-400">{formatPrice(pmt.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-600 uppercase text-[var(--text-tertiary)]">Montant</p>
              <p className="mt-3 text-2xl font-700 text-[var(--text-primary)]">{formatPrice(selectedOrder.totalAmount)}</p>
              {(selectedOrder.remainingBalance ?? 0) > 0 && (selectedOrder.paidAmount ?? 0) > 0 && (
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-emerald-400">Payé : {formatPrice(selectedOrder.paidAmount ?? 0)}</span>
                  <span className="text-amber-400">Reste : {formatPrice(selectedOrder.remainingBalance ?? 0)}</span>
                </div>
              )}
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
                      {(() => {
                        const ids = parseColorIds(item.product.color);
                        const resolved = ids.map((id) => colorMap[id]).filter(Boolean) as { name: string; hex: string }[];
                        if (resolved.length === 0) return null;
                        return (
                          <div className="mt-0.5 flex flex-wrap items-center gap-1">
                            {resolved.map((c, i) => (
                              <span key={c.hex + i} className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-1.5 py-0.5 text-xs text-[var(--text-tertiary)]">
                                <span className="h-2.5 w-2.5 rounded-full border border-[var(--border)]" style={{ backgroundColor: c.hex }} />
                                {c.name}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <p className="font-500 text-[var(--text-primary)]">{formatPrice(item.priceAtOrder)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SellerModal>

      {/* Payment Modal */}
      <SellerModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Enregistrer un paiement"
        description={paymentOrderId ? `Commande #${paymentOrderId.slice(0, 8)}` : ''}
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button onClick={() => setShowPaymentModal(false)}
              className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-500 text-[var(--text-secondary)] transition-smooth hover:bg-[var(--bg-hover)]">
              Annuler
            </button>
            <button disabled={recording || !paymentAmount} onClick={recordPayment}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-500 text-white transition-smooth hover:opacity-90 disabled:opacity-40">
              {recording ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {(() => {
            const payOrder = orders.find((o) => o.id === paymentOrderId);
            if (!payOrder || (payOrder.remainingBalance ?? 0) <= 0) return null;
            return (
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-[var(--bg-outer)] p-3 text-center">
                <div>
                  <p className="text-[10px] uppercase text-[var(--text-tertiary)]">Total</p>
                  <p className="text-sm font-700 text-[var(--text-primary)]">{formatPrice(payOrder.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[var(--text-tertiary)]">Payé</p>
                  <p className="text-sm font-700 text-emerald-400">{formatPrice(payOrder.paidAmount ?? 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[var(--text-tertiary)]">Reste</p>
                  <p className="text-sm font-700 text-amber-400">{formatPrice(payOrder.remainingBalance ?? 0)}</p>
                </div>
              </div>
            );
          })()}
          <div>
            <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Montant *</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Mode de paiement *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
            >
              <option value="CASH">Espèces</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CARD">Carte bancaire</option>
              <option value="BANK_TRANSFER">Virement bancaire</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Référence (optionnel)</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="Numéro de transaction"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Notes (optionnel)</label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Notes sur le paiement"
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-smooth focus:border-[var(--accent-blue)] resize-none"
            />
          </div>
        </div>
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
