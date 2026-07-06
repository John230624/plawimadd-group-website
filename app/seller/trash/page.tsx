'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Archive } from 'lucide-react';
import { toast } from 'react-toastify';

import SellerButton from '@/components/seller/SellerButton';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import Loading from '@/components/Loading';
import {
  SellerTable, SellerTableBody, SellerTableCell, SellerTableHeader, SellerTableRow,
} from '@/components/seller/SellerTable';

interface TrashItem {
  id: string;
  type: string;
  label: string;
  deletedAt: string;
  name?: string;
  category?: { name: string };
  totalAmount?: number;
}

export default function TrashPage(): React.ReactElement {
  const [items, setItems] = useState<{ products: TrashItem[]; categories: TrashItem[]; orders: TrashItem[] }>({ products: [], categories: [], orders: [] });
  const [purgeCount, setPurgeCount] = useState({ products: 0, categories: 0, orders: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/trash');
      const data = await res.json();
      setItems(data.items);
      setPurgeCount(data.purgeCount);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrash(); }, []);

  const handleAction = async (id: string, type: string, action: string) => {
    setActionLoading(`${action}-${id}`);
    try {
      const res = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, action }),
      });
      if (!res.ok) throw new Error();
      toast.success(action === 'restore' ? 'Élément restauré' : 'Élément supprimé');
      await fetchTrash();
    } catch { toast.error('Erreur'); }
    finally { setActionLoading(null); }
  };

  const handlePurge = async (type: string) => {
    if (!confirm(`Supprimer définitivement tous les ${type}s de plus de 30 jours ?`)) return;
    setActionLoading(`purge-${type}`);
    try {
      const res = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action: 'purge-all' }),
      });
      if (!res.ok) throw new Error();
      toast.success('Purge effectuée');
      await fetchTrash();
    } catch { toast.error('Erreur'); }
    finally { setActionLoading(null); }
  };

  const allItems = [...items.products, ...items.categories, ...items.orders];
  const totalPurge = purgeCount.products + purgeCount.categories + purgeCount.orders;

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loading /></div>;

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader
        title="Corbeille"
        action={
          totalPurge > 0 && (
            <div className="flex gap-2">
              <span className="text-sm text-[var(--text-tertiary)]">{totalPurge} élément(s) à purger</span>
            </div>
          )
        }
      />

      {allItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-[var(--text-tertiary)]">
          <Archive className="h-12 w-12" />
          <p className="text-sm">La corbeille est vide</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Products */}
          {items.products.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Produits ({items.products.length})</h3>
                {purgeCount.products > 0 && <SellerButton variant="outline" size="sm" onClick={() => handlePurge('product')} disabled={actionLoading === 'purge-product'}>Purger ({purgeCount.products})</SellerButton>}
              </div>
              <SellerTable>
                <SellerTableHeader>
                  <SellerTableRow>
                    <SellerTableCell isHeader>Nom</SellerTableCell>
                    <SellerTableCell isHeader className="text-center">Supprimé le</SellerTableCell>
                    <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
                  </SellerTableRow>
                </SellerTableHeader>
                <SellerTableBody>
                  {items.products.map((item) => (
                    <SellerTableRow key={item.id}>
                      <SellerTableCell className="text-[var(--text-primary)]">{item.label}</SellerTableCell>
                      <SellerTableCell className="text-center text-[var(--text-secondary)]">{new Date(item.deletedAt).toLocaleDateString('fr-FR')}</SellerTableCell>
                      <SellerTableCell className="text-center">
                        <div className="inline-flex gap-2">
                          <SellerButton variant="outline" size="sm" icon={RotateCcw} disabled={actionLoading === `restore-${item.id}`} onClick={() => handleAction(item.id, 'product', 'restore')}>Restaurer</SellerButton>
                          <SellerButton variant="danger" size="sm" icon={Trash2} disabled={actionLoading === `delete-${item.id}`} onClick={() => handleAction(item.id, 'product', 'delete')}>Supprimer</SellerButton>
                        </div>
                      </SellerTableCell>
                    </SellerTableRow>
                  ))}
                </SellerTableBody>
              </SellerTable>
            </div>
          )}

          {/* Categories */}
          {items.categories.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Catégories ({items.categories.length})</h3>
                {purgeCount.categories > 0 && <SellerButton variant="outline" size="sm" onClick={() => handlePurge('category')} disabled={actionLoading === 'purge-category'}>Purger ({purgeCount.categories})</SellerButton>}
              </div>
              <SellerTable>
                <SellerTableHeader>
                  <SellerTableRow>
                    <SellerTableCell isHeader>Nom</SellerTableCell>
                    <SellerTableCell isHeader className="text-center">Supprimé le</SellerTableCell>
                    <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
                  </SellerTableRow>
                </SellerTableHeader>
                <SellerTableBody>
                  {items.categories.map((item) => (
                    <SellerTableRow key={item.id}>
                      <SellerTableCell className="text-[var(--text-primary)]">{item.label}</SellerTableCell>
                      <SellerTableCell className="text-center text-[var(--text-secondary)]">{new Date(item.deletedAt).toLocaleDateString('fr-FR')}</SellerTableCell>
                      <SellerTableCell className="text-center">
                        <div className="inline-flex gap-2">
                          <SellerButton variant="outline" size="sm" icon={RotateCcw} disabled={actionLoading === `restore-${item.id}`} onClick={() => handleAction(item.id, 'category', 'restore')}>Restaurer</SellerButton>
                          <SellerButton variant="danger" size="sm" icon={Trash2} disabled={actionLoading === `delete-${item.id}`} onClick={() => handleAction(item.id, 'category', 'delete')}>Supprimer</SellerButton>
                        </div>
                      </SellerTableCell>
                    </SellerTableRow>
                  ))}
                </SellerTableBody>
              </SellerTable>
            </div>
          )}

          {/* Orders */}
          {items.orders.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Commandes ({items.orders.length})</h3>
                {purgeCount.orders > 0 && <SellerButton variant="outline" size="sm" onClick={() => handlePurge('order')} disabled={actionLoading === 'purge-order'}>Purger ({purgeCount.orders})</SellerButton>}
              </div>
              <SellerTable>
                <SellerTableHeader>
                  <SellerTableRow>
                    <SellerTableCell isHeader>Référence</SellerTableCell>
                    <SellerTableCell isHeader className="text-center">Supprimé le</SellerTableCell>
                    <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
                  </SellerTableRow>
                </SellerTableHeader>
                <SellerTableBody>
                  {items.orders.map((item) => (
                    <SellerTableRow key={item.id}>
                      <SellerTableCell className="text-[var(--text-primary)]">{item.label}</SellerTableCell>
                      <SellerTableCell className="text-center text-[var(--text-secondary)]">{new Date(item.deletedAt).toLocaleDateString('fr-FR')}</SellerTableCell>
                      <SellerTableCell className="text-center">
                        <div className="inline-flex gap-2">
                          <SellerButton variant="outline" size="sm" icon={RotateCcw} disabled={actionLoading === `restore-${item.id}`} onClick={() => handleAction(item.id, 'order', 'restore')}>Restaurer</SellerButton>
                          <SellerButton variant="danger" size="sm" icon={Trash2} disabled={actionLoading === `delete-${item.id}`} onClick={() => handleAction(item.id, 'order', 'delete')}>Supprimer</SellerButton>
                        </div>
                      </SellerTableCell>
                    </SellerTableRow>
                  ))}
                </SellerTableBody>
              </SellerTable>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
