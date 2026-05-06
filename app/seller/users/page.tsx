'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Mail, Search, ShieldCheck, UserRound, Users } from 'lucide-react';
import { toast } from 'react-toastify';

import Footer from '@/components/seller/Footer';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import SellerStatCard from '@/components/seller/SellerStatCard';
import Loading from '@/components/Loading';
import { UserRole } from '@/lib/types';

interface AdminUser {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string | null;
  createdAt: string;
  role?: string;
}

export default function UserManagementPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('USER');

  const fetchUsers = useCallback(async () => {
    if (status !== 'authenticated' || session?.user?.role !== UserRole.ADMIN) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const query = roleFilter === 'ALL' ? '' : `?role=${roleFilter.toLowerCase()}`;
      const response = await axios.get<AdminUser[]>(`/api/admin/users${query}`, {
        headers: {
          'auth-token': session.user.token,
        },
      });
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, session?.user?.role, session?.user?.token, status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const haystack = [
        user.name,
        `${user.firstName || ''} ${user.lastName || ''}`,
        user.email,
        user.phoneNumber || '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, users]);

  const customerCount = useMemo(
    () => users.filter((user) => (user.role || 'USER').toUpperCase() === 'USER').length,
    [users]
  );
  const adminCount = useMemo(
    () => users.filter((user) => (user.role || '').toUpperCase() === 'ADMIN').length,
    [users]
  );

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
        eyebrow="Relations clients"
        title="Gestion des clients"
        description="Consultez les comptes clients, retrouvez rapidement un profil et gardez un suivi simple des inscriptions."
      />

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <SellerStatCard
          title="Comptes affiches"
          value={String(users.length)}
          description="Nombre de profils remontes avec le filtre actif."
          icon={Users}
          tone="blue"
        />
        <SellerStatCard
          title="Clients"
          value={String(customerCount)}
          description="Profils standards utilises pour l'achat et le suivi de commandes."
          icon={UserRound}
          tone="emerald"
        />
        <SellerStatCard
          title="Admins"
          value={String(adminCount)}
          description="Comptes de gestion avec acces a l'espace d'administration."
          icon={ShieldCheck}
          tone="slate"
        />
      </section>

      <SellerPanel className="mt-6 p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher par nom, email ou telephone"
              className="w-full rounded-full border border-slate-200 bg-white px-11 py-3.5 text-sm text-slate-700 outline-none transition focus:border-[var(--brand-300)]"
            />
          </div>

          <SellerSelect
            value={roleFilter}
            onChange={(value) => setRoleFilter(value as 'ALL' | 'USER' | 'ADMIN')}
            options={[
              { value: 'USER', label: 'Clients' },
              { value: 'ADMIN', label: 'Admins' },
              { value: 'ALL', label: 'Tous les roles' },
            ]}
          />
        </div>
      </SellerPanel>

      <SellerPanel className="mt-6 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-6">
            <SellerEmptyState
              title="Aucun profil trouve"
              description="Aucun utilisateur ne correspond a votre recherche ou au filtre de role choisi."
              icon={Users}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Profil</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Inscription</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const displayName =
                    user.name ||
                    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                    'Utilisateur';
                  const role = (user.role || 'USER').toUpperCase();

                  return (
                    <tr key={user.id} className="border-t border-slate-100">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(191,219,254,0.18)] text-[var(--brand-700)]">
                            <UserRound className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">{displayName}</p>
                            <p className="mt-1 text-xs text-slate-400">#{user.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {user.email}
                          </p>
                          <p className="text-xs text-slate-400">
                            {user.phoneNumber || 'Telephone non renseigne'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            role === 'ADMIN'
                              ? 'bg-[rgba(191,219,254,0.22)] text-[var(--brand-700)]'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SellerPanel>

      <Footer />
    </div>
  );
}
