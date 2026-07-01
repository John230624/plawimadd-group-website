'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  DollarSign,
  Globe,
  Mail,
  Phone,
  Save,
  Settings,
  Truck,
} from 'lucide-react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
import SellerButton from '@/components/seller/SellerButton';
import SellerInput from '@/components/seller/SellerInput';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import SellerTextarea from '@/components/seller/SellerTextarea';

interface ShopSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  deliveryFee: number;
  freeShippingMin: number;
  currency: string;
  facebook: string;
  instagram: string;
  twitter: string;
  whatsapp: string;
}

const defaultSettings: ShopSettings = {
  siteName: '',
  siteDescription: '',
  contactEmail: '',
  contactPhone: '',
  deliveryFee: 0,
  freeShippingMin: 0,
  currency: 'XOF',
  facebook: '',
  instagram: '',
  twitter: '',
  whatsapp: '',
};

export default function SettingsPage(): React.ReactElement {
  const [form, setForm] = useState<ShopSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setForm({ ...defaultSettings, ...data });
    } catch {
      toast.error('Impossible de charger les paramètres.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Erreur');
      toast.success('Paramètres enregistrés.');
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
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
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader title="Paramètres boutique" />

      <div className="flex flex-col gap-6">
        {/* Général */}
        <div className="rounded-[10px] bg-[var(--bg-outer)] p-6">
          <div className="mb-4 flex items-center gap-3">
            <Settings className="h-5 w-5 text-[var(--accent-blue)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Général</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SellerInput
              label="Nom du site"
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              placeholder="Mon e-commerce"
            />
          </div>
          <div className="mt-4">
            <SellerTextarea
              label="Description du site"
              rows={3}
              value={form.siteDescription}
              onChange={(e) => setForm({ ...form, siteDescription: e.target.value })}
              placeholder="Description courte du site..."
            />
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-[10px] bg-[var(--bg-outer)] p-6">
          <div className="mb-4 flex items-center gap-3">
            <Mail className="h-5 w-5 text-[var(--accent-green)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Contact</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SellerInput
              label="Email de contact"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="contact@example.com"
              icon={Mail}
            />
            <SellerInput
              label="Téléphone"
              type="tel"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              placeholder="+225 00 00 00 00"
              icon={Phone}
            />
          </div>
        </div>

        {/* Livraison */}
        <div className="rounded-[10px] bg-[var(--bg-outer)] p-6">
          <div className="mb-4 flex items-center gap-3">
            <Truck className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Livraison</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SellerInput
              label="Frais de livraison"
              type="number"
              value={String(form.deliveryFee)}
              onChange={(e) => setForm({ ...form, deliveryFee: Number(e.target.value) })}
              icon={DollarSign}
            />
            <SellerInput
              label="Livraison gratuite à partir de"
              type="number"
              value={String(form.freeShippingMin)}
              onChange={(e) => setForm({ ...form, freeShippingMin: Number(e.target.value) })}
              icon={Truck}
            />
          </div>
        </div>

        {/* Devise */}
        <div className="rounded-[10px] bg-[var(--bg-outer)] p-6">
          <div className="mb-4 flex items-center gap-3">
            <Globe className="h-5 w-5 text-[var(--accent-blue)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Devise</h2>
          </div>
          <div className="max-w-xs">
            <SellerSelect
              value={form.currency}
              onChange={(v) => setForm({ ...form, currency: v })}
              options={[
                { value: 'XOF', label: 'XOF (Franc CFA)' },
                { value: 'EUR', label: 'EUR (Euro)' },
                { value: 'USD', label: 'USD (Dollar US)' },
              ]}
            />
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="rounded-[10px] bg-[var(--bg-outer)] p-6">
          <div className="mb-4 flex items-center gap-3">
            <Globe className="h-5 w-5 text-[var(--accent-green)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Réseaux sociaux</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SellerInput
              label="Facebook"
              value={form.facebook}
              onChange={(e) => setForm({ ...form, facebook: e.target.value })}
              placeholder="https://facebook.com/..."
            />
            <SellerInput
              label="Instagram"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="https://instagram.com/..."
            />
            <SellerInput
              label="Twitter"
              value={form.twitter}
              onChange={(e) => setForm({ ...form, twitter: e.target.value })}
              placeholder="https://twitter.com/..."
            />
            <SellerInput
              label="WhatsApp"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="+225 00 00 00 00"
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <SellerButton icon={Save} disabled={saving} onClick={handleSave}>
            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </SellerButton>
        </div>
      </div>
    </div>
  );
}
