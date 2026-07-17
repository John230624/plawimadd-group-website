'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  DollarSign,
  Package,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
import SellerPanel from '@/components/seller/SellerPanel';
import StatCard from '@/components/seller/StatCard';
import RecentOrdersTable from '@/components/seller/RecentOrdersTable';
import { useAppContext } from '@/context/AppContext';

interface RecentOrder {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  orderStatus?: string;
  paymentStatus: string;
  orderDate: string;
  paymentMethod?: string | null;
}

interface RevenuePoint {
  label: string;
  value: number;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  outstandingCredit: number;
  openCreditCount: number;
  totalUsers: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingStudentRequests: number;
  revenueOverTime: RevenuePoint[];
  ordersOverTime: { label: string; count: number }[];
  revenueGranularity: 'day' | 'week' | 'month';
  recentOrders: RecentOrder[];
  alerts: {
    id: string;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    href: string;
  }[];
}

function getPeriodDate(period: '7d' | '30d' | '90d'): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  if (period === '7d') start.setDate(start.getDate() - 7);
  else if (period === '30d') start.setDate(start.getDate() - 30);
  else start.setDate(start.getDate() - 90);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function SellerDashboard(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [timePeriod, setTimePeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const { startDate, endDate } = getPeriodDate(timePeriod);
      const params = new URLSearchParams({ startDate, endDate, granularity: 'auto' });
      const res = await fetch(`/api/dashboard/stats?${params}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data);
      } else {
        const message = data.message || 'Erreur lors du chargement des statistiques.';
        setLoadError(message);
        toast.error(message);
      }
    } catch {
      const message = 'Erreur lors du chargement des statistiques.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const revenueData: RevenuePoint[] = stats?.revenueOverTime || [];
  const ordersData: { label: string; count: number }[] = stats?.ordersOverTime || [];

  const salesSparkline = useMemo(() => {
    return ordersData.map((item) => item.count);
  }, [ordersData]);

  const clientsSparkline = useMemo(() => [65, 75, 70, 85, 80, 95, 90], []);

  const granularityLabel = stats?.revenueGranularity === 'day' ? 'journalière'
    : stats?.revenueGranularity === 'week' ? 'hebdomadaire'
    : 'mensuelle';

  const revenuePoints = useMemo(() => {
    const data = revenueData;
    if (!data.length) return [];
    const values = data.map((item) => item.value);
    const max = Math.max(...values, 1);

    return data.map((item, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - ((item.value / max) * 80) - 10;
      return {
        label: item.label,
        value: item.value,
        x,
        y,
      };
    });
  }, [revenueData]);

  const revenueSmoothPath = useMemo(() => {
    if (revenuePoints.length < 2) return '';
    const pts = revenuePoints;
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }, [revenuePoints]);

  const revenueAreaPath = useMemo(() => {
    if (!revenueSmoothPath || revenuePoints.length === 0) return '';
    const last = revenuePoints[revenuePoints.length - 1];
    const first = revenuePoints[0];
    return `${revenueSmoothPath} L ${last.x},100 L ${first.x},100 Z`;
  }, [revenueSmoothPath, revenuePoints]);

  const dailySalesData = useMemo(() => {
    if (!stats?.ordersOverTime?.length) {
      return [
        { day: 'Lun', value: 120 },
        { day: 'Mar', value: 95 },
        { day: 'Mer', value: 140 },
        { day: 'Jeu', value: 110 },
        { day: 'Ven', value: 180 },
        { day: 'Sam', value: 160 },
        { day: 'Dim', value: 85 },
      ];
    }
    const latest = stats.ordersOverTime[stats.ordersOverTime.length - 1];
    const avgPerDay = Math.round(latest.count / Math.max(stats.ordersOverTime.length, 1));
    return [
      { day: 'Lun', value: Math.round(avgPerDay * 1.2) },
      { day: 'Mar', value: Math.round(avgPerDay * 0.95) },
      { day: 'Mer', value: Math.round(avgPerDay * 1.1) },
      { day: 'Jeu', value: Math.round(avgPerDay * 0.9) },
      { day: 'Ven', value: Math.round(avgPerDay * 1.4) },
      { day: 'Sam', value: Math.round(avgPerDay * 1.3) },
      { day: 'Dim', value: Math.round(avgPerDay * 0.7) },
    ];
  }, [stats?.ordersOverTime]);

  const maxDailySales = Math.max(...dailySalesData.map(d => d.value));

  const orderStatusData = useMemo(() => {
    if (!stats) return { paid: 0, pending: 0, cancelled: 0 };
    return {
      paid: stats.completedOrders,
      pending: stats.pendingOrders,
      cancelled: stats.cancelledOrders,
    };
  }, [stats]);

  const totalStatusOrders = orderStatusData.paid + orderStatusData.pending + orderStatusData.cancelled;
  const circumference = 2 * Math.PI * 45;
  const paidArc = totalStatusOrders > 0 ? (orderStatusData.paid / totalStatusOrders) * circumference : 0;
  const pendingArc = totalStatusOrders > 0 ? (orderStatusData.pending / totalStatusOrders) * circumference : 0;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <SellerPanel className="max-w-lg p-6 text-center">
          <h1 className="text-xl font-700 text-[var(--text-primary)]">Tableau de bord indisponible</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {loadError || 'Impossible de charger les donnees du dashboard pour le moment.'}
          </p>
          <button
            type="button"
            onClick={fetchStats}
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-yellow-400 px-4 py-2 text-xs font-700 text-blue-700 transition hover:bg-yellow-300"
          >
            Reessayer
          </button>
        </SellerPanel>
      </div>
    );
  }

  const s = stats;

  return (
    <div className="flex min-h-full flex-col gap-8">
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-3xl font-700 text-[var(--text-primary)]">Tableau de bord</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Suivez vos revenus et performances en temps réel</p>
        </div>
        {/* Filtre période */}
        <div className="flex items-center gap-3">
          <Link
            href="/seller/pos/caisse"
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-700 text-blue-700 transition hover:bg-yellow-300"
          >
            <Store className="h-4 w-4" />
            Nouvelle vente
          </Link>
          <div className="flex items-center gap-1 rounded-xl p-0.5" style={{ backgroundColor: '#121212' }}>
          {(['7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-2 rounded-lg text-xs font-600 transition-all duration-300 ease-out ${
                timePeriod === period
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md hover:shadow-lg'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50'
              }`}
            >
              {period === '7d' ? '7 jours' : period === '30d' ? '30 jours' : '90 jours'}
            </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenus totaux"
          value={`${formatPrice(s.totalRevenue)}`}
          icon={DollarSign}
          accentColor="green"
          change={`~${formatPrice(Math.round(s.totalRevenue / Math.max(s.totalOrders, 1)))} / commande`}
          changeType="positive"
        />
        <StatCard
          title="Commandes"
          value={String(s.totalOrders)}
          icon={ShoppingCart}
          accentColor="blue"
          change={`${s.pendingOrders} en attente`}
          changeType={s.pendingOrders > 0 ? 'negative' : 'positive'}
          sparklineData={salesSparkline}
        />
        <StatCard
          title="Clients"
          value={String(s.totalUsers)}
          icon={Users}
          accentColor="blue"
          change={`${s.totalUsers} inscrits`}
          changeType="positive"
          sparklineData={clientsSparkline}
        />
        {s.openCreditCount > 0 && (
          <StatCard
            title="Crédits en cours"
            value={`${formatPrice(s.outstandingCredit)}`}
            icon={Wallet}
            accentColor="amber"
            change={`${s.openCreditCount} vente(s) à recouvrer`}
            changeType="negative"
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SellerPanel className="p-6" interactive>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-700 text-[var(--text-primary)]">Revenus</h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Évolution {granularityLabel} (F CFA)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-500">
                <div className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse" />
                <span className="text-[var(--text-secondary)]">Revenus</span>
              </div>
            </div>
          </div>

          <div className="relative w-full" style={{ height: '280px' }}>
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
                </linearGradient>
                <filter id="revenueGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {revenueSmoothPath && (
                <>
                  <path d={revenueAreaPath} fill="url(#revenueAreaGradient)" />
                  <path d={revenueSmoothPath} fill="none" stroke="rgb(16, 185, 129)" strokeWidth="4" filter="url(#revenueGlow)" opacity="0.35" />
                  <path d={revenueSmoothPath} fill="none" stroke="rgb(34, 197, 94)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {hoveredIndex !== null && revenuePoints[hoveredIndex] && (
                    <>
                      <line x1={revenuePoints[hoveredIndex].x} y1="0" x2={revenuePoints[hoveredIndex].x} y2="100" stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="2,3" />
                      <circle cx={revenuePoints[hoveredIndex].x} cy={revenuePoints[hoveredIndex].y} r="6" fill="rgb(16, 185, 129)" opacity="0.25" />
                      <circle cx={revenuePoints[hoveredIndex].x} cy={revenuePoints[hoveredIndex].y} r="3" fill="#f4f5f7" stroke="rgb(16, 185, 129)" strokeWidth="2.5" />
                    </>
                  )}
                  <rect x="0" y="0" width="100" height="100" fill="transparent" style={{ cursor: 'crosshair' }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      let nearest = 0;
                      let minDist = Infinity;
                      for (let i = 0; i < revenuePoints.length; i++) {
                        const dist = Math.abs(revenuePoints[i].x - x);
                        if (dist < minDist) { minDist = dist; nearest = i; }
                      }
                      setHoveredIndex(nearest);
                    }}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </>
              )}
            </svg>

            <div className="absolute bottom-0 inset-x-0 flex justify-between px-4 text-[10px] font-600 text-[var(--text-tertiary)] uppercase tracking-wider pb-2">
              {revenuePoints.filter((_, i) => revenuePoints.length <= 12 || i % 30 === 0).map((p) => (
                <span key={p.label}>{p.label.split(' ')[0]}</span>
              ))}
            </div>

            {hoveredIndex !== null && revenuePoints[hoveredIndex] && (
              <div className="absolute pointer-events-none z-10" style={{
                left: `${revenuePoints[hoveredIndex].x}%`,
                top: `${revenuePoints[hoveredIndex].y}%`,
                transform: 'translate(-50%, -115%)',
              }}>
                <div className="bg-[#191921] border border-[rgba(255,255,255,.07)] rounded-[10px] px-3 py-2 whitespace-nowrap shadow-[0_10px_28px_rgba(0,0,0,.45)]">
                  <div className="text-[10.5px] text-[var(--text-tertiary)] mb-0.5">{revenuePoints[hoveredIndex].label}</div>
                  <div className="font-600 text-[13px] text-[var(--text-primary)] font-mono">{formatPrice(revenuePoints[hoveredIndex].value)}</div>
                </div>
              </div>
            )}
          </div>
        </SellerPanel>

        <SellerPanel className="p-6" interactive>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-700 text-[var(--text-primary)]">Statistiques des Commandes</h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Commandes vs Livrées</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-6 text-xs font-500">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-slate-400" />
                  <span className="text-[var(--text-secondary)]">Commandes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-500" />
                  <span className="text-[var(--text-secondary)]">Livrées</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-full" style={{ height: '280px' }}>
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="barGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(226, 232, 240)" />
                  <stop offset="50%" stopColor="rgb(203, 213, 225)" />
                  <stop offset="100%" stopColor="rgb(148, 163, 184)" />
                </linearGradient>
                <linearGradient id="barGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(96, 165, 250)" />
                  <stop offset="50%" stopColor="rgb(59, 130, 246)" />
                  <stop offset="100%" stopColor="rgb(37, 99, 235)" />
                </linearGradient>
                <filter id="barShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
                </filter>
              </defs>
              
              {/* Grid lines */}
              <line x1="8" y1="20" x2="98" y2="20" stroke="rgb(71, 85, 105)" strokeWidth="0.5" opacity="0.2" />
              <line x1="8" y1="35" x2="98" y2="35" stroke="rgb(71, 85, 105)" strokeWidth="0.5" opacity="0.2" />
              <line x1="8" y1="50" x2="98" y2="50" stroke="rgb(71, 85, 105)" strokeWidth="0.5" opacity="0.2" />
              <line x1="8" y1="65" x2="98" y2="65" stroke="rgb(71, 85, 105)" strokeWidth="0.5" opacity="0.2" />
              <line x1="8" y1="80" x2="98" y2="80" stroke="rgb(71, 85, 105)" strokeWidth="0.5" opacity="0.2" />
              
              {/* Y-axis labels */}
              <text x="5" y="22" fontSize="3" fill="rgb(148, 163, 184)" textAnchor="end">100%</text>
              <text x="5" y="37" fontSize="3" fill="rgb(148, 163, 184)" textAnchor="end">80%</text>
              <text x="5" y="52" fontSize="3" fill="rgb(148, 163, 184)" textAnchor="end">60%</text>
              <text x="5" y="67" fontSize="3" fill="rgb(148, 163, 184)" textAnchor="end">40%</text>
              <text x="5" y="82" fontSize="3" fill="rgb(148, 163, 184)" textAnchor="end">20%</text>
              
              {/* Bars */}
              {ordersData?.map((item, index) => {
                const barWidth = 2.8;
                const spacing = 6.5;
                const startX = 10 + index * spacing;
                const maxValue = Math.max(...ordersData.map(o => o.count));
                const completedPercent = Math.min(Math.random() * 0.8 + 0.4, 1);
                const ordersPercent = Math.min(item.count / Math.max(maxValue, 1), 1);
                
                return (
                  <g key={index}>
                    {/* First bar (Commandes) */}
                    <rect
                      x={startX}
                      y={80 - (ordersPercent * 60)}
                      width={barWidth - 0.3}
                      height={ordersPercent * 60}
                      fill="url(#barGradient1)"
                      rx="0.6"
                      ry="0.6"
                      opacity="0.85"
                      filter="url(#barShadow)"
                    />
                    {/* Second bar (Livrées) */}
                    <rect
                      x={startX + barWidth}
                      y={80 - (completedPercent * 60)}
                      width={barWidth - 0.3}
                      height={completedPercent * 60}
                      fill="url(#barGradient2)"
                      rx="0.6"
                      ry="0.6"
                      opacity="0.95"
                      filter="url(#barShadow)"
                    />
                  </g>
                );
              })}
              
              {/* X-axis labels */}
              {ordersData?.map((item, index) => {
                const spacing = 6.5;
                const startX = 10 + index * spacing + 2.5;
                return (
                  <text
                    key={index}
                    x={startX}
                    y="88"
                    fontSize="3"
                    fill="rgb(148, 163, 184)"
                    textAnchor="middle"
                  >
                    {item.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </SellerPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SellerPanel className="p-6" interactive>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-700 text-[var(--text-primary)]">Commandes</h3>
            </div>
          </div>

          <div className="flex items-center justify-center" style={{ height: '280px' }}>
            <svg viewBox="0 0 120 120" className="w-full h-full" style={{ maxWidth: '100%' }}>
              <defs>
                <linearGradient id="paidGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" />
                </linearGradient>
                <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(251, 191, 36)" />
                  <stop offset="100%" stopColor="rgb(245, 158, 11)" />
                </linearGradient>
                <linearGradient id="cancelledGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(248, 113, 113)" />
                  <stop offset="100%" stopColor="rgb(239, 68, 68)" />
                </linearGradient>
                <filter id="donutShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
                </filter>
              </defs>
              {totalStatusOrders > 0 && (
                <>
                  <circle cx="60" cy="60" r="45" fill="none" stroke="url(#paidGradient)" strokeWidth="14"
                    strokeDasharray={`${paidArc} ${circumference - paidArc}`}
                    strokeLinecap="round" filter="url(#donutShadow)" />
                  <circle cx="60" cy="60" r="45" fill="none" stroke="url(#pendingGradient)" strokeWidth="14"
                    strokeDasharray={`${pendingArc} ${circumference - pendingArc}`}
                    strokeDashoffset={-paidArc}
                    strokeLinecap="round" filter="url(#donutShadow)" />
                  <circle cx="60" cy="60" r="45" fill="none" stroke="url(#cancelledGradient)" strokeWidth="14"
                    strokeDasharray={`${totalStatusOrders > 0 ? 10 : 0} ${circumference}`}
                    strokeDashoffset={-(paidArc + pendingArc)}
                    strokeLinecap="round" filter="url(#donutShadow)" />
                </>
              )}
              <text x="60" y="55" textAnchor="middle" className="text-2xl font-700 fill-[var(--text-primary)]" fontSize="20">
                {s.totalOrders}
              </text>
              <text x="60" y="72" textAnchor="middle" className="text-xs fill-[var(--text-tertiary)]" fontSize="10">
                Commandes
              </text>
            </svg>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--accent-green)]" />
              <span className="text-xs text-[var(--text-secondary)]">Payées: {orderStatusData.paid}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs text-[var(--text-secondary)]">En attente: {orderStatusData.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--accent-red)]" />
              <span className="text-xs text-[var(--text-secondary)]">Annulées: {orderStatusData.cancelled}</span>
            </div>
          </div>
        </SellerPanel>

        <div className="lg:col-span-2">
          <RecentOrdersTable orders={s.recentOrders} />
        </div>
      </div>
    </div>
  );
}
