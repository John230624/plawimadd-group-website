'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Check, Loader2, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';

import CountryFlag from '@/components/CountryFlag';
import HomeFooter from '@/components/home/HomeFooter';
import { COUNTRIES, DEFAULT_COUNTRY, resolveCountry } from '@/lib/countries';
import { useAppContext } from '@/context/AppContext';
import type { Address } from '@/lib/types';

interface FormState {
  fullName: string;
  dial: string;
  phone: string;
  country: string;
  area: string;
  street: string;
  state: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

function emptyForm(): FormState {
  return {
    fullName: '',
    dial: DEFAULT_COUNTRY.dial,
    phone: '',
    country: DEFAULT_COUNTRY.name,
    area: '',
    street: '',
    state: '',
    city: '',
    pincode: '',
    isDefault: false,
  };
}

function addressToForm(address: Address): FormState {
  const info = resolveCountry(address.country) || DEFAULT_COUNTRY;
  const raw = (address.phoneNumber || '').trim();
  const phone = raw.startsWith(info.dial) ? raw.slice(info.dial.length).trim() : raw;

  return {
    fullName: address.fullName || '',
    dial: info.dial,
    phone,
    country: info.name,
    area: address.area || '',
    street: address.street || '',
    state: address.state || '',
    city: address.city || '',
    pincode: address.pincode || '',
    isDefault: Boolean(address.isDefault),
  };
}

export default function AddressesPage(): React.ReactElement {
  const router = useRouter();
  const { currentUser, isLoggedIn, userAddresses, loadingAddresses, fetchUserAddresses } =
    useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (isLoggedIn) fetchUserAddresses();
  }, [isLoggedIn, fetchUserAddresses]);

  const sortedAddresses = useMemo(
    () => [...userAddresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
    [userAddresses]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), fullName: currentUser?.name || '' });
    setIsModalOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditingId(address.id ?? null);
    setForm(addressToForm(address));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleCountryChange = (name: string) => {
    const info = resolveCountry(name) || DEFAULT_COUNTRY;
    setForm((prev) => ({ ...prev, country: info.name, dial: info.dial }));
  };

  const handleSave = useCallback(async () => {
    if (!currentUser?.id) {
      toast.error('Veuillez vous connecter.');
      return;
    }
    if (!form.fullName || !form.phone || !form.area || !form.city || !form.state || !form.country) {
      toast.error('Veuillez remplir les champs obligatoires.');
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      phoneNumber: `${form.dial} ${form.phone.trim()}`.trim(),
      country: form.country,
      area: form.area.trim(),
      street: form.street.trim() || null,
      state: form.state.trim(),
      city: form.city.trim(),
      pincode: form.pincode.trim() || null,
      isDefault: form.isDefault,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await axios.put(`/api/addresses/${currentUser.id}`, { ...payload, id: editingId });
        toast.success('Adresse mise a jour.');
      } else {
        await axios.post(`/api/addresses/${currentUser.id}`, payload);
        toast.success('Adresse ajoutee.');
      }
      await fetchUserAddresses();
      closeModal();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || 'Erreur serveur.'
        : 'Erreur inattendue.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [currentUser?.id, form, editingId, fetchUserAddresses]);

  const handleDelete = useCallback(
    async (address: Address) => {
      if (!currentUser?.id || !address.id) return;
      if (!window.confirm('Supprimer cette adresse ?')) return;

      setDeletingId(address.id);
      try {
        await axios.delete(`/api/addresses/${currentUser.id}?addressId=${address.id}`);
        toast.success('Adresse supprimee.');
        await fetchUserAddresses();
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || 'Erreur serveur.'
          : 'Erreur inattendue.';
        toast.error(message);
      } finally {
        setDeletingId(null);
      }
    },
    [currentUser?.id, fetchUserAddresses]
  );

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
        <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center justify-center px-4 py-20 text-center">
          <MapPin className="h-10 w-10 text-[#ff6a00]" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Carnet d&apos;adresses</h1>
          <p className="mt-2 text-sm text-slate-500">Connectez-vous pour gerer vos adresses de livraison.</p>
          <Link
            href="/login"
            className="mt-6 rounded-full bg-[var(--brand-600)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--brand-700)]"
          >
            Se connecter
          </Link>
        </main>
        <HomeFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-8 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Carnet d&apos;adresses</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gerez vos adresses de livraison : ajoutez, modifiez ou supprimez.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--brand-600)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-700)]"
          >
            <Plus className="h-4 w-4" />
            Ajouter une adresse
          </button>
        </div>

        <div className="mt-6">
          {loadingAddresses ? (
            <div className="flex min-h-[200px] items-center justify-center text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sortedAddresses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <MapPin className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">Aucune adresse enregistree pour le moment.</p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--brand-300)] px-4 py-2 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[var(--brand-50)]"
              >
                <Plus className="h-4 w-4" />
                Ajouter ma premiere adresse
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {sortedAddresses.map((address) => (
                <div
                  key={address.id}
                  className={`relative rounded-2xl border bg-white p-5 shadow-sm ${
                    address.isDefault ? 'border-[var(--brand-300)]' : 'border-slate-200'
                  }`}
                >
                  {address.isDefault ? (
                    <span className="absolute right-4 top-4 rounded-full bg-[var(--brand-50)] px-2.5 py-1 text-[11px] font-bold text-[var(--brand-700)]">
                      Par defaut
                    </span>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <CountryFlag country={address.country} className="h-4 w-6" />
                    <span className="text-xs font-medium text-slate-500">{address.country}</span>
                  </div>

                  <p className="mt-3 text-base font-bold text-slate-900">{address.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">{address.phoneNumber}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {address.area}
                    {address.street ? `, ${address.street}` : ''}
                    <br />
                    {address.city}, {address.state}
                    {address.pincode ? ` ${address.pincode}` : ''}
                  </p>

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(address)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(address)}
                      disabled={deletingId === address.id}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === address.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <HomeFooter />

      {isModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Modifier l’adresse' : 'Ajouter une adresse'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <p className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                <Check className="h-4 w-4" />
                Vos informations sont securisees
              </p>

              <label className="block">
                <span className="text-xs font-medium text-slate-500">Pays / region *</span>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-[var(--brand-300)]">
                  <CountryFlag country={form.country} className="h-4 w-6" />
                  <select
                    value={form.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 outline-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Prenom et Nom *</span>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-300)]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Numero de telephone *</span>
                  <div className="mt-1 flex items-center rounded-xl border border-slate-200 focus-within:border-[var(--brand-300)]">
                    <span className="border-r border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-500">
                      {form.dial}
                    </span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-slate-500">Adresse ou boite postale *</span>
                <input
                  type="text"
                  value={form.area}
                  onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-300)]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-500">Appartement, suite, batiment, etage (facultatif)</span>
                <input
                  type="text"
                  value={form.street}
                  onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-300)]"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Etat / province *</span>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-300)]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Ville *</span>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-300)]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Code postal</span>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-300)]"
                  />
                </label>
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-[var(--brand-600)] accent-[var(--brand-600)]"
                />
                <span className="text-sm text-slate-600">Definir comme adresse de livraison par defaut</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-600)] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-700)] disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
