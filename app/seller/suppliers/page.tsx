'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';

import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerInput from '@/components/seller/SellerInput';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';
import { useAppContext } from '@/context/AppContext';

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  ifu: string | null;
  notes: string | null;
  isActive: boolean;
  purchaseCount: number;
  totalPurchased: number;
  totalPaid: number;
  balance: number;
}

const emptyForm = { name: '', contactName: '', phone: '', email: '', address: '', ifu: '', notes: '' };

export default function SuppliersPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/suppliers');
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch {
      toast.error('Impossible de charger les fournisseurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name, contactName: s.contactName || '', phone: s.phone || '',
      email: s.email || '', address: s.address || '', ifu: s.ifu || '', notes: s.notes || '',
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Le nom est requis.'); return; }
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/suppliers/${editing.id}` : '/api/admin/suppliers', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Erreur');
      toast.success(editing ? 'Fournisseur mis à jour.' : 'Fournisseur créé.');
      setShowModal(false);
      await fetchSuppliers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: Supplier) => {
    if (!window.confirm(`Supprimer le fournisseur "${s.name}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/suppliers/${s.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Erreur');
      toast.success('Fournisseur supprimé.');
      await fetchSuppliers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const filtered = suppliers.filter((s) =>
    !search.trim() ||
    [s.name, s.contactName, s.phone, s.email].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase()),
  );

  const totalDebt = suppliers.reduce((sum, s) => sum + Math.max(0, s.balance), 0);

  return (
    <div className="flex min-h-full flex-col gap-6">
      <SellerSectionHeader
        title="Fournisseurs"
        action={<SellerButton size="sm" icon={Plus} onClick={openCreate}>Nouveau fournisseur</SellerButton>}
      />

      {totalDebt > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          <Wallet className="h-4 w-4 shrink-0" />
          Dette fournisseurs totale : <strong>{formatPrice(totalDebt)}</strong>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          placeholder="Rechercher un fournisseur…"
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : filtered.length === 0 ? (
        <SellerEmptyState title="Aucun fournisseur" description="Créez votre premier fournisseur pour suivre vos achats." icon={Building2} />
      ) : (
        <SellerTable>
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader>Fournisseur</SellerTableCell>
              <SellerTableCell isHeader>Contact</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Achats</SellerTableCell>
              <SellerTableCell isHeader className="text-right">Total acheté</SellerTableCell>
              <SellerTableCell isHeader className="text-right">Payé</SellerTableCell>
              <SellerTableCell isHeader className="text-right">Dette</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {filtered.map((s) => (
              <SellerTableRow key={s.id}>
                <SellerTableCell>
                  <div className="font-medium text-[var(--text-primary)]">{s.name}</div>
                  {s.ifu && <div className="text-xs text-[var(--text-tertiary)]">IFU : {s.ifu}</div>}
                </SellerTableCell>
                <SellerTableCell className="text-xs text-[var(--text-secondary)]">
                  {s.contactName && <div>{s.contactName}</div>}
                  {[s.phone, s.email].filter(Boolean).join(' · ') || '—'}
                </SellerTableCell>
                <SellerTableCell className="text-center text-sm text-[var(--text-secondary)]">{s.purchaseCount}</SellerTableCell>
                <SellerTableCell className="text-right text-sm text-[var(--text-primary)]">{formatPrice(s.totalPurchased)}</SellerTableCell>
                <SellerTableCell className="text-right text-sm text-[var(--accent-green)]">{formatPrice(s.totalPaid)}</SellerTableCell>
                <SellerTableCell className="text-right">
                  {s.balance > 0 ? (
                    <SellerBadge color="warning">{formatPrice(s.balance)}</SellerBadge>
                  ) : (
                    <SellerBadge color="success">Soldé</SellerBadge>
                  )}
                </SellerTableCell>
                <SellerTableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--accent-blue)]" title="Modifier">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(s)} className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--accent-red)]" title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </SellerTableCell>
              </SellerTableRow>
            ))}
          </SellerTableBody>
        </SellerTable>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SellerInput label="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ets Kokou & Fils" />
              <SellerInput label="Personne de contact" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              <SellerInput label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+229 ..." />
              <SellerInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <SellerInput label="IFU" value={form.ifu} onChange={(e) => setForm({ ...form, ifu: e.target.value })} />
              <SellerInput label="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="mt-4">
              <SellerInput label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <SellerButton variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Annuler</SellerButton>
              <SellerButton onClick={save} disabled={saving}>
                {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer'}
              </SellerButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
