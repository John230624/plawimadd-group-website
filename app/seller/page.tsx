'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Box,
  DollarSign,
  Package,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
import Footer from '@/components/seller/Footer';
import SellerPanel from '@/components/seller/SellerPanel';
import { useAppContext } from '@/context/AppContext';

interface RecentOrder {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentStatus: string;
  orderDate: string;
}

interface OrdersPerMonthItem {
  month: string;
  orderCount: number;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  pendingOrders: number;
  recentOrders: RecentOrder[];
  ordersPerMonth: OrdersPerMonthItem[];
}

const monthLabels = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];

function MiniMetricCard({
  title,
  value,
  icon: Icon,
  tone = 'positive',
  change,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'positive' | 'negative' | 'neutral';
  change: string;
}): React.ReactElement {
  const trendStyles =
    tone === 'negative'
      ? 'bg-rose-50 text-rose-600'
      : tone === 'neutral'
        ? 'bg-slate-100 text-slate-600'
        : 'bg-emerald-50 text-emerald-600';

  return (
    <div className="rounded-[1.45rem] border border-[rgba(148,163,184,0.14)] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-slate-950">
            {value}
          </p>
        </div>
        <div className="rounded-2xl bg-[rgba(191,219,254,0.18)] p-3 text-[var(--brand-700)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-slate-400">vs periode recente</p>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${trendStyles}`}>
          {tone === 'negative' ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5" />
          )}
          {change}
        </span>
      </div>
    </div>
  );
}

export default function SellerDashboard(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    pendingOrders: 0,
    recentOrders: [],
    ordersPerMonth: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Impossible de charger les statistiques.');
        }

        setStats({
          totalProducts: data.totalProducts || 0,
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
          totalUsers: data.totalUsers || 0,
          pendingOrders: data.pendingOrders || 0,
          recentOrders: data.recentOrders || [],
          ordersPerMonth: data.ordersPerMonth || [],
        });
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : 'Erreur lors du chargement du dashboard.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const reportPoints = useMemo(() => {
    const values = stats.ordersPerMonth.map((item) => item.orderCount);
    const max = Math.max(...values, 1);

    return stats.ordersPerMonth.map((item, index) => {
      const [year, month] = item.month.split('-');
      const x = stats.ordersPerMonth.length === 1 ? 0 : (index / (stats.ordersPerMonth.length - 1)) * 100;
      const y = 100 - (item.orderCount / max) * 100;

      return {
        label: `${monthLabels[Number(month) - 1]} ${year.slice(2)}`,
        value: item.orderCount,
        x,
        y,
      };
    });
  }, [stats.ordersPerMonth]);

  const pathData = useMemo(() => {
    if (reportPoints.length === 0) return '';
    return reportPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
      .join(' ');
  }, [reportPoints]);

  const topCountries = [
    { name: 'Benin', value: 72 },
    { name: 'Cote d Ivoire', value: 58 },
    { name: 'Togo', value: 44 },
    { name: 'Senegal', value: 36 },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative w-full md:w-[320px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher dans le dashboard"
              className="w-full rounded-full border border-[rgba(148,163,184,0.16)] bg-white px-11 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--brand-300)]"
            />
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand-700)]">
              Overview
            </p>
            <h1 className="mt-1 text-[2.25rem] font-semibold tracking-[-0.05em] text-slate-950 md:text-[2.75rem]">
              Vue generale
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-[rgba(148,163,184,0.16)] bg-white px-4 py-2 text-sm text-slate-600">
            20 - 26 mars 2026
          </div>
          <div className="rounded-full border border-[rgba(148,163,184,0.16)] bg-white px-4 py-2 text-sm font-medium text-slate-700">
            Cette semaine
          </div>
        </div>
      </div>

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MiniMetricCard
          title="Transactions"
          value={formatPrice(stats.totalRevenue)}
          icon={DollarSign}
          change="+34%"
          tone="positive"
        />
        <MiniMetricCard
          title="Produits"
          value={String(stats.totalProducts)}
          icon={Package}
          change="+8%"
          tone="positive"
        />
        <MiniMetricCard
          title="Commandes completes"
          value={String(
            stats.recentOrders.filter((order) => order.paymentStatus === 'COMPLETED').length
          )}
          icon={ShoppingCart}
          change="+20%"
          tone="positive"
        />
        <MiniMetricCard
          title="Commandes annulees"
          value={String(stats.pendingOrders)}
          icon={Box}
          change="-12%"
          tone="negative"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <SellerPanel className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">This month sales report</p>
              <div className="mt-2 flex items-center gap-3">
                <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-slate-950">
                  {formatPrice(stats.totalRevenue)}
                </h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  +34%
                </span>
              </div>
            </div>

            <div className="rounded-full border border-[rgba(148,163,184,0.16)] bg-white px-4 py-2 text-sm text-slate-600">
              Mensuel
            </div>
          </div>

          <div className="mt-8">
            <div className="relative h-[320px] rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(239,246,255,0.9),rgba(255,255,255,0.8))] p-5">
              <div className="absolute inset-x-5 top-5 bottom-12">
                <div className="flex h-full flex-col justify-between">
                  {[200, 150, 100, 50, 0].map((label) => (
                    <div key={label} className="flex items-center gap-4">
                      <span className="w-8 text-xs text-slate-400">{label}</span>
                      <div className="h-px flex-1 border-t border-dashed border-slate-200" />
                    </div>
                  ))}
                </div>
              </div>

              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-x-16 top-10 bottom-16 h-[250px] w-[calc(100%-5rem)]"
              >
                <path
                  d={pathData}
                  fill="none"
                  stroke="rgb(37 99 235)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="absolute inset-x-8 bottom-5 grid grid-cols-6 gap-2">
                {reportPoints.map((point) => (
                  <div key={point.label} className="text-center">
                    <p className="text-xs text-slate-400">{point.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SellerPanel>

        <SellerPanel className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Top sell by country</p>
              <h2 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">
                Repartition geographique
              </h2>
            </div>
            <div className="rounded-full border border-[rgba(148,163,184,0.16)] bg-white px-4 py-2 text-sm text-slate-600">
              Mensuel
            </div>
          </div>

          <div className="mt-6 rounded-[1.4rem] bg-[linear-gradient(180deg,rgba(241,245,249,0.9),rgba(248,250,252,0.95))] p-5">
            <div className="aspect-[1.25/0.78] rounded-[1.2rem] bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_70%_45%,rgba(59,130,246,0.10),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,245,249,0.96))]" />
          </div>

          <div className="mt-6 space-y-5">
            {topCountries.map((country) => (
              <div key={country.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{country.name}</span>
                  <span className="text-slate-500">{country.value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div
                    className="h-2.5 rounded-full bg-[linear-gradient(90deg,var(--brand-500),var(--brand-700))]"
                    style={{ width: `${country.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SellerPanel>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <SellerPanel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <p className="text-sm font-medium text-slate-500">Transactions</p>
              <h2 className="mt-1 text-[1.4rem] font-semibold tracking-[-0.04em] text-slate-950">
                Recent transactions
              </h2>
            </div>
            <Link
              href="/seller/orders"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-700)]"
            >
              Voir plus
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Montant</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order) => (
                    <tr key={order.orderId} className="border-t border-slate-100">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        #{order.orderId.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{order.customerName || 'Client'}</p>
                        <p className="text-slate-500">{order.customerEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                          {order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center text-slate-500">
                      Aucune transaction recente pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SellerPanel>

        <SellerPanel className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Top metrics</p>
              <h2 className="mt-1 text-[1.4rem] font-semibold tracking-[-0.04em] text-slate-950">
                Vue rapide
              </h2>
            </div>
            <Users className="h-5 w-5 text-slate-300" />
          </div>

          <div className="mt-6 space-y-4">
            {[
              { label: 'Clients actifs', value: stats.totalUsers, pct: 76 },
              { label: 'Produits suivis', value: stats.totalProducts, pct: 68 },
              { label: 'Commandes traitees', value: stats.totalOrders, pct: 61 },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.3rem] bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="mt-1 text-[1.15rem] font-semibold text-slate-950">{item.value}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-500">{item.pct}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,var(--brand-500),var(--brand-700))]"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SellerPanel>
      </section>

      <Footer />
    </div>
  );
}
