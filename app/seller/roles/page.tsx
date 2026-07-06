'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Copy,
  Download,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Loading from '@/components/Loading';
import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerInput from '@/components/seller/SellerInput';
import SellerModal from '@/components/seller/SellerModal';
import SellerPagination from '@/components/seller/SellerPagination';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import StatCard from '@/components/seller/StatCard';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';

interface Permission {
  id: string;
  name: string;
  slug: string;
  module: string;
  description?: string | null;
}

interface RoleUser {
  id: string;
  roleId: string;
  userId: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  permissions: { permission: Permission }[];
  _count: { users: number };
  users?: RoleUser[];
}

interface RolesResponse {
  success: boolean;
  data: Role[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    totalRoles: number;
    totalPermissions: number;
    totalUsersWithRoles: number;
    systemRoles: number;
  };
}

const pageSize = 15;

type SortField = 'name' | 'createdAt';
type SortDir = 'asc' | 'desc';

const randomColors = [
  { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  { bg: 'bg-rose-500/10', text: 'text-rose-400' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  { bg: 'bg-teal-500/10', text: 'text-teal-400' },
];

function roleColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return randomColors[Math.abs(hash) % randomColors.length];
}

export default function RolesPage(): React.ReactElement {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<RolesResponse['stats']>({ totalRoles: 0, totalPermissions: 0, totalUsersWithRoles: 0, systemRoles: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'name', dir: 'asc' });

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [detailUsers, setDetailUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [permSearch, setPermSearch] = useState('');

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      params.set('sortBy', sort.field);
      params.set('sortOrder', sort.dir);
      const [rolesRes, permsRes] = await Promise.all([
        fetch(`/api/admin/roles?${params}`),
        fetch('/api/admin/permissions'),
      ]);
      const rolesData: RolesResponse = await rolesRes.json();
      if (rolesData.success) {
        setRoles(rolesData.data ?? []);
        setTotal(rolesData.total ?? 0);
        setTotalPages(rolesData.totalPages ?? 1);
        setStats(rolesData.stats);
      }
      setPermissions(await permsRes.json());
    } catch {
      toast.error('Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page, sort]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  useEffect(() => { setPage(1); }, [searchTerm, sort]);

  const toggleSort = (field: SortField) => {
    setSort((prev) => (prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ArrowUpWideNarrow className="ml-1 h-3 w-3 opacity-30" />;
    return sort.dir === 'asc' ? (
      <ArrowUpWideNarrow className="ml-1 h-3 w-3 text-[var(--accent-green)]" />
    ) : (
      <ArrowDownWideNarrow className="ml-1 h-3 w-3 text-[var(--accent-green)]" />
    );
  };

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
      if (!acc[p.module]) acc[p.module] = [];
      acc[p.module].push(p);
      return acc;
    }, {});
  }, [permissions]);

  const filteredGroupedPermissions = useMemo(() => {
    if (!permSearch) return groupedPermissions;
    const q = permSearch.toLowerCase();
    const result: Record<string, Permission[]> = {};
    for (const [module, perms] of Object.entries(groupedPermissions)) {
      const filtered = perms.filter(
        (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
      );
      if (filtered.length > 0) result[module] = filtered;
    }
    return result;
  }, [groupedPermissions, permSearch]);

  const openAdd = () => {
    setEditing(null);
    setNameInput('');
    setDescInput('');
    setSelectedPerms(new Set());
    setPermSearch('');
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setNameInput(role.name);
    setDescInput(role.description || '');
    setSelectedPerms(new Set(role.permissions.map((rp) => rp.permission.id)));
    setPermSearch('');
    setShowModal(true);
  };

  const duplicateRole = async (role: Role) => {
    setEditing(null);
    setNameInput(`${role.name} (copie)`);
    setDescInput(role.description || '');
    setSelectedPerms(new Set(role.permissions.map((rp) => rp.permission.id)));
    setPermSearch('');
    setShowModal(true);
  };

  const openDetail = async (role: Role) => {
    setDetailRole(role);
    setShowDetail(true);
    setLoadingDetail(true);
    setDetailUsers([]);
    try {
      const res = await fetch(`/api/admin/roles/${role.id}`);
      const data = await res.json();
      if (data.success && data.data?.users) {
        setDetailUsers(
          data.data.users.map((u: RoleUser) => ({
            id: u.user.id,
            name: [u.user.firstName, u.user.lastName].filter(Boolean).join(' ') || u.user.email || 'Inconnu',
            email: u.user.email || '',
          }))
        );
      }
    } catch {
      // Silently fail, users list is optional
    } finally {
      setLoadingDetail(false);
    }
  };

  const save = async () => {
    if (!nameInput.trim()) { toast.error('Nom requis.'); return; }
    setSaving(true);
    try {
      const url = '/api/admin/roles';
      const method = editing ? 'PUT' : 'POST';
      const body = editing
        ? { id: editing.id, name: nameInput.trim(), description: descInput.trim(), permissionIds: Array.from(selectedPerms) }
        : { name: nameInput.trim(), description: descInput.trim(), permissionIds: Array.from(selectedPerms) };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Erreur');
      toast.success(editing ? 'Rôle modifié.' : 'Rôle créé.');
      setShowModal(false);
      await fetchRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Erreur');
      toast.success(json.message || 'Rôle supprimé.');
      setDeleteTarget(null);
      await fetchRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const togglePerm = (id: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleModule = (module: string, checked: boolean) => {
    const modulePermIds = groupedPermissions[module].map((p) => p.id);
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      for (const id of modulePermIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const allPermsInModule = (module: string) => {
    return groupedPermissions[module].every((p) => selectedPerms.has(p.id));
  };

  function exportCSV() {
    if (roles.length === 0) return;
    const header = 'Nom;Description;Permissions;Utilisateurs;Systeme\n';
    const rows = roles.map((r) =>
      [
        `"${r.name}"`,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        r.permissions.length,
        r._count.users,
        r.isSystem ? 'Oui' : 'Non',
      ].join(';')
    ).join('\n');
    const csv = '\uFEFF' + header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roles_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    if (roles.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageW, 50, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(241, 245, 249);
    doc.text('Rôles & Permissions', 20, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 32);
    doc.text(`${total} rôle(s)`, 20, 40);

    autoTable(doc, {
      head: [['Rôle', 'Description', 'Permissions', 'Utilisateurs', 'Système']],
      body: roles.map((r) => [
        r.name,
        r.description || '',
        String(r.permissions.length),
        String(r._count.users),
        r.isSystem ? 'Oui' : 'Non',
      ]),
      startY: 55,
      styles: { fontSize: 8, textColor: [241, 245, 249], fillColor: [18, 18, 18], lineColor: [30, 41, 59], lineWidth: 0.3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [24, 24, 24] },
      margin: { top: 55, bottom: 20 },
    });
    doc.save(`roles_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (loading && roles.length === 0) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loading /></div>;
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader
        title="Rôles & Permissions"
        action={
          <div className="flex gap-2">
            <SellerButton variant="outline" size="sm" icon={RefreshCw} onClick={() => { setPage(1); fetchRoles(); }}>Actualiser</SellerButton>
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportCSV}>CSV</SellerButton>
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportPDF}>PDF</SellerButton>
            <SellerButton icon={Plus} onClick={openAdd}>Nouveau rôle</SellerButton>
          </div>
        }
      />

      {/* StatCards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Rôles" value={String(stats.totalRoles)} description="Total des rôles" icon={Shield} accentColor="blue" sparklineData={[stats.totalRoles]} />
        <StatCard title="Permissions" value={String(stats.totalPermissions)} description="Permissions système" icon={ShieldCheck} accentColor="green" sparklineData={[stats.totalPermissions]} />
        <StatCard title="Utilisateurs" value={String(stats.totalUsersWithRoles)} description="Avec un rôle assigné" icon={Users} accentColor="amber" sparklineData={[stats.totalUsersWithRoles]} />
        <StatCard title="Rôles système" value={String(stats.systemRoles)} description="Non modifiables" icon={Shield} accentColor="red" sparklineData={[stats.systemRoles]} />
      </div>

      {/* Filtres */}
      <SellerFilterBar>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Rechercher par nom ou description..."
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            />
          </div>
          <div className="rounded-lg bg-[var(--bg-hover)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            {total} résultat(s)
          </div>
        </div>
      </SellerFilterBar>

      {roles.length === 0 ? (
        <SellerEmptyState
          title="Aucun rôle"
          description="Créez votre premier rôle."
          icon={Shield}
          action={<SellerButton icon={Plus} onClick={openAdd}>Nouveau rôle</SellerButton>}
        />
      ) : (
        <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('name')}>
                <span className="inline-flex items-center">Rôle <SortIcon field="name" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center">Description</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Permissions</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Utilisateurs</SellerTableCell>
              <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
                <span className="inline-flex items-center">Créé le <SortIcon field="createdAt" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {roles.map((role) => {
              const color = roleColor(role.name);
              return (
                <SellerTableRow key={role.id}>
                  <SellerTableCell className="text-center">
                    <div className="inline-flex items-center gap-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${color.bg} ${color.text}`}>
                        {role.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium text-[var(--text-primary)]">{role.name}</span>
                      {role.isSystem && (
                        <SellerBadge color="primary" variant="solid">
                          <Shield className="mr-1 h-3 w-3" />
                          Système
                        </SellerBadge>
                      )}
                    </div>
                  </SellerTableCell>
                  <SellerTableCell className="text-center text-[var(--text-secondary)] max-w-[30ch] truncate">
                    {role.description || '—'}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <span className="rounded-md bg-[var(--bg-hover)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]">
                      {role.permissions.length}
                    </span>
                  </SellerTableCell>
                  <SellerTableCell className="text-center text-[var(--text-secondary)]">
                    {role._count.users}
                  </SellerTableCell>
                  <SellerTableCell className="text-center text-[var(--text-secondary)] text-xs">
                    {new Date(role.createdAt || role.id).toLocaleDateString('fr-FR')}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <div className="inline-flex gap-1">
                      <SellerButton variant="ghost" size="icon" icon={Eye} onClick={() => openDetail(role)}>
                        Détail
                      </SellerButton>
                      <SellerButton variant="ghost" size="icon" icon={Pencil} onClick={() => openEdit(role)}>
                        Modifier
                      </SellerButton>
                      <SellerButton variant="ghost" size="icon" icon={Copy} onClick={() => duplicateRole(role)}>
                        Dupliquer
                      </SellerButton>
                      {!role.isSystem && (
                        <SellerButton variant="ghost" size="icon" icon={Trash2} className="text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10" onClick={() => setDeleteTarget(role)}>
                          Supprimer
                        </SellerButton>
                      )}
                    </div>
                  </SellerTableCell>
                </SellerTableRow>
              );
            })}
          </SellerTableBody>
          <tfoot>
            <tr>
              <td colSpan={6}>
                <SellerPagination page={page} pageSize={pageSize} totalItems={total} onPageChange={setPage} />
              </td>
            </tr>
          </tfoot>
        </SellerTable>
      )}

      {/* Modal édition / création */}
      <SellerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Modifier le rôle' : 'Nouveau rôle'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <SellerButton variant="outline" onClick={() => setShowModal(false)}>Annuler</SellerButton>
            <SellerButton disabled={saving} onClick={save}>{saving ? 'Enregistrement...' : 'Enregistrer'}</SellerButton>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <SellerInput
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Nom du rôle"
            label="Nom"
          />
          <SellerInput
            value={descInput}
            onChange={(e) => setDescInput(e.target.value)}
            placeholder="Description (optionnelle)"
            label="Description"
          />

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              placeholder="Rechercher une permission..."
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-4">
            {Object.entries(filteredGroupedPermissions).length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">Aucune permission trouvée.</p>
            ) : (
              Object.entries(filteredGroupedPermissions).map(([module, perms]) => {
                const allSelected = allPermsInModule(module);
                return (
                  <div key={module}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">{module}</p>
                      <button
                        type="button"
                        onClick={() => toggleModule(module, !allSelected)}
                        className={`text-xs font-medium transition ${allSelected ? 'text-[var(--accent-green)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                      >
                        {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => (
                        <label
                          key={perm.id}
                          className={`group flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                            selectedPerms.has(perm.id)
                              ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10'
                              : 'border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]'
                          }`}
                        >
                          <input type="checkbox" checked={selectedPerms.has(perm.id)} onChange={() => togglePerm(perm.id)} className="sr-only" />
                          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] font-bold transition ${
                            selectedPerms.has(perm.id)
                              ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white'
                              : 'border-[var(--border)] text-transparent group-hover:border-[var(--text-tertiary)]'
                          }`}>
                            {selectedPerms.has(perm.id) ? '✓' : ''}
                          </div>
                          <div className="flex flex-col">
                            <span className={`font-medium ${selectedPerms.has(perm.id) ? 'text-[var(--accent-blue)]' : 'text-[var(--text-primary)]'}`}>
                              {perm.name}
                            </span>
                            {perm.description && (
                              <span className="text-[10px] text-[var(--text-tertiary)]">{perm.description}</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </SellerModal>

      {/* Modal détail */}
      <SellerModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={detailRole?.name || 'Détail du rôle'}
        size="lg"
      >
        {detailRole && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Rôle</p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">{detailRole.name}</span>
                  {detailRole.isSystem && (
                    <SellerBadge color="primary" variant="solid" icon={Shield}>Système</SellerBadge>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Description</p>
                <p className="text-sm text-[var(--text-primary)]">{detailRole.description || '—'}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Permissions</p>
                <p className="text-lg font-semibold text-[var(--accent-blue)]">{detailRole.permissions.length}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Utilisateurs</p>
                <p className="text-lg font-semibold text-[var(--accent-green)]">{detailRole._count.users}</p>
              </div>
            </div>

            {/* Permissions list */}
            <div>
              <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Permissions détaillées</p>
              {detailRole.permissions.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)]">Aucune permission.</p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {Object.entries(
                    detailRole.permissions.reduce<Record<string, typeof detailRole.permissions>>((acc, rp) => {
                      const mod = rp.permission.module;
                      if (!acc[mod]) acc[mod] = [];
                      acc[mod].push(rp);
                      return acc;
                    }, {})
                  ).map(([module, perms]) => (
                    <div key={module} className="rounded-lg bg-[var(--bg-outer)] p-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase text-[var(--text-tertiary)]">{module}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map((rp) => (
                          <span key={rp.permission.id} className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-blue)]/10 px-2 py-1 text-[11px] font-medium text-[var(--accent-blue)]">
                            <ShieldCheck className="h-3 w-3" />
                            {rp.permission.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Users list */}
            <div>
              <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                Utilisateurs ({detailRole._count.users})
              </p>
              {loadingDetail ? (
                <div className="flex items-center justify-center py-4"><Loading /></div>
              ) : detailUsers.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)]">Aucun utilisateur.</p>
              ) : (
                <div className="space-y-2">
                  {detailUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 rounded-lg bg-[var(--bg-outer)] px-4 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-primary)]">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{u.name}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{u.email}</p>
                      </div>
                    </div>
                  ))}
                  {detailRole._count.users > detailUsers.length && (
                    <p className="text-xs text-[var(--text-tertiary)] text-center">
                      +{detailRole._count.users - detailUsers.length} autre(s) utilisateur(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </SellerModal>

      {/* Modal suppression */}
      <SellerModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer ce rôle ?"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <SellerButton variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</SellerButton>
            <SellerButton variant="danger" onClick={confirmDelete}>Supprimer</SellerButton>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Le rôle <strong className="text-[var(--text-primary)]">&quot;{deleteTarget?.name}&quot;</strong> sera supprimé définitivement.
          </p>
          {deleteTarget && deleteTarget._count.users > 0 && (
            <div className="rounded-lg border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/5 p-3">
              <p className="text-xs font-medium text-[var(--accent-red)]">
                ⚠ {deleteTarget._count.users} utilisateur(s) possèdent ce rôle et perdront leurs permissions associées.
              </p>
            </div>
          )}
        </div>
      </SellerModal>
    </div>
  );
}
