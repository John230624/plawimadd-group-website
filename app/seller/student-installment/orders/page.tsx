'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Download, Edit, Mail, Search, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Loading from '@/components/Loading';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerModal from '@/components/seller/SellerModal';
import SellerPanel from '@/components/seller/SellerPanel';
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

interface InstallmentWithPaidBy {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: string;
  paidAt: string | null;
  paymentReference: string | null;
  paymentMethod: string | null;
  paidById: string | null;
  lateFee: number | null;
  notes: string | null;
  remindedAt: string | null;
  paidBy: { firstName: string | null; lastName: string | null } | null;
}

interface OrderWithInstallments {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  userEmail: string;
  shippingAddressLine1: string;
  user: { firstName: string | null; lastName: string | null; email: string | null };
  studentInstallments: InstallmentWithPaidBy[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StatsData {
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  paidAmount: number;
  pendingAmount: number;
  lateFeesTotal: number;
  totalOrderAmount: number;
  recoveryRate: number;
  monthlyTrend: { month: string; paid: number; total: number }[];
}

function getStatusBadge(status: string): string {
  const map: Record<string, string> = {
    PAID: 'bg-emerald-100 text-emerald-700',
    PENDING: 'bg-amber-100 text-amber-700',
    OVERDUE: 'bg-rose-100 text-rose-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
  };
  return map[status] || 'bg-slate-100 text-slate-500';
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PAID: 'Payee',
    PENDING: 'En attente',
    OVERDUE: 'En retard',
    CANCELLED: 'Annulee',
  };
  return map[status] || status;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Especes' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CARD', label: 'Carte bancaire' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'INSTALLMENT_STUDENT', label: 'Echeance etudiante' },
];

