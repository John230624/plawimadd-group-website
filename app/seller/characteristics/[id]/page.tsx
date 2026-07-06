'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
import SellerButton from '@/components/seller/SellerButton';
import SellerInput from '@/components/seller/SellerInput';
import SellerModal from '@/components/seller/SellerModal';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';

interface AttributeValue {
  id: string;
  characteristicId: string;
  value: string;
  valueSlug: string | null;
  colorCode: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Characteristic {
  id: string;
  name: string;
  attributeType: string;
  isVariant: boolean;
}

export default function AttributeValuesPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [characteristic, setCharacteristic] = useState<Characteristic | null>(null);
  const [values, setValues] = useState<AttributeValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AttributeValue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttributeValue | null>(null);
  const [valueInput, setValueInput] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [colorCodeInput, setColorCodeInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [sortOrderInput, setSortOrderInput] = useState('0');
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      const [charRes, valRes] = await Promise.all([
        fetch('/api/admin/characteristics'),
        fetch(`/api/admin/attribute-values?characteristicId=${id}`),
      ]);
      const chars: Characteristic[] = await charRes.json();
      const char = chars.find(c => c.id === id) || null;
      setCharacteristic(char);
      const vals = await valRes.json();
      setValues(Array.isArray(vals) ? vals : []);
    } catch {
      toast.error('Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const openAdd = () => {
    setEditing(null);
    setValueInput('');
    setSlugInput('');
    setColorCodeInput('');
    setImageUrlInput('');
    setSortOrderInput(String(values.length));
    setShowModal(true);
  };

  const openEdit = (v: AttributeValue) => {
    setEditing(v);
    setValueInput(v.value);
    setSlugInput(v.valueSlug || '');
    setColorCodeInput(v.colorCode || '');
    setImageUrlInput(v.imageUrl || '');
    setSortOrderInput(String(v.sortOrder));
    setShowModal(true);
  };

  const save = async () => {
    if (!valueInput.trim()) { toast.error('Valeur requise.'); return; }
    setSaving(true);
    try {
      const url = '/api/admin/attribute-values';
      const method = editing ? 'PUT' : 'POST';
      const body = editing
        ? { id: editing.id, value: valueInput.trim(), valueSlug: slugInput || null, colorCode: colorCodeInput || null, imageUrl: imageUrlInput || null, sortOrder: parseInt(sortOrderInput, 10) || 0 }
        : { characteristicId: id, value: valueInput.trim(), valueSlug: slugInput || null, colorCode: colorCodeInput || null, imageUrl: imageUrlInput || null, sortOrder: parseInt(sortOrderInput, 10) || 0 };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Erreur'); }
      toast.success(editing ? 'Valeur modifiée.' : 'Valeur créée.');
      setShowModal(false);
      await fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/attribute-values?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur');
      toast.success('Valeur supprimée.');
      setDeleteTarget(null);
      await fetchAll();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loading /></div>;
  }

  const showColor = characteristic?.attributeType === 'COLOR';

  return (
    <div className="flex min-h-full flex-col gap-8">
      <div className="flex items-center gap-3">
        <SellerButton variant="ghost" size="icon" icon={ArrowLeft} onClick={() => router.push('/seller/characteristics')}>
          Retour
        </SellerButton>
        <div className="flex-1">
          <SellerSectionHeader
            title={`Valeurs — ${characteristic?.name || 'Caractéristique'}`}
            description={`Type: ${characteristic?.attributeType || '—'} | ${characteristic?.isVariant ? 'Variante' : 'Caractéristique simple'}`}
            action={
              <SellerButton icon={Plus} onClick={openAdd}>Ajouter une valeur</SellerButton>
            }
          />
        </div>
      </div>

      <SellerTable>
        <SellerTableHeader>
          <SellerTableRow>
            {showColor && <SellerTableCell isHeader className="text-center">Aperçu</SellerTableCell>}
            <SellerTableCell isHeader className="text-center">Valeur</SellerTableCell>
            <SellerTableCell isHeader className="text-center">Slug</SellerTableCell>
            <SellerTableCell isHeader className="text-center">Ordre</SellerTableCell>
            <SellerTableCell isHeader className="text-center">Actif</SellerTableCell>
            <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
          </SellerTableRow>
        </SellerTableHeader>
        <SellerTableBody>
          {values.map((v) => (
            <SellerTableRow key={v.id}>
              {showColor && (
                <SellerTableCell className="text-center">
                  <div className="mx-auto h-8 w-8 rounded-full border border-[var(--border)]" style={{ backgroundColor: v.colorCode || '#ccc' }} />
                </SellerTableCell>
              )}
              <SellerTableCell className="text-center font-medium text-[var(--text-primary)]">{v.value}</SellerTableCell>
              <SellerTableCell className="text-center text-xs text-[var(--text-secondary)]">{v.valueSlug || '—'}</SellerTableCell>
              <SellerTableCell className="text-center text-[var(--text-secondary)]">{v.sortOrder}</SellerTableCell>
              <SellerTableCell className="text-center">
                {v.isActive ? <span className="text-xs font-medium text-[var(--accent-green)]">Oui</span> : <span className="text-xs text-[var(--text-tertiary)]">Non</span>}
              </SellerTableCell>
              <SellerTableCell className="text-center">
                <div className="inline-flex gap-2">
                  <SellerButton variant="outline" size="icon" icon={Pencil} className="!h-9 !w-9" onClick={() => openEdit(v)}>Modifier</SellerButton>
                  <SellerButton variant="outline" size="icon" icon={Trash2} className="!h-9 !w-9 border-[var(--accent-red)]/50 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10" onClick={() => setDeleteTarget(v)}>Supprimer</SellerButton>
                </div>
              </SellerTableCell>
            </SellerTableRow>
          ))}
          {values.length === 0 && (
            <SellerTableRow>
              <SellerTableCell colSpan={showColor ? 6 : 5} className="py-10 text-center text-[var(--text-tertiary)]">
                Aucune valeur. Ajoutez-en une.
              </SellerTableCell>
            </SellerTableRow>
          )}
        </SellerTableBody>
      </SellerTable>

      <SellerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Modifier la valeur' : 'Ajouter une valeur'}
        footer={
          <div className="flex justify-end gap-3">
            <SellerButton variant="outline" onClick={() => setShowModal(false)}>Annuler</SellerButton>
            <SellerButton disabled={saving} onClick={save}>{saving ? 'Enregistrement...' : 'Enregistrer'}</SellerButton>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <SellerInput
            value={valueInput}
            onChange={(e) => { setValueInput(e.target.value); if (!editing && !slugInput) setSlugInput(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
            placeholder="Ex: Intel i7, 16 Go, Rouge..."
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
          />
          <SellerInput
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            placeholder="Slug (ex: intel-i7)"
          />
          {showColor && (
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={colorCodeInput || '#000000'}
                onChange={(e) => setColorCodeInput(e.target.value)}
                className="h-12 w-12 cursor-pointer rounded-lg border border-[var(--border)] bg-transparent"
              />
              <SellerInput
                value={colorCodeInput}
                onChange={(e) => setColorCodeInput(e.target.value)}
                placeholder="#000000"
              />
            </div>
          )}
          <SellerInput
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            placeholder="URL d'image (optionnel)"
          />
          <SellerInput
            value={sortOrderInput}
            onChange={(e) => setSortOrderInput(e.target.value)}
            placeholder="Ordre d'affichage"
            type="number"
          />
        </div>
      </SellerModal>

      <SellerModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer cette valeur ?"
        description={`"${deleteTarget?.value}" sera supprimé.`}
        footer={
          <div className="flex justify-end gap-3">
            <SellerButton variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</SellerButton>
            <SellerButton variant="danger" onClick={confirmDelete}>Supprimer</SellerButton>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">Cette action est irreversible.</p>
      </SellerModal>
    </div>
  );
}
