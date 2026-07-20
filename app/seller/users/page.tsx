'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import {
  Ban, CheckCircle, Eye, Mail, Pencil, Plus, Search, ShieldCheck,
  Trash2, UserRound, Users, XCircle, MapPin, ShoppingCart, Star,
  GraduationCap, Package, CreditCard, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-toastify';

import SellerModal from '@/components/seller/SellerModal';
import SellerPagination from '@/components/seller/SellerPagination';
import SellerPanel from '@/components/seller/SellerPanel';
import StatCard from '@/components/seller/StatCard';
import Loading from '@/components/Loading';
import { UserRole } from '@/lib/types';

interface AdminUser {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string | null;
  role?: string;
  banned: boolean;
  bannedAt?: string | null;
  createdAt: string;
}

interface AddressInfo {
  id: string;
  fullName: string;
  phoneNumber: string;
  area: string;
  city: string;
  state: string;
  country: string;
  street: string | null;
  pincode: string | null;
  isDefault: boolean;
}

interface CartItemInfo {
  id: string;
  quantity: number;
  product: { id: string; name: string; price: number };
}

interface OrderInfo {
  id: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  currency: string;
  orderItems: {
    id: string;
    quantity: number;
    priceAtOrder: number;
    product: { id: string; name: string };
  }[];
}

interface ReviewInfo {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  product: { id: string; name: string };
}

interface StudentRequestInfo {
  id: string;
  fullName: string;
  schoolName: string;
  studentEmail: string;
  status: string;
  requestedMonths: number;
  createdAt: string;
}

interface PermissionInfo {
  id: string;
  name: string;
  slug: string;
  module: string;
}

interface RoleInfo {
  id: string;
  name: string;
  permissions?: { permission: PermissionInfo }[];
}

interface UserPermissionOverride {
  id: string;
  granted: boolean;
  permission: PermissionInfo;
}

interface UserDetail extends AdminUser {
  addresses: AddressInfo[];
  cartItems: CartItemInfo[];
  orders: OrderInfo[];
  reviews: ReviewInfo[];
  studentInstallmentRequests: StudentRequestInfo[];
  roles?: { role: RoleInfo }[];
  permissions?: UserPermissionOverride[];
  totalOrders: number;
  totalReviews: number;
  totalAddresses: number;
  cartValue: number;
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'BANNED';
type ModalMode = 'create' | 'edit' | 'view' | 'confirm' | null;
type RoleValue = 'USER' | 'SELLER' | 'ADMIN';
type PermissionOverrideValue = 'default' | 'grant' | 'deny';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: RoleValue;
  password: string;
}

const pageSize = 10;

const emptyForm: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  role: 'USER',
  password: '',
};

function getDisplayName(user: AdminUser): string {
  return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur';
}