export default function StudentInstallmentOrdersPage(): React.ReactElement {
  const [orders, setOrders] = useState<OrderWithInstallments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [tab, setTab] = useState<'liste' | 'calendrier' | 'stats'>('liste');

  const [payModal, setPayModal] = useState<{ open: boolean; installmentIds: string[] }>({ open: false, installmentIds: [] });
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const [editModal, setEditModal] = useState<{ open: boolean; inst: InstallmentWithPaidBy | null }>({ open: false, inst: null });
  const [editDueDate, setEditDueDate] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editLateFee, setEditLateFee] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<StatsData | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/student-installments?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Erreur chargement echeances');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, dateFrom, dateTo]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/student-installments/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { if (tab === 'stats') fetchStats(); }, [tab, fetchStats]);

  const allInstallments = useMemo(
    () => orders.flatMap((o) => o.studentInstallments.map((inst) => ({ ...inst, order: o }))),
    [orders]
  );

  const paidCount = allInstallments.filter((i) => i.status === 'PAID').length;
  const pendingCount = allInstallments.filter((i) => i.status === 'PENDING').length;
  const overdueCount = allInstallments.filter((i) => i.status === 'OVERDUE').length;

  const filteredOrders = useMemo(
    () => orders.filter((o) =>
      o.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [orders, searchTerm]
  );

  const handleMarkPaid = async () => {
    if (payModal.installmentIds.length === 0) return;
    setProcessing(true);
    try {
      const body: Record<string, unknown> = {
        installmentId: payModal.installmentIds[0],
        paymentMethod: payMethod,
        paymentReference: payRef || null,
        notes: payNotes || null,
      };
      if (payModal.installmentIds.length > 1) {
        const res = await fetch('/api/admin/student-installments/batch-pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ installmentIds: payModal.installmentIds, paymentMethod: payMethod, paymentReference: payRef || null }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        toast.success(`${data.count} echeance(s) payee(s)`);
      } else {
        const res = await fetch('/api/admin/student-installments/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        toast.success('Echeance marquee payee');
      }
      setPayModal({ open: false, installmentIds: [] });
      setPayRef('');
      setPayNotes('');
      setPayMethod('CASH');
      setSelectedIds(new Set());
      await fetchOrders();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemind = async (installmentId?: string, orderId?: string) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/student-installments/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installmentId, orderId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.sent} rappel(s) envoye(s) sur ${data.total}`);
        await fetchOrders();
      } else {
        toast.error(data.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur envoi rappel');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (!editModal.inst) return;
    setProcessing(true);
    try {
      const body: Record<string, unknown> = {};
      if (editDueDate) body.dueDate = editDueDate;
      if (editAmount) body.amount = parseFloat(editAmount);
      if (editLateFee !== '') body.lateFee = parseFloat(editLateFee) || null;
      if (editNotes !== undefined) body.notes = editNotes || null;

      const res = await fetch(`/api/admin/student-installments/${editModal.inst.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Echeance modifiee');
        setEditModal({ open: false, inst: null });
        await fetchOrders();
      } else {
        toast.error(data.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur modification');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/admin/student-installments/export', '_blank');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageW, 50, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(241, 245, 249);
    doc.text('Echeanciers etudiants', 20, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 32);
    doc.text(`${allInstallments.length} echeance(s)`, 20, 40);
    const statsY = 60;
    const statWidth = (pageW - 40) / 3;
    const boxes = [
      { label: 'Payees', value: String(paidCount), color: [16, 185, 129] },
      { label: 'En attente', value: String(pendingCount), color: [245, 158, 11] },
      { label: 'En retard', value: String(overdueCount), color: [239, 68, 68] },
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
    const rows = allInstallments.map((inst) => {
      const o = (inst as any).order;
      return [
        o?.id?.slice(0, 8) || 'N/A',
        `Echeance #${inst.installmentNumber}`,
        new Date(inst.dueDate).toLocaleDateString('fr-FR'),
        `${inst.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA`,
        inst.status === 'PAID' ? 'Payee' : inst.status === 'OVERDUE' ? 'En retard' : 'En attente',
        inst.paidAt ? new Date(inst.paidAt).toLocaleDateString('fr-FR') : '—',
      ];
    });
    autoTable(doc, {
      head: [['Commande', 'Echeance', 'Echeance le', 'Montant', 'Statut', 'Payee le']],
      body: rows,
      startY: statsY + 32,
      styles: { fontSize: 7, textColor: [241, 245, 249], fillColor: [18, 18, 18], lineColor: [30, 41, 59], lineWidth: 0.3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [24, 24, 24] },
      margin: { top: statsY + 32, bottom: 20 },
    });
    doc.save(`echeanciers_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  type InstWithOrder = InstallmentWithPaidBy & { order: OrderWithInstallments };

  const calendarData = useMemo(() => {
    const groups: Record<string, InstWithOrder[]> = {};
    (allInstallments as InstWithOrder[]).forEach((inst) => {
      const d = new Date(inst.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(inst);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [allInstallments]);

  if (loading && orders.length === 0 && tab !== 'stats') {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loading /></div>;
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <div className="flex items-center justify-between">
        <SellerSectionHeader title="Financement" />
        <div className="flex gap-2">
          <SellerButton variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>CSV</SellerButton>
          <SellerButton variant="outline" size="sm" icon={Download} onClick={handleExportPDF}>PDF</SellerButton>
          {selectedIds.size > 0 && (
            <SellerButton variant="success" size="sm" icon={CheckCircle2} onClick={() => setPayModal({ open: true, installmentIds: [...selectedIds] })}>
              Payer {selectedIds.size} echeance(s)
            </SellerButton>
          )}
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard title="Payees" value={String(paidCount)} description="Echeances reglees" icon={CheckCircle2} accentColor="green" />
        <StatCard title="En attente" value={String(pendingCount)} description="Echeances impayees" icon={Clock} accentColor="amber" />
        <StatCard title="En retard" value={String(overdueCount)} description="Echeances depassees" icon={XCircle} accentColor="red" />
      </section>

      <SellerFilterBar>
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par email ou commande..."
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            />
          </div>
          <SellerSelect
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: 'ALL', label: 'Tous les statuts' },
              { value: 'PAID', label: 'Payees' },
              { value: 'PENDING', label: 'Attente' },
              { value: 'OVERDUE', label: 'Retard' },
            ]}
            className="[&_button]:!h-9 [&_button]:!py-1.5 [&_button]:!px-3 w-[170px] shrink-0"
          />
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 w-[135px] shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2.5 text-xs text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)] [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100" title="Date debut" />
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 w-[135px] shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2.5 text-xs text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)] [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100" title="Date fin" />
          <div className="flex shrink-0 gap-1 rounded-lg border border-[var(--border)] p-0.5">
            {(['liste', 'calendrier', 'stats'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  tab === t ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'
                }`}
              >
                {t === 'liste' ? 'Liste' : t === 'calendrier' ? 'Calendrier' : 'Stats'}
              </button>
            ))}
          </div>
        </div>
      </SellerFilterBar>

      {tab === 'liste' && (
        <>
          {filteredOrders.length === 0 ? (
            <SellerPanel className="p-6">
              <SellerEmptyState title="Aucune commande" description="Aucune commande avec echeancier trouvee." icon={Calendar} />
            </SellerPanel>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const totalPaid = order.studentInstallments.filter((i) => i.status === 'PAID').reduce((s, i) => s + Number(i.amount), 0);
                const isComplete = order.studentInstallments.every((i) => i.status === 'PAID');

                return (
                  <SellerPanel key={order.id}>
                    <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Commande #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{order.user.firstName} {order.user.lastName} ({order.user.email})</p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          Total: {Number(order.totalAmount).toLocaleString('fr-FR')} FCFA | Paye: {totalPaid.toLocaleString('fr-FR')} FCFA | Restant: {(Number(order.totalAmount) - totalPaid).toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Definitive</span>
                        ) : totalPaid > 0 ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Partielle</span>
                        ) : null}
                        <SellerButton variant="outline" size="sm" icon={Download} onClick={() => window.open(`/api/orders/invoice?orderId=${order.id}`, '_blank')}>Facture</SellerButton>
                        <SellerButton variant="ghost" size="sm" icon={Download} onClick={() => window.open(`/api/student/installment-pdf?orderId=${order.id}`, '_blank')}>Plan</SellerButton>
                        {order.studentInstallments.some((i) => i.status === 'OVERDUE') && (
                          <SellerButton variant="ghost" size="sm" icon={Mail} disabled={processing} onClick={() => handleRemind(undefined, order.id)}>
                            Rappel
                          </SellerButton>
                        )}
                      </div>
                    </div>
                    <SellerTable>
                      <SellerTableHeader>
                        <SellerTableRow>
                          <SellerTableCell isHeader className="text-center w-10">
                            <input type="checkbox" onChange={() => {
                              const ids = order.studentInstallments.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE').map((i) => i.id);
                              const allSelected = ids.every((id) => selectedIds.has(id));
                              ids.forEach((id) => allSelected ? selectedIds.delete(id) : selectedIds.add(id));
                              setSelectedIds(new Set(selectedIds));
                            }}
                              checked={order.studentInstallments.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE').every((i) => selectedIds.has(i.id))}
                              className="accent-[var(--accent-blue)]" />
                          </SellerTableCell>
                          <SellerTableCell isHeader className="text-center">#</SellerTableCell>
                          <SellerTableCell isHeader className="text-center">Montant</SellerTableCell>
                          <SellerTableCell isHeader className="text-center">Echeance</SellerTableCell>
                          <SellerTableCell isHeader className="text-center">Statut</SellerTableCell>
                          <SellerTableCell isHeader className="text-center">Paiement</SellerTableCell>
                          <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
                        </SellerTableRow>
                      </SellerTableHeader>
                      <SellerTableBody>
                        {order.studentInstallments.map((inst) => (
                          <SellerTableRow key={inst.id} className={inst.status === 'OVERDUE' ? 'bg-rose-50/50' : ''}>
                            <SellerTableCell className="text-center">
                              {(inst.status === 'PENDING' || inst.status === 'OVERDUE') && (
                                <input type="checkbox" checked={selectedIds.has(inst.id)} onChange={() => toggleSelect(inst.id)} className="accent-[var(--accent-blue)]" />
                              )}
                            </SellerTableCell>
                            <SellerTableCell className="text-center font-semibold text-[var(--text-primary)]">Tranche {inst.installmentNumber}</SellerTableCell>
                            <SellerTableCell className="text-center text-[var(--text-primary)]">
                              {Number(inst.amount).toLocaleString('fr-FR')} FCFA
                              {inst.lateFee ? <span className="ml-1 text-xs text-[var(--accent-red)]">(+{Number(inst.lateFee).toLocaleString('fr-FR')} penalite)</span> : null}
                            </SellerTableCell>
                            <SellerTableCell className={`text-center text-[var(--text-secondary)] ${inst.status === 'OVERDUE' ? 'text-[var(--accent-red)] font-medium' : ''}`}>
                              {new Date(inst.dueDate).toLocaleDateString('fr-FR')}
                            </SellerTableCell>
                            <SellerTableCell className="text-center">
                              <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${getStatusBadge(inst.status)}`}>{getStatusLabel(inst.status)}</span>
                            </SellerTableCell>
                            <SellerTableCell className="text-center text-xs text-[var(--text-tertiary)]">
                              {inst.status === 'PAID' ? (
                                <>
                                  <p>{inst.paymentMethod ? PAYMENT_METHODS.find((m) => m.value === inst.paymentMethod)?.label || inst.paymentMethod : '-'}</p>
                                  {inst.paidBy && <p>par {inst.paidBy.firstName} {inst.paidBy.lastName}</p>}
                                  {inst.paymentReference && <p className="text-[10px]">Ref: {inst.paymentReference}</p>}
                                </>
                              ) : null}
                            </SellerTableCell>
                            <SellerTableCell className="text-center">
                              <div className="inline-flex gap-1">
                                {inst.status === 'PENDING' ? (
                                  <SellerButton variant="outline" size="sm" icon={CheckCircle2}
                                    disabled={processing}
                                    onClick={() => setPayModal({ open: true, installmentIds: [inst.id] })}>
                                    Payer
                                  </SellerButton>
                                ) : inst.status === 'OVERDUE' ? (
                                  <div className="inline-flex gap-1">
                                    <SellerButton variant="outline" size="sm" icon={CheckCircle2}
                                      disabled={processing}
                                      onClick={() => setPayModal({ open: true, installmentIds: [inst.id] })}>
                                      Payer
                                    </SellerButton>
                                    <button
                                      disabled={processing}
                                      onClick={() => handleRemind(inst.id)}
                                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                                      title="Envoyer un rappel"
                                    >
                                      <Mail className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : null}
                                {inst.status !== 'PAID' && (
                                  <button
                                    onClick={() => {
                                      setEditModal({ open: true, inst });
                                      setEditDueDate(new Date(inst.dueDate).toISOString().split('T')[0]);
                                      setEditAmount(String(Number(inst.amount)));
                                      setEditLateFee(inst.lateFee ? String(Number(inst.lateFee)) : '');
                                      setEditNotes(inst.notes || '');
                                    }}
                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Modifier l'echeance"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </SellerTableCell>
                          </SellerTableRow>
                        ))}
                      </SellerTableBody>
                    </SellerTable>
                  </SellerPanel>
                );
              })}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-6 py-4">
              <p className="text-xs text-[var(--text-tertiary)]">{pagination.total} echeance(s) - Page {pagination.page}/{pagination.totalPages}</p>
              <div className="flex gap-2">
                <SellerButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Precedent</SellerButton>
                <SellerButton variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Suivant</SellerButton>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'calendrier' && (
        <div className="space-y-6">
          {calendarData.length === 0 ? (
            <SellerPanel className="p-6"><SellerEmptyState title="Aucune echeance" description="Aucun echeancier pour le moment." icon={Calendar} /></SellerPanel>
          ) : calendarData.map(([month, insts]) => {
            const monthPaid = insts.filter((i) => i.status === 'PAID').length;
            const monthTotal = insts.length;
            const monthDate = new Date(month + '-01');
            return (
              <SellerPanel key={month} className="overflow-hidden p-0">
                <div className="border-b border-[var(--border)] bg-[var(--bg-dark)]/30 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent-green)]" />{monthPaid} payee(s)</span>
                      <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent-red)]" />{insts.filter((i) => i.status === 'OVERDUE').length} retard(s)</span>
                      <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--text-tertiary)] opacity-40" />{monthTotal - monthPaid} restant(s)</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)]">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                      <div key={d} className="bg-[var(--bg-dark)]/20 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{d}</div>
                    ))}
                    {(() => {
                      const d = new Date(month + '-01');
                      const firstDay = (d.getDay() + 6) % 7;
                      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                      const cells: React.ReactNode[] = [];
                      for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="bg-[var(--bg-outer)]" />);
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${month}-${String(day).padStart(2, '0')}`;
                        const dayInsts = insts.filter((i) => i.dueDate.startsWith(dateStr));
                        const hasOverdue = dayInsts.some((i) => i.status === 'OVERDUE');
                        const hasPending = dayInsts.some((i) => i.status === 'PENDING');
                        const allPaid = dayInsts.length > 0 && dayInsts.every((i) => i.status === 'PAID');
                        const today = new Date();
                        const isToday = today.getFullYear() === d.getFullYear() && today.getMonth() === d.getMonth() && today.getDate() === day;
                        cells.push(
                          <div key={day}
                            className={`relative bg-[var(--bg-outer)] px-3 py-2.5 text-xs transition hover:bg-[var(--bg-input)] ${
                              isToday ? 'ring-2 ring-inset ring-[var(--accent-blue)]' : ''
                            }`}
                          >
                            <span className={`font-medium ${
                              hasOverdue ? 'text-[var(--accent-red)]' :
                              hasPending ? 'text-[var(--accent-blue)]' :
                              allPaid ? 'text-[var(--accent-green)]' :
                              'text-[var(--text-secondary)]'
                            }`}>{day}</span>
                            {dayInsts.length > 0 && (
                              <div className="mt-1 flex gap-0.5">
                                {hasOverdue && <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-red)]" />}
                                {hasPending && <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-blue)]" />}
                                {allPaid && <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]" />}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                </div>

                <div className="border-t border-[var(--border)] bg-[var(--bg-dark)]/20 px-6 py-3">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Echeances du mois</p>
                  <div className="space-y-1.5">
                    {insts.map((inst) => (
                      <div key={inst.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-4 py-2.5 text-xs transition hover:border-[var(--accent-blue)]/30 hover:shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-dark)]/30 text-[10px] font-bold text-[var(--text-secondary)]">{inst.installmentNumber}</span>
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">Commande #{inst.order?.id?.slice(0, 8) || 'N/A'}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)]">Echeance: {new Date(inst.dueDate).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-[var(--text-primary)]">{Number(inst.amount).toLocaleString('fr-FR')} FCFA</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getStatusBadge(inst.status)}`}>
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                              inst.status === 'PAID' ? 'bg-emerald-500' :
                              inst.status === 'OVERDUE' ? 'bg-rose-500' :
                              inst.status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-400'
                            }`} />
                            {getStatusLabel(inst.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SellerPanel>
            );
          })}
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-6">
          {!stats ? <Loading /> : (
            <>
              <section className="grid gap-5 md:grid-cols-4">
                <StatCard title="Taux recouvrement" value={`${stats.recoveryRate}%`} description={`${stats.paidCount}/${stats.totalCount} echeances`} icon={CheckCircle2} accentColor="green" />
                <StatCard title="Montant percu" value={stats.paidAmount.toLocaleString('fr-FR') + ' FCFA'} description="Total encaisse" icon={CheckCircle2} accentColor="blue" />
                <StatCard title="Impayes" value={stats.pendingAmount.toLocaleString('fr-FR') + ' FCFA'} description="En attente + retard" icon={XCircle} accentColor="red" />
                <StatCard title="Penalites" value={stats.lateFeesTotal.toLocaleString('fr-FR') + ' FCFA'} description="Frais de retard cumules" icon={Clock} accentColor="amber" />
              </section>

              <SellerPanel>
                <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Tendance mensuelle</h3>
                <div className="flex items-end gap-3 overflow-x-auto pb-2">
                  {stats.monthlyTrend.map((m) => {
                    const max = Math.max(...stats.monthlyTrend.map((x) => x.total), 1);
                    const totalH = (m.total / max) * 160;
                    const paidH = (m.paid / max) * 160;
                    return (
                      <div key={m.month} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-[var(--text-tertiary)]">{Number(m.paid).toLocaleString('fr-FR')}</span>
                        <div className="relative w-8 rounded-md bg-[var(--bg-input)]" style={{ height: `${Math.max(totalH, 4)}px` }}>
                          <div className="absolute bottom-0 w-full rounded-md bg-[var(--accent-green)] transition-all" style={{ height: `${Math.max(paidH, 2)}px` }} />
                        </div>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{m.month.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </SellerPanel>
            </>
          )}
        </div>
      )}

      <SellerModal
        isOpen={payModal.open}
        onClose={() => { setPayModal({ open: false, installmentIds: [] }); setPayRef(''); setPayNotes(''); setPayMethod('CASH'); }}
        title={`Paiement - ${payModal.installmentIds.length} echeance(s)`}
        footer={
          <SellerButton variant="success" disabled={processing} onClick={handleMarkPaid}>
            {processing ? 'Traitement...' : 'Confirmer le paiement'}
          </SellerButton>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Mode de paiement</p>
            <SellerSelect
              value={payMethod}
              onChange={(v) => setPayMethod(v)}
              options={PAYMENT_METHODS}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Reference de paiement</p>
            <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)}
              placeholder="Optionnel" className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]" />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Notes</p>
            <textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
              placeholder="Notes internes..." rows={2} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]" />
          </div>
        </div>
      </SellerModal>

      <SellerModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, inst: null })}
        title="Modifier l'echeance"
        footer={
          <SellerButton variant="primary" disabled={processing} onClick={handleEdit}>
            {processing ? 'Traitement...' : 'Enregistrer'}
          </SellerButton>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Date echeance</p>
              <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)] [color-scheme:dark]" />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Montant (FCFA)</p>
              <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]" />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Frais de retard (FCFA)</p>
            <input type="number" value={editLateFee} onChange={(e) => setEditLateFee(e.target.value)}
              placeholder="0" className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]" />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Notes</p>
            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
              rows={2} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]" />
          </div>
        </div>
      </SellerModal>

    </div>
  );
}
