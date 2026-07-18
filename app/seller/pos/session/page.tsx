'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BookOpenCheck,
  Clock,
  Loader2,
  Lock,
  PiggyBank,
  Unlock,
} from 'lucide-react';
import { toast } from 'react-toastify';

import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerInput from '@/components/seller/SellerInput';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';
import { useAppContext } from '@/context/AppContext';

interface CurrentSession {
  id: string;
  openedAt: string;
  openingFloat: number;
  txCount: number;
  salesTotal: number;
  cashCollected: number;
  expectedCash: number;
}

interface ClosedSession {
  id: string;
  openedAt: string;
  closedAt: string;
  openingFloat: number;
  closingCash: number | null;
  expectedCash: number | null;
  variance: number | null;
  closingNotes: string | null;
}

export default function PosSessionPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const [current, setCurrent] = useState<CurrentSession | null>(null);
  const [history, setHistory] = useState<ClosedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingFloat, setOpeningFloat] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pos/session');
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setCurrent(data.current);
      setHistory(data.history || []);
    } catch {
      toast.error('Impossible de charger la session de caisse.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openSession = async () => {
    const amount = Number(openingFloat || 0);
    if (!Number.isFinite(amount) || amount < 0) { toast.error('Fond de caisse invalide.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/pos/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingFloat: amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Erreur');
      toast.success('Caisse ouverte.');
      setOpeningFloat('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const previewVariance = useMemo(() => {
    if (!current || closingCash === '') return null;
    const counted = Number(closingCash);
    if (!Number.isFinite(counted)) return null;
    return counted - current.expectedCash;
  }, [current, closingCash]);

  const closeSession = async () => {
    if (!current) return;
    const counted = Number(closingCash);
    if (!Number.isFinite(counted) || counted < 0) { toast.error('Saisissez les espèces comptées.'); return; }
    const varianceMsg = previewVariance !== null && Math.abs(previewVariance) > 0.5
      ? `\nÉcart de caisse : ${previewVariance > 0 ? '+' : ''}${Math.round(previewVariance)}`
      : '';
    if (!window.confirm(`Clôturer la caisse ?${varianceMsg}`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/pos/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closingCash: counted, notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Erreur');
      const v = data.report.variance;
      toast.success(
        Math.abs(v) <= 0.5
          ? 'Caisse clôturée — aucun écart ✅'
          : `Caisse clôturée — écart ${v > 0 ? '+' : ''}${Math.round(v)}`,
      );
      setClosingCash('');
      setNotes('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" /></div>;
  }

  return (
    <div className="flex min-h-full flex-col gap-6">
      <SellerSectionHeader title="Journal de caisse" />

      {current ? (
        <SellerPanel className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-[var(--accent-green)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Session en cours</h2>
            </div>
            <SellerBadge color="success">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Ouverte le {new Date(current.openedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </SellerBadge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-[var(--bg-outer)] p-3 text-center">
              <p className="text-[10px] uppercase text-[var(--text-tertiary)]">Fond de caisse</p>
              <p className="text-base font-bold text-[var(--text-primary)]">{formatPrice(current.openingFloat)}</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-3 text-center">
              <p className="text-[10px] uppercase text-[var(--text-tertiary)]">Ventes ({current.txCount})</p>
              <p className="text-base font-bold text-[var(--text-primary)]">{formatPrice(current.salesTotal)}</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-3 text-center">
              <p className="text-[10px] uppercase text-[var(--text-tertiary)]">Espèces encaissées</p>
              <p className="text-base font-bold text-[var(--accent-green)]">{formatPrice(current.cashCollected)}</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-3 text-center">
              <p className="text-[10px] uppercase text-[var(--text-tertiary)]">Espèces attendues</p>
              <p className="text-base font-bold text-[var(--accent-blue)]">{formatPrice(current.expectedCash)}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-[var(--border)] pt-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Lock className="h-4 w-4 text-amber-500" /> Clôturer la caisse
            </h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-48">
                <SellerInput
                  label="Espèces comptées"
                  type="number"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  placeholder={String(Math.round(current.expectedCash))}
                />
              </div>
              <div className="min-w-[220px] flex-1">
                <SellerInput label="Notes (facultatif)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Justification d'écart, remarques…" />
              </div>
              <SellerButton icon={Lock} onClick={closeSession} disabled={busy || closingCash === ''}>
                {busy ? 'Clôture…' : 'Clôturer'}
              </SellerButton>
            </div>
            {previewVariance !== null && (
              <p className={`text-sm font-semibold ${Math.abs(previewVariance) <= 0.5 ? 'text-[var(--accent-green)]' : previewVariance > 0 ? 'text-amber-400' : 'text-[var(--accent-red)]'}`}>
                {Math.abs(previewVariance) <= 0.5
                  ? 'Aucun écart ✅'
                  : `Écart de caisse : ${previewVariance > 0 ? '+' : ''}${Math.round(previewVariance)} F CFA`}
              </p>
            )}
            <p className="text-xs text-[var(--text-tertiary)]">
              Espèces attendues = fond de caisse + ventes payées en espèces durant la session. Les tranches encaissées hors caisse ne sont pas comptées ici.
            </p>
          </div>
        </SellerPanel>
      ) : (
        <SellerPanel className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-[var(--accent-blue)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ouvrir la caisse</h2>
          </div>
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            Saisissez le fond de caisse (espèces présentes dans le tiroir) avant de commencer les ventes.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-48">
              <SellerInput
                label="Fond de caisse"
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                placeholder="0"
              />
            </div>
            <SellerButton icon={Unlock} onClick={openSession} disabled={busy}>
              {busy ? 'Ouverture…' : 'Ouvrir la caisse'}
            </SellerButton>
          </div>
        </SellerPanel>
      )}

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
          <BookOpenCheck className="h-4 w-4 text-[var(--accent-blue)]" /> Historique des clôtures
        </h2>
        {history.length === 0 ? (
          <SellerEmptyState title="Aucune clôture" description="Les rapports de clôture (Z) apparaîtront ici." icon={BookOpenCheck} />
        ) : (
          <SellerTable>
            <SellerTableHeader>
              <SellerTableRow>
                <SellerTableCell isHeader>Ouverture</SellerTableCell>
                <SellerTableCell isHeader>Clôture</SellerTableCell>
                <SellerTableCell isHeader className="text-right">Fond</SellerTableCell>
                <SellerTableCell isHeader className="text-right">Attendu</SellerTableCell>
                <SellerTableCell isHeader className="text-right">Compté</SellerTableCell>
                <SellerTableCell isHeader className="text-center">Écart</SellerTableCell>
                <SellerTableCell isHeader>Notes</SellerTableCell>
              </SellerTableRow>
            </SellerTableHeader>
            <SellerTableBody>
              {history.map((s) => {
                const v = s.variance ?? 0;
                const ok = Math.abs(v) <= 0.5;
                return (
                  <SellerTableRow key={s.id}>
                    <SellerTableCell className="text-xs text-[var(--text-tertiary)]">
                      {new Date(s.openedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </SellerTableCell>
                    <SellerTableCell className="text-xs text-[var(--text-tertiary)]">
                      {new Date(s.closedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </SellerTableCell>
                    <SellerTableCell className="text-right text-sm text-[var(--text-secondary)]">{formatPrice(s.openingFloat)}</SellerTableCell>
                    <SellerTableCell className="text-right text-sm text-[var(--text-secondary)]">{s.expectedCash !== null ? formatPrice(s.expectedCash) : '—'}</SellerTableCell>
                    <SellerTableCell className="text-right text-sm text-[var(--text-primary)]">{s.closingCash !== null ? formatPrice(s.closingCash) : '—'}</SellerTableCell>
                    <SellerTableCell className="text-center">
                      {ok ? (
                        <SellerBadge color="success"><span className="inline-flex items-center gap-1"><BadgeCheck className="h-3 w-3" /> OK</span></SellerBadge>
                      ) : (
                        <SellerBadge color={v > 0 ? 'warning' : 'error'}>{v > 0 ? '+' : ''}{Math.round(v)}</SellerBadge>
                      )}
                    </SellerTableCell>
                    <SellerTableCell className="text-xs text-[var(--text-secondary)]">{s.closingNotes || '—'}</SellerTableCell>
                  </SellerTableRow>
                );
              })}
            </SellerTableBody>
          </SellerTable>
        )}
      </div>
    </div>
  );
}
