'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Download,
  Eye,
  MessageSquareText,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useAppContext } from '@/context/AppContext';
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
import SellerTextarea from '@/components/seller/SellerTextarea';
import StatCard from '@/components/seller/StatCard';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';

interface ReviewUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string | null;
}

interface ReviewProduct {
  id: string;
  name: string;
  imgUrl: string[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  product: ReviewProduct;
  user: ReviewUser | null;
}

interface ReviewsResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const pageSize = 20;
type SortField = 'product' | 'rating' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

function Stars({ rating }: { rating: number }): React.ReactElement {
  return (
    <span className="text-amber-400">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function getStatusRowClass(status: string): string {
  if (status === 'PENDING') return 'bg-amber-50/50';
  if (status === 'REJECTED') return 'bg-red-50/30';
  return '';
}

export default function ReviewsPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'createdAt', dir: 'desc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const fetchReviews = useCallback(async () => {
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

      const res = await fetch(`/api/admin/reviews?${params}`);
      const json: ReviewsResponse = await res.json();
      setReviews(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch {
      toast.error('Impossible de charger les avis.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, dateFrom, dateTo, page, sort]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    total,
    pending: reviews.filter((r) => r.status === 'PENDING').length,
    approved: reviews.filter((r) => r.status === 'APPROVED').length,
    rejected: reviews.filter((r) => r.status === 'REJECTED').length,
  }), [reviews, total]);

  const ratingDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
    });
    const maxCount = Math.max(...counts, 1);
    return counts.map((count, i) => ({
      stars: i + 1,
      count,
      pct: Math.round((count / (reviews.length || 1)) * 100),
      width: Math.round((count / maxCount) * 100),
    })).reverse();
  }, [reviews]);

  const allSelected = reviews.length > 0 && reviews.every((r) => selectedIds.has(r.id));

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

  const updateStatus = async (review: Review, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Erreur');
      toast.success(`Avis ${status === 'APPROVED' ? 'approuvé' : 'rejeté'}.`);
      fetchReviews();
      if (selectedReview?.id === review.id) setSelectedReview(null);
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const handleReply = async () => {
    if (!selectedReview || !replyText.trim()) return;
    setIsReplying(true);
    try {
      const res = await fetch(`/api/admin/reviews/${selectedReview.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      if (!res.ok) throw new Error('Erreur');
      toast.success('Réponse envoyée.');
      setReplyText('');
      fetchReviews();
    } catch {
      toast.error("Erreur lors de l'envoi de la réponse.");
    } finally {
      setIsReplying(false);
    }
  };

  const batchApprove = async () => {
    for (const id of selectedIds) {
      try {
        await fetch(`/api/admin/reviews/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' }),
        });
      } catch { /* ignore */ }
    }
    toast.success(`${selectedIds.size} avis approuvés.`);
    setSelectedIds(new Set());
    fetchReviews();
  };

  const batchReject = async () => {
    for (const id of selectedIds) {
      try {
        await fetch(`/api/admin/reviews/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED' }),
        });
      } catch { /* ignore */ }
    }
    toast.success(`${selectedIds.size} avis rejetés.`);
    setSelectedIds(new Set());
    fetchReviews();
  };

  const batchDelete = async () => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: 'delete' }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Erreur');
      toast.success(`${json.message}`);
      setSelectedIds(new Set());
      fetchReviews();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  function exportCSV() {
    const header = 'Produit;Client;Note;Commentaire;Statut;Date\n';
    const rows = reviews.map((r) =>
      [
        r.product.name,
        r.user?.name || r.user?.email || 'Anonyme',
        String(r.rating),
        (r.comment || '').replace(/"/g, '""'),
        r.status === 'PENDING' ? 'En attente' : r.status === 'APPROVED' ? 'Approuvé' : 'Rejeté',
        new Date(r.createdAt).toLocaleDateString('fr-FR'),
      ].join(';')
    ).join('\n');
    const csv = '\uFEFF' + header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avis_${new Date().toISOString().slice(0, 10)}.csv`;
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
    doc.text('Avis clients', 20, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 32);
    doc.text(`${total} avis`, 20, 40);

    const statsY = 60;
    const statWidth = (pageW - 40) / 4;
    const boxes = [
      { label: 'Total', value: String(total), color: [59, 130, 246] },
      { label: 'En attente', value: String(stats.pending), color: [245, 158, 11] },
      { label: 'Approuvés', value: String(stats.approved), color: [16, 185, 129] },
      { label: 'Rejetés', value: String(stats.rejected), color: [239, 68, 68] },
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
      head: [['Produit', 'Client', 'Note', 'Commentaire', 'Statut', 'Date']],
      body: reviews.map((r) => [
        r.product.name,
        r.user?.name || r.user?.email || 'Anonyme',
        String(r.rating),
        r.comment || '',
        r.status === 'PENDING' ? 'En attente' : r.status === 'APPROVED' ? 'Approuvé' : 'Rejeté',
        new Date(r.createdAt).toLocaleDateString('fr-FR'),
      ]),
      startY: statsY + 32,
      styles: { fontSize: 7, textColor: [241, 245, 249], fillColor: [18, 18, 18], lineColor: [30, 41, 59], lineWidth: 0.3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [24, 24, 24] },
      margin: { top: statsY + 32, bottom: 20 },
    });
    doc.save(`avis_${new Date().toISOString().slice(0, 10)}.pdf`);
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
        title="Avis clients"
        action={
          <div className="flex gap-2">
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportCSV}>CSV</SellerButton>
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportPDF}>PDF</SellerButton>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total" value={String(stats.total)} description="Tous les avis" icon={MessageSquareText} accentColor="blue" />
        <StatCard title="En attente" value={String(stats.pending)} description="À modérer" icon={Eye} accentColor="amber" />
        <StatCard title="Approuvés" value={String(stats.approved)} description="Visibles" icon={ThumbsUp} accentColor="green" />
        <StatCard title="Rejetés" value={String(stats.rejected)} description="Masqués" icon={ThumbsDown} accentColor="red" />
      </div>

      <SellerFilterBar>
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); }}
              placeholder="Rechercher par produit ou client"
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            />
          </div>
          <SellerSelect
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); }}
            options={[
              { value: 'ALL', label: 'Tous les statuts' },
              { value: 'PENDING', label: 'En attente' },
              { value: 'APPROVED', label: 'Approuvés' },
              { value: 'REJECTED', label: 'Rejetés' },
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
          <SellerButton variant="success" size="sm" icon={ThumbsUp} onClick={batchApprove}>
            Approuver
          </SellerButton>
          <SellerButton variant="danger" size="sm" icon={ThumbsDown} onClick={batchReject}>
            Rejeter
          </SellerButton>
          <SellerButton variant="danger" size="sm" icon={Trash2} onClick={batchDelete}>
            Supprimer
          </SellerButton>
          <SellerButton variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            Annuler
          </SellerButton>
        </div>
      )}

      {reviews.length === 0 ? (
        <SellerEmptyState
          title="Aucun avis trouvé"
          description="Les avis des clients apparaîtront ici."
          icon={MessageSquareText}
        />
      ) : (
        <>
          <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
            <SellerTableHeader>
              <SellerTableRow>
                <SellerTableCell isHeader className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) setSelectedIds(new Set());
                      else setSelectedIds(new Set(reviews.map((r) => r.id)));
                    }}
                    className="h-4 w-4 accent-[var(--accent-green)]"
                  />
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('product')}>
                  <span className="flex items-center">Produit <SortIcon field="product" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center">Client</SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('rating')}>
                  <span className="flex items-center">Note <SortIcon field="rating" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center">Commentaire</SellerTableCell>
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
              {reviews.map((review) => (
                <SellerTableRow key={review.id} className={getStatusRowClass(review.status)}>
                  <SellerTableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(review.id)}
                      onChange={() => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          next.has(review.id) ? next.delete(review.id) : next.add(review.id);
                          return next;
                        });
                      }}
                      className="h-4 w-4 accent-[var(--accent-green)]"
                    />
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-hover)]">
                        {review.product.imgUrl?.[0] ? (
                          <Image src={review.product.imgUrl[0]} alt={review.product.name} width={40} height={40} className="h-full w-full object-cover" />
                        ) : (
                          <MessageSquareText className="h-5 w-5 text-[var(--text-tertiary)]" />
                        )}
                      </div>
                      <span className="font-medium text-[var(--text-primary)]">{review.product.name}</span>
                    </div>
                  </SellerTableCell>
                  <SellerTableCell className="text-[var(--text-secondary)] text-center">
                    {review.user?.name || review.user?.email || 'Anonyme'}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <Stars rating={review.rating} />
                  </SellerTableCell>
                  <SellerTableCell className="max-w-[30ch] truncate text-[var(--text-secondary)] text-center">
                    {review.comment}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <SellerBadge color={review.status === 'APPROVED' ? 'success' : review.status === 'REJECTED' ? 'error' : 'warning'}>
                      {review.status === 'PENDING' ? 'En attente' : review.status === 'APPROVED' ? 'Approuvé' : 'Rejeté'}
                    </SellerBadge>
                  </SellerTableCell>
                  <SellerTableCell className="text-[var(--text-secondary)] text-center">
                    {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <div className="flex gap-2">
                      <SellerButton variant="outline" size="sm" icon={Eye} onClick={() => setSelectedReview(review)}>
                        Détail
                      </SellerButton>
                      {review.status === 'PENDING' && (
                        <>
                          <SellerButton variant="success" size="sm" icon={ThumbsUp} onClick={() => updateStatus(review, 'APPROVED')}>
                            Approuver
                          </SellerButton>
                          <SellerButton variant="danger" size="sm" icon={ThumbsDown} onClick={() => updateStatus(review, 'REJECTED')}>
                            Rejeter
                          </SellerButton>
                        </>
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

          <SellerPanel className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Répartition des notes</h3>
            <div className="space-y-2">
              {ratingDistribution.map(({ stars, count, pct, width }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="flex w-20 shrink-0 items-center gap-1 text-xs text-[var(--text-secondary)]">
                    {stars} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex h-6 flex-1 overflow-hidden rounded-md bg-[var(--bg-hover)]">
                    <div
                      className="h-full rounded-md bg-amber-400/60 transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs font-medium text-[var(--text-primary)]">
                    {count} ({pct}%)
                  </span>
                </div>
              ))}
            </div>
          </SellerPanel>
        </>
      )}

      <SellerModal
        isOpen={Boolean(selectedReview)}
        onClose={() => { setSelectedReview(null); setReplyText(''); }}
        title="Détail de l'avis"
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <SellerButton variant="outline" onClick={() => { setSelectedReview(null); setReplyText(''); }}>
              Fermer
            </SellerButton>
            {selectedReview?.status === 'PENDING' && (
              <>
                <SellerButton variant="danger" icon={ThumbsDown} onClick={() => selectedReview && updateStatus(selectedReview, 'REJECTED')}>
                  Rejeter
                </SellerButton>
                <SellerButton variant="success" icon={ThumbsUp} onClick={() => selectedReview && updateStatus(selectedReview, 'APPROVED')}>
                  Approuver
                </SellerButton>
              </>
            )}
          </div>
        }
      >
        {selectedReview && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-hover)]">
                {selectedReview.product.imgUrl?.[0] ? (
                  <Image src={selectedReview.product.imgUrl[0]} alt={selectedReview.product.name} width={80} height={80} className="h-full w-full object-cover" />
                ) : (
                  <MessageSquareText className="h-8 w-8 text-[var(--text-tertiary)]" />
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{selectedReview.product.name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">#{selectedReview.product.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">{selectedReview.user?.name || 'Anonyme'}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{selectedReview.user?.email}</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Note</p>
              <Stars rating={selectedReview.rating} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Commentaire</p>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">{selectedReview.comment}</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Date</p>
              <p className="text-sm text-[var(--text-secondary)]">
                {new Date(selectedReview.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Répondre à cet avis</p>
              <SellerTextarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Écrivez votre réponse..."
              />
              <div className="mt-3 flex justify-end">
                <SellerButton disabled={!replyText.trim() || isReplying} onClick={handleReply}>
                  {isReplying ? 'Envoi...' : 'Envoyer la réponse'}
                </SellerButton>
              </div>
            </div>
          </div>
        )}
      </SellerModal>
    </div>
  );
}
