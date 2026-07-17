'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BadgeDollarSign,
  BarChart3,
  Calendar,
  Crown,
  DollarSign,
  Download,
  Eye,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  Warehouse,
} from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Loading from '@/components/Loading';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerModal from '@/components/seller/SellerModal';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerPagination from '@/components/seller/SellerPagination';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import StatCard from '@/components/seller/StatCard';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';
import { useAppContext } from '@/context/AppContext';

interface TopProduct {
  rank: number;
  name: string;
  totalSold: number;
  revenue: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface RecentOrder {
  id: string;
  client: string;
  total: number;
  status: string;
  date: string;
}

interface ReportsData {
  success: boolean;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  topProducts: TopProduct[];
  monthlyRevenues: MonthlyRevenue[];
  recentOrders: RecentOrder[];
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  totalStockUnits: number;
  stockValueAtSellingPrice: number;
  stockValueAtCostPrice: number;
  stockProfitPotential: number;
  productsAddedThisPeriod: number;
  productsAddedToday: number;
  totalCostOfGoodsSold: number;
  realizedProfit: number;
  profitMargin: number;
  fullyCostedOrders: number;
}

const pageSize = 10;

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

const statusColor: Record<string, string> = {
  PENDING: 'text-amber-400',
  PROCESSING: 'text-[var(--accent-blue)]',
  SHIPPED: 'text-[var(--accent-green)]',
  DELIVERED: 'text-[var(--accent-green)]',
  CANCELLED: 'text-[var(--accent-red)]',
};

type SortField = 'date' | 'total';
type SortDir = 'asc' | 'desc';

const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function ReportsPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'date', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);
  const [topPage, setTopPage] = useState(1);
  const [monthPage, setMonthPage] = useState(1);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('sortBy', sort.field);
      params.set('sortOrder', sort.dir);
      const res = await fetch(`/api/admin/reports?${params}`);
      const result = await res.json();
      setData(result?.success ? result : result?.data ?? result);
    } catch {
      toast.error('Impossible de charger les rapports.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, sort]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

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

  const paginatedTop = useMemo(() => {
    if (!data?.topProducts) return [];
    const start = (topPage - 1) * pageSize;
    return data.topProducts.slice(start, start + pageSize);
  }, [data?.topProducts, topPage]);

  const paginatedMonths = useMemo(() => {
    if (!data?.monthlyRevenues) return [];
    const start = (monthPage - 1) * pageSize;
    return data.monthlyRevenues.slice(start, start + pageSize);
  }, [data?.monthlyRevenues, monthPage]);

  const paginatedOrders = useMemo(() => {
    if (!data?.recentOrders) return [];
    const start = (page - 1) * pageSize;
    return data.recentOrders.slice(start, start + pageSize);
  }, [data?.recentOrders, page]);

  function exportCSV() {
    if (!data) return;
    const header = 'Rang;Produit;Vendus;Revenu\n---\n';
    const topRows = data.topProducts.map((p) =>
      [p.rank, `"${p.name}"`, p.totalSold, p.revenue].join(';')
    ).join('\n');
    const orderHeader = '\n---\nID;Client;Total;Statut;Date\n';
    const orderRows = data.recentOrders.map((o) =>
      [`#${o.id.slice(0, 8)}`, `"${o.client}"`, o.total, o.status, new Date(o.date).toLocaleDateString('fr-FR')].join(';')
    ).join('\n');
    const csv = '\uFEFF' + header + topRows + orderHeader + orderRows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapports_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    if (!data) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageW, 50, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(241, 245, 249);
    doc.text('Rapports & Analytiques', 20, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 32);

    const statsY = 60;
    const statWidth = (pageW - 40) / 4;
    const boxes = [
      { label: 'Revenus totaux', value: formatPrice(data.totalRevenue), color: [16, 185, 129] },
      { label: 'Bénéfice net', value: formatPrice(data.realizedProfit), color: data.realizedProfit >= 0 ? [16, 185, 129] : [239, 68, 68] },
      { label: 'Commandes', value: String(data.totalOrders), color: [59, 130, 246] },
      { label: 'Stock', value: `${data.totalStockUnits} unités`, color: [245, 158, 11] },
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
      head: [['#', 'Produit', 'Vendus', 'Revenu']],
      body: data.topProducts.map((p) => [String(p.rank), p.name, String(p.totalSold), formatPrice(p.revenue)]),
      startY: statsY + 32,
      styles: { fontSize: 7, textColor: [241, 245, 249], fillColor: [18, 18, 18], lineColor: [30, 41, 59], lineWidth: 0.3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [24, 24, 24] },
      margin: { top: statsY + 32, bottom: 20 },
    });
    doc.save(`rapports_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-3xl font-700 text-[var(--text-primary)]">Rapports & Analytiques</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {data.totalOrders} commande(s) · {data.totalStockUnits} unité(s) en stock · {formatPrice(data.totalRevenue)} CA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl p-0.5" style={{ backgroundColor: '#121212' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="h-8 w-[130px] rounded-lg border-0 bg-transparent px-2.5 text-xs text-[var(--text-primary)] outline-none [color-scheme:dark]"
              title="Date début"
            />
            <span className="text-xs text-[var(--text-tertiary)]">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="h-8 w-[130px] rounded-lg border-0 bg-transparent px-2.5 text-xs text-[var(--text-primary)] outline-none [color-scheme:dark]"
              title="Date fin"
            />
          </div>
          <SellerButton variant="outline" size="sm" icon={Download} onClick={exportCSV}>CSV</SellerButton>
          <SellerButton variant="outline" size="sm" icon={Download} onClick={exportPDF}>PDF</SellerButton>
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenus totaux"
          value={`${formatPrice(data.totalRevenue)}`}
          icon={TrendingUp}
          accentColor="green"
          change={`${data.todayRevenue > 0 ? '+' : ''}${formatPrice(data.todayRevenue)} aujourd'hui`}
          changeType={data.todayRevenue > 0 ? 'positive' : 'neutral'}
        />
        <StatCard
          title={data.realizedProfit >= 0 ? 'Bénéfice net' : 'Perte nette'}
          value={`${formatPrice(Math.abs(data.realizedProfit))}`}
          description={`Marge ${data.profitMargin}%`}
          icon={data.realizedProfit >= 0 ? BadgeDollarSign : TrendingDown}
          accentColor={data.realizedProfit >= 0 ? 'green' : 'red'}
          change={`Coût ventes: ${formatPrice(data.totalCostOfGoodsSold)}`}
          changeType={data.realizedProfit >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Commandes"
          value={String(data.totalOrders)}
          icon={ShoppingCart}
          accentColor="blue"
          change={`${data.pendingOrders} en attente · ${data.todayOrders} aujourd'hui`}
          changeType={data.pendingOrders > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          title="Stock"
          value={`${data.totalStockUnits} unités`}
          description={`${formatPrice(data.stockValueAtSellingPrice)} valeur vente`}
          icon={Warehouse}
          accentColor="amber"
          change={`${data.productsAddedThisPeriod} nouveau(x)`}
          changeType="positive"
        />
      </div>

      {/* Revenus par mois + Top produits */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SellerPanel className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-[var(--accent-blue)]" />
            <h2 className="text-lg font-700 text-[var(--text-primary)]">Revenus par mois</h2>
          </div>
          {data.monthlyRevenues.length === 0 ? (
            <SellerEmptyState title="Aucun revenu" description="Aucune donnée disponible." icon={BarChart3} />
          ) : (
            <div className="space-y-3">
              {paginatedMonths.map((item, idx) => {
                const [y, m] = item.month.split('-');
                const maxVal = Math.max(...data.monthlyRevenues.map((r) => r.revenue), 1);
                const pct = (item.revenue / maxVal) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs text-[var(--text-secondary)]">
                      {monthLabels[Number(m) - 1]} {y}
                    </span>
                    <div className="flex h-6 flex-1 overflow-hidden rounded bg-[var(--bg-hover)]">
                      <div className="h-full rounded bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-28 text-right text-xs font-medium text-[var(--text-primary)]">{formatPrice(item.revenue)}</span>
                  </div>
                );
              })}
              <SellerPagination page={monthPage} pageSize={pageSize} totalItems={data.monthlyRevenues.length} onPageChange={setMonthPage} />
            </div>
          )}
        </SellerPanel>

        <SellerPanel className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Crown className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-700 text-[var(--text-primary)]">Top produits</h2>
          </div>
          {data.topProducts.length === 0 ? (
            <SellerEmptyState title="Aucun produit" description="Aucune donnée disponible." icon={Package} />
          ) : (
            <>
              <div className="space-y-2">
                {paginatedTop.map((product) => (
                  <div key={product.rank} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-3 py-2.5 transition hover:border-amber-400/30">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-primary)]">
                      {product.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{product.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{product.totalSold} vendu(s)</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[var(--accent-green)]">{formatPrice(product.revenue)}</span>
                  </div>
                ))}
              </div>
              <SellerPagination page={topPage} pageSize={pageSize} totalItems={data.topProducts.length} onPageChange={setTopPage} />
            </>
          )}
        </SellerPanel>
      </div>

      {/* Analyse stock + Résumé période */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SellerPanel className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Warehouse className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-700 text-[var(--text-primary)]">Analyse du stock</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-medium text-[var(--text-tertiary)]">Valeur de vente</p>
              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{formatPrice(data.stockValueAtSellingPrice)}</p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{data.totalStockUnits} unité(s) en stock</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-medium text-[var(--text-tertiary)]">Valeur de revient</p>
              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{formatPrice(data.stockValueAtCostPrice)}</p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Coût d'achat estimé</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-medium text-[var(--text-tertiary)]">Potentiel de gain</p>
              <p className="mt-1 text-xl font-bold text-emerald-400">{formatPrice(data.stockProfitPotential)}</p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Marge si tout vendu au prix actuel</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-medium text-[var(--text-tertiary)]">Produits en catalogue</p>
              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{data.totalProducts}</p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{data.productsAddedToday} ajouté(s) aujourd'hui</p>
            </div>
          </div>
        </SellerPanel>

        <SellerPanel className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-[var(--accent-blue)]" />
            <h2 className="text-lg font-700 text-[var(--text-primary)]">Résumé de la période</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-medium text-[var(--text-tertiary)]">Clients</p>
              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{data.totalCustomers}</p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Enregistrés</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-medium text-[var(--text-tertiary)]">Panier moyen</p>
              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{formatPrice(data.averageOrderValue)}</p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Par commande</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-medium text-[var(--text-tertiary)]">Aujourd'hui</p>
              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{formatPrice(data.todayRevenue)}</p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{data.todayOrders} commande(s)</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] p-4">
              <p className="text-xs font-medium text-[var(--text-tertiary)]">En attente</p>
              <p className="mt-1 text-xl font-bold text-amber-400">{data.pendingOrders}</p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Commande(s) à traiter</p>
            </div>
          </div>
        </SellerPanel>
      </div>

      {/* Dernières commandes */}
      <SellerPanel className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <ShoppingCart className="h-5 w-5 text-[var(--accent-blue)]" />
          <h2 className="text-lg font-700 text-[var(--text-primary)]">Dernières commandes</h2>
        </div>
        {data.recentOrders.length === 0 ? (
          <SellerEmptyState title="Aucune commande" description="Aucune commande récente." icon={ShoppingCart} />
        ) : (
          <>
            <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
              <SellerTableHeader>
                <SellerTableRow>
                  <SellerTableCell isHeader className="text-center">Commande</SellerTableCell>
                  <SellerTableCell isHeader className="text-center">Client</SellerTableCell>
                  <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('total')}>
                    <span className="inline-flex items-center">Total <SortIcon field="total" /></span>
                  </SellerTableCell>
                  <SellerTableCell isHeader className="text-center">Statut</SellerTableCell>
                  <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('date')}>
                    <span className="inline-flex items-center">Date <SortIcon field="date" /></span>
                  </SellerTableCell>
                  <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
                </SellerTableRow>
              </SellerTableHeader>
              <SellerTableBody>
                {paginatedOrders.map((order) => (
                  <SellerTableRow key={order.id}>
                    <SellerTableCell className="text-center font-mono text-sm text-[var(--text-primary)]">
                      #{order.id.slice(0, 8)}
                    </SellerTableCell>
                    <SellerTableCell className="text-center text-[var(--text-primary)]">
                      {order.client}
                    </SellerTableCell>
                    <SellerTableCell className="text-center font-medium text-[var(--text-primary)]">
                      {formatPrice(order.total)}
                    </SellerTableCell>
                    <SellerTableCell className="text-center">
                      <span className={`text-sm font-medium ${statusColor[order.status] || 'text-[var(--text-secondary)]'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </SellerTableCell>
                    <SellerTableCell className="text-center text-[var(--text-secondary)]">
                      {new Date(order.date).toLocaleDateString('fr-FR')}
                    </SellerTableCell>
                    <SellerTableCell className="text-center">
                      <SellerButton variant="ghost" size="icon" icon={Eye} onClick={() => setSelectedOrder(order)}>
                        Détail
                      </SellerButton>
                    </SellerTableCell>
                  </SellerTableRow>
                ))}
              </SellerTableBody>
            </SellerTable>
            <SellerPagination page={page} pageSize={pageSize} totalItems={data.recentOrders.length} onPageChange={setPage} />
          </>
        )}
      </SellerPanel>

      {/* Modal détail commande */}
      <SellerModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title="Détail de la commande"
        size="sm"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Commande</p>
              <p className="font-mono text-sm text-[var(--text-primary)]">#{selectedOrder.id.slice(0, 8)}</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Client</p>
              <p className="text-sm text-[var(--text-primary)]">{selectedOrder.client}</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Total</p>
              <p className="text-lg font-semibold text-[var(--accent-green)]">{formatPrice(selectedOrder.total)}</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Statut</p>
              <span className={`text-sm font-medium ${statusColor[selectedOrder.status] || 'text-[var(--text-secondary)]'}`}>
                {statusLabels[selectedOrder.status] || selectedOrder.status}
              </span>
            </div>
            <div className="rounded-lg bg-[var(--bg-outer)] p-4">
              <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Date</p>
              <p className="text-sm text-[var(--text-primary)]">
                {new Date(selectedOrder.date).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        )}
      </SellerModal>
    </div>
  );
}
