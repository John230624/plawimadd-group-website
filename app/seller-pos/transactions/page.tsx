'use client';

import React, { useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Loading from '@/components/Loading';

interface PosTransaction {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  finalAmount: number;
  totalAmount: number;
  discount: number;
  paymentMethod: string;
  items: { id: string; productId: string; quantity: number; unitPrice: number; totalPrice: number }[];
  createdAt: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);
}

export default function PosTransactionsPage(): React.ReactElement {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<PosTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/pos/transactions')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTransactions(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = transactions.filter(
    (t) =>
      t.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (t.customerName || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loading /></div>;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Transactions</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-60 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">Aucune transaction</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs font-medium text-gray-500">
                <th className="px-3 py-2">Facture</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Articles</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Remise</th>
                <th className="px-3 py-2">Net</th>
                <th className="px-3 py-2">Paiement</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-medium text-blue-700">{t.invoiceNumber}</td>
                  <td className="px-3 py-2.5 text-gray-600">{new Date(t.createdAt).toLocaleString('fr-FR')}</td>
                  <td className="px-3 py-2.5 text-gray-800">{t.customerName || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600">{t.items?.length || 0}</td>
                  <td className="px-3 py-2.5 text-gray-800">{formatPrice(Number(t.totalAmount))}</td>
                  <td className="px-3 py-2.5 text-green-600">{Number(t.discount) > 0 ? `-${formatPrice(Number(t.discount))}` : '—'}</td>
                  <td className="px-3 py-2.5 font-bold text-gray-900">{formatPrice(Number(t.finalAmount))}</td>
                  <td className="px-3 py-2.5"><span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{t.paymentMethod}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
