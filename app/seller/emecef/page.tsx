'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Save, ShieldCheck, Plug, AlertTriangle, FileCheck2 } from 'lucide-react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
import SellerButton from '@/components/seller/SellerButton';
import SellerInput from '@/components/seller/SellerInput';
import SellerSelect from '@/components/seller/SellerSelect';
import SellerPanel from '@/components/seller/SellerPanel';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';

type Settings = Record<string, string>;

const YES_NO = [
  { value: 'true', label: 'Activé' },
  { value: 'false', label: 'Désactivé' },
];
const ENVS = [
  { value: 'TEST', label: 'TEST (bac à sable DGI)' },
  { value: 'PROD', label: 'PRODUCTION' },
];
const TAX_GROUPS = [
  { value: 'A', label: 'A — Exonéré (0%)' },
  { value: 'B', label: 'B — Taux normal 18%' },
  { value: 'C', label: 'C — Taxe spécifique' },
  { value: 'D', label: 'D — Exportation (0%)' },
  { value: 'E', label: 'E — Régime TPS' },
  { value: 'F', label: 'F — Taux réduit' },
];
const AIB = [
  { value: '', label: 'Aucun' },
  { value: 'A', label: 'AIB groupe A' },
  { value: 'B', label: 'AIB groupe B' },
];

export default function EmecefSettingsPage(): React.ReactElement {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const get = (k: string, d = '') => settings[k] ?? d;
  const set = (k: string, v: string) => setSettings((s) => ({ ...s, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.status === 401 || res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json();
      setSettings(data || {});
    } catch {
      toast.error('Impossible de charger les réglages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: Settings = {
        'emecef.enabled': get('emecef.enabled', 'false'),
        'emecef.environment': get('emecef.environment', 'TEST'),
        'emecef.token': get('emecef.token', ''),
        'emecef.ifu': get('emecef.ifu', ''),
        'emecef.defaultTaxGroup': get('emecef.defaultTaxGroup', 'B'),
        'emecef.aib': get('emecef.aib', ''),
        'emecef.autoNormalizeOnline': get('emecef.autoNormalizeOnline', 'false'),
        'company.name': get('company.name', ''),
        'company.rccm': get('company.rccm', ''),
        'company.address': get('company.address', ''),
        'company.contact': get('company.contact', ''),
      };
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Réglages e-MECeF enregistrés.');
      } else {
        toast.error(data.message || "Échec de l'enregistrement.");
      }
    } catch {
      toast.error("Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/emecef/status');
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success(`Connexion e-MECeF OK (${data.environment}) — IFU ${data.ifu || 'non défini'}.`);
      } else {
        toast.error(`Échec : ${data.message || 'connexion impossible'}`);
      }
    } catch {
      toast.error('Échec du test de connexion.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-2xl">
        <SellerPanel className="p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Accès réservé aux administrateurs</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            La configuration de la facturation normalisée (e-MECeF) est réservée aux comptes administrateurs.
          </p>
        </SellerPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 pb-12">
      <SellerSectionHeader title="Facturation normalisée (e-MECeF / DGI)" />

      <SellerPanel className="p-4 border-l-4 border-l-[var(--accent-blue)]">
        <div className="flex items-start gap-3">
          <FileCheck2 className="mt-0.5 h-5 w-5 text-[var(--accent-blue)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Renseignez ici votre accès e-MECeF de la DGI. En environnement <strong>TEST</strong>, utilisez un
            jeton de bac à sable pour valider le fonctionnement. Une fois prêt pour la production, il suffit de
            basculer sur <strong>PRODUCTION</strong> et de coller vos vraies clés : le reste fonctionne à l&apos;identique.
            Les paiements du site génèrent la <strong>facture simple</strong> par défaut ; la normalisation reste à la demande.
          </p>
        </div>
      </SellerPanel>

      {/* Connexion e-MECeF */}
      <SellerPanel className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[var(--accent-blue)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connexion e-MECeF</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Normalisation</span>
            <SellerSelect value={get('emecef.enabled', 'false')} onChange={(v) => set('emecef.enabled', v)} options={YES_NO} />
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Environnement</span>
            <SellerSelect value={get('emecef.environment', 'TEST')} onChange={(v) => set('emecef.environment', v)} options={ENVS} />
          </div>
          <SellerInput
            label="Jeton API (Bearer)"
            type="password"
            value={get('emecef.token')}
            onChange={(e) => set('emecef.token', e.target.value)}
            placeholder="Collez votre jeton e-MECeF"
            autoComplete="off"
          />
          <SellerInput
            label="IFU émetteur"
            value={get('emecef.ifu')}
            onChange={(e) => set('emecef.ifu', e.target.value)}
            placeholder="3202XXXXXXXXX"
          />
          <div>
            <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Groupe de taxe par défaut</span>
            <SellerSelect value={get('emecef.defaultTaxGroup', 'B')} onChange={(v) => set('emecef.defaultTaxGroup', v)} options={TAX_GROUPS} />
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">AIB</span>
            <SellerSelect value={get('emecef.aib', '')} onChange={(v) => set('emecef.aib', v)} options={AIB} />
          </div>
          <div className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Normaliser automatiquement les paiements en ligne</span>
            <SellerSelect value={get('emecef.autoNormalizeOnline', 'false')} onChange={(v) => set('emecef.autoNormalizeOnline', v)} options={YES_NO} />
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Laissez « Désactivé » pour garder la facture simple par défaut sur les commandes du site.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <SellerButton type="button" variant="outline" icon={Plug} disabled={testing} onClick={testConnection}>
            {testing ? 'Test en cours…' : 'Tester la connexion'}
          </SellerButton>
          <SellerButton type="button" icon={Save} disabled={saving} onClick={save}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </SellerButton>
        </div>
      </SellerPanel>

      {/* Identité émetteur (imprimée sur la facture) */}
      <SellerPanel className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <FileCheck2 className="h-5 w-5 text-[var(--accent-blue)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Identité émetteur (facture)</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <SellerInput label="Raison sociale" value={get('company.name')} onChange={(e) => set('company.name', e.target.value)} placeholder="PLAWIMADD GROUP" />
          <SellerInput label="RCCM" value={get('company.rccm')} onChange={(e) => set('company.rccm', e.target.value)} placeholder="RB/ABC/22 B 6030" />
          <SellerInput label="Adresse" value={get('company.address')} onChange={(e) => set('company.address', e.target.value)} placeholder="GODOMEY - ABOMEY CALAVI" />
          <SellerInput label="Contact" value={get('company.contact')} onChange={(e) => set('company.contact', e.target.value)} placeholder="97918000 / 97747178" />
        </div>
        <div className="mt-6 flex justify-end">
          <SellerButton type="button" icon={Save} disabled={saving} onClick={save}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </SellerButton>
        </div>
      </SellerPanel>
    </div>
  );
}
