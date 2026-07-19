'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Download,
  Printer,
  Share2,
  FileText,
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  Plus,
  FileCheck2,
  ShieldCheck,
  ReceiptText,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAppContext } from '@/context/AppContext';

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  totalAmount: number;
  discount: number;
  discountReason: string | null;
  finalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentMethod: string;
  dueDate: string | null;
  createdAt: string;
  sellerName: string;
  items: InvoiceItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TranchePayment {
  id: string;
  installmentNumber: number;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  paidAt: string;
  recordedByName: string | null;
}

export default function InvoicesPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [history, setHistory] = useState<TranchePayment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [paying, setPaying] = useState(false);

  // Normalisation e-MECeF
  interface NormalizedInfo {
    id: string;
    status: string;
    type: string;
    nim: string | null;
    counters: string | null;
    ni: string | null;
    environment: string;
    errorDesc: string | null;
  }
  const [normalizedInfo, setNormalizedInfo] = useState<NormalizedInfo | null>(null);
  const [normalizing, setNormalizing] = useState(false);

  const lookupNormalized = useCallback(async (transactionId: string) => {
    setNormalizedInfo(null);
    try {
      const res = await fetch(`/api/admin/emecef/lookup?source=POS&id=${transactionId}`);
      if (!res.ok) return; // 403 pour non-admin : on masque simplement la fonctionnalité
      const data = await res.json();
      setNormalizedInfo(data.invoice || null);
    } catch {
      /* silencieux */
    }
  }, []);

  const openNormalizedPdf = (normalizedId: string) => {
    window.open(`/api/admin/emecef/invoice-pdf?id=${normalizedId}`, '_blank', 'noopener,noreferrer');
  };

  const normalizeInvoice = async (transactionId: string) => {
    setNormalizing(true);
    try {
      const res = await fetch('/api/admin/emecef/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'POS', id: transactionId, type: 'FV' }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success(`Facture normalisée ✅ NIM ${data.invoice?.nim ?? ''}`);
        await lookupNormalized(transactionId);
      } else {
        toast.error(data.message || 'Échec de la normalisation.');
      }
    } catch {
      toast.error('Échec de la normalisation.');
    } finally {
      setNormalizing(false);
    }
  };

  const fetchInvoices = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search.trim()) params.set('search', search.trim());
      if (methodFilter !== 'ALL') params.set('method', methodFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/pos/invoices?${params}`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setInvoices(data.invoices);
      setPagination(data.pagination);
    } catch {
      console.error('Erreur chargement factures');
    } finally {
      setLoading(false);
    }
  }, [search, methodFilter, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const openInvoice = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/pos/invoice?transactionId=${transactionId}`);
      if (!res.ok) throw new Error('Facture indisponible');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch {
      console.error('Erreur facture');
    }
  };

  const downloadInvoice = async (transactionId: string, invoiceNumber: string) => {
    try {
      const res = await fetch(`/api/pos/invoice?transactionId=${transactionId}`);
      if (!res.ok) throw new Error('Erreur');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      console.error('Erreur téléchargement');
    }
  };

  const shareInvoice = async (invoice: Invoice) => {
    if (navigator.share) {
      try {
        const res = await fetch(`/api/pos/invoice?transactionId=${invoice.id}`);
        if (!res.ok) throw new Error('Erreur');
        const blob = await res.blob();
        const file = new File([blob], `facture-${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });
        await navigator.share({
          title: `Facture ${invoice.invoiceNumber}`,
          files: [file],
        });
      } catch {
        console.error('Erreur partage');
      }
    } else {
      openInvoice(invoice.id);
    }
  };

  const openTicket = (transactionId: string) => {
    window.open(`/api/pos/ticket?transactionId=${transactionId}&width=80`, '_blank', 'noopener,noreferrer');
  };

  const printInvoice = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/pos/invoice?transactionId=${transactionId}`);
      if (!res.ok) throw new Error('Erreur');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => printWindow.print(), 500);
        };
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch {
      console.error('Erreur impression');
    }
  };

  const fetchHistory = useCallback(async (transactionId: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/pos/installments/${transactionId}`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setHistory(Array.isArray(data.payments) ? data.payments : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const viewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetail(true);
    setPayAmount('');
    setPayMethod('CASH');
    setHistory([]);
    if (invoice.paymentMethod === 'INSTALLMENT') {
      fetchHistory(invoice.id);
    }
    lookupNormalized(invoice.id);
  };

  const submitTranche = async () => {
    if (!selectedInvoice) return;
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Montant invalide.');
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(`/api/pos/installments/${selectedInvoice.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod: payMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Erreur');
      toast.success(data.isFullyPaid ? 'Tranche encaissée. Facture soldée ✅' : 'Tranche encaissée.');
      // Met à jour l'invoice sélectionnée et la liste
      setSelectedInvoice((prev) =>
        prev ? { ...prev, paidAmount: data.totalPaid, remainingBalance: data.remaining } : prev,
      );
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvoice.id
            ? { ...inv, paidAmount: data.totalPaid, remainingBalance: data.remaining }
            : inv,
        ),
      );
      setPayAmount('');
      fetchHistory(selectedInvoice.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'encaissement.');
    } finally {
      setPaying(false);
    }
  };

  const getPaymentBadge = (method: string, remaining: number) => {
    if (method === 'INSTALLMENT' && remaining > 0) {
      return { label: 'Partiel', color: 'text-amber-400 bg-amber-500/10', icon: Clock };
    }
    if (method === 'INSTALLMENT') {
      return { label: 'Tranche(s)', color: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle2 };
    }
    return { label: method === 'CASH' ? 'Espèces' : 'Virement', color: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle2 };
  };

  return (
    <div className="flex min-h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-700 text-yellow-400">Factures</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Consultez, téléchargez, imprimez ou partagez vos factures.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="search"
            name="invoice-search"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (n° facture, client, téléphone…)"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 pl-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-yellow-400"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-yellow-400"
        >
          <option value="ALL">Tous les modes</option>
          <option value="CASH">Espèces</option>
          <option value="TRANSFER">Virement</option>
          <option value="INSTALLMENT">Paiement par tranche</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-yellow-400"
        >
          <option value="ALL">Tous règlements</option>
          <option value="PAID">Soldées</option>
          <option value="UNPAID">Reste à payer</option>
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-[10px] bg-[var(--bg-card)]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
            <p className="text-sm font-500 text-[var(--text-secondary)]">Aucune facture trouvée</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">Les factures des ventes physiques apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-600 text-[var(--text-tertiary)]">
                  <th className="px-4 py-3 text-left">Facture</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Montant</th>
                  <th className="px-4 py-3 text-left">Paiement</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const badge = getPaymentBadge(inv.paymentMethod, inv.remainingBalance);
                  const Icon = badge.icon;
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-[var(--border)] transition hover:bg-[var(--bg-hover)]"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => viewDetails(inv)}
                          className="font-600 text-yellow-400 transition hover:text-yellow-300"
                        >
                          {inv.invoiceNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[var(--text-primary)]">{inv.customerName}</div>
                        {inv.customerPhone && (
                          <div className="text-xs text-[var(--text-tertiary)]">{inv.customerPhone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-600 text-[var(--text-primary)]">
                        {formatPrice(inv.finalAmount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                        {inv.paymentMethod === 'CASH' ? 'Espèces' : inv.paymentMethod === 'TRANSFER' ? 'Virement' : 'Tranche'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-600 ${badge.color}`}>
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                        {inv.remainingBalance > 0 && (
                          <div className="mt-0.5 text-xs text-amber-400">
                            Reste: {formatPrice(inv.remainingBalance)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-tertiary)]">
                        {new Date(inv.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openInvoice(inv.id)}
                            className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-yellow-400"
                            title="Voir"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => downloadInvoice(inv.id, inv.invoiceNumber)}
                            className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-yellow-400"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => shareInvoice(inv)}
                            className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-yellow-400"
                            title="Partager"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => printInvoice(inv.id)}
                            className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-yellow-400"
                            title="Imprimer"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openTicket(inv.id)}
                            className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-yellow-400"
                            title="Ticket thermique (80mm)"
                          >
                            <ReceiptText className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchInvoices(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-[var(--text-secondary)]">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchInvoices(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] disabled:opacity-40"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {showDetail && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-yellow-400">{selectedInvoice.invoiceNumber}</h3>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  {new Date(selectedInvoice.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-[var(--bg-outer)] p-3">
                <p className="text-xs text-[var(--text-tertiary)]">Client</p>
                <p className="text-sm font-600 text-[var(--text-primary)]">{selectedInvoice.customerName}</p>
                {selectedInvoice.customerPhone && (
                  <p className="text-xs text-[var(--text-secondary)]">{selectedInvoice.customerPhone}</p>
                )}
                {selectedInvoice.customerEmail && (
                  <p className="text-xs text-[var(--text-secondary)]">{selectedInvoice.customerEmail}</p>
                )}
              </div>

              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-[var(--text-tertiary)]">
                      <th className="pb-1 text-left font-500">Produit</th>
                      <th className="pb-1 text-center font-500">Qté</th>
                      <th className="pb-1 text-right font-500">Prix</th>
                      <th className="pb-1 text-right font-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-[var(--border)]">
                        <td className="py-2 text-[var(--text-primary)]">{item.name}</td>
                        <td className="py-2 text-center text-[var(--text-secondary)]">{item.quantity}</td>
                        <td className="py-2 text-right text-[var(--text-secondary)]">{formatPrice(item.unitPrice)}</td>
                        <td className="py-2 text-right font-600 text-[var(--text-primary)]">{formatPrice(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 border-t border-[var(--border)] pt-3 text-sm">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Sous-total</span>
                  <span>{formatPrice(selectedInvoice.totalAmount)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Remise</span>
                    <span>-{formatPrice(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[var(--text-primary)]">
                  <span>Total</span>
                  <span>{formatPrice(selectedInvoice.finalAmount)}</span>
                </div>
                {selectedInvoice.paymentMethod === 'INSTALLMENT' && (
                  <>
                    <div className="flex justify-between text-emerald-400">
                      <span>Versé</span>
                      <span>{formatPrice(selectedInvoice.paidAmount)}</span>
                    </div>
                    {selectedInvoice.remainingBalance > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Reste à payer</span>
                        <span>{formatPrice(selectedInvoice.remainingBalance)}</span>
                      </div>
                    )}
                    {selectedInvoice.dueDate && (
                      <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                        <span>Échéance</span>
                        <span>{new Date(selectedInvoice.dueDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                  <span>Paiement</span>
                  <span>
                    {selectedInvoice.paymentMethod === 'CASH'
                      ? 'Espèces'
                      : selectedInvoice.paymentMethod === 'TRANSFER'
                      ? 'Virement'
                      : 'Paiement par tranche'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                  <span>Vendeur</span>
                  <span>{selectedInvoice.sellerName}</span>
                </div>
              </div>

              {/* Suivi crédit : historique des tranches + encaissement */}
              {selectedInvoice.paymentMethod === 'INSTALLMENT' && (
                <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] p-3">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-600 uppercase text-[var(--text-tertiary)]">
                      <Wallet className="h-3.5 w-3.5" /> Suivi des tranches
                    </p>
                    {selectedInvoice.remainingBalance <= 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-600 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Soldée
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-600 text-amber-400">
                        <Clock className="h-3 w-3" /> En cours
                      </span>
                    )}
                  </div>

                  {/* Récap payé / reste / total */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-[var(--bg-card)] p-2">
                      <p className="text-[10px] uppercase text-[var(--text-tertiary)]">Payé</p>
                      <p className="text-sm font-700 text-emerald-400">{formatPrice(selectedInvoice.paidAmount)}</p>
                    </div>
                    <div className="rounded-md bg-[var(--bg-card)] p-2">
                      <p className="text-[10px] uppercase text-[var(--text-tertiary)]">Reste</p>
                      <p className="text-sm font-700 text-amber-400">{formatPrice(selectedInvoice.remainingBalance)}</p>
                    </div>
                    <div className="rounded-md bg-[var(--bg-card)] p-2">
                      <p className="text-[10px] uppercase text-[var(--text-tertiary)]">Total</p>
                      <p className="text-sm font-700 text-[var(--text-primary)]">{formatPrice(selectedInvoice.finalAmount)}</p>
                    </div>
                  </div>

                  {/* Historique */}
                  {historyLoading ? (
                    <div className="flex justify-center py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                    </div>
                  ) : history.length > 0 ? (
                    <div className="space-y-1.5">
                      {history.map((h) => (
                        <div key={h.id} className="flex items-center justify-between rounded-md bg-[var(--bg-card)] px-3 py-2 text-xs">
                          <div>
                            <span className="font-600 text-[var(--text-primary)]">Tranche #{h.installmentNumber}</span>
                            <span className="ml-2 text-[var(--text-tertiary)]">
                              {new Date(h.paidAt).toLocaleDateString('fr-FR')} · {h.paymentMethod}
                            </span>
                          </div>
                          <span className="font-600 text-emerald-400">{formatPrice(h.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-1 text-center text-xs text-[var(--text-tertiary)]">Aucune tranche enregistrée.</p>
                  )}

                  {/* Formulaire d'encaissement */}
                  {selectedInvoice.remainingBalance > 0 && (
                    <div className="space-y-2 border-t border-[var(--border)] pt-3">
                      <p className="text-xs font-600 text-[var(--text-secondary)]">Encaisser une tranche</p>
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="number"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder={`Max ${Math.round(selectedInvoice.remainingBalance)}`}
                          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-yellow-400"
                        />
                        <select
                          value={payMethod}
                          onChange={(e) => setPayMethod(e.target.value)}
                          className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-yellow-400"
                        >
                          <option value="CASH">Espèces</option>
                          <option value="MOBILE_MONEY">Mobile Money</option>
                          <option value="CARD">Carte</option>
                          <option value="BANK_TRANSFER">Virement</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setPayAmount(String(Math.round(selectedInvoice.remainingBalance)))}
                          className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-500 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]"
                          title="Solder le reste"
                        >
                          Tout
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={paying || !payAmount}
                        onClick={submitTranche}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-40"
                      >
                        {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {paying ? 'Encaissement...' : 'Encaisser'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Facturation normalisée e-MECeF (DGI) */}
              <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] p-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-600 uppercase text-[var(--text-tertiary)]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Facture normalisée (DGI)
                  </p>
                  {normalizedInfo?.status === 'CONFIRMED' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-600 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Normalisée
                      {normalizedInfo.environment === 'TEST' ? ' (TEST)' : ''}
                    </span>
                  )}
                </div>

                {normalizedInfo?.status === 'CONFIRMED' ? (
                  <div className="space-y-1.5">
                    <div className="text-xs text-[var(--text-secondary)]">
                      <span className="text-[var(--text-tertiary)]">NIM :</span> {normalizedInfo.nim || '—'}
                      {normalizedInfo.counters ? <span className="ml-2 text-[var(--text-tertiary)]">Compteurs : {normalizedInfo.counters}</span> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => openNormalizedPdf(normalizedInfo.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-600 text-emerald-400 transition hover:bg-emerald-500/20"
                    >
                      <FileCheck2 className="h-4 w-4" />
                      Voir la facture normalisée
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {normalizedInfo?.status === 'ERROR' && (
                      <p className="flex items-center gap-1 text-xs text-red-400">
                        <AlertCircle className="h-3 w-3" /> Échec précédent : {normalizedInfo.errorDesc || 'erreur'}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={normalizing}
                      onClick={() => normalizeInvoice(selectedInvoice.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-600 text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)] disabled:opacity-50"
                    >
                      {normalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {normalizing ? 'Normalisation…' : 'Normaliser cette facture'}
                    </button>
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                      Transmet la vente à la DGI et génère la facture normalisée (NIM + QR). Réservé aux administrateurs.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDetail(false); openInvoice(selectedInvoice.id); }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-yellow-300"
                >
                  <FileText className="h-4 w-4" />
                  Voir la facture
                </button>
                <button
                  onClick={() => { setShowDetail(false); downloadInvoice(selectedInvoice.id, selectedInvoice.invoiceNumber); }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-600 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setShowDetail(false); printInvoice(selectedInvoice.id); }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-600 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openTicket(selectedInvoice.id)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-600 text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]"
                  title="Ticket thermique (80mm)"
                >
                  <ReceiptText className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
