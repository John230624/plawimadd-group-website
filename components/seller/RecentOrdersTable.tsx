'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export interface RecentOrder {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  orderStatus?: string;
  paymentStatus: string;
  orderDate: string;
  paymentMethod?: string | null;
}

interface RecentOrdersTableProps {
  orders?: RecentOrder[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  DELIVERED: { label: 'Livrée', className: 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]' },
  PAID_SUCCESS: { label: 'Payée', className: 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]' },
  PROCESSING: { label: 'En cours', className: 'bg-blue-500/10 text-blue-400' },
  SHIPPED: { label: 'Expédiée', className: 'bg-blue-500/10 text-blue-400' },
  PENDING: { label: 'En attente', className: 'bg-amber-500/10 text-amber-400' },
  ON_HOLD: { label: 'En attente', className: 'bg-amber-500/10 text-amber-400' },
  CANCELLED: { label: 'Annulée', className: 'bg-[var(--accent-red)]/10 text-[var(--accent-red)]' },
  PAYMENT_FAILED: { label: 'Échouée', className: 'bg-[var(--accent-red)]/10 text-[var(--accent-red)]' },
};

function getStatus(order: RecentOrder): { label: string; className: string } {
  const key = order.orderStatus || order.paymentStatus || 'PENDING';
  return statusConfig[key] || { label: key, className: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]' };
}

export default function RecentOrdersTable({
  orders = [],
}: RecentOrdersTableProps): React.ReactElement {
  const { formatPrice } = useAppContext();

  return (
    <div className="rounded-[10px] bg-[var(--bg-outer)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-700 text-[var(--text-primary)]">Commandes récentes</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Vos dernières commandes</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/seller/orders" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-xs font-600 text-white shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.97]">
            Voir tout
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingCart className="mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
          <p className="text-sm font-500 text-[var(--text-secondary)]">Aucune commande récente</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Les dernières commandes apparaîtront ici.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left font-600 text-[var(--text-secondary)]">Client</th>
                <th className="px-4 py-3 text-left font-600 text-[var(--text-secondary)]">Date</th>
                <th className="px-4 py-3 text-left font-600 text-[var(--text-secondary)]">Montant</th>
                <th className="px-4 py-3 text-left font-600 text-[var(--text-secondary)]">Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = getStatus(order);
                return (
                  <tr key={order.orderId} className="border-b border-[var(--border)] transition-colors duration-300 hover:bg-[var(--bg-hover)]">
                    {/* Client */}
                    <td className="px-4 py-4">
                      <p className="font-600 text-[var(--text-primary)]">{order.customerName || 'Client'}</p>
                      {order.customerEmail && (
                        <p className="text-xs text-[var(--text-secondary)]">{order.customerEmail}</p>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-[var(--text-secondary)]">
                      {new Date(order.orderDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Montant */}
                    <td className="px-4 py-4 font-600 text-[var(--text-primary)]">{formatPrice(order.totalAmount)}</td>

                    {/* Statut */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-600 ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
