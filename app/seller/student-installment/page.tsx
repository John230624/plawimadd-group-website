'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { CheckCircle2, GraduationCap, Search, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

import Footer from '@/components/seller/Footer';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import SellerStatCard from '@/components/seller/SellerStatCard';
import Loading from '@/components/Loading';
import {
  StudentInstallmentRequest,
  StudentInstallmentRequestStatus,
  UserRole,
} from '@/lib/types';

function getStatusClasses(status: StudentInstallmentRequestStatus): string {
  if (status === StudentInstallmentRequestStatus.APPROVED) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === StudentInstallmentRequestStatus.REJECTED) {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-amber-100 text-amber-700';
}

export default function StudentInstallmentPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<StudentInstallmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StudentInstallmentRequestStatus>('ALL');

  const fetchRequests = useCallback(async () => {
    if (status !== 'authenticated' || session?.user?.role !== UserRole.ADMIN) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/api/admin/student-installment');

      setRequests(response.data?.requests || []);
    } catch (error) {
      console.error(error);
      toast.error('Impossible de charger les demandes etudiantes.');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.role, status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
      const haystack = [
        request.fullName,
        request.schoolName,
        request.studentEmail,
        request.studentIdNumber,
      ]
        .join(' ')
        .toLowerCase();

      return matchesStatus && haystack.includes(searchTerm.toLowerCase());
    });
  }, [requests, searchTerm, statusFilter]);

  const pendingCount = requests.filter(
    (request) => request.status === StudentInstallmentRequestStatus.PENDING
  ).length;
  const approvedCount = requests.filter(
    (request) => request.status === StudentInstallmentRequestStatus.APPROVED
  ).length;
  const rejectedCount = requests.filter(
    (request) => request.status === StudentInstallmentRequestStatus.REJECTED
  ).length;

  const updateStatus = async (
    requestId: string,
    nextStatus: StudentInstallmentRequestStatus
  ): Promise<void> => {
    try {
      const response = await axios.put(
        `/api/admin/student-installment/${requestId}`,
        { status: nextStatus }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Mise a jour impossible.');
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: nextStatus,
                reviewedAt: new Date().toISOString(),
              }
            : request
        )
      );

      toast.success('Demande mise a jour.');
    } catch (error) {
      console.error(error);
      toast.error('Impossible de mettre a jour la demande.');
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
        eyebrow="Financement"
        title="Demandes etudiantes"
        description="Validez les dossiers de paiement par tranche reserves aux etudiants avant qu'ils puissent passer une commande en mode etudiant."
      />

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <SellerStatCard
          title="En attente"
          value={String(pendingCount)}
          description="Demandes a verifier avec justificatif."
          icon={GraduationCap}
          tone="amber"
        />
        <SellerStatCard
          title="Approuvees"
          value={String(approvedCount)}
          description="Profils etudiants pouvant demander un paiement par tranche."
          icon={CheckCircle2}
          tone="emerald"
        />
        <SellerStatCard
          title="Refusees"
          value={String(rejectedCount)}
          description="Demandes non conformes ou incompletes."
          icon={XCircle}
          tone="rose"
        />
      </section>

      <SellerPanel className="mt-6 p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher par nom, ecole, email ou carte etudiante"
              className="w-full rounded-full border border-slate-200 bg-white px-11 py-3.5 text-sm text-slate-700 outline-none transition focus:border-[var(--brand-300)]"
            />
          </div>

          <SellerSelect
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as 'ALL' | StudentInstallmentRequestStatus)
            }
            options={[
              { value: 'ALL', label: 'Tous les statuts' },
              { value: StudentInstallmentRequestStatus.PENDING, label: 'En attente' },
              { value: StudentInstallmentRequestStatus.APPROVED, label: 'Approuvees' },
              { value: StudentInstallmentRequestStatus.REJECTED, label: 'Refusees' },
            ]}
          />
        </div>
      </SellerPanel>

      <SellerPanel className="mt-6 overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-6">
            <SellerEmptyState
              title="Aucune demande trouvee"
              description="Aucun dossier ne correspond a votre recherche ou au filtre applique."
              icon={GraduationCap}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Etudiant</th>
                  <th className="px-6 py-4 font-medium">Etablissement</th>
                  <th className="px-6 py-4 font-medium">Dossier</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-t border-slate-100 align-top">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-950">{request.fullName}</p>
                      <p className="mt-1 text-slate-500">{request.studentEmail}</p>
                      <p className="mt-1 text-xs text-slate-400">{request.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-medium text-slate-900">{request.schoolName}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Carte: {request.studentIdNumber}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Plan fixe: 3 tranches (50% / 25% / 25%)
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <a
                        href={request.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--brand-700)] underline underline-offset-4"
                      >
                        Voir le justificatif
                      </a>
                      {request.notes ? (
                        <p className="mt-2 max-w-[30ch] text-xs leading-6 text-slate-500">
                          {request.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(request.id, StudentInstallmentRequestStatus.APPROVED)
                          }
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Approuver
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(request.id, StudentInstallmentRequestStatus.REJECTED)
                          }
                          className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          Refuser
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SellerPanel>

      <Footer />
    </div>
  );
}
