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

export default function PromotionsPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promotions');
      const data = await res.json();
      setPromotions(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      toast.error('Impossible de charger les promotions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);
  useEffect(() => { setPage(1); }, [searchTerm]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return promotions.filter((p) => p.code.toLowerCase().includes(q));
  }, [promotions, searchTerm]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const activeCount = promotions.filter((p) => p.active).length;
  const avgUsage = promotions.length
    ? Math.round(promotions.reduce((sum, p) => sum + (p.maxUses ? p.usedCount / p.maxUses : 0), 0) / promotions.length * 100)
    : 0;

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
          <SellerButton icon={Plus} onClick={openCreate}>
            Ajouter un code
          </SellerButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Codes promo" value={String(promotions.length)} description="Total des codes" icon={Gift} accentColor="blue" />
        <StatCard title="Codes actifs" value={String(activeCount)} description="Actuellement actifs" icon={Percent} accentColor="green" />
        <StatCard title="Utilisation moyenne" value={`${avgUsage}%`} description="Taux d'utilisation moyen" icon={Percent} accentColor="amber" />
      </div>

      <SellerFilterBar>
        <SellerInput
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par code"
        />
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--bg-hover)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            {filtered.length} résultat(s)
          </div>
        </div>
      </SellerFilterBar>

      {filtered.length === 0 ? (
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
              <SellerTableCell isHeader>Code</SellerTableCell>
              <SellerTableCell isHeader>Type</SellerTableCell>
              <SellerTableCell isHeader>Valeur</SellerTableCell>
              <SellerTableCell isHeader>Min commande</SellerTableCell>
              <SellerTableCell isHeader>Utilisations</SellerTableCell>
              <SellerTableCell isHeader>Expire le</SellerTableCell>
              <SellerTableCell isHeader>Statut</SellerTableCell>
              <SellerTableCell isHeader>Actions</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {paginated.map((promo) => (
              <SellerTableRow key={promo.id}>
                <SellerTableCell>
                  <span className="font-semibold text-[var(--text-primary)]">{promo.code}</span>
                </SellerTableCell>
                <SellerTableCell>
                  <SellerBadge color={promo.discountType === 'PERCENTAGE' ? 'primary' : 'warning'}>
                    {promo.discountType === 'PERCENTAGE' ? '%' : 'Fixe'}
                  </SellerBadge>
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-primary)]">
                  {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : formatPrice(promo.discountValue)}
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)]">
                  {promo.minAmount ? formatPrice(promo.minAmount) : '—'}
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)]">
                  {promo.usedCount}{promo.maxUses ? ` / ${promo.maxUses}` : ''}
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)]">
                  {promo.expiresAt
                    ? new Date(promo.expiresAt).toLocaleDateString('fr-FR')
                    : '—'}
                </SellerTableCell>
                <SellerTableCell>
                  <SellerBadge color={promo.active ? 'success' : 'slate'}>
                    {promo.active ? 'Actif' : 'Inactif'}
                  </SellerBadge>
                </SellerTableCell>
                <SellerTableCell>
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
              <td colSpan={8}>
                <SellerPagination page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />
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
