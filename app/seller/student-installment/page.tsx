'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Download, Eye, GraduationCap, RefreshCw, RotateCcw, Search, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Loading from '@/components/Loading';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerModal from '@/components/seller/SellerModal';
import SellerPanel from '@/components/seller/SellerPanel';
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
import {
  StudentInstallmentRequest,
  StudentInstallmentRequestStatus,
  UserRole,
} from '@/lib/types';

function getStatusClasses(status: StudentInstallmentRequestStatus): string {
  if (status === StudentInstallmentRequestStatus.APPROVED) return 'bg-emerald-100 text-emerald-700';
  if (status === StudentInstallmentRequestStatus.REJECTED) return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
}

export default function StudentInstallmentPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<StudentInstallmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StudentInstallmentRequestStatus>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [selectedRequest, setSelectedRequest] = useState<StudentInstallmentRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const limit = 50;

  const fetchRequests = useCallback(async () => {
    if (status !== 'authenticated' || session?.user?.role !== UserRole.ADMIN) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get('/api/admin/student-installment', { params });
      setRequests(response.data?.requests || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setTotal(response.data?.pagination?.total || 0);
    } catch (error) {
      console.error(error);
      toast.error('Impossible de charger les demandes.');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.role, status, page, statusFilter, dateFrom, dateTo, searchTerm]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const pendingCount = requests.filter((r) => r.status === StudentInstallmentRequestStatus.PENDING).length;
  const approvedCount = requests.filter((r) => r.status === StudentInstallmentRequestStatus.APPROVED).length;
  const rejectedCount = requests.filter((r) => r.status === StudentInstallmentRequestStatus.REJECTED).length;

  const updateStatus = async (requestId: string, nextStatus: StudentInstallmentRequestStatus) => {
    if (nextStatus === StudentInstallmentRequestStatus.REJECTED && !adminNote.trim()) {
      toast.error('Un motif de rejet est obligatoire.');
      return;
    }
    setProcessing(true);
    try {
      const response = await axios.put(`/api/admin/student-installment/${requestId}`, {
        status: nextStatus,
        adminNote: adminNote.trim() || null,
      });
      if (!response.data?.success) throw new Error(response.data?.message || 'Erreur');
      setRequests((current) => current.map((r) =>
        r.id === requestId ? { ...r, status: nextStatus, adminNote: adminNote.trim() || null, reviewedAt: new Date().toISOString() } : r
      ));
      toast.success('Demande mise a jour.');
      setSelectedRequest(null);
      setAdminNote('');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la mise a jour.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReopen = async (requestId: string) => {
    setProcessing(true);
    try {
      const res = await axios.post(`/api/admin/student-installment/${requestId}/reopen`);
      if (res.data?.success) {
        setRequests((current) => current.map((r) =>
          r.id === requestId ? { ...r, status: StudentInstallmentRequestStatus.PENDING, adminNote: null, reviewedAt: null } : r
        ));
        toast.success('Demande rouverte.');
        setSelectedRequest(null);
      } else {
        toast.error(res.data?.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la reouverture.');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/admin/student-installment/export', '_blank');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageW, 50, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(241, 245, 249);
    doc.text('Demandes etudiantes', 20, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 32);
    doc.text(`${requests.length} demande(s)`, 20, 40);
    const statsY = 60;
    const statWidth = (pageW - 40) / 3;
    const boxes = [
      { label: 'En attente', value: String(pendingCount), color: [245, 158, 11] },
      { label: 'Approuvees', value: String(approvedCount), color: [16, 185, 129] },
      { label: 'Refusees', value: String(rejectedCount), color: [239, 68, 68] },
    ];
    boxes.forEach((box, i) => {
      const x = 20 + i * (statWidth + 5);
      doc.setFillColor(24, 24, 24);
      doc.roundedRect(x, statsY, statWidth, 22, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(box.color[0], box.color[1], box.color[2]);
      doc.text(box.value, x + 4, statsY + 9);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(box.label, x + 4, statsY + 17);
    });
    autoTable(doc, {
      head: [['Nom', 'Email', 'Telephone', 'Ecole', 'Statut', 'Date']],
      body: requests.map((r) => [
        r.fullName, r.studentEmail, r.phoneNumber, r.schoolName,
        r.status === 'PENDING' ? 'En attente' : r.status === 'APPROVED' ? 'Approuvee' : 'Refusee',
        new Date(r.createdAt).toLocaleDateString('fr-FR'),
      ]),
      startY: statsY + 32,
      styles: { fontSize: 7, textColor: [241, 245, 249], fillColor: [18, 18, 18], lineColor: [30, 41, 59], lineWidth: 0.3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [24, 24, 24] },
      margin: { top: statsY + 32, bottom: 20 },
    });
    doc.save(`demandes_etudiantes_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const isDocImage = (url: string) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(url);

  if (loading && requests.length === 0) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loading /></div>;
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <div className="flex items-center justify-between">
        <SellerSectionHeader title="Financement" />
        <SellerButton variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
          CSV
        </SellerButton>
        <SellerButton variant="outline" size="sm" icon={Download} onClick={handleExportPDF}>
          PDF
        </SellerButton>
      </div>

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard title="En attente" value={String(pendingCount)} description="Demandes a verifier" icon={GraduationCap} accentColor="amber" />
        <StatCard title="Approuvees" value={String(approvedCount)} description="Profils actifs" icon={CheckCircle2} accentColor="green" />
        <StatCard title="Refusees" value={String(rejectedCount)} description="Demandes non conformes" icon={XCircle} accentColor="red" />
      </section>

      <SellerFilterBar>
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Rechercher par nom, ecole, email ou carte"
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            />
          </div>
          <SellerSelect
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value as 'ALL' | StudentInstallmentRequestStatus); setPage(1); }}
            options={[
              { value: 'ALL', label: 'Tous les statuts' },
              { value: StudentInstallmentRequestStatus.PENDING, label: 'En attente' },
              { value: StudentInstallmentRequestStatus.APPROVED, label: 'Approuvees' },
              { value: StudentInstallmentRequestStatus.REJECTED, label: 'Refusees' },
            ]}
            className="[&_button]:!h-9 [&_button]:!py-1.5 [&_button]:!px-3 w-[170px] shrink-0"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 w-[135px] shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2.5 text-xs text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)] [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
            title="Date debut"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 w-[135px] shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2.5 text-xs text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)] [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
            title="Date fin"
          />
        </div>
      </SellerFilterBar>

      <SellerPanel className="overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-6">
            <SellerEmptyState title="Aucune demande" description="Aucun dossier ne correspond aux criteres." icon={GraduationCap} />
          </div>
        ) : (
          <>
            <SellerTable>
              <SellerTableHeader>
                <SellerTableRow>
                  <SellerTableCell isHeader className="text-center">Etudiant</SellerTableCell>
                  <SellerTableCell isHeader className="text-center">Etablissement</SellerTableCell>
                  <SellerTableCell isHeader className="text-center">Dossier</SellerTableCell>
                  <SellerTableCell isHeader className="text-center">Statut</SellerTableCell>
                  <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
                </SellerTableRow>
              </SellerTableHeader>
              <SellerTableBody>
                {requests.map((request) => (
                  <SellerTableRow key={request.id}>
                    <SellerTableCell className="text-center">
                      <p className="font-semibold text-[var(--text-primary)]">{request.fullName}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{request.studentEmail}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{request.phoneNumber}</p>
                    </SellerTableCell>
                    <SellerTableCell className="text-center">
                      <p className="font-medium text-[var(--text-primary)]">{request.schoolName}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Carte: {request.studentIdNumber}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Plan: 3 tranches (50/25/25%)</p>
                    </SellerTableCell>
                    <SellerTableCell className="text-center">
                      <a href={request.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent-blue)] underline underline-offset-4">Voir le justificatif</a>
                      {request.notes ? <p className="mt-2 max-w-[30ch] text-xs leading-5 text-[var(--text-tertiary)]">{request.notes}</p> : null}
                    </SellerTableCell>
                    <SellerTableCell className="text-center">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(request.status)}`}>{request.status}</span>
                      {request.reviewedBy ? (
                        <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">par {request.reviewedBy.firstName} {request.reviewedBy.lastName}</p>
                      ) : null}
                    </SellerTableCell>
                    <SellerTableCell className="text-center">
                      <div className="inline-flex gap-2">
                        <SellerButton variant="ghost" size="sm" icon={Eye} onClick={() => { setSelectedRequest(request); setAdminNote(request.adminNote || ''); }}>Detail</SellerButton>
                        {request.status === StudentInstallmentRequestStatus.REJECTED && (
                          <SellerButton variant="outline" size="sm" icon={RotateCcw} onClick={() => handleReopen(request.id)}>Rouvrir</SellerButton>
                        )}
                        {request.status === StudentInstallmentRequestStatus.PENDING && (
                          <>
                            <SellerButton variant="success" size="sm" onClick={() => { setSelectedRequest(request); setAdminNote(''); }}>
                              Approuver
                            </SellerButton>
                            <SellerButton variant="danger" size="sm" onClick={() => { setSelectedRequest(request); setAdminNote(''); }}>
                              Refuser
                            </SellerButton>
                          </>
                        )}
                      </div>
                    </SellerTableCell>
                  </SellerTableRow>
                ))}
              </SellerTableBody>
            </SellerTable>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
                <p className="text-xs text-[var(--text-tertiary)]">{total} demande(s) - Page {page}/{totalPages}</p>
                <div className="flex gap-2">
                  <SellerButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Precedent</SellerButton>
                  <SellerButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Suivant</SellerButton>
                </div>
              </div>
            )}
          </>
        )}
      </SellerPanel>

      <SellerModal
        isOpen={!!selectedRequest}
        onClose={() => { setSelectedRequest(null); setAdminNote(''); }}
        title="Detail du dossier"
        size="lg"
        footer={
          selectedRequest && selectedRequest.status === StudentInstallmentRequestStatus.PENDING ? (
            <div className="flex gap-2">
              <SellerButton variant="success" disabled={processing} onClick={() => updateStatus(selectedRequest.id, StudentInstallmentRequestStatus.APPROVED)}>
                Approuver
              </SellerButton>
              <SellerButton variant="danger" disabled={processing} onClick={() => updateStatus(selectedRequest.id, StudentInstallmentRequestStatus.REJECTED)}>
                Refuser
              </SellerButton>
            </div>
          ) : selectedRequest && selectedRequest.status === StudentInstallmentRequestStatus.REJECTED ? (
            <SellerButton variant="outline" disabled={processing} onClick={() => handleReopen(selectedRequest.id)}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Rouvrir la demande
            </SellerButton>
          ) : null
        }
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)]">Nom complet</p>
                <p className="text-[var(--text-primary)]">{selectedRequest.fullName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)]">Telephone</p>
                <p className="text-[var(--text-primary)]">{selectedRequest.phoneNumber}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)]">Email etudiant</p>
                <p className="text-[var(--text-primary)]">{selectedRequest.studentEmail}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)]">Ecole</p>
                <p className="text-[var(--text-primary)]">{selectedRequest.schoolName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)]">Numero carte</p>
                <p className="text-[var(--text-primary)]">{selectedRequest.studentIdNumber}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)]">Plan</p>
                <p className="text-[var(--text-primary)]">{selectedRequest.requestedMonths} mois (50/25/25%)</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)]">Statut</p>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(selectedRequest.status)}`}>{selectedRequest.status}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)]">Date soumission</p>
                <p className="text-[var(--text-primary)]">{new Date(selectedRequest.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              {selectedRequest.reviewedAt && (
                <div>
                  <p className="text-xs font-medium text-[var(--text-tertiary)]">Date validation</p>
                  <p className="text-[var(--text-primary)]">{new Date(selectedRequest.reviewedAt).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
              {selectedRequest.reviewedBy && (
                <div>
                  <p className="text-xs font-medium text-[var(--text-tertiary)]">Valide par</p>
                  <p className="text-[var(--text-primary)]">{selectedRequest.reviewedBy.firstName} {selectedRequest.reviewedBy.lastName}</p>
                </div>
              )}
            </div>

            {selectedRequest.notes && (
              <div>
                <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Notes de l'etudiant</p>
                <p className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-primary)]">{selectedRequest.notes}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Justificatif</p>
              {isDocImage(selectedRequest.documentUrl) ? (
                <img src={selectedRequest.documentUrl} alt="Justificatif" className="max-h-80 w-full rounded-lg border border-[var(--border)] object-contain" />
              ) : (
                <iframe src={selectedRequest.documentUrl} className="h-80 w-full rounded-lg border border-[var(--border)]" title="Justificatif" />
              )}
              <a href={selectedRequest.documentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[var(--accent-blue)] underline underline-offset-4">Ouvrir dans un nouvel onglet</a>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">
                Note admin {selectedRequest.status === StudentInstallmentRequestStatus.REJECTED ? <span className="text-[var(--accent-red)]">*</span> : null}
              </p>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ajouter une note interne..."
                rows={3}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
              />
              {selectedRequest.status === StudentInstallmentRequestStatus.REJECTED && selectedRequest.adminNote && (
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">Motif de rejet actuel: {selectedRequest.adminNote}</p>
              )}
            </div>
          </div>
        )}
      </SellerModal>

    </div>
  );
}
