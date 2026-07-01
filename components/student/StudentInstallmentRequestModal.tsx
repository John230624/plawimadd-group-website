'use client';

import React, { ChangeEvent, useState } from 'react';
import axios from 'axios';
import { Loader2, Upload, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

import type { StudentInstallmentRequest } from '@/lib/types';

interface StudentInstallmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (request: StudentInstallmentRequest) => void;
}

type FormState = {
  fullName: string;
  phoneNumber: string;
  schoolName: string;
  studentEmail: string;
  studentIdNumber: string;
  notes: string;
};

const initialForm: FormState = {
  fullName: '',
  phoneNumber: '',
  schoolName: '',
  studentEmail: '',
  studentIdNumber: '',
  notes: '',
};

export default function StudentInstallmentRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: StudentInstallmentRequestModalProps): React.ReactElement | null {
  const { status } = useSession();
  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const updateField = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async () => {
    if (status !== 'authenticated') {
      toast.info('Connectez-vous avant de soumettre une demande etudiante.');
      return;
    }

    if (
      !form.fullName ||
      !form.phoneNumber ||
      !form.schoolName ||
      !form.studentEmail ||
      !form.studentIdNumber ||
      !selectedFile
    ) {
      toast.error('Veuillez remplir tous les champs et ajouter un justificatif.');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadData = new FormData();
      uploadData.append('image', selectedFile);

      const uploadResponse = await axios.post('/api/upload-image', uploadData);
      const documentUrl = uploadResponse.data?.imageUrl;

      if (!documentUrl) {
        throw new Error("Le justificatif n'a pas pu etre telecharge.");
      }

      const response = await axios.post('/api/student-installment', {
        ...form,
        requestedMonths: 3,
        documentUrl,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Demande impossible.');
      }

      toast.success('Votre demande etudiante a bien ete envoyee.');
      onSuccess?.(response.data.request);
      setForm(initialForm);
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : 'Erreur lors de la soumission de la demande.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-[860px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 md:px-8">
          <div>
            <p className="text-sm text-slate-500">Paiement par tranche</p>
            <h2 className="mt-1 text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950">
              Demande etudiante
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-5 p-6 md:grid-cols-2 md:p-8">
            <Field name="fullName" value={form.fullName} onChange={updateField} placeholder="Nom complet" />
            <Field name="phoneNumber" value={form.phoneNumber} onChange={updateField} placeholder="Telephone" />
            <Field name="schoolName" value={form.schoolName} onChange={updateField} placeholder="Etablissement" />
            <Field
              name="studentEmail"
              value={form.studentEmail}
              onChange={updateField}
              placeholder="Email etudiant"
              type="email"
            />
            <Field
              name="studentIdNumber"
              value={form.studentIdNumber}
              onChange={updateField}
              placeholder="Numero de carte etudiante"
            />

            <div className="rounded-[1.15rem] border border-[var(--brand-200)] bg-[rgba(237,244,253,0.45)] px-4 py-3.5">
              <span className="block text-sm font-medium text-slate-700">Plan applique</span>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                3 tranches obligatoires : 50% au depart, puis 25% au 2e mois et 25% au 3e mois.
              </p>
            </div>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Justificatif etudiant
              </span>
              <label className="flex cursor-pointer items-center gap-3 rounded-[1.2rem] border border-dashed border-[var(--brand-300)] bg-[rgba(237,244,253,0.55)] px-4 py-4 text-sm text-slate-600">
                <Upload className="h-4 w-4 text-[var(--brand-700)]" />
                <span className="truncate">
                  {selectedFile ? selectedFile.name : 'Ajouter une carte etudiante ou un justificatif'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Notes</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={updateField}
                rows={4}
                placeholder="Expliquez votre besoin, votre filiere ou le materiel vise."
                className="w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 outline-none"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 md:flex-row md:justify-end md:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-700)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)] disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Envoyer la demande
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  name: string;
  value: string | number;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  placeholder: string;
  type?: string;
}): React.ReactElement {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{placeholder}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 outline-none"
      />
    </label>
  );
}
