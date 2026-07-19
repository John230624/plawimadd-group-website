'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Gift,
  Plus,
  Pencil,
  Percent,
  Search,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowUpWideNarrow,
  ArrowDownWideNarrow,
} from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface Promotion {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

interface FetchResponse {
  data: Promotion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const pageSize = 10;
const emptyForm = {
  code: '',
  discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
  discountValue: 0,
  minAmount: 0,
  maxUses: 100,
  startsAt: '',
  expiresAt: '',
  active: true,
};

type SortField = 'code' | 'discountType' | 'discountValue' | 'usedCount' | 'startsAt' | 'expiresAt' | 'active' | 'createdAt';
type SortDir = 'asc' | 'desc';

function isExpired(promo: Promotion): boolean {
  return !!promo.expiresAt && new Date(promo.expiresAt) < new Date();
}

function getRowClass(promo: Promotion): string {
  if (isExpired(promo)) return 'bg-red-50/30';
  if (!promo.active) return 'opacity-60';
  return '';
}

export default function PromotionsPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'createdAt', dir: 'desc' });

  const [form, setForm] = useState(emptyForm);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('q', searchTerm);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (page > 1) params.set('page', String(page));
      if (sort.field !== 'createdAt' || sort.dir !== 'desc') {
        params.set('sortBy', sort.field);
        params.set('sortOrder', sort.dir);
      }

      const res = await fetch(`/api/admin/promotions?${params.toString()}`);
      const json: FetchResponse = await res.json();
      setPromotions(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch {
      toast.error('Impossible de charger les promotions.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, dateFrom, dateTo, page, sort]);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, dateFrom, dateTo]);

  const expiredCount = useMemo(() => promotions.filter((p) => isExpired(p)).length, [promotions]);
  const activeCount = useMemo(() => promotions.filter((p) => p.active && !isExpired(p)).length, [promotions]);

  const allSelected = promotions.length > 0 && promotions.every((p) => selectedIds.has(p.id));

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

  const openCreate = () => {
    setEditingPromotion(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (promo: Promotion) => {
    setEditingPromotion(promo);
    setForm({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minAmount: promo.minAmount ?? 0,
      maxUses: promo.maxUses ?? 100,
      startsAt: promo.startsAt ? promo.startsAt.slice(0, 16) : '',
      expiresAt: promo.expiresAt ? promo.expiresAt.slice(0, 16) : '',
      active: promo.active,
    });
    setIsFormOpen(true);
  };

  const toggleActive = async (promo: Promotion) => {
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !promo.active }),
      });
      if (!res.ok) throw new Error('Erreur');
      toast.success(`Code ${promo.active ? 'désactivé' : 'activé'}.`);
      fetchPromotions();
    } catch {
      toast.error('Erreur lors du changement de statut.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        minAmount: form.minAmount || null,
        maxUses: form.maxUses || null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };
      const method = editingPromotion ? 'PUT' : 'POST';
      const url = editingPromotion ? `/api/admin/promotions/${editingPromotion.id}` : '/api/admin/promotions';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur');
      toast.success(editingPromotion ? 'Promotion mise à jour.' : 'Promotion créée.');
      setIsFormOpen(false);
      fetchPromotions();
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBatchAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      let count = 0;
      for (const id of ids) {
        if (action === 'delete') {
          const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
          if (res.ok) count++;
        } else {
          const res = await fetch(`/api/admin/promotions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: action === 'activate' }),
          });
          if (res.ok) count++;
        }
      }
      toast.success(`${count}/${ids.length} promotion(s) ${action === 'activate' ? 'activée(s)' : action === 'deactivate' ? 'désactivée(s)' : 'supprimée(s)'}.`);
      setSelectedIds(new Set());
      fetchPromotions();
    } catch {
      toast.error('Erreur lors de l\'opération groupée.');
    }
  };

  function exportCSV() {
    const header = 'Code;Type;Valeur;Min commande;Utilisations/Max;Debut;Expiration;Actif\n';
    const rows = promotions.map((p) =>
      [
        p.code,
        p.discountType === 'PERCENTAGE' ? 'Pourcentage' : 'Fixe',
        p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : formatPrice(p.discountValue),
        p.minAmount ? formatPrice(p.minAmount) : '',
        p.maxUses ? `${p.usedCount}/${p.maxUses}` : String(p.usedCount),
        p.startsAt ? new Date(p.startsAt).toLocaleDateString('fr-FR') : '',
        p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('fr-FR') : '',
        p.active ? 'Oui' : 'Non',
      ].join(';')
    ).join('\n');
    const csv = '\uFEFF' + header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promotions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, 50, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(24, 24, 27);
    doc.text('Codes promo', 20, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(113, 113, 122);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 32);
    doc.text(`${promotions.length} code(s) promo`, 20, 40);
    const statsY = 60;
    const statWidth = (pageW - 40) / 3;
    const boxes = [
      { label: 'Codes actifs', value: String(promotions.filter((p) => p.active).length), color: [16, 185, 129] },
      { label: 'Codes expirés', value: String(promotions.filter((p) => isExpired(p)).length), color: [239, 68, 68] },
      { label: 'Total codes', value: String(promotions.length), color: [59, 130, 246] },
    ];
    boxes.forEach((box, i) => {
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
    autoTable(doc, {
      head: [['Code', 'Type', 'Valeur', 'Min commande', 'Utilisations', 'Début', 'Expiration', 'Actif']],
      body: promotions.map((p) => [
        p.code,
        p.discountType === 'PERCENTAGE' ? '%' : 'Fixe',
        p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `${p.discountValue}`,
        p.minAmount ? `${p.minAmount}` : '—',
        p.maxUses ? `${p.usedCount}/${p.maxUses}` : String(p.usedCount),
        p.startsAt ? new Date(p.startsAt).toLocaleDateString('fr-FR') : '—',
        p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('fr-FR') : '—',
        p.active ? 'Oui' : 'Non',
      ]),
      startY: statsY + 32,
      styles: { fontSize: 7, textColor: [39, 39, 42], fillColor: [255, 255, 255], lineColor: [228, 228, 231], lineWidth: 0.3 },
      headStyles: { fillColor: [244, 244, 245], textColor: [24, 24, 27], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [24, 24, 24] },
      margin: { top: statsY + 32, bottom: 20 },
    });
    doc.save(`promotions_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

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
        title="Promotions & Codes promo"
        action={
          <div className="flex gap-2">
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportCSV}>CSV</SellerButton>
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportPDF}>PDF</SellerButton>
            <SellerButton icon={Plus} onClick={openCreate}>
              Ajouter un code
            </SellerButton>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Codes promo" value={String(total)} description="Total des codes" icon={Gift} accentColor="blue" />
        <StatCard title="Codes actifs" value={String(activeCount)} description="Actuellement actifs" icon={Percent} accentColor="green" />
        <StatCard title="Codes expirés" value={String(expiredCount)} description="Expirés" icon={Percent} accentColor="red" />
      </div>

      <SellerFilterBar>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              autoComplete="off"
              placeholder="Rechercher par code"
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            />
          </div>
          <SellerSelect
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: 'all', label: 'Tous' },
              { value: 'active', label: 'Actifs' },
              { value: 'inactive', label: 'Inactifs' },
              { value: 'expired', label: 'Expirés' },
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

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 rounded-[10px] bg-[var(--accent-blue)]/10 px-5 py-3">
          <span className="text-sm font-medium text-[var(--accent-blue)]">{selectedIds.size} sélectionné(s)</span>
          <SellerButton variant="primary" size="sm" icon={CheckCircle} onClick={() => handleBatchAction('activate')}>
            Activer
          </SellerButton>
          <SellerButton variant="outline" size="sm" icon={XCircle} onClick={() => handleBatchAction('deactivate')}>
            Désactiver
          </SellerButton>
          <SellerButton variant="outline" size="sm" icon={Trash2} onClick={() => handleBatchAction('delete')}>
            Supprimer
          </SellerButton>
          <SellerButton variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            Annuler
          </SellerButton>
        </div>
      )}

      {promotions.length === 0 ? (
        <SellerEmptyState
          title="Aucun code promo trouvé"
          description="Ajoutez un nouveau code promo ou modifiez votre recherche."
          icon={Gift}
          action={
            <SellerButton icon={Plus} onClick={openCreate}>
              Ajouter un code
            </SellerButton>
          }
        />
      ) : (
        <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => {
                    if (allSelected) setSelectedIds(new Set());
                    else setSelectedIds(new Set(promotions.map((p) => p.id)));
                  }}
                  className="h-4 w-4 accent-[var(--accent-green)]"
                />
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('code')}>
                <span className="flex items-center justify-center">Code <SortIcon field="code" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('discountType')}>
                <span className="flex items-center justify-center">Type <SortIcon field="discountType" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('discountValue')}>
                <span className="flex items-center justify-center">Valeur <SortIcon field="discountValue" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center">Min commande</SellerTableCell>
              <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('usedCount')}>
                <span className="flex items-center justify-center">Utilisations <SortIcon field="usedCount" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('startsAt')}>
                <span className="flex items-center justify-center">Début <SortIcon field="startsAt" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('expiresAt')}>
                <span className="flex items-center justify-center">Expiration <SortIcon field="expiresAt" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('active')}>
                <span className="flex items-center justify-center">Statut <SortIcon field="active" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {promotions.map((promo) => (
              <SellerTableRow key={promo.id} className={getRowClass(promo)}>
                <SellerTableCell className="text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(promo.id)}
                    onChange={() => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        next.has(promo.id) ? next.delete(promo.id) : next.add(promo.id);
                        return next;
                      });
                    }}
                    className="h-4 w-4 accent-[var(--accent-green)]"
                  />
                </SellerTableCell>
                <SellerTableCell className="text-center">
                  <span className="font-semibold text-[var(--text-primary)]">{promo.code}</span>
                </SellerTableCell>
                <SellerTableCell className="text-center">
                  <SellerBadge color={promo.discountType === 'PERCENTAGE' ? 'primary' : 'warning'}>
                    {promo.discountType === 'PERCENTAGE' ? '%' : 'Fixe'}
                  </SellerBadge>
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-primary)] text-center">
                  {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : formatPrice(promo.discountValue)}
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)] text-center">
                  {promo.minAmount ? formatPrice(promo.minAmount) : '—'}
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)] text-center">
                  {promo.usedCount}{promo.maxUses ? ` / ${promo.maxUses}` : ''}
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)] text-center">
                  {promo.startsAt
                    ? new Date(promo.startsAt).toLocaleDateString('fr-FR')
                    : '—'}
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)] text-center">
                  {promo.expiresAt
                    ? new Date(promo.expiresAt).toLocaleDateString('fr-FR')
                    : '—'}
                </SellerTableCell>
                <SellerTableCell className="text-center">
                  <SellerBadge color={isExpired(promo) ? 'error' : promo.active ? 'success' : 'slate'}>
                    {isExpired(promo) ? 'Expiré' : promo.active ? 'Actif' : 'Inactif'}
                  </SellerBadge>
                </SellerTableCell>
                <SellerTableCell className="text-center">
                  <div className="flex gap-2">
                    <SellerButton variant="outline" size="sm" icon={Pencil} onClick={() => openEdit(promo)}>
                      Modifier
                    </SellerButton>
                    <SellerButton
                      variant="outline"
                      size="sm"
                      icon={promo.active ? ToggleRight : ToggleLeft}
                      onClick={() => toggleActive(promo)}
                    >
                      {promo.active ? 'Désactiver' : 'Activer'}
                    </SellerButton>
                  </div>
                </SellerTableCell>
              </SellerTableRow>
            ))}
          </SellerTableBody>
          <tfoot>
            <tr>
              <td colSpan={10}>
                <SellerPagination page={page} pageSize={pageSize} totalItems={total} onPageChange={setPage} />
              </td>
            </tr>
          </tfoot>
        </SellerTable>
      )}

      <SellerModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingPromotion ? 'Modifier le code promo' : 'Ajouter un code promo'}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <SellerButton variant="outline" onClick={() => setIsFormOpen(false)}>
              Annuler
            </SellerButton>
            <SellerButton type="submit" form="promo-form" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </SellerButton>
          </div>
        }
      >
        <form id="promo-form" onSubmit={handleSubmit} className="space-y-4">
          <SellerInput
            label="Code *"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Ex: PROMO20"
          />
          <div>
            <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Type de réduction</span>
            <SellerSelect
              value={form.discountType}
              onChange={(v) => setForm({ ...form, discountType: v as 'PERCENTAGE' | 'FIXED' })}
              options={[
                { value: 'PERCENTAGE', label: 'Pourcentage (%)' },
                { value: 'FIXED', label: 'Montant fixe' },
              ]}
            />
          </div>
          <SellerInput
            label="Valeur de la réduction *"
            type="number"
            value={String(form.discountValue)}
            onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
          />
          <SellerInput
            label="Montant minimum de commande"
            type="number"
            value={String(form.minAmount)}
            onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })}
          />
          <SellerInput
            label="Utilisations maximum"
            type="number"
            value={String(form.maxUses)}
            onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <SellerInput
              label="Date de début"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              icon={Calendar}
            />
            <SellerInput
              label="Date d'expiration"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              icon={Calendar}
            />
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 accent-[var(--accent-green)]"
            />
            <span className="text-sm text-[var(--text-primary)]">Actif</span>
          </label>
        </form>
      </SellerModal>
    </div>
  );
}