export default function UserManagementPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'SELLER' | 'ADMIN'>('USER');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'ban' | 'unban' | 'delete'; user: AdminUser } | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<RoleInfo[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionInfo[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [permissionOverrides, setPermissionOverrides] = useState<Record<string, 'default' | 'grant' | 'deny'>>({});

  const fetchUsers = useCallback(async () => {
    if (status !== 'authenticated' || session?.user?.role !== UserRole.ADMIN) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'ALL') params.set('role', roleFilter.toLowerCase());
      if (statusFilter !== 'ALL') params.set('status', statusFilter.toLowerCase());
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await axios.get<AdminUser[]>(`/api/admin/users${query}`);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, session?.user?.role, status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

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

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page]);

  const customerCount = useMemo(
    () => users.filter((u) => (u.role || 'USER').toUpperCase() === 'USER').length,
    [users]
  );
  const adminCount = useMemo(
    () => users.filter((u) => (u.role || '').toUpperCase() === 'ADMIN').length,
    [users]
  );
  const sellerCount = useMemo(
    () => users.filter((u) => (u.role || '').toUpperCase() === 'SELLER').length,
    [users]
  );

  function openCreate() {
    setFormData(emptyForm);
    setSelectedUser(null);
    setSelectedRoleIds(new Set());
    setPermissionOverrides({});
    setModalMode('create');
  }

  async function loadAccessSettings(userId?: string) {
    try {
      const [rolesRes, permsRes, userAccessRes] = await Promise.all([
        axios.get<{ success: boolean; data: RoleInfo[] }>('/api/admin/roles?limit=100'),
        axios.get<PermissionInfo[]>('/api/admin/permissions'),
        userId ? axios.get<{ roles: RoleInfo[]; permissions: UserPermissionOverride[] }>(`/api/admin/users/roles?userId=${userId}`) : Promise.resolve(null),
      ]);

      setAvailableRoles(rolesRes.data.data || []);
      setAvailablePermissions(Array.isArray(permsRes.data) ? permsRes.data : []);

      if (userAccessRes) {
        setSelectedRoleIds(new Set(userAccessRes.data.roles.map((role) => role.id)));
        setPermissionOverrides(Object.fromEntries(
          userAccessRes.data.permissions.map((item) => [item.permission.id, item.granted ? 'grant' : 'deny'])
        ));
      }
    } catch {
      toast.error('Erreur lors du chargement des rôles et permissions.');
    }
  }

  function openEdit(user: AdminUser) {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: (user.role as 'USER' | 'SELLER' | 'ADMIN') || 'USER',
      password: '',
    });
    setSelectedRoleIds(new Set());
    setPermissionOverrides({});
    loadAccessSettings(user.id);
    setModalMode('edit');
  }

  function openView(user: AdminUser) {
    setSelectedUser(user);
    setModalMode('view');
    setExpandedSection(null);
    setLoadingDetail(true);
    setUserDetail(null);
    axios.get<UserDetail>(`/api/admin/users/${user.id}`)
      .then((res) => setUserDetail(res.data))
      .catch(() => toast.error('Erreur lors du chargement des détails.'))
      .finally(() => setLoadingDetail(false));
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
    setFormData(emptyForm);
    setConfirmAction(null);
    setUserDetail(null);
    setLoadingDetail(false);
    setExpandedSection(null);
    setSelectedRoleIds(new Set());
    setPermissionOverrides({});
  }

  async function handleCreate() {
    if (!formData.email || !formData.password) {
      toast.error('Email et mot de passe sont requis.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/admin/users', formData);
      toast.success('Utilisateur créé avec succès.');
      closeModal();
      fetchUsers();
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erreur lors de la création de l'utilisateur.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        id: selectedUser.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
      };
      await axios.patch('/api/admin/users', payload);
      await axios.put('/api/admin/users/roles', {
        userId: selectedUser.id,
        roleIds: Array.from(selectedRoleIds),
        permissionOverrides: Object.entries(permissionOverrides)
          .filter(([, value]) => value !== 'default')
          .map(([permissionId, value]) => ({ permissionId, granted: value === 'grant' })),
      });
      toast.success('Utilisateur modifié avec succès.');
      closeModal();
      fetchUsers();
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erreur lors de la modification de l'utilisateur.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBanToggle(user: AdminUser) {
    setSubmitting(true);
    try {
      await axios.patch('/api/admin/users', { id: user.id, banned: !user.banned });
      toast.success(user.banned ? 'Utilisateur débanni avec succès.' : 'Utilisateur banni avec succès.');
      closeModal();
      fetchUsers();
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erreur lors de la mise à jour du statut.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(user: AdminUser) {
    setSubmitting(true);
    try {
      await axios.delete('/api/admin/users', { data: { id: user.id } });
      toast.success('Utilisateur supprimé avec succès.');
      closeModal();
      fetchUsers();
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erreur lors de la suppression de l'utilisateur.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openConfirm(type: 'ban' | 'unban' | 'delete', user: AdminUser) {
    setConfirmAction({ type, user });
    setModalMode('confirm');
  }

  function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') {
      handleDelete(confirmAction.user);
    } else {
      handleBanToggle(confirmAction.user);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-700 text-[var(--text-primary)]">Utilisateurs</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Gestion des clients et administrateurs</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-600 text-white shadow-lg transition-all duration-300 hover:from-emerald-400 hover:to-cyan-400 hover:shadow-xl"
        >
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Comptes affichés"
          value={String(users.length)}
          description="Nombre de profils avec le filtre actif"
          icon={Users}
        />
        <StatCard
          title="Clients"
          value={String(customerCount)}
          description="Profils standards pour l'achat"
          icon={UserRound}
        />
        <StatCard
          title="Vendeurs"
          value={String(sellerCount)}
          description="Comptes avec accès vente"
          icon={ShoppingCart}
        />
        <StatCard
          title="Admins"
          value={String(adminCount)}
          description="Comptes avec accès admin"
          icon={ShieldCheck}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              autoComplete="off" placeholder="Rechercher par nom, email ou téléphone"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-4 py-2 pl-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 rounded-xl p-0.5" style={{ backgroundColor: '#121212' }}>
            {(['ALL', 'ACTIVE', 'BANNED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-600 transition-all duration-300 ease-out whitespace-nowrap ${
                  statusFilter === s
                    ? s === 'BANNED'
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                      : s === 'ACTIVE'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                      : 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50'
                }`}
              >
                {s === 'ALL' ? 'Tous' : s === 'ACTIVE' ? 'Actifs' : 'Bannis'}
              </button>
            ))}
          </div>
          {/* Role filter */}
          <div className="flex items-center gap-1 rounded-xl p-0.5" style={{ backgroundColor: '#121212' }}>
            {(['USER', 'SELLER', 'ADMIN', 'ALL'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-lg text-xs font-600 transition-all duration-300 ease-out ${
                  roleFilter === role
                    ? role === 'ADMIN'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg'
                      : role === 'SELLER'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md hover:shadow-lg'
                      : role === 'USER'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50'
                }`}
              >
                {role === 'USER' ? 'Clients' : role === 'SELLER' ? 'Vendeurs' : role === 'ADMIN' ? 'Admins' : 'Tous les rôles'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <SellerPanel className="overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4">
              <Users className="h-12 w-12 text-purple-400" />
            </div>
            <p className="text-[var(--text-secondary)]">Aucun utilisateur trouvé</p>
            <p className="text-xs text-[var(--text-tertiary)]">Aucun utilisateur ne correspond à votre recherche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Profil</th>
                  <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Contact</th>
                  <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Rôle</th>
                  <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Statut</th>
                  <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Inscription</th>
                  <th className="px-6 py-3 text-center font-500 text-[var(--text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const displayName = getDisplayName(user);
                  const role = (user.role || 'USER').toUpperCase();

                  return (
                    <tr key={user.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-smooth">
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400">
                            <UserRound className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-500 text-[var(--text-primary)]">{displayName}</p>
                            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">#{user.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-1">
                          <p className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
                            <Mail className="h-3.5 w-3.5 text-emerald-400" />
                            {user.email}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {user.phoneNumber || 'Non renseigné'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-500 ${
                          role === 'ADMIN'
                            ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400'
                            : role === 'SELLER'
                            ? 'bg-gradient-to-r from-amber-500/20 to-orange-600/20 text-amber-400'
                            : 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400'
                        }`}>
                          {role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-500 ${
                          user.banned
                            ? 'bg-gradient-to-r from-red-500/20 to-rose-600/20 text-red-400'
                            : 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400'
                        }`}>
                          {user.banned ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                          {user.banned ? 'Banni' : 'Actif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[var(--text-tertiary)] text-xs">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openView(user)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-2.5 py-1.5 text-xs font-500 text-indigo-400 transition-all duration-300 hover:from-indigo-500/30 hover:to-purple-500/30 hover:shadow-lg"
                            title="Détails"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(user)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2.5 py-1.5 text-xs font-500 text-amber-400 transition-all duration-300 hover:from-amber-500/30 hover:to-orange-500/30 hover:shadow-lg"
                            title="Modifier"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {user.email !== 'jbladeleboladji@gmail.com' && (
                            <>
                              <button
                                onClick={() => openConfirm(user.banned ? 'unban' : 'ban', user)}
                                className={`inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-500 transition-all duration-300 hover:shadow-lg ${
                                  user.banned
                                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400 hover:from-green-500/30 hover:to-emerald-600/30'
                                    : 'bg-gradient-to-r from-red-500/20 to-rose-600/20 text-red-400 hover:from-red-500/30 hover:to-rose-600/30'
                                }`}
                                title={user.banned ? 'Débannir' : 'Bannir'}
                              >
                                {user.banned ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={() => openConfirm('delete', user)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-gray-500/20 to-slate-600/20 px-2.5 py-1.5 text-xs font-500 text-gray-400 transition-all duration-300 hover:from-gray-500/30 hover:to-slate-600/30 hover:shadow-lg"
                                title="Supprimer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="border-t border-[var(--border)] px-6 py-4">
            <SellerPagination
              page={page}
              pageSize={pageSize}
              totalItems={filteredUsers.length}
              onPageChange={setPage}
            />
          </div>
        )}
      </SellerPanel>

      {/* View Modal */}
      <SellerModal
        isOpen={modalMode === 'view'}
        onClose={closeModal}
        title={selectedUser ? getDisplayName(selectedUser) : 'Profil client'}
        description="Toutes les informations liées au compte."
      >
        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : userDetail ? (
          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
            {/* Info de base */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-[var(--bg-outer)] p-3">
                <p className="text-xs text-[var(--text-tertiary)]">Email</p>
                <p className="mt-1 text-sm font-500 text-[var(--text-primary)] break-all">{userDetail.email}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-3">
                <p className="text-xs text-[var(--text-tertiary)]">Téléphone</p>
                <p className="mt-1 text-sm font-500 text-[var(--text-primary)]">{userDetail.phoneNumber || 'Non renseigné'}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-3">
                <p className="text-xs text-[var(--text-tertiary)]">Rôle</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-500 ${
                    (userDetail.role || 'USER').toUpperCase() === 'ADMIN'
                      ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400'
                      : 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400'
                  }`}>
                    {(userDetail.role || 'USER').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-3">
                <p className="text-xs text-[var(--text-tertiary)]">Statut</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-500 ${
                    userDetail.banned
                      ? 'bg-gradient-to-r from-red-500/20 to-rose-600/20 text-red-400'
                      : 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400'
                  }`}>
                    {userDetail.banned ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                    {userDetail.banned ? 'Banni' : 'Actif'}
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-3">
                <p className="text-xs text-[var(--text-tertiary)]">Inscription</p>
                <p className="mt-1 text-sm font-500 text-[var(--text-primary)]">
                  {new Date(userDetail.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              {userDetail.bannedAt && (
                <div className="rounded-lg bg-[var(--bg-outer)] p-3">
                  <p className="text-xs text-[var(--text-tertiary)]">Banni le</p>
                  <p className="mt-1 text-sm font-500 text-[var(--text-primary)]">
                    {new Date(userDetail.bannedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>

            {/* Stats rapides */}
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-3 text-center">
                <Package className="mx-auto h-5 w-5 text-blue-400" />
                <p className="mt-1 text-lg font-700 text-[var(--text-primary)]">{userDetail.totalOrders}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Commandes</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-3 text-center">
                <MapPin className="mx-auto h-5 w-5 text-emerald-400" />
                <p className="mt-1 text-lg font-700 text-[var(--text-primary)]">{userDetail.totalAddresses}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Adresses</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-3 text-center">
                <Star className="mx-auto h-5 w-5 text-amber-400" />
                <p className="mt-1 text-lg font-700 text-[var(--text-primary)]">{userDetail.totalReviews}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Avis</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-3 text-center">
                <ShoppingCart className="mx-auto h-5 w-5 text-purple-400" />
                <p className="mt-1 text-lg font-700 text-[var(--text-primary)]">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(userDetail.cartValue || 0)}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Panier</p>
              </div>
            </div>

            {/* Sections dépliables */}
            <div className="space-y-2">
              {/* Adresses */}
              <SectionBlock
                title="Adresses"
                icon={MapPin}
                count={userDetail.addresses.length}
                isOpen={expandedSection === 'addresses'}
                onToggle={() => setExpandedSection(expandedSection === 'addresses' ? null : 'addresses')}
              >
                {userDetail.addresses.length === 0 ? (
                  <p className="py-3 text-center text-xs text-[var(--text-tertiary)]">Aucune adresse enregistrée</p>
                ) : (
                  <div className="space-y-2">
                    {userDetail.addresses.map((addr) => (
                      <div key={addr.id} className="rounded-lg border border-[var(--border)] p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-500 text-[var(--text-primary)]">{addr.fullName}</p>
                          {addr.isDefault && (
                            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-500 text-blue-400">Défaut</span>
                          )}
                        </div>
                        <p className="mt-1 text-[var(--text-secondary)]">
                          {[addr.street, addr.area, addr.city, addr.state, addr.country].filter(Boolean).join(', ')}
                        </p>
                        <p className="text-[var(--text-tertiary)]">{addr.phoneNumber}</p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionBlock>

              {/* Commandes */}
              <SectionBlock
                title="Commandes"
                icon={Package}
                count={userDetail.orders.length}
                isOpen={expandedSection === 'orders'}
                onToggle={() => setExpandedSection(expandedSection === 'orders' ? null : 'orders')}
              >
                {userDetail.orders.length === 0 ? (
                  <p className="py-3 text-center text-xs text-[var(--text-tertiary)]">Aucune commande</p>
                ) : (
                  <div className="space-y-2">
                    {userDetail.orders.map((order) => (
                      <div key={order.id} className="rounded-lg border border-[var(--border)] p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-500 text-[var(--text-primary)]">#{order.id.slice(0, 8)}</p>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-500 ${
                            order.status === 'DELIVERED' || order.status === 'PAID_SUCCESS'
                              ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400'
                              : order.status === 'CANCELLED' || order.status === 'PAYMENT_FAILED'
                              ? 'bg-gradient-to-r from-red-500/20 to-rose-600/20 text-red-400'
                              : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: order.currency || 'XOF' }).format(Number(order.totalAmount))}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {order.orderItems.length > 0 && (
                          <div className="mt-2 border-t border-[var(--border)] pt-2 text-[var(--text-tertiary)]">
                            {order.orderItems.map((item) => (
                              <p key={item.id}>{item.product.name} × {item.quantity}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionBlock>

              {/* Panier */}
              <SectionBlock
                title="Panier"
                icon={ShoppingCart}
                count={userDetail.cartItems.length}
                isOpen={expandedSection === 'cart'}
                onToggle={() => setExpandedSection(expandedSection === 'cart' ? null : 'cart')}
              >
                {userDetail.cartItems.length === 0 ? (
                  <p className="py-3 text-center text-xs text-[var(--text-tertiary)]">Panier vide</p>
                ) : (
                  <div className="space-y-2">
                    {userDetail.cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-xs">
                        <div>
                          <p className="font-500 text-[var(--text-primary)]">{item.product.name}</p>
                          <p className="text-[var(--text-tertiary)]">Qté: {item.quantity}</p>
                        </div>
                        <p className="font-500 text-[var(--text-primary)]">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(Number(item.product.price) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionBlock>

              {/* Avis */}
              <SectionBlock
                title="Avis"
                icon={Star}
                count={userDetail.reviews.length}
                isOpen={expandedSection === 'reviews'}
                onToggle={() => setExpandedSection(expandedSection === 'reviews' ? null : 'reviews')}
              >
                {userDetail.reviews.length === 0 ? (
                  <p className="py-3 text-center text-xs text-[var(--text-tertiary)]">Aucun avis</p>
                ) : (
                  <div className="space-y-2">
                    {userDetail.reviews.map((review) => (
                      <div key={review.id} className="rounded-lg border border-[var(--border)] p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-500 text-[var(--text-primary)]">{review.product.name}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--border)]'}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mt-1 italic text-[var(--text-secondary)]">"{review.comment}"</p>
                        )}
                        <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionBlock>

              {/* Demandes d'échelonnement */}
              <SectionBlock
                title="Demandes d'échelonnement"
                icon={GraduationCap}
                count={userDetail.studentInstallmentRequests.length}
                isOpen={expandedSection === 'studentRequests'}
                onToggle={() => setExpandedSection(expandedSection === 'studentRequests' ? null : 'studentRequests')}
              >
                {userDetail.studentInstallmentRequests.length === 0 ? (
                  <p className="py-3 text-center text-xs text-[var(--text-tertiary)]">Aucune demande</p>
                ) : (
                  <div className="space-y-2">
                    {userDetail.studentInstallmentRequests.map((req) => (
                      <div key={req.id} className="rounded-lg border border-[var(--border)] p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-500 text-[var(--text-primary)]">{req.schoolName}</p>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-500 ${
                            req.status === 'APPROVED'
                              ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400'
                              : req.status === 'REJECTED'
                              ? 'bg-gradient-to-r from-red-500/20 to-rose-600/20 text-red-400'
                              : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="mt-1 text-[var(--text-secondary)]">{req.fullName} — {req.requestedMonths} mois</p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionBlock>
            </div>
          </div>
        ) : null}
      </SellerModal>

      {/* Create / Edit Modal */}
      <SellerModal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'}
        description={modalMode === 'create' ? 'Créez un nouveau compte utilisateur.' : 'Modifiez les informations du compte.'}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Prénom</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
              placeholder="Jean"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Nom</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
              placeholder="Dupont"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
              placeholder="jean@exemple.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Téléphone</label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
              placeholder="+229 01 23 45 67"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Rôle</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleValue })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
            >
              <option value="USER">Utilisateur</option>
              <option value="SELLER">Vendeur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          {modalMode === 'create' && (
            <div>
              <label className="mb-1 block text-xs font-500 text-[var(--text-secondary)]">Mot de passe *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-smooth focus:border-[var(--accent-blue)]"
                placeholder="••••••••"
              />
            </div>
          )}
        </div>
        {modalMode === 'edit' && (
          <div className="mt-6 space-y-4 rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] p-4">
            <div>
              <p className="text-sm font-600 text-[var(--text-primary)]">Rôles réels</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Ces rôles alimentent directement le système de permissions.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {availableRoles.map((role) => (
                  <label key={role.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.has(role.id)}
                      onChange={(event) => {
                        setSelectedRoleIds((prev) => {
                          const next = new Set(prev);
                          if (event.target.checked) next.add(role.id);
                          else next.delete(role.id);
                          return next;
                        });
                      }}
                    />
                    <span>{role.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-600 text-[var(--text-primary)]">Permissions directes</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Laissez sur Défaut pour hériter des rôles, ou forcez une autorisation/refus pour ce compte.</p>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="grid gap-2 rounded-lg border border-[var(--border)] p-2 text-xs sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-500 text-[var(--text-primary)]">{permission.name}</p>
                      <p className="text-[var(--text-tertiary)]">{permission.slug}</p>
                    </div>
                    <select
                      value={permissionOverrides[permission.id] || 'default'}
                      onChange={(event) => setPermissionOverrides((prev) => ({
                        ...prev,
                        [permission.id]: event.target.value as PermissionOverrideValue,
                      }))}
                      className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
                    >
                      <option value="default">Défaut</option>
                      <option value="grant">Autoriser</option>
                      <option value="deny">Refuser</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-500 text-[var(--text-secondary)] transition-smooth hover:bg-[var(--bg-hover)]"
          >
            Annuler
          </button>
          <button
            onClick={modalMode === 'create' ? handleCreate : handleUpdate}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-600 text-white shadow-lg transition-all duration-300 hover:from-emerald-400 hover:to-cyan-400 hover:shadow-xl disabled:opacity-50"
          >
            {submitting ? 'En cours...' : modalMode === 'create' ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </SellerModal>

      {/* Confirm Modal */}
      <SellerModal
        isOpen={modalMode === 'confirm'}
        onClose={closeModal}
        title="Confirmation"
        description=""
      >
        {confirmAction && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-lg bg-[var(--bg-outer)] p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                confirmAction.type === 'delete'
                  ? 'bg-gradient-to-br from-gray-500/20 to-slate-600/20 text-gray-400'
                  : confirmAction.type === 'ban'
                  ? 'bg-gradient-to-br from-red-500/20 to-rose-600/20 text-red-400'
                  : 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 text-green-400'
              }`}>
                {confirmAction.type === 'delete' ? <Trash2 className="h-5 w-5" /> :
                 confirmAction.type === 'ban' ? <Ban className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-500 text-[var(--text-primary)]">{getDisplayName(confirmAction.user)}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{confirmAction.user.email}</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {confirmAction.type === 'delete'
                ? 'Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.'
                : confirmAction.type === 'ban'
                ? 'Êtes-vous sûr de vouloir bannir cet utilisateur ? Il ne pourra plus se connecter ni passer de commandes.'
                : 'Êtes-vous sûr de vouloir débannir cet utilisateur ? Il retrouvera l\'accès à son compte.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-500 text-[var(--text-secondary)] transition-smooth hover:bg-[var(--bg-hover)]"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 ${
                  confirmAction.type === 'delete'
                    ? 'bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-400 hover:to-slate-500'
                    : confirmAction.type === 'ban'
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500'
                }`}
              >
                {submitting
                  ? 'En cours...'
                  : confirmAction.type === 'delete'
                  ? 'Supprimer'
                  : confirmAction.type === 'ban'
                  ? 'Bannir'
                  : 'Débannir'}
              </button>
            </div>
          </div>
        )}
      </SellerModal>
    </div>
  );
}

function SectionBlock({
  title,
  icon: Icon,
  count,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-smooth hover:bg-[var(--bg-hover)]"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-500 text-[var(--text-primary)]">{title}</span>
          <span className="rounded-full bg-[var(--bg-outer)] px-2 py-0.5 text-[10px] font-500 text-[var(--text-tertiary)]">{count}</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />}
      </button>
      {isOpen && <div className="border-t border-[var(--border)] px-4 py-3">{children}</div>}
    </div>
  );
}
