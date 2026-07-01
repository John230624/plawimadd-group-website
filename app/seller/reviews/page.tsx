'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Star,
  Search,
  MessageSquareText,
  ThumbsUp,
  ThumbsDown,
  Eye,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Image from 'next/image';

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
import SellerTextarea from '@/components/seller/SellerTextarea';
import StatCard from '@/components/seller/StatCard';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';
interface Review {
  id: string;
  rating: number;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  product: {
    id: string;
    name: string;
    imgUrl: string[];
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

const pageSize = 10;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function ReviewsPage(): React.ReactElement {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/admin/reviews?${params}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      toast.error('Impossible de charger les avis.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => { setPage(1); }, [searchTerm, statusFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return reviews.slice(start, start + pageSize);
  }, [reviews, page]);

  const stats = useMemo(() => ({
    total: reviews.length,
    pending: reviews.filter((r) => r.status === 'PENDING').length,
    approved: reviews.filter((r) => r.status === 'APPROVED').length,
    rejected: reviews.filter((r) => r.status === 'REJECTED').length,
  }), [reviews]);

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
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (!res.ok) throw new Error('Erreur');
      toast.success('Réponse envoyée.');
      setReplyText('');
      fetchReviews();
    } catch {
      toast.error('Erreur lors de l\'envoi de la réponse.');
    } finally {
      setIsReplying(false);
    }
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
      <SellerSectionHeader title="Avis clients" />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total" value={String(stats.total)} description="Tous les avis" icon={MessageSquareText} accentColor="blue" />
        <StatCard title="En attente" value={String(stats.pending)} description="À modérer" icon={Eye} accentColor="amber" />
        <StatCard title="Approuvés" value={String(stats.approved)} description="Visibles" icon={ThumbsUp} accentColor="green" />
        <StatCard title="Rejetés" value={String(stats.rejected)} description="Masqués" icon={ThumbsDown} accentColor="red" />
      </div>

      <SellerFilterBar>
        <SellerInput
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par produit"
        />
        <div className="flex items-center gap-3">
          <SellerSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ALL', label: 'Tous' },
              { value: 'PENDING', label: 'En attente' },
              { value: 'APPROVED', label: 'Approuvés' },
              { value: 'REJECTED', label: 'Rejetés' },
            ]}
          />
          <div className="rounded-lg bg-[var(--bg-hover)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            {reviews.length} résultat(s)
          </div>
        </div>
      </SellerFilterBar>

      {reviews.length === 0 ? (
        <SellerEmptyState
          title="Aucun avis trouvé"
          description="Les avis des clients apparaîtront ici."
          icon={MessageSquareText}
        />
      ) : (
        <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader>Produit</SellerTableCell>
              <SellerTableCell isHeader>Client</SellerTableCell>
              <SellerTableCell isHeader>Note</SellerTableCell>
              <SellerTableCell isHeader>Commentaire</SellerTableCell>
              <SellerTableCell isHeader>Date</SellerTableCell>
              <SellerTableCell isHeader>Actions</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {paginated.map((review) => (
              <SellerTableRow key={review.id}>
                <SellerTableCell>
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
                <SellerTableCell className="text-[var(--text-secondary)]">
                  {review.user.name || review.user.email}
                </SellerTableCell>
                <SellerTableCell>
                  <Stars rating={review.rating} />
                </SellerTableCell>
                <SellerTableCell className="max-w-[30ch] truncate text-[var(--text-secondary)]">
                  {review.comment}
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)]">
                  {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                </SellerTableCell>
                <SellerTableCell>
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
                    {review.status !== 'PENDING' && (
                      <SellerBadge color={review.status === 'APPROVED' ? 'success' : 'error'}>
                        {review.status === 'APPROVED' ? 'Approuvé' : 'Rejeté'}
                      </SellerBadge>
                    )}
                  </div>
                </SellerTableCell>
              </SellerTableRow>
            ))}
          </SellerTableBody>
          <tfoot>
            <tr>
              <td colSpan={6}>
                <SellerPagination page={page} pageSize={pageSize} totalItems={reviews.length} onPageChange={setPage} />
              </td>
            </tr>
          </tfoot>
        </SellerTable>
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
              <p className="text-sm font-medium text-[var(--text-primary)]">{selectedReview.user.name || 'Anonyme'}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{selectedReview.user.email}</p>
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
