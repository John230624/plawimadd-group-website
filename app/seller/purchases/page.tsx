'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  PackageCheck,
  Plus,
  ShoppingBasket,
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
import SellerSelect from '@/components/seller/SellerSelect';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';
import { useAppContext } from '@/context/AppContext';

interface PurchaseItemRow {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface Purchase {
  id: string;
  reference: string;
  supplierId: string;
  supplierName: string;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  paidAmount: number;
  balance: number;
  itemCount: number;
  items: PurchaseItemRow[];
  notes: string | null;
  receivedAt: string | null;
  createdAt: string;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

interface SupplierOption { id: string; name: string }

interface DraftLine { productId: string; quantity: string; unitCost: string }

export default function PurchasesPage(): React.ReactElement {
  const { products, formatPrice } = useAppContext();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([{ productId: '', quantity: '1', unitCost: '' }]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [payFor, setPayFor] = useState<Purchase | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [paying, setPaying] = useState(false);

  const fetchPurchases = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/purchases?${params}`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setPurchases(data.purchases || []);
      setPagination(data.pagination);
    } catch {
      toast.error('Impossible de charger les achats.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    fetch('/api/admin/suppliers')
      .then((r) => (r.ok ? r.json() : { suppliers: [] }))
      .then((data) => setSuppliers((data.suppliers || []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))))
      .catch(() => setSuppliers([]));
  }, []);

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: p.name })),
    [products],
  );

  const draftTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0),
    [lines],
  );

  const setLine = (idx: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const createPurchase = async () => {
    if (!supplierId) { toast.error('Sélectionnez un fournisseur.'); return; }
    const items = lines
      .filter((l) => l.productId)
      .map((l) => ({ productId: l.productId, quantity: Number(l.quantity), unitCost: Number(l.unitCost) }));
    if (items.length === 0) { toast.error('Ajoutez au moins un article.'); return; }
    if (items.some((it) => !Number.isFinite(it.quantity) || it.quantity <= 0 || !Number.isFinite(it.unitCost) || it.unitCost < 0)) {
      toast.error('Quantités ou coûts invalides.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, items, notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Erreur');
      toast.success(`Achat ${data.purchase.reference} créé.`);
      setShowCreate(false);
      setSupplierId('');
      setLines([{ productId: '', quantity: '1', unitCost: '' }]);
      setNotes('');
      await fetchPurchases();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const receivePurchase = async (p: Purchase) => {
    if (!window.confirm(`Réceptionner ${p.reference} ? Le stock des ${p.itemCount} article(s) sera augmenté.`)) return;
    try {
      const res = await fetch(`/api/admin/purchases/${p.id}/receive`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Erreur');
      toast.success(`${p.reference} réceptionné — stock mis à jour.`);
      await fetchPurchases(pagination.page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const submitPayment = async () => {
    if (!payFor) return;
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Montant invalide.'); return; }
    setPaying(true);
    try {
      const res = await fetch(`/api/admin/purchases/${payFor.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method: payMethod }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Erreur');
      toast.success('Paiement fournisseur enregistré.');
      setPayFor(null);
      setPayAmount('');
      await fetchPurchases(pagination.page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setPaying(false);
    }
  };

  const statusBadge = (p: Purchase) => {
    if (p.status === 'RECEIVED') return <SellerBadge color="success"><span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Reçu</span></SellerBadge>;
    if (p.status === 'CANCELLED') return <SellerBadge color="error">Annulé</SellerBadge>;
    return <SellerBadge color="warning"><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> En attente</span></SellerBadge>;
  };

  return (
    <div className="flex min-h-full flex-col gap-6">
      <SellerSectionHeader
        title="Achats fournisseurs"
        action={<SellerButton size="sm" icon={Plus} onClick={() => setShowCreate(true)}>Nouvel achat</SellerButton>}
      />

      <div className="max-w-xs">
        <SellerSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'ALL', label: 'Tous les statuts' },
            { value: 'PENDING', label: 'En attente de réception' },
            { value: 'RECEIVED', label: 'Réceptionnés' },
            { value: 'CANCELLED', label: 'Annulés' },
          ]}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : purchases.length === 0 ? (
        <SellerEmptyState title="Aucun achat" description="Créez une commande d'achat pour réapprovisionner votre stock." icon={ShoppingBasket} />
      ) : (
        <>
          <SellerTable>
            <SellerTableHeader>
              <SellerTableRow>
                <SellerTableCell isHeader>Référence</SellerTableCell>
                <SellerTableCell isHeader>Fournisseur</SellerTableCell>
                <SellerTableCell isHeader className="text-center">Articles</SellerTableCell>
                <SellerTableCell isHeader className="text-right">Total</SellerTableCell>
                <SellerTableCell isHeader className="text-right">Reste à payer</SellerTableCell>
                <SellerTableCell isHeader className="text-center">Statut</SellerTableCell>
                <SellerTableCell isHeader>Date</SellerTableCell>
                <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
              </SellerTableRow>
            </SellerTableHeader>
            <SellerTableBody>
              {purchases.map((p) => (
                <SellerTableRow key={p.id}>
                  <SellerTableCell className="font-medium text-[var(--text-primary)]">{p.reference}</SellerTableCell>
                  <SellerTableCell className="text-sm text-[var(--text-secondary)]">{p.supplierName}</SellerTableCell>
                  <SellerTableCell className="text-center text-sm text-[var(--text-secondary)]">
                    <span title={p.items.map((it) => `${it.productName} ×${it.quantity}`).join('\n')}>{p.itemCount}</span>
                  </SellerTableCell>
                  <SellerTableCell className="text-right text-sm font-semibold text-[var(--text-primary)]">{formatPrice(p.totalAmount)}</SellerTableCell>
                  <SellerTableCell className="text-right text-sm">
                    {p.balance > 0 ? (
                      <span className="text-amber-400">{formatPrice(p.balance)}</span>
                    ) : (
                      <span className="text-[var(--accent-green)]">Soldé</span>
                    )}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">{statusBadge(p)}</SellerTableCell>
                  <SellerTableCell className="text-xs text-[var(--text-tertiary)]">
                    {new Date(p.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {p.status === 'PENDING' && (
                        <button onClick={() => receivePurchase(p)} className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--accent-green)]" title="Réceptionner (entrée en stock)">
                          <PackageCheck className="h-4 w-4" />
                        </button>
                      )}
                      {p.status !== 'CANCELLED' && p.balance > 0 && (
                        <button onClick={() => { setPayFor(p); setPayAmount(String(Math.round(p.balance))); }} className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-amber-400" title="Enregistrer un paiement">
                          <Wallet className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </SellerTableCell>
                </SellerTableRow>
              ))}
            </SellerTableBody>
          </SellerTable>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => fetchPurchases(pagination.page - 1)} disabled={pagination.page <= 1} className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] disabled:opacity-40">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-[var(--text-secondary)]">Page {pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => fetchPurchases(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] disabled:opacity-40">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal création */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Nouvel achat fournisseur</h3>
              <button onClick={() => setShowCreate(false)} className="text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Fournisseur *</span>
                <SellerSelect
                  value={supplierId}
                  onChange={setSupplierId}
                  options={[{ value: '', label: '— Choisir —' }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]}
                />
                {suppliers.length === 0 && (
                  <p className="mt-1 text-xs text-amber-400">Aucun fournisseur — créez-en un d&apos;abord dans l&apos;onglet Fournisseurs.</p>
                )}
              </div>

              <div className="space-y-2">
                <span className="block text-sm font-medium text-[var(--text-primary)]">Articles *</span>
                {lines.map((line, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2">
                    <div className="min-w-[220px] flex-1">
                      <SellerSelect
                        value={line.productId}
                        onChange={(v) => setLine(idx, { productId: v })}
                        options={[{ value: '', label: '— Produit —' }, ...productOptions]}
                      />
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => setLine(idx, { quantity: e.target.value })}
                      placeholder="Qté"
                      className="h-10 w-20 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 text-center text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                    />
                    <input
                      type="number"
                      min={0}
                      value={line.unitCost}
                      onChange={(e) => setLine(idx, { unitCost: e.target.value })}
                      placeholder="Coût unit."
                      className="h-10 w-28 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 text-right text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
                    />
                    <button
                      onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                      disabled={lines.length === 1}
                      className="rounded-lg p-2 text-[var(--text-tertiary)] transition hover:text-[var(--accent-red)] disabled:opacity-30"
                      title="Retirer la ligne"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <SellerButton variant="outline" size="sm" icon={Plus} onClick={() => setLines((prev) => [...prev, { productId: '', quantity: '1', unitCost: '' }])}>
                  Ajouter une ligne
                </SellerButton>
              </div>

              <SellerInput label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Référence bon de commande, transporteur…" />

              <div className="flex items-center justify-between rounded-lg bg-[var(--bg-outer)] px-4 py-3">
                <span className="text-sm text-[var(--text-secondary)]">Total de l&apos;achat</span>
                <span className="text-lg font-bold text-[var(--text-primary)]">{formatPrice(draftTotal)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <SellerButton variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>Annuler</SellerButton>
              <SellerButton onClick={createPurchase} disabled={saving}>
                {saving ? 'Création…' : "Créer l'achat"}
              </SellerButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal paiement */}
      {payFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Paiement — {payFor.reference}</h3>
              <button onClick={() => setPayFor(null)} className="text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-[var(--text-secondary)]">
              Reste à payer : <strong className="text-amber-400">{formatPrice(payFor.balance)}</strong>
            </p>
            <div className="space-y-3">
              <SellerInput label="Montant" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              <div>
                <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Mode de paiement</span>
                <SellerSelect
                  value={payMethod}
                  onChange={setPayMethod}
                  options={[
                    { value: 'CASH', label: 'Espèces' },
                    { value: 'TRANSFER', label: 'Virement' },
                    { value: 'MOBILE_MONEY', label: 'Mobile Money' },
                  ]}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <SellerButton variant="outline" onClick={() => setPayFor(null)} disabled={paying}>Annuler</SellerButton>
              <SellerButton onClick={submitPayment} disabled={paying}>
                {paying ? 'Enregistrement…' : 'Enregistrer'}
              </SellerButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
