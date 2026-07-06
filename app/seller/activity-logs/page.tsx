'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  Search,
  Trash2,
  Users,
  XCircle,
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
import SellerPanel from '@/components/seller/SellerPanel';
import SellerPagination from '@/components/seller/SellerPagination';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import StatCard from '@/components/seller/StatCard';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';

interface ActivityLog {
  id: string;
  createdAt: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
}

interface LogsResponse {
  success: boolean;
  data: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const pageSize = 25;

type SortField = 'createdAt' | 'action' | 'entity' | 'entityId';
type SortDir = 'asc' | 'desc';

const actionColors: Record<string, string> = {
  CREATE: 'text-[var(--accent-green)] bg-[var(--accent-green)]/10',
  UPDATE: 'text-[var(--accent-blue)] bg-[var(--accent-blue)]/10',
  DELETE: 'text-[var(--accent-red)] bg-[var(--accent-red)]/10',
  LOGIN: 'text-amber-400 bg-amber-500/10',
  LOGOUT: 'text-slate-400 bg-slate-500/10',
};

const actionLabels: Record<string, string> = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
};

const rowHighlight: Record<string, string> = {
  CREATE: 'bg-[var(--accent-green)]/5',
  DELETE: 'bg-[var(--accent-red)]/5',
  UPDATE: 'bg-[var(--accent-blue)]/5',
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `il y a ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export default function ActivityLogsPage(): React.ReactElement {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'createdAt', dir: 'desc' });
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'ALL') params.set('action', actionFilter);
      if (entityFilter !== 'ALL') params.set('entity', entityFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (searchTerm) params.set('search', searchTerm);
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      params.set('sortBy', sort.field);
      params.set('sortOrder', sort.dir);
      const res = await fetch(`/api/admin/activity-logs?${params}`);
      const data: LogsResponse = await res.json();
      if (data.success) {
        setLogs(data.data ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      } else {
        setLogs([]);
        setTotal(0);
      }
    } catch {
      toast.error('Impossible de charger le journal.');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, startDate, endDate, searchTerm, page, sort]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [actionFilter, entityFilter, startDate, endDate, searchTerm, sort]);

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(logs.map((l) => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer ${selectedIds.size} entrée(s) ?`)) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/activity-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`${selectedIds.size} entrée(s) supprimée(s).`);
      setSelectedIds(new Set());
      fetchLogs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  };

  const uniqueActions = useMemo(() => {
    const all = logs.map((l) => l.action);
    return ['ALL', ...new Set(all)];
  }, [logs]);

  const uniqueEntities = useMemo(() => {
    const all = logs.map((l) => l.entity);
    return ['ALL', ...new Set(all)];
  }, [logs]);

  // Statistiques
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = logs.filter((l) => l.createdAt?.startsWith(today)).length;
    const byEntity: Record<string, number> = {};
    const errors = logs.filter((l) => l.action === 'DELETE').length;
    logs.forEach((l) => { byEntity[l.entity] = (byEntity[l.entity] || 0) + 1; });
    return { total: logs.length, today: todayLogs, errors, byEntity };
  }, [logs]);

  // Breakdown par jour/heure
  const breakdown = useMemo(() => {
    const byDay: Record<string, number> = {};
    const byHour: Record<string, number> = {};
    logs.forEach((l) => {
      if (l.createdAt) {
        const day = l.createdAt.slice(0, 10);
        byDay[day] = (byDay[day] || 0) + 1;
        const hour = l.createdAt.slice(11, 13) + 'h';
        byHour[hour] = (byHour[hour] || 0) + 1;
      }
    });
    const sortedDays = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).slice(-7);
    const sortedHours = Object.entries(byHour).sort(([a], [b]) => a.localeCompare(b));
    const topUsers: { name: string; count: number }[] = [];
    const userCount: Record<string, number> = {};
    logs.forEach((l) => {
      if (l.userName && l.userName !== 'Système') {
        userCount[l.userName] = (userCount[l.userName] || 0) + 1;
      }
    });
    Object.entries(userCount).sort(([, a], [, b]) => b - a).slice(0, 5).forEach(([name, count]) => {
      topUsers.push({ name, count });
    });
    return { byDay: sortedDays, byHour: sortedHours, topUsers, topEntity: Object.entries(stats.byEntity).sort(([, a], [, b]) => b - a).slice(0, 5) };
  }, [logs, stats.byEntity]);

  function exportCSV() {
    if (logs.length === 0) return;
    const header = 'Date;Utilisateur;Email;Action;Entite;Entite ID;Details\n';
    const rows = logs.map((l) =>
      [
        new Date(l.createdAt).toISOString(),
        l.userName,
        l.userEmail,
        l.action,
        l.entity,
        l.entityId || '',
        l.details ? `"${l.details.replace(/"/g, '""')}"` : '',
      ].join(';')
    ).join('\n');
    const csv = '\uFEFF' + header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activite_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    if (logs.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageW, 50, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(241, 245, 249);
    doc.text("Journal d'activité", 20, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 32);
    doc.text(`${total} entrée(s)`, 20, 40);

    autoTable(doc, {
      head: [['Date', 'Utilisateur', 'Email', 'Action', 'Entité', 'Entité ID', 'Détails']],
      body: logs.map((l) => [
        new Date(l.createdAt).toLocaleString('fr-FR'),
        l.userName,
        l.userEmail,
        actionLabels[l.action] || l.action,
        l.entity,
        l.entityId || '',
        l.details?.slice(0, 100) || '',
      ]),
      startY: 55,
      styles: { fontSize: 6.5, textColor: [241, 245, 249], fillColor: [18, 18, 18], lineColor: [30, 41, 59], lineWidth: 0.3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [24, 24, 24] },
      margin: { top: 55, bottom: 20 },
    });
    doc.save(`activite_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (loading && logs.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader
        title="Journal d'activité"
        action={
          <div className="flex gap-2">
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportCSV}>CSV</SellerButton>
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportPDF}>PDF</SellerButton>
          </div>
        }
      />

      {/* StatCards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Actions" value={String(total)} description="Total des actions" icon={Activity} accentColor="blue" sparklineData={[stats.total]} />
        <StatCard title="Aujourd'hui" value={String(stats.today)} description="Actions aujourd'hui" icon={Calendar} accentColor="green" sparklineData={[stats.today]} />
        <StatCard title="Suppressions" value={String(stats.errors)} description="Actions DELETE" icon={XCircle} accentColor="red" sparklineData={[stats.errors]} />
        <StatCard title="Entités" value={String(Object.keys(stats.byEntity).length)} description="Entités distinctes" icon={Users} accentColor="amber" sparklineData={[Object.keys(stats.byEntity).length]} />
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
              placeholder="Rechercher par nom, email, détails..."
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            />
          </div>
          <div className="min-w-[140px]">
            <SellerSelect
              value={actionFilter}
              onChange={(v) => { setActionFilter(v); setPage(1); }}
              options={[
                { value: 'ALL', label: 'Toutes actions' },
                ...uniqueActions.filter((a) => a !== 'ALL').map((a) => ({ value: a, label: actionLabels[a] || a })),
              ]}
            />
          </div>
          <div className="min-w-[140px]">
            <SellerSelect
              value={entityFilter}
              onChange={(v) => { setEntityFilter(v); setPage(1); }}
              options={[
                { value: 'ALL', label: 'Toutes entités' },
                ...uniqueEntities.filter((e) => e !== 'ALL').map((e) => ({ value: e, label: e })),
              ]}
            />
          </div>
          <SellerInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Date début"
            icon={Calendar}
            className="w-40 [color-scheme:dark]"
          />
          <SellerInput
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Date fin"
            icon={Calendar}
            className="w-40 [color-scheme:dark]"
          />
          <div className="rounded-lg bg-[var(--bg-hover)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            {total} résultat(s)
          </div>
          {selectedIds.size > 0 && (
            <SellerButton variant="danger" size="sm" icon={Trash2} onClick={handleBatchDelete} disabled={deleting}>
              {deleting ? '...' : `Supprimer (${selectedIds.size})`}
            </SellerButton>
          )}
        </div>
      </SellerFilterBar>

      {logs.length === 0 && !loading ? (
        <SellerEmptyState
          title="Aucune activité"
          description="Le journal d'activité est vide."
          icon={Activity}
        />
      ) : (
        <>
          <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
            <SellerTableHeader>
              <SellerTableRow>
                <SellerTableCell isHeader className="text-center w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-input)] accent-[var(--accent-blue)]"
                    checked={logs.length > 0 && selectedIds.size === logs.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
                  <span className="inline-flex items-center">Date <SortIcon field="createdAt" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center">Utilisateur</SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('action')}>
                  <span className="inline-flex items-center">Action <SortIcon field="action" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('entity')}>
                  <span className="inline-flex items-center">Entité <SortIcon field="entity" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center cursor-pointer select-none" onClick={() => toggleSort('entityId')}>
                  <span className="inline-flex items-center">Entité ID <SortIcon field="entityId" /></span>
                </SellerTableCell>
                <SellerTableCell isHeader className="text-center">Détails</SellerTableCell>
                <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
              </SellerTableRow>
            </SellerTableHeader>
            <SellerTableBody>
              {logs.map((log) => (
                <SellerTableRow key={log.id} className={rowHighlight[log.action] || ''}>
                  <SellerTableCell className="text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-input)] accent-[var(--accent-blue)]"
                      checked={selectedIds.has(log.id)}
                      onChange={(e) => handleSelectOne(log.id, e.target.checked)}
                    />
                  </SellerTableCell>
                  <SellerTableCell className="whitespace-nowrap text-[var(--text-secondary)] text-center">
                    <span title={new Date(log.createdAt).toLocaleString('fr-FR')}>{relativeTime(log.createdAt)}</span>
                  </SellerTableCell>
                  <SellerTableCell className="text-[var(--text-secondary)] text-center">
                    <span title={log.userEmail || log.userId || ''}>{log.userName}</span>
                    {log.userName !== 'Système' && (
                      <span className="block text-[10px] text-[var(--text-tertiary)]">{log.userEmail}</span>
                    )}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${actionColors[log.action] || 'text-[var(--text-primary)] bg-[var(--bg-hover)]'}`}>
                      {log.action === 'CREATE' && <CheckCircle className="h-3 w-3" />}
                      {log.action === 'DELETE' && <XCircle className="h-3 w-3" />}
                      {log.action === 'UPDATE' && <Activity className="h-3 w-3" />}
                      {actionLabels[log.action] || log.action}
                    </span>
                  </SellerTableCell>
                  <SellerTableCell className="text-[var(--text-secondary)] text-center">
                    <SellerBadge color="slate" variant="light">{log.entity}</SellerBadge>
                  </SellerTableCell>
                  <SellerTableCell className="text-center font-mono text-xs text-[var(--text-tertiary)]">
                    {log.entityId || '—'}
                  </SellerTableCell>
                  <SellerTableCell className="max-w-[30ch] truncate text-[var(--text-secondary)] text-center text-xs">
                    {log.details || '—'}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <SellerButton variant="ghost" size="icon" icon={Eye} onClick={() => setSelectedLog(log)}>
                      Détail
                    </SellerButton>
                  </SellerTableCell>
                </SellerTableRow>
              ))}
            </SellerTableBody>
            <tfoot>
              <tr>
                <td colSpan={8}>
                  <SellerPagination page={page} pageSize={pageSize} totalItems={total} onPageChange={setPage} />
                </td>
              </tr>
            </tfoot>
          </SellerTable>

          {/* Panel breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <SellerPanel className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Activité par jour (7 derniers)</h3>
              <div className="space-y-2">
                {breakdown.byDay.length === 0 ? (
                  <p className="text-xs text-[var(--text-tertiary)]">Aucune donnée.</p>
                ) : (
                  breakdown.byDay.map(([day, count]) => {
                    const maxVal = Math.max(...breakdown.byDay.map(([, c]) => c), 1);
                    const pct = (count / maxVal) * 100;
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="w-24 text-xs text-[var(--text-secondary)] shrink-0">
                          {new Date(day + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex h-5 flex-1 overflow-hidden rounded bg-[var(--bg-hover)]">
                          <div className="h-full rounded bg-[var(--accent-blue)]/60 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-xs font-medium text-[var(--text-primary)] shrink-0">{count}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </SellerPanel>

            <SellerPanel className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Top utilisateurs</h3>
              <div className="space-y-2">
                {breakdown.topUsers.length === 0 ? (
                  <p className="text-xs text-[var(--text-tertiary)]">Aucune donnée.</p>
                ) : (
                  breakdown.topUsers.map(({ name, count }) => {
                    const maxVal = breakdown.topUsers[0]?.count || 1;
                    const pct = (count / maxVal) * 100;
                    return (
                      <div key={name} className="flex items-center gap-3">
                        <span className="w-32 truncate text-xs text-[var(--text-secondary)] shrink-0">{name}</span>
                        <div className="flex h-5 flex-1 overflow-hidden rounded bg-[var(--bg-hover)]">
                          <div className="h-full rounded bg-[var(--accent-green)]/60 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-xs font-medium text-[var(--text-primary)] shrink-0">{count}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <h3 className="mb-3 mt-5 text-sm font-semibold text-[var(--text-primary)]">Activité par entité</h3>
              <div className="space-y-2">
                {breakdown.topEntity.length === 0 ? (
                  <p className="text-xs text-[var(--text-tertiary)]">Aucune donnée.</p>
                ) : (
                  breakdown.topEntity.map(([entity, count]) => {
                    const maxVal = breakdown.topEntity[0]?.[1] || 1;
                    const pct = (count / maxVal) * 100;
                    return (
                      <div key={entity} className="flex items-center gap-3">
                        <span className="w-32 truncate text-xs text-[var(--text-secondary)] shrink-0">{entity}</span>
                        <div className="flex h-5 flex-1 overflow-hidden rounded bg-[var(--bg-hover)]">
                          <div className="h-full rounded bg-amber-400/60 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-xs font-medium text-[var(--text-primary)] shrink-0">{count}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </SellerPanel>
          </div>
        </>
      )}

      {/* Modal détail */}
      <SellerModal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Détail de l'activité"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Date</p>
                <p className="text-sm text-[var(--text-primary)]">
                  {new Date(selectedLog.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Utilisateur</p>
                <p className="text-sm text-[var(--text-primary)]">{selectedLog.userName}</p>
                {selectedLog.userEmail && (
                  <p className="text-xs text-[var(--text-tertiary)]">{selectedLog.userEmail}</p>
                )}
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Action</p>
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${actionColors[selectedLog.action] || 'text-[var(--text-primary)] bg-[var(--bg-hover)]'}`}>
                  {actionLabels[selectedLog.action] || selectedLog.action}
                </span>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Entité</p>
                <p className="text-sm text-[var(--text-primary)]">{selectedLog.entity}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Entité ID</p>
                <p className="font-mono text-sm text-[var(--text-primary)]">{selectedLog.entityId || '—'}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">ID Utilisateur</p>
                <p className="font-mono text-xs text-[var(--text-tertiary)]">{selectedLog.userId || '—'}</p>
              </div>
            </div>

            {selectedLog.details && (
              <div className="rounded-lg bg-[var(--bg-outer)] p-4">
                <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Détails (JSON)</p>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded bg-[var(--bg-dark)] p-3 font-mono text-xs text-[var(--text-primary)]">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                    } catch {
                      return selectedLog.details;
                    }
                  })()}
                </pre>
              </div>
            )}
          </div>
        )}
      </SellerModal>
    </div>
  );
}
