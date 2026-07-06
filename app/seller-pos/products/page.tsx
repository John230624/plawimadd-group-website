'use client';

import React, { useEffect, useState } from 'react';
import { Package, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Loading from '@/components/Loading';
import type { Product } from '@/lib/types';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);
}

export default function SellerPosProductsPage(): React.ReactElement {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (data?.products) setProducts(data.products);
        else if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loading /></div>;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Produits</h1>
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs font-medium text-gray-500">
              <th className="px-3 py-2">Produit</th>
              <th className="px-3 py-2">Catégorie</th>
              <th className="px-3 py-2">Marque</th>
              <th className="px-3 py-2">Prix</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                      {product.imgUrl?.[0] ? (
                        <img src={product.imgUrl[0]} alt={product.name} className="max-h-8 w-auto object-contain" />
                      ) : (
                        <Package className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                    <span className="font-medium text-gray-800">{product.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-gray-600">{product.category?.name || 'N/A'}</td>
                <td className="px-3 py-2.5 text-gray-600">{product.brand || '—'}</td>
                <td className="px-3 py-2.5 font-medium text-gray-900">{formatPrice(Number(product.offerPrice ?? product.price))}</td>
                <td className="px-3 py-2.5">
                  <span className={`font-medium ${product.stock <= 0 ? 'text-red-500' : product.stock <= 5 ? 'text-amber-500' : 'text-green-600'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/product/${product.id}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                    <ExternalLink className="h-3 w-3" />
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
