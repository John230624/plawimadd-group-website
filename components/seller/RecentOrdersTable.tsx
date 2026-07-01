'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  variants: number;
  image: string;
  price: number;
  category: string;
  status: 'delivered' | 'pending' | 'canceled';
}

interface RecentOrdersTableProps {
  orders?: OrderItem[];
  period?: 'week' | 'month' | 'year';
}

const weekOrders: OrderItem[] = [
  {
    id: 'w1',
    productName: 'MacBook Air M3',
    variants: 1,
    image: '🖥️',
    price: 1299.00,
    category: 'Laptop',
    status: 'delivered',
  },
  {
    id: 'w2',
    productName: 'AirPods Pro',
    variants: 1,
    image: '🎧',
    price: 249.00,
    category: 'Accessories',
    status: 'pending',
  },
  {
    id: 'w3',
    productName: 'iPhone 15',
    variants: 1,
    image: '📱',
    price: 999.00,
    category: 'SmartPhone',
    status: 'delivered',
  },
];

const monthOrders: OrderItem[] = [
  {
    id: 'm1',
    productName: 'MacBook Pro 13"',
    variants: 2,
    image: '🖥️',
    price: 2399.00,
    category: 'Laptop',
    status: 'delivered',
  },
  {
    id: 'm2',
    productName: 'Apple Watch Ultra',
    variants: 1,
    image: '⌚',
    price: 879.00,
    category: 'Watch',
    status: 'pending',
  },
  {
    id: 'm3',
    productName: 'iPhone 15 Pro Max',
    variants: 2,
    image: '📱',
    price: 1869.00,
    category: 'SmartPhone',
    status: 'delivered',
  },
  {
    id: 'm4',
    productName: 'iPad Pro 3rd Gen',
    variants: 2,
    image: '📱',
    price: 1699.00,
    category: 'Electronics',
    status: 'canceled',
  },
  {
    id: 'm5',
    productName: 'AirPods Pro 2nd Gen',
    variants: 1,
    image: '🎧',
    price: 240.00,
    category: 'Accessories',
    status: 'delivered',
  },
];

const yearOrders: OrderItem[] = [
  {
    id: 'y1',
    productName: 'MacBook Pro 16"',
    variants: 3,
    image: '🖥️',
    price: 3499.00,
    category: 'Laptop',
    status: 'delivered',
  },
  {
    id: 'y2',
    productName: 'Apple Vision Pro',
    variants: 1,
    image: '🥽',
    price: 4299.00,
    category: 'Accessories',
    status: 'pending',
  },
  {
    id: 'y3',
    productName: 'iPhone 15 Pro Max',
    variants: 3,
    image: '📱',
    price: 1869.00,
    category: 'SmartPhone',
    status: 'delivered',
  },
  {
    id: 'y4',
    productName: 'iPad Pro 3rd Gen',
    variants: 2,
    image: '📱',
    price: 1699.00,
    category: 'Electronics',
    status: 'delivered',
  },
  {
    id: 'y5',
    productName: 'Apple Watch Ultra',
    variants: 2,
    image: '⌚',
    price: 879.00,
    category: 'Watch',
    status: 'canceled',
  },
  {
    id: 'y6',
    productName: 'AirPods Pro 2nd Gen',
    variants: 1,
    image: '🎧',
    price: 240.00,
    category: 'Accessories',
    status: 'delivered',
  },
  {
    id: 'y7',
    productName: 'Mac Mini M4',
    variants: 1,
    image: '🖥️',
    price: 1599.00,
    category: 'Desktop',
    status: 'pending',
  },
  {
    id: 'y8',
    productName: 'Studio Display',
    variants: 1,
    image: '🖥️',
    price: 1799.00,
    category: 'Accessories',
    status: 'delivered',
  },
];

const periodOrderMap: Record<string, OrderItem[]> = {
  week: weekOrders,
  month: monthOrders,
  year: yearOrders,
};

export default function RecentOrdersTable({
  orders,
  period = 'month',
}: RecentOrdersTableProps): React.ReactElement {
  const displayOrders = orders ?? periodOrderMap[period] ?? monthOrders;
  const statusConfig = {
    delivered: {
      label: 'Livré',
      className: 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]',
    },
    pending: {
      label: 'En attente',
      className: 'bg-amber-500/10 text-amber-400',
    },
    canceled: {
      label: 'Annulé',
      className: 'bg-[var(--accent-red)]/10 text-[var(--accent-red)]',
    },
  };

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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left font-600 text-[var(--text-secondary)]">Produits</th>
              <th className="px-4 py-3 text-left font-600 text-[var(--text-secondary)]">Catégorie</th>
              <th className="px-4 py-3 text-left font-600 text-[var(--text-secondary)]">Prix</th>
              <th className="px-4 py-3 text-left font-600 text-[var(--text-secondary)]">Statut</th>
            </tr>
          </thead>
          <tbody>
            {displayOrders.map((order) => (
              <tr key={order.id} className="border-b border-[var(--border)] transition-colors duration-300 hover:bg-[var(--bg-hover)]">
                {/* Product */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center text-lg">
                      {order.image}
                    </div>
                    <div>
                      <p className="font-600 text-[var(--text-primary)]">{order.productName}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{order.variants} Variant{order.variants > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-4 py-4 text-[var(--text-secondary)]">{order.category}</td>

                {/* Price */}
                <td className="px-4 py-4 font-600 text-[var(--text-primary)]">${order.price.toFixed(2)}</td>

                {/* Status */}
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-600 ${statusConfig[order.status].className}`}>
                    {statusConfig[order.status].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
