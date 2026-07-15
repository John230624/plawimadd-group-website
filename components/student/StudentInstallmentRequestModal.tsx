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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-[620px] flex-col overflow-hidden rounded-[2px] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.12)] border-0">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 md:px-7 text-left">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Paiement par tranche</p>
            <h2 className="mt-1.5 text-base font-extrabold text-slate-900">
              Demande Étudiante
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
            aria-label="Fermer la modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-5 p-6 md:p-7">
            <div className="grid gap-4 md:grid-cols-2">
              <Field name="fullName" value={form.fullName} onChange={updateField} placeholder="Nom complet" />
              <Field name="phoneNumber" value={form.phoneNumber} onChange={updateField} placeholder="Téléphone" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field name="schoolName" value={form.schoolName} onChange={updateField} placeholder="Établissement scolaire" />
              <Field
                name="studentEmail"
                value={form.studentEmail}
                onChange={updateField}
                placeholder="Email étudiant"
                type="email"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                name="studentIdNumber"
                value={form.studentIdNumber}
                onChange={updateField}
                placeholder="Numéro de carte étudiante"
              />

              <div className="rounded-[2px] border border-slate-150 bg-slate-50/50 p-4 flex flex-col justify-center text-left">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-800">Plan de paiement</span>
                <p className="mt-1 text-[11px] leading-4 text-slate-500 font-medium">
                  3 échéances fixes : 50% au départ, puis 25% le 2e mois, et 25% le 3e mois.
                </p>
              </div>
            </div>

            <label className="block text-left">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Justificatif d&apos;inscription
              </span>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-[2px] border border-dashed border-slate-350 bg-slate-50/50 px-4 py-3 text-xs text-slate-650 hover:border-slate-400 transition">
                <Upload className="h-4 w-4 text-slate-500" />
                <span className="truncate font-medium">
                  {selectedFile ? selectedFile.name : 'Sélectionner un certificat ou une carte d\'étudiant'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </label>

            <label className="block text-left">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-700">Notes et matériel visé</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={updateField}
                rows={3}
                placeholder="Précisez votre filière d'études ou le matériel dont vous avez besoin."
                className="w-full rounded-[2px] border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-900 transition"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 md:flex-row md:justify-end md:px-7">
          <button
            type="button"
            onClick={onClose}
            className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-[2px] px-5 py-2.5 text-xs font-bold transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[2px] px-5 py-2.5 text-xs font-bold transition disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
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
    <label className="block text-left">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-700">{placeholder}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-[2px] border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-900 transition"
      />
    </label>
  );
}
