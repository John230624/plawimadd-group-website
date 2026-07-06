'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

interface Color {
  id: string;
  name: string;
  hex: string;
}

const defaultColors = [
  { name: 'Noir', hex: '#000000' },
  { name: 'Blanc', hex: '#FFFFFF' },
  { name: 'Gris', hex: '#808080' },
  { name: 'Argent', hex: '#C0C0C0' },
  { name: 'Rouge', hex: '#FF0000' },
  { name: 'Bleu', hex: '#0000FF' },
  { name: 'Vert', hex: '#008000' },
  { name: 'Jaune', hex: '#FFFF00' },
  { name: 'Or', hex: '#FFD700' },
  { name: 'Rose', hex: '#FFC0CB' },
  { name: 'Violet', hex: '#800080' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Marron', hex: '#8B4513' },
  { name: 'Titane', hex: '#B7AEA1' },
];

export default function ColorsPage(): React.ReactElement {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Color | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Color | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [hexInput, setHexInput] = useState('#000000');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const fetchAll = async () => {
    try {
      const res = await fetch('/api/admin/colors');
      const data = await res.json();
      setColors(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const allSelected = colors.length > 0 && colors.every((c) => selectedIds.has(c.id));

  const openAdd = () => {
    setEditing(null);
    setNameInput('');
    setHexInput('#000000');
    setShowModal(true);
  };

  const openEdit = (c: Color) => {
    setEditing(c);
    setNameInput(c.name);
    setHexInput(c.hex);
    setShowModal(true);
  };

  const seedDefaults = async () => {
    setSaving(true);
    try {
      for (const c of defaultColors) {
        const existing = colors.find((x) => x.name === c.name);
        if (!existing) {
          await fetch('/api/admin/colors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(c),
          });
        }
      }
      toast.success('Couleurs par défaut ajoutées.');
      await fetchAll();
    } catch {
      toast.error('Erreur.');
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!nameInput.trim()) { toast.error('Nom requis.'); return; }
    if (!hexInput.trim()) { toast.error('Code hex requis.'); return; }
    setSaving(true);
    try {
      const url = '/api/admin/colors';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { id: editing.id, name: nameInput.trim(), hex: hexInput } : { name: nameInput.trim(), hex: hexInput };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Erreur'); }
      toast.success(editing ? 'Couleur modifiée.' : 'Couleur créée.');
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
      const res = await fetch('/api/admin/colors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteTarget.id }) });
      if (!res.ok) throw new Error('Erreur');
      toast.success('Couleur supprimée.');
      setDeleteTarget(null);
      await fetchAll();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const executeBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchProcessing(true);
    try {
      const res = await fetch('/api/admin/colors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Erreur');
      toast.success(`${data.count} couleur(s) supprimée(s)`);
      setSelectedIds(new Set());
      await fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loading /></div>;

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader
        title="Couleurs"
        action={
          <div className="flex gap-2">
            <SellerButton variant="outline" onClick={seedDefaults} disabled={saving}>Ajouter les défauts</SellerButton>
            <SellerButton icon={Plus} onClick={openAdd}>Ajouter</SellerButton>
          </div>
        }
      />

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 rounded-[10px] bg-[var(--accent-red)]/10 px-5 py-3">
          <span className="text-sm font-medium text-[var(--accent-red)]">{selectedIds.size} selectionnee(s)</span>
          <SellerButton variant="danger" size="sm" icon={Trash2} disabled={isBatchProcessing} onClick={executeBatchDelete}>
            {isBatchProcessing ? 'Suppression...' : 'Supprimer la selection'}
          </SellerButton>
          <SellerButton variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            Annuler
          </SellerButton>
        </div>
      )}

      <SellerTable>
        <SellerTableHeader>
          <SellerTableRow>
            <SellerTableCell isHeader className="w-10 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => {
                  if (allSelected) setSelectedIds(new Set());
                  else setSelectedIds(new Set(colors.map((c) => c.id)));
                }}
                className="h-4 w-4 accent-[var(--accent-green)]"
              />
            </SellerTableCell>
            <SellerTableCell isHeader className="text-center">Apercu</SellerTableCell>
            <SellerTableCell isHeader className="text-center">Nom</SellerTableCell>
            <SellerTableCell isHeader className="text-center">Hex</SellerTableCell>
            <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
          </SellerTableRow>
        </SellerTableHeader>
        <SellerTableBody>
          {colors.map((c) => (
            <SellerTableRow key={c.id}>
              <SellerTableCell className="text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                      return next;
                    });
                  }}
                  className="h-4 w-4 accent-[var(--accent-green)]"
                />
              </SellerTableCell>
              <SellerTableCell className="text-center">
                <div className="mx-auto h-8 w-8 rounded-full border border-[var(--border)]" style={{ backgroundColor: c.hex }} />
              </SellerTableCell>
              <SellerTableCell className="text-center font-medium text-[var(--text-primary)]">{c.name}</SellerTableCell>
              <SellerTableCell className="text-center text-[var(--text-secondary)]">{c.hex}</SellerTableCell>
              <SellerTableCell className="text-center">
                <div className="inline-flex gap-2">
                  <SellerButton variant="outline" size="icon" icon={Pencil} className="!h-9 !w-9" onClick={() => openEdit(c)}>Modifier</SellerButton>
                  <SellerButton variant="outline" size="icon" icon={Trash2} className="!h-9 !w-9 border-[var(--accent-red)]/50 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10" onClick={() => setDeleteTarget(c)}>Supprimer</SellerButton>
                </div>
              </SellerTableCell>
            </SellerTableRow>
          ))}
          {colors.length === 0 && (
            <SellerTableRow>
              <SellerTableCell colSpan={5} className="py-10 text-center text-[var(--text-tertiary)]">
                Aucune couleur. Ajoutez-en ou importez les couleurs par défaut.
              </SellerTableCell>
            </SellerTableRow>
          )}
        </SellerTableBody>
      </SellerTable>

      <SellerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Modifier la couleur' : 'Ajouter une couleur'}
        footer={
          <div className="flex justify-end gap-3">
            <SellerButton variant="outline" onClick={() => setShowModal(false)}>Annuler</SellerButton>
            <SellerButton disabled={saving} onClick={save}>{saving ? 'Enregistrement...' : 'Enregistrer'}</SellerButton>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              className="h-12 w-12 cursor-pointer rounded-lg border border-[var(--border)] bg-transparent"
            />
            <SellerInput
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              placeholder="#000000"
            />
          </div>
          <SellerInput
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Ex: Noir, Blanc, Rouge..."
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
          />
        </div>
      </SellerModal>

      <SellerModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer cette couleur ?"
        description={`"${deleteTarget?.name}" sera retiré.`}
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
