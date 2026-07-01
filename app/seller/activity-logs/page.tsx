'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
} from 'lucide-react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerInput from '@/components/seller/SellerInput';
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
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
}

const pageSize = 20;

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
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'ALL') params.set('action', actionFilter);
      if (entityFilter !== 'ALL') params.set('entity', entityFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/admin/activity-logs?${params}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      toast.error('Impossible de charger le journal.');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [actionFilter, entityFilter, startDate, endDate]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, page]);

  const uniqueActions = useMemo(() => ['ALL', ...new Set(logs.map((l) => l.action))], [logs]);
  const uniqueEntities = useMemo(() => ['ALL', ...new Set(logs.map((l) => l.entity))], [logs]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader title="Journal d'activité" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Actions" value={String(logs.length)} description="Total des actions" icon={Activity} accentColor="blue" />
      </div>

      <SellerFilterBar>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[140px]">
            <SellerSelect
              value={actionFilter}
              onChange={(v) => { setActionFilter(v); setPage(1); }}
              options={[
                { value: 'ALL', label: 'Toutes actions' },
                ...uniqueActions.filter((a) => a !== 'ALL').map((a) => ({ value: a, label: a })),
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
            className="w-40"
          />
          <SellerInput
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Date fin"
            icon={Calendar}
            className="w-40"
          />
          <div className="rounded-lg bg-[var(--bg-hover)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            {logs.length} résultat(s)
          </div>
        </div>
      </SellerFilterBar>

      {logs.length === 0 ? (
        <SellerEmptyState
          title="Aucune activité"
          description="Le journal d'activité est vide."
          icon={Activity}
        />
      ) : (
        <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader>Date</SellerTableCell>
              <SellerTableCell isHeader>Utilisateur</SellerTableCell>
              <SellerTableCell isHeader>Action</SellerTableCell>
              <SellerTableCell isHeader>Entité</SellerTableCell>
              <SellerTableCell isHeader>Détails</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {paginated.map((log) => (
              <SellerTableRow key={log.id}>
                <SellerTableCell className="whitespace-nowrap text-[var(--text-secondary)]">
                  <span title={new Date(log.createdAt).toLocaleString('fr-FR')}>{relativeTime(log.createdAt)}</span>
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)]">{log.userId ? log.userId.slice(0, 8) : 'Systeme'}</SellerTableCell>
                <SellerTableCell>
                  <span className="rounded-md bg-[var(--bg-hover)] px-2 py-1 text-xs font-medium text-[var(--text-primary)]">
                    {log.action}
                  </span>
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)]">{log.entity}</SellerTableCell>
                <SellerTableCell className="max-w-[40ch] truncate text-[var(--text-secondary)]">
                  {log.details}
                </SellerTableCell>
              </SellerTableRow>
            ))}
          </SellerTableBody>
          <tfoot>
            <tr>
              <td colSpan={5}>
                <SellerPagination page={page} pageSize={pageSize} totalItems={logs.length} onPageChange={setPage} />
              </td>
            </tr>
          </tfoot>
        </SellerTable>
      )}
    </div>
  );
}
