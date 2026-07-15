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

  useEffect(() => {
    if (isOpen && mode === 'create') {
      const userFullName = currentUser
        ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || ''
        : '';
      const userPhone = currentUser?.phoneNumber || '';

      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || userFullName,
        phoneNumber: prev.phoneNumber || userPhone,
      }));
    }
  }, [isOpen, mode, currentUser]);

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
      <div className="w-full max-w-[980px] overflow-hidden rounded-lg bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 md:px-8">
          <div>
            <h2 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950">
              Adresse de livraison
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr] text-left">
          <div className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r lg:p-8">
            <div className="mb-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMode('select')}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  mode === 'select'
                    ? 'bg-[#ff6a00] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Mes adresses
              </button>
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  mode === 'create'
                    ? 'bg-[#ff6a00] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Nouvelle adresse
              </button>
            </div>

            {mode === 'select' ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {loadingAddresses ? (
                  <div className="flex min-h-[220px] items-center justify-center text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : userAddresses.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 p-6 text-sm leading-7 text-slate-500 border border-slate-100">
                    Aucune adresse enregistrée pour le moment. Vous pouvez en ajouter une
                    directement dans cette fenêtre.
                  </div>
                ) : (
                  userAddresses.map((address) => {
                    const isSelected = address.id === selectedId;

                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => setSelectedId(address.id ?? null)}
                        className={`w-full rounded-lg border p-5 text-left transition ${
                          isSelected
                            ? 'border-[#ff6a00] bg-orange-50/20 shadow-sm'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-lg bg-orange-50 p-2 text-[#ff6a00]">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {address.fullName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500 font-semibold">{address.phoneNumber}</p>
                              <p className="mt-2 text-xs leading-5 text-slate-650 font-medium">
                                {address.area}, {address.city}, {address.state}
                                {address.country ? `, ${address.country}` : ''}
                              </p>
                            </div>
                          </div>

                          {address.isDefault ? (
                            <span className="rounded-md bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-[#ff6a00] uppercase tracking-wide">
                              Par défaut
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
                  className="rounded-lg border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#ff6a00] md:col-span-2 transition"
                />
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
                  }
                  placeholder="Téléphone"
                  className="rounded-lg border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#ff6a00] transition"
                />
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(event) => setForm((prev) => ({ ...prev, pincode: event.target.value }))}
                  placeholder="Code postal"
                  className="rounded-lg border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#ff6a00] transition"
                />
                <textarea
                  value={form.area}
                  onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
                  placeholder="Adresse détaillée"
                  rows={3}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#ff6a00] md:col-span-2 transition"
                />
                <input
                  type="text"
                  value={form.street}
                  onChange={(event) => setForm((prev) => ({ ...prev, street: event.target.value }))}
                  placeholder="Rue"
                  className="rounded-lg border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#ff6a00] md:col-span-2 transition"
                />
                <input
                  type="text"
                  value={form.city}
                  onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                  placeholder="Ville"
                  className="rounded-lg border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#ff6a00] transition"
                />
                <input
                  type="text"
                  value={form.state}
                  onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
                  placeholder="Région"
                  className="rounded-lg border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#ff6a00] transition"
                />
                <input
                  type="text"
                  value={form.country}
                  onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
                  placeholder="Pays"
                  className="rounded-lg border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#ff6a00] md:col-span-2 transition"
                />
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-6 lg:p-8">
            <div className="rounded-lg bg-white p-6 shadow-none border border-transparent">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Étape checkout</p>
              <h3 className="mt-1 text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Livraison
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-500 font-medium">
                Choisissez une adresse existante ou ajoutez-en une nouvelle sans quitter votre
                panier. C’est plus fluide et plus professionnel pour le parcours d’achat.
              </p>

              <div className="mt-5 rounded-lg border border-dashed border-slate-250 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Adresse sélectionnée</p>
                {selectedAddress ? (
                  <div className="mt-2 text-xs leading-5 text-slate-600">
                    <p className="font-bold text-slate-900">{selectedAddress.fullName}</p>
                    <p className="font-semibold">{selectedAddress.phoneNumber}</p>
                    <p className="font-medium text-slate-500">
                      {selectedAddress.area}, {selectedAddress.city}, {selectedAddress.state}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-slate-400 italic font-medium">
                    Aucune adresse encore sélectionnée.
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-2.5">
                {mode === 'select' ? (
                  <button
                    type="button"
                    onClick={useSelectedAddress}
                    disabled={!selectedAddress || isSaving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff6a00] hover:bg-[#e25c00] px-6 py-3.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {selectActionLabel}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={saveNewAddress}
                    disabled={isSaving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff6a00] hover:bg-[#e25c00] px-6 py-3.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {createActionLabel}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Fermer
                </button>
              </div>

              <button
                type="button"
                onClick={() => window.location.assign('/addresses')}
                className="mt-4 text-xs font-bold text-[#ff6a00] hover:text-[#e25c00] transition underline underline-offset-4 block w-full text-center"
              >
                Ouvrir la page complète de gestion des adresses
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
