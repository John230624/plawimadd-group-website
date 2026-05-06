'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Clock3,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';

import Footer from '@/components/seller/Footer';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import SellerStatCard from '@/components/seller/SellerStatCard';
import Loading from '@/components/Loading';
import { useAppContext } from '@/context/AppContext';
import { Order, OrderStatus, PaymentStatus, UserRole } from '@/lib/types';

function getStatusClasses(status: string): string {
  if ([OrderStatus.DELIVERED, PaymentStatus.COMPLETED].includes(status as never)) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (
    [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.ON_HOLD, OrderStatus.SHIPPED].includes(
      status as never
    )
  ) {
    return 'bg-amber-100 text-amber-700';
  }

  if (
    [OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED, PaymentStatus.FAILED].includes(
      status as never
    )
  ) {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-slate-100 text-slate-600';
}

export default function OrdersPage(): React.ReactElement {
  const { formatPrice } = useAppContext();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAllOrders = useCallback(async () => {
    if (status !== 'authenticated' || session?.user?.role !== UserRole.ADMIN) {
      setLoading(false);
      setError("Acces refuse. Vous devez etre connecte en tant qu'administrateur.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<Order[]>('/api/admin/orders', {
        headers: {
          'auth-token': session.user.token,
        },
      });

      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || 'Erreur lors du chargement des commandes.'
          : 'Erreur inconnue lors du chargement des commandes.'
      );
    } finally {
      setLoading(false);
    }
  }, [session?.user?.role, session?.user?.token, status]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === UserRole.ADMIN) {
      fetchAllOrders();
      return;
    }

    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [fetchAllOrders, router, session?.user?.role, status]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const haystack = [
        order.id,
        order.userName,
        order.userEmail,
        order.shippingCity,
        order.shippingCountry,
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm, statusFilter]);

  const pendingCount = useMemo(
    () => orders.filter((order) => order.status === OrderStatus.PENDING).length,
    [orders]
  );
  const deliveredCount = useMemo(
    () => orders.filter((order) => order.status === OrderStatus.DELIVERED).length,
    [orders]
  );
  const totalRevenue = useMemo(
    () =>
      orders.reduce((sum, order) => {
        return order.paymentStatus === PaymentStatus.COMPLETED ? sum + order.totalAmount : sum;
      }, 0),
    [orders]
  );

  const handleStatusChange = async (newStatus: OrderStatus, orderId: string): Promise<void> => {

    if (!session?.user?.token) {
      toast.error('Authentification requise.');
      return;
    }

    try {
      const response = await axios.put(
        `/api/admin/orders/${orderId}`,
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            'auth-token': session.user.token,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Mise a jour impossible.');
      }

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );
      toast.success('Statut de commande mis a jour.');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise a jour du statut.');
    }
  };

  const handleDeleteOrder = async (): Promise<void> => {
    if (!orderToDelete || !session?.user?.token) return;

    setIsDeleting(true);

    try {
      const response = await axios.delete(`/api/admin/orders/${orderToDelete}`, {
        headers: { 'auth-token': session.user.token },
        data: { id: orderToDelete },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Suppression impossible.');
      }

      setOrders((current) => current.filter((order) => order.id !== orderToDelete));
      toast.success('Commande supprimee avec succes.');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression de la commande.');
    } finally {
      setIsDeleting(false);
      setOrderToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <SellerSectionHeader
        eyebrow="Operations"
        title="Gestion des commandes"
        description="Suivez les commandes en attente, mettez a jour leur statut et gardez une vision claire sur la livraison et le paiement."
      />

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <SellerStatCard
          title="Commandes totales"
          value={String(orders.length)}
          description="Toutes les commandes disponibles dans le back-office."
          icon={ShoppingCart}
          tone="blue"
        />
        <SellerStatCard
          title="En attente"
          value={String(pendingCount)}
          description="Commandes a confirmer, preparer ou expedier."
          icon={Clock3}
          tone="amber"
        />
        <SellerStatCard
          title="Livrees"
          value={String(deliveredCount)}
          description="Commandes marquees comme finalisees et remises au client."
          icon={Truck}
          tone="emerald"
        />
      </section>

      <SellerPanel className="mt-6 p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher par client, email, ville ou numero de commande"
              className="w-full rounded-full border border-slate-200 bg-white px-11 py-3.5 text-sm text-slate-700 outline-none transition focus:border-[var(--brand-300)]"
            />
          </div>

          <SellerSelect
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as 'ALL' | OrderStatus)}
            options={[
              { value: 'ALL', label: 'Tous les statuts' },
              { value: OrderStatus.PENDING, label: 'En attente' },
              { value: OrderStatus.PROCESSING, label: 'En cours' },
              { value: OrderStatus.SHIPPED, label: 'Expediees' },
              { value: OrderStatus.DELIVERED, label: 'Livrees' },
              { value: OrderStatus.CANCELLED, label: 'Annulees' },
            ]}
          />

          <div className="rounded-[1.2rem] bg-slate-50 px-4 py-3.5 text-sm">
            <p className="text-slate-500">CA encaisse</p>
            <p className="mt-1 font-semibold text-slate-950">{formatPrice(totalRevenue)}</p>
          </div>
        </div>
      </SellerPanel>

      <SellerPanel className="mt-6 overflow-hidden">
        {error ? (
          <div className="p-6">
            <SellerEmptyState
              title="Chargement impossible"
              description={error}
              icon={XCircle}
            />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-6">
            <SellerEmptyState
              title="Aucune commande trouvee"
              description="Aucun resultat ne correspond aux filtres appliques pour le moment."
              icon={ShoppingCart}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Commande</th>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Montant</th>
                  <th className="px-6 py-4 font-medium">Paiement</th>
                  <th className="px-6 py-4 font-medium">Livraison</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100 align-top">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-950">#{order.id.slice(0, 8)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.orderItems.length} article(s)
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-medium text-slate-900">{order.userName}</p>
                      <p className="mt-1 text-slate-500">{order.userEmail}</p>
                    </td>
                    <td className="px-6 py-5 font-semibold text-slate-950">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-600">
                      <p>{order.shippingCity}</p>
                      <p className="mt-1 text-xs text-slate-400">{order.shippingCountry}</p>
                    </td>
                    <td className="px-6 py-5 text-slate-500">
                      {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-5">
                      <SellerSelect
                        value={order.status}
                        onChange={(value) => handleStatusChange(value as OrderStatus, order.id)}
                        className={`min-w-[160px] ${getStatusClasses(order.status)}`}
                        options={[
                          { value: OrderStatus.PENDING, label: 'En attente' },
                          { value: OrderStatus.PROCESSING, label: 'En cours' },
                          { value: OrderStatus.SHIPPED, label: 'Expediee' },
                          { value: OrderStatus.DELIVERED, label: 'Livree' },
                          { value: OrderStatus.CANCELLED, label: 'Annulee' },
                        ]}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => setOrderToDelete(order.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SellerPanel>

      <Footer />

      {orderToDelete ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.8rem] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
            <h3 className="text-[1.35rem] font-semibold text-slate-950">
              Supprimer cette commande ?
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Cette action retire la commande, ses lignes et ses informations de paiement de
              l&apos;espace d&apos;administration.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="flex-1 rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {isDeleting ? 'Suppression...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
