'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Loader2, MapPin, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppContext } from '@/context/AppContext';
import type { Address } from '@/lib/types';

interface AddressCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelected: (address: Address) => Promise<void> | void;
  selectedAddressId?: number | null;
  selectActionLabel?: string;
  createActionLabel?: string;
}

interface AddressFormState {
  fullName: string;
  phoneNumber: string;
  pincode: string;
  area: string;
  city: string;
  state: string;
  street: string;
  country: string;
}

const emptyForm: AddressFormState = {
  fullName: '',
  phoneNumber: '',
  pincode: '',
  area: '',
  city: '',
  state: '',
  street: '',
  country: 'Benin',
};

export default function AddressCheckoutModal({
  isOpen,
  onClose,
  onAddressSelected,
  selectedAddressId,
  selectActionLabel = 'Utiliser cette adresse et payer',
  createActionLabel = 'Enregistrer et payer',
}: AddressCheckoutModalProps): React.ReactElement | null {
  const { currentUser, userAddresses, loadingAddresses, fetchUserAddresses } = useAppContext();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [selectedId, setSelectedId] = useState<number | null>(selectedAddressId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<AddressFormState>(emptyForm);

  useEffect(() => {
    if (!isOpen) return;
    fetchUserAddresses();
  }, [fetchUserAddresses, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const defaultAddress =
      userAddresses.find((address) => address.isDefault) || userAddresses[0] || null;

    setSelectedId(selectedAddressId ?? defaultAddress?.id ?? null);
    setMode(userAddresses.length ? 'select' : 'create');
  }, [isOpen, selectedAddressId, userAddresses]);

  const selectedAddress = useMemo(
    () => userAddresses.find((address) => address.id === selectedId) || null,
    [selectedId, userAddresses]
  );

  if (!isOpen) return null;

  const saveNewAddress = async () => {
    if (!currentUser?.id) {
      toast.error('Veuillez vous connecter pour ajouter une adresse.');
      return;
    }

    if (!form.fullName || !form.phoneNumber || !form.area || !form.city || !form.state) {
      toast.error('Veuillez remplir les champs obligatoires.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await axios.post(`/api/addresses/${currentUser.id}`, {
        ...form,
        pincode: form.pincode || null,
        isDefault: true,
      });

      if (!response.data?.success) {
        toast.error(response.data?.message || "Impossible d'ajouter l'adresse.");
        return;
      }

      await fetchUserAddresses();
      const refreshedAddress = {
        id: response.data.addressId,
        userId: currentUser.id,
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        pincode: form.pincode || null,
        area: form.area,
        city: form.city,
        state: form.state,
        street: form.street || '',
        country: form.country,
        isDefault: true,
      } as Address;

      await onAddressSelected(refreshedAddress);
      setForm(emptyForm);
      toast.success('Adresse ajoutee avec succes.');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout de l'adresse.");
    } finally {
      setIsSaving(false);
    }
  };

  const useSelectedAddress = async () => {
    if (!currentUser?.id || !selectedAddress || !selectedAddress.id) {
      toast.error('Veuillez selectionner une adresse.');
      return;
    }

    setIsSaving(true);
    try {
      await axios.put(`/api/addresses/${currentUser.id}`, {
        ...selectedAddress,
        id: selectedAddress.id,
        isDefault: true,
      });

      await fetchUserAddresses();
      await onAddressSelected({ ...selectedAddress, isDefault: true });
      toast.success('Adresse selectionnee.');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'utiliser cette adresse.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[980px] overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 md:px-8">
          <div>
            <p className="text-sm text-slate-500">Finalisation de commande</p>
            <h2 className="mt-1 text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950">
              Adresse de livraison
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

        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r lg:p-8">
            <div className="mb-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMode('select')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === 'select'
                    ? 'bg-[var(--brand-600)] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Mes adresses
              </button>
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === 'create'
                    ? 'bg-[var(--brand-600)] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Nouvelle adresse
              </button>
            </div>

            {mode === 'select' ? (
              <div className="space-y-4">
                {loadingAddresses ? (
                  <div className="flex min-h-[220px] items-center justify-center text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : userAddresses.length === 0 ? (
                  <div className="rounded-[1.5rem] bg-slate-50 p-6 text-sm leading-7 text-slate-500">
                    Aucune adresse enregistree pour le moment. Vous pouvez en ajouter une
                    directement dans cette fenetre.
                  </div>
                ) : (
                  userAddresses.map((address) => {
                    const isSelected = address.id === selectedId;

                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => setSelectedId(address.id ?? null)}
                        className={`w-full rounded-[1.5rem] border p-5 text-left transition ${
                          isSelected
                            ? 'border-[var(--brand-300)] bg-[rgba(191,219,254,0.12)] shadow-[0_10px_24px_rgba(96,165,250,0.08)]'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full bg-[var(--brand-50)] p-2 text-[var(--brand-700)]">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-base font-semibold text-slate-950">
                                {address.fullName}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">{address.phoneNumber}</p>
                              <p className="mt-2 text-sm leading-7 text-slate-600">
                                {address.area}, {address.city}, {address.state}
                                {address.country ? `, ${address.country}` : ''}
                              </p>
                            </div>
                          </div>

                          {address.isDefault ? (
                            <span className="rounded-full bg-[var(--brand-50)] px-3 py-1 text-xs font-medium text-[var(--brand-700)]">
                              Par defaut
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  placeholder="Nom complet"
                  className="rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-[var(--brand-300)] md:col-span-2"
                />
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
                  }
                  placeholder="Telephone"
                  className="rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-[var(--brand-300)]"
                />
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(event) => setForm((prev) => ({ ...prev, pincode: event.target.value }))}
                  placeholder="Code postal"
                  className="rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-[var(--brand-300)]"
                />
                <textarea
                  value={form.area}
                  onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
                  placeholder="Adresse detaillee"
                  rows={4}
                  className="rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-[var(--brand-300)] md:col-span-2"
                />
                <input
                  type="text"
                  value={form.street}
                  onChange={(event) => setForm((prev) => ({ ...prev, street: event.target.value }))}
                  placeholder="Rue"
                  className="rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-[var(--brand-300)] md:col-span-2"
                />
                <input
                  type="text"
                  value={form.city}
                  onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                  placeholder="Ville"
                  className="rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-[var(--brand-300)]"
                />
                <input
                  type="text"
                  value={form.state}
                  onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
                  placeholder="Region"
                  className="rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-[var(--brand-300)]"
                />
                <input
                  type="text"
                  value={form.country}
                  onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
                  placeholder="Pays"
                  className="rounded-[1rem] border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-[var(--brand-300)] md:col-span-2"
                />
              </div>
            )}
          </div>

          <div className="bg-[var(--brand-50)] p-6 lg:p-8">
            <div className="rounded-[1.6rem] bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
              <p className="text-sm text-slate-500">Etape checkout</p>
              <h3 className="mt-2 text-[1.35rem] font-semibold text-slate-950">
                Livraison
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Choisissez une adresse existante ou ajoutez-en une nouvelle sans quitter votre
                panier. C’est plus fluide et plus professionnel pour le parcours d’achat.
              </p>

              <div className="mt-6 rounded-[1.3rem] border border-dashed border-[var(--brand-200)] bg-[rgba(191,219,254,0.10)] p-5">
                <p className="text-sm font-medium text-slate-700">Adresse selectionnee</p>
                {selectedAddress ? (
                  <div className="mt-3 text-sm leading-7 text-slate-600">
                    <p className="font-semibold text-slate-900">{selectedAddress.fullName}</p>
                    <p>{selectedAddress.phoneNumber}</p>
                    <p>
                      {selectedAddress.area}, {selectedAddress.city}, {selectedAddress.state}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Aucune adresse encore selectionnee.
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {mode === 'select' ? (
                  <button
                    type="button"
                    onClick={useSelectedAddress}
                    disabled={!selectedAddress || isSaving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-600)] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {selectActionLabel}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={saveNewAddress}
                    disabled={isSaving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-600)] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {createActionLabel}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Fermer
                </button>
              </div>

              <button
                type="button"
                onClick={() => window.location.assign('/add-address')}
                className="mt-4 text-sm font-medium text-[var(--brand-700)] underline underline-offset-4"
              >
                Ouvrir la page complete de gestion des adresses
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
