'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Search, Trash2, List } from 'lucide-react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerModal from '@/components/seller/SellerModal';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';

interface CategoryLink {
  category: { id: string; name: string };
}

interface Characteristic {
  id: string;
  name: string;
  attributeType: string;
  isVariant: boolean;
  displayOrder: number;
  categories: CategoryLink[];
  values: { id: string; value: string; valueSlug: string | null; colorCode: string | null; }[];
  createdAt: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

export default function CharacteristicsPage(): React.ReactElement {
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Characteristic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Characteristic | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(new Set());
  const [attributeTypeInput, setAttributeTypeInput] = useState('SELECT');
  const [isVariantInput, setIsVariantInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchAll = async () => {
    try {
      const [charRes, catRes] = await Promise.all([
        fetch('/api/admin/characteristics'),
        fetch('/api/categories'),
      ]);
      const chars = await charRes.json();
      const cats = await catRes.json();
      setCharacteristics(Array.isArray(chars) ? chars : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch {
      toast.error('Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredCharacteristics = useMemo(() => {
    return characteristics.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (categoryFilter !== 'ALL') {
        return c.categories.some((link) => link.category.id === categoryFilter);
      }
      return true;
    });
  }, [characteristics, searchTerm, categoryFilter]);

  const openAdd = () => {
    setEditing(null);
    setNameInput('');
    setSelectedCatIds(new Set());
    setAttributeTypeInput('SELECT');
    setIsVariantInput(false);
    setShowModal(true);
  };

  const openEdit = (c: Characteristic) => {
    setEditing(c);
    setNameInput(c.name);
    setSelectedCatIds(new Set(c.categories.map((link) => link.category.id)));
    setAttributeTypeInput(c.attributeType || 'SELECT');
    setIsVariantInput(c.isVariant || false);
    setShowModal(true);
  };

  const save = async () => {
    if (!nameInput.trim()) { toast.error('Nom requis.'); return; }
    if (selectedCatIds.size === 0) { toast.error('Au moins une catégorie requise.'); return; }

    setSaving(true);
    try {
      const url = '/api/admin/characteristics';
      const method = editing ? 'PUT' : 'POST';
      const body = editing
        ? { id: editing.id, name: nameInput.trim(), categoryIds: Array.from(selectedCatIds), attributeType: attributeTypeInput, isVariant: isVariantInput }
        : { name: nameInput.trim(), categoryIds: Array.from(selectedCatIds), attributeType: attributeTypeInput, isVariant: isVariantInput };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur');
      }
      toast.success(editing ? 'Caractéristique modifiée.' : 'Caractéristique créée.');
      setShowModal(false);
      await fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const toggleCat = (catId: string) => {
    setSelectedCatIds((prev) => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch('/api/admin/characteristics', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) throw new Error('Erreur');
      toast.success('Caractéristique supprimée.');
      setDeleteTarget(null);
      await fetchAll();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loading /></div>;
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader
        title="Caractéristiques"
        action={
          <SellerButton icon={Plus} onClick={openAdd}>Ajouter</SellerButton>
        }
      />

      <SellerFilterBar>
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une caractéristique"
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            />
          </div>
          <SellerSelect
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v)}
            options={[
              { value: 'ALL', label: 'Toutes les catégories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            className="[&_button]:!h-9 [&_button]:!py-1.5 [&_button]:!px-3 w-[200px] shrink-0"
          />
          <div className="rounded-lg bg-[var(--bg-hover)] px-3 py-1.5 text-xs text-[var(--text-secondary)] shrink-0">
            {filteredCharacteristics.length} résultat(s)
          </div>
        </div>
      </SellerFilterBar>

      <SellerTable>
        <SellerTableHeader>
          <SellerTableRow>
            <SellerTableCell isHeader className="text-center">Nom</SellerTableCell>
            <SellerTableCell isHeader className="text-center">Type</SellerTableCell>
            <SellerTableCell isHeader className="text-center">Variante</SellerTableCell>
            <SellerTableCell isHeader className="text-center">Valeurs</SellerTableCell>
            <SellerTableCell isHeader className="text-center">Catégories liées</SellerTableCell>
            <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
          </SellerTableRow>
        </SellerTableHeader>
        <SellerTableBody>
          {filteredCharacteristics.map((c) => (
            <SellerTableRow key={c.id}>
              <SellerTableCell className="text-center font-medium text-[var(--text-primary)]">{c.name}</SellerTableCell>
              <SellerTableCell className="text-center"><span className="rounded bg-[var(--bg-hover)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">{c.attributeType || 'SELECT'}</span></SellerTableCell>
              <SellerTableCell className="text-center">{c.isVariant ? <span className="text-xs font-medium text-purple-400">Oui</span> : <span className="text-xs text-[var(--text-tertiary)]">Non</span>}</SellerTableCell>
              <SellerTableCell className="text-center"><span className="text-xs text-[var(--text-secondary)]">{c.values?.length || 0}</span></SellerTableCell>
              <SellerTableCell className="text-center">
                <div className="inline-flex flex-wrap gap-1.5">
                  {c.categories.length === 0 ? (
                    <span className="text-xs italic text-[var(--text-tertiary)]">Aucune</span>
                  ) : (
                    c.categories.map((link) => (
                      <SellerBadge key={link.category.id} color="info">{link.category.name}</SellerBadge>
                    ))
                  )}
                </div>
              </SellerTableCell>
              <SellerTableCell className="text-center">
                <div className="inline-flex gap-2">
                  <Link href={`/seller/characteristics/${c.id}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--accent-blue)]" title="Gérer les valeurs">
                    <List className="h-4 w-4" />
                  </Link>
                  <SellerButton variant="outline" size="icon" icon={Pencil} className="!h-9 !w-9" onClick={() => openEdit(c)}>Modifier</SellerButton>
                  <SellerButton variant="outline" size="icon" icon={Trash2} className="!h-9 !w-9 border-[var(--accent-red)]/50 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10" onClick={() => setDeleteTarget(c)}>Supprimer</SellerButton>
                </div>
              </SellerTableCell>
            </SellerTableRow>
          ))}
          {filteredCharacteristics.length === 0 && (
            <SellerTableRow>
              <SellerTableCell colSpan={6} className="py-10 text-center text-[var(--text-tertiary)]">
                Aucune caractéristique trouvée.
              </SellerTableCell>
            </SellerTableRow>
          )}
        </SellerTableBody>
      </SellerTable>

      <SellerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Modifier la caractéristique' : 'Ajouter une caractéristique'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <SellerButton variant="outline" onClick={() => setShowModal(false)}>Annuler</SellerButton>
            <SellerButton disabled={saving} onClick={save}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </SellerButton>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <p className="mb-1.5 text-sm font-medium text-[var(--text-primary)]">Nom *</p>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Ex: Processeur, RAM, Stockage..."
              onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
              className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-[var(--text-primary)]">Type d&apos;attribut</p>
              <select value={attributeTypeInput} onChange={(e) => setAttributeTypeInput(e.target.value)}
                className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]">
                <option value="TEXT">Texte libre</option>
                <option value="SELECT">Sélection unique</option>
                <option value="MULTI_SELECT">Sélection multiple</option>
                <option value="COLOR">Couleur</option>
                <option value="SIZE">Taille</option>
                <option value="RANGE">Intervalle</option>
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-[var(--text-primary)]">Variante</p>
              <label className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 cursor-pointer transition hover:bg-[var(--bg-hover)]">
                <input type="checkbox" checked={isVariantInput} onChange={(e) => setIsVariantInput(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent-blue)]" />
                <span className="text-sm text-[var(--text-secondary)]">Génère des variantes</span>
              </label>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Catégories associées *</p>
            <p className="mb-3 text-xs text-[var(--text-tertiary)]">Sélectionnez au moins une catégorie à laquelle cette caractéristique sera liée.</p>
            {categories.length === 0 ? (
              <p className="text-xs italic text-[var(--text-tertiary)]">Aucune catégorie disponible. Créez d'abord des catégories.</p>
            ) : (
              <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-[var(--border)] p-2">
                {categories.map((cat) => {
                  const checked = selectedCatIds.has(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                        checked
                          ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCat(cat.id)}
                        className="h-4 w-4 accent-[var(--accent-blue)]"
                      />
                      {cat.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SellerModal>

      <SellerModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer cette caractéristique ?"
        footer={
          <div className="flex justify-end gap-3">
            <SellerButton variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</SellerButton>
            <SellerButton variant="danger" onClick={confirmDelete}>Supprimer</SellerButton>
          </div>
        }
      >
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          &quot;{deleteTarget?.name}&quot; sera retiré de toutes les catégories qui l&apos;utilisent.
        </p>
      </SellerModal>
    </div>
  );
}
