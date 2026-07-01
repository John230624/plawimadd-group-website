'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Crown,
  Calendar,
} from 'lucide-react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
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
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  topProducts: TopProduct[];
  monthlyRevenues: MonthlyRevenue[];
  recentOrders: RecentOrder[];
}

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

export default function ReportsPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports');
      const result = await res.json();
      setData(result?.data ?? result);
    } catch {
      toast.error('Impossible de charger les rapports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader title="Rapports & Analytiques" />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Revenus totaux"
          value={formatPrice(data.totalRevenue)}
          description="Chiffre d'affaires global"
          icon={TrendingUp}
          accentColor="green"
        />
        <StatCard
          title="Commandes"
          value={String(data.totalOrders)}
          description="Total des commandes"
          icon={ShoppingCart}
          accentColor="blue"
        />
        <StatCard
          title="Produits"
          value={String(data.totalProducts)}
          description="Produits en catalogue"
          icon={Package}
          accentColor="amber"
        />
        <StatCard
          title="Clients"
          value={String(data.totalCustomers)}
          description="Clients enregistrés"
          icon={Users}
          accentColor="blue"
        />
      </div>

      {/* Top 10 produits */}
      <div className="rounded-[10px] bg-[var(--bg-outer)] p-6">
        <div className="mb-4 flex items-center gap-3">
          <Crown className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Top 10 produits</h2>
        </div>
        {data.topProducts.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">Aucune donnée disponible.</p>
        ) : (
          <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
            <SellerTableHeader>
              <SellerTableRow>
                <SellerTableCell isHeader className="w-12">#</SellerTableCell>
                <SellerTableCell isHeader>Produit</SellerTableCell>
                <SellerTableCell isHeader>Vendus</SellerTableCell>
                <SellerTableCell isHeader>Revenu</SellerTableCell>
              </SellerTableRow>
            </SellerTableHeader>
            <SellerTableBody>
              {data.topProducts.map((product) => (
                <SellerTableRow key={product.rank}>
                  <SellerTableCell>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-hover)] text-sm font-bold text-[var(--text-primary)]">
                      {product.rank}
                    </span>
                  </SellerTableCell>
                  <SellerTableCell className="font-medium text-[var(--text-primary)]">
                    {product.name}
                  </SellerTableCell>
                  <SellerTableCell className="text-[var(--text-secondary)]">
                    {product.totalSold}
                  </SellerTableCell>
                  <SellerTableCell className="font-medium text-[var(--accent-green)]">
                    {formatPrice(product.revenue)}
                  </SellerTableCell>
                </SellerTableRow>
              ))}
            </SellerTableBody>
          </SellerTable>
        )}
      </div>

      {/* Revenus par mois */}
      <div className="rounded-[10px] bg-[var(--bg-outer)] p-6">
        <div className="mb-4 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-[var(--accent-blue)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Revenus par mois</h2>
        </div>
        {data.monthlyRevenues.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">Aucune donnée disponible.</p>
        ) : (
          <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
            <SellerTableHeader>
              <SellerTableRow>
                <SellerTableCell isHeader>Mois</SellerTableCell>
                <SellerTableCell isHeader>Revenus</SellerTableCell>
              </SellerTableRow>
            </SellerTableHeader>
            <SellerTableBody>
              {data.monthlyRevenues.map((item, idx) => (
                <SellerTableRow key={idx}>
                  <SellerTableCell className="font-medium text-[var(--text-primary)]">
                    {item.month}
                  </SellerTableCell>
                  <SellerTableCell className="font-medium text-[var(--accent-green)]">
                    {formatPrice(item.revenue)}
                  </SellerTableCell>
                </SellerTableRow>
              ))}
            </SellerTableBody>
          </SellerTable>
        )}
      </div>

      {/* Dernières commandes */}
      <div className="rounded-[10px] bg-[var(--bg-outer)] p-6">
        <div className="mb-4 flex items-center gap-3">
          <ShoppingCart className="h-5 w-5 text-[var(--accent-blue)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Dernières commandes</h2>
        </div>
        {data.recentOrders.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">Aucune commande récente.</p>
        ) : (
          <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
            <SellerTableHeader>
              <SellerTableRow>
                <SellerTableCell isHeader>Commande</SellerTableCell>
                <SellerTableCell isHeader>Client</SellerTableCell>
                <SellerTableCell isHeader>Total</SellerTableCell>
                <SellerTableCell isHeader>Statut</SellerTableCell>
                <SellerTableCell isHeader>Date</SellerTableCell>
              </SellerTableRow>
            </SellerTableHeader>
            <SellerTableBody>
              {data.recentOrders.map((order) => (
                <SellerTableRow key={order.id}>
                  <SellerTableCell className="font-mono text-sm text-[var(--text-primary)]">
                    #{order.id.slice(0, 8)}
                  </SellerTableCell>
                  <SellerTableCell className="text-[var(--text-primary)]">
                    {order.client}
                  </SellerTableCell>
                  <SellerTableCell className="font-medium text-[var(--text-primary)]">
                    {formatPrice(order.total)}
                  </SellerTableCell>
                  <SellerTableCell>
                    <span className={`text-sm font-medium ${statusColor[order.status] || 'text-[var(--text-secondary)]'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </SellerTableCell>
                  <SellerTableCell className="text-[var(--text-secondary)]">
                    {new Date(order.date).toLocaleDateString('fr-FR')}
                  </SellerTableCell>
                </SellerTableRow>
              ))}
            </SellerTableBody>
          </SellerTable>
        )}
      </div>
    </div>
  );
}
