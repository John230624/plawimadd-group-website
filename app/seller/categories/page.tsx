'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Download,
  FolderTree,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Loading from '@/components/Loading';
import SellerBadge from '@/components/seller/SellerBadge';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerInput from '@/components/seller/SellerInput';
import SellerModal from '@/components/seller/SellerModal';
import SellerPagination from '@/components/seller/SellerPagination';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import StatCard from '@/components/seller/StatCard';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';
import SellerTextarea from '@/components/seller/SellerTextarea';
import { useAppContext } from '@/context/AppContext';
import { UserRole } from '@/lib/types';

interface Category {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  level?: number;
  parent?: { id: string; name: string } | null;
  children?: { id: string; name: string }[];
  _count?: { products: number };
  createdAt?: string;
  updatedAt?: string;
}

interface FieldError {
  field: string;
  message: string;
}

const pageSize = 8;

const emptyForm = { name: '', description: '', imageUrl: '' };

type SortField = 'name' | 'products';
type SortDir = 'asc' | 'desc';

export default function CategoriesPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const { products } = useAppContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<FieldError[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'name', dir: 'asc' });
  const [productFilter, setProductFilter] = useState<'ALL' | 'WITH_PRODUCTS' | 'EMPTY'>('ALL');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const [allCharacteristics, setAllCharacteristics] = useState<{ id: string; name: string }[]>([]);
  const [selectedCharIds, setSelectedCharIds] = useState<Set<string>>(new Set());

  const getFormError = (field: string) => formErrors.find((e) => e.field === field)?.message;

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get<Category[]>('/api/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch {
      toast.error('Impossible de charger les categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const productCountByCategory = useMemo(() => {
    return products.reduce<Record<string, number>>((acc, product) => {
      const categoryId = product.category?.id;
      if (!categoryId) return acc;
      acc[categoryId] = (acc[categoryId] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const rootCategories = useMemo(() => {
    return categories.filter(
      (c) => !c.parentId && (!editingCategory || c.id !== editingCategory.id)
    );
  }, [categories, editingCategory]);

  const filteredCategories = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return categories
      .filter((category) => {
        const matchesSearch = [category.name, category.description || ''].join(' ').toLowerCase().includes(query);
        if (!matchesSearch) return false;
        if (productFilter === 'WITH_PRODUCTS') return (productCountByCategory[category.id] || 0) > 0;
        if (productFilter === 'EMPTY') return (productCountByCategory[category.id] || 0) === 0;
        return true;
      })
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1;
        if (sort.field === 'products') {
          return ((productCountByCategory[a.id] || 0) - (productCountByCategory[b.id] || 0)) * dir;
        }
        return a.name.localeCompare(b.name) * dir;
      });
  }, [categories, searchTerm, sort, productFilter, productCountByCategory]);

  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, page]);

  const allSelected = paginatedCategories.length > 0 && paginatedCategories.every((c) => selectedIds.has(c.id));

  const toggleSort = (field: SortField) => {
    setSort((prev) => (prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ArrowUpWideNarrow className="ml-1 h-3 w-3 opacity-30" />;
    return sort.dir === 'asc' ? (
      <ArrowUpWideNarrow className="ml-1 h-3 w-3 text-[var(--accent-green)]" />
    ) : (
      <ArrowDownWideNarrow className="ml-1 h-3 w-3 text-[var(--accent-green)]" />
    );
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setFormErrors([]);
    setSelectedCharIds(new Set());
    setEditParentId(null);
    setIsFormOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
    });
    setFormErrors([]);
    setEditParentId(category.parentId || null);
    setIsFormOpen(true);

    fetch('/api/admin/characteristics')
      .then((res) => res.json())
      .then((data: { id: string; name: string }[]) => setAllCharacteristics(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch(`/api/categories/characteristics?categoryId=${category.id}`)
      .then((res) => res.json())
      .then((data: { id: string; name: string }[]) => {
        if (Array.isArray(data)) {
          setSelectedCharIds(new Set(data.map((c) => c.id)));
        }
      })
      .catch(() => {});
  };

  const validateForm = (): boolean => {
    const errs: FieldError[] = [];
    if (!form.name.trim()) errs.push({ field: 'name', message: 'Le nom est requis.' });
    if (form.imageUrl.trim() && !/^https?:\/\/.+/.test(form.imageUrl.trim())) {
      errs.push({ field: 'imageUrl', message: 'URL invalide (doit commencer par http).' });
    }
    setFormErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    if (status !== 'authenticated' || session?.user?.role !== UserRole.ADMIN) {
      toast.error('Acces admin requis.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        parentId: editParentId || null,
      };

      if (editingCategory) {
        await axios.put(`/api/categories/${editingCategory.id}`, payload);

        await fetch(`/api/categories/${editingCategory.id}/characteristics`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characteristicIds: Array.from(selectedCharIds) }),
        });

        toast.success('Categorie mise a jour.');
      } else {
        await axios.post('/api/categories', payload);
        toast.success('Categorie creee.');
      }

      setIsFormOpen(false);
      await fetchCategories();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Erreur lors de la sauvegarde.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/categories/${categoryToDelete.id}`);
      toast.success('Categorie supprimee.');
      setCategoryToDelete(null);
      await fetchCategories();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Suppression impossible.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const executeBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchProcessing(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: 'delete' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erreur');
      toast.success(`${data.count} categorie(s) supprimee(s)`);
      setSelectedIds(new Set());
      await fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur batch');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, 50, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(24, 24, 27);
    doc.text('Categories du catalogue', 20, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(113, 113, 122);
    doc.text(
      `Genere le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      20, 32,
    );
    doc.text(`${filteredCategories.length} categorie(s)`, 20, 40);

    const statsY = 60;
    const statWidth = (pageW - 40) / 3;
    const withProducts = filteredCategories.filter((c) => (productCountByCategory[c.id] || 0) > 0).length;
    const withoutProducts = filteredCategories.length - withProducts;

    const boxes = [
      { label: 'Total categories', value: String(filteredCategories.length), color: [16, 185, 129] },
      { label: 'Avec produits', value: String(withProducts), color: [59, 130, 246] },
      { label: 'Vides', value: String(withoutProducts), color: [245, 158, 11] },
    ];

    boxes.forEach((box, i) => {
      const x = 20 + i * (statWidth + 5);
      doc.setFillColor(247, 247, 248);
      doc.roundedRect(x, statsY, statWidth, 22, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(box.color[0], box.color[1], box.color[2]);
      doc.text(box.value, x + 4, statsY + 9);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(113, 113, 122);
      doc.text(box.label, x + 4, statsY + 17);
    });

    const tableBody = filteredCategories.map((c) => [
      c.name,
      c.parent?.name || '—',
      c.description || '—',
      String(productCountByCategory[c.id] || 0),
    ]);

    autoTable(doc, {
      head: [['Categorie', 'Parent', 'Description', 'Produits']],
      body: tableBody,
      startY: statsY + 32,
      styles: {
        fontSize: 7,
        textColor: [39, 39, 42],
        fillColor: [255, 255, 255],
        lineColor: [228, 228, 231],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [244, 244, 245],
        textColor: [24, 24, 27],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: { fillColor: [24, 24, 24] },
      margin: { top: statsY + 32, bottom: 20 },
      didDrawPage: () => {
        doc.setFontSize(7);
        doc.setTextColor(113, 113, 122);
        doc.text('Plawimadd Group — Categories', 20, doc.internal.pageSize.getHeight() - 10);
      },
    });

    doc.save(`categories_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader
        title="Categories"
        action={
          <div className="flex items-center gap-3">
            <SellerButton variant="outline" size="sm" icon={Download} onClick={exportPDF}>
              Exporter PDF
            </SellerButton>
            <SellerButton icon={Plus} onClick={openCreateModal}>
              Ajouter une categorie
            </SellerButton>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Categories" value={String(categories.length)} description="Familles de produits" icon={FolderTree} accentColor="blue" />
        <StatCard
          title="Avec produits"
          value={String(categories.filter((c) => productCountByCategory[c.id]).length)}
          description="Categories qui contiennent des fiches"
          icon={Package}
          accentColor="green"
        />
        <StatCard
          title="Sans produits"
          value={String(categories.filter((c) => !productCountByCategory[c.id]).length)}
          description="Categories vides a gerer"
          icon={AlertTriangle}
          accentColor="amber"
        />
      </div>

      <SellerFilterBar>
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              autoComplete="off"
              placeholder="Rechercher une categorie"
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            />
          </div>
          <SellerSelect
            value={productFilter}
            onChange={(v) => { setProductFilter(v as typeof productFilter); setPage(1); }}
            options={[
              { value: 'ALL', label: 'Toutes les categories' },
              { value: 'WITH_PRODUCTS', label: 'Avec produits' },
              { value: 'EMPTY', label: 'Vides' },
            ]}
            className="[&_button]:!h-9 [&_button]:!py-1.5 [&_button]:!px-3 w-[180px] shrink-0"
          />
          <div className="rounded-lg bg-[var(--bg-hover)] px-3 py-1.5 text-xs text-[var(--text-secondary)] shrink-0">
            {filteredCategories.length} resultat(s)
          </div>
        </div>
      </SellerFilterBar>

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

      {filteredCategories.length === 0 ? (
        <SellerEmptyState
          title="Aucune categorie trouvee"
          description="Ajoutez une nouvelle categorie ou modifiez votre recherche."
          icon={FolderTree}
          action={
            <SellerButton icon={Plus} onClick={openCreateModal}>
              Ajouter une categorie
            </SellerButton>
          }
        />
      ) : (
        <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => {
                    if (allSelected) setSelectedIds(new Set());
                    else setSelectedIds(new Set(paginatedCategories.map((c) => c.id)));
                  }}
                  className="h-4 w-4 accent-[var(--accent-green)]"
                />
              </SellerTableCell>
              <SellerTableCell
                isHeader
                className="cursor-pointer select-none text-center"
                onClick={() => toggleSort('name')}
              >
                <span className="flex items-center">Categorie <SortIcon field="name" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center">Parent</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Description</SellerTableCell>
              <SellerTableCell
                isHeader
                className="cursor-pointer select-none text-center"
                onClick={() => toggleSort('products')}
              >
                <span className="flex items-center">Produits <SortIcon field="products" /></span>
              </SellerTableCell>
              <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {paginatedCategories.map((category) => {
              const productCount = productCountByCategory[category.id] || 0;

              return (
                <SellerTableRow key={category.id}>
                  <SellerTableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(category.id)}
                      onChange={() => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(category.id)) next.delete(category.id);
                          else next.add(category.id);
                          return next;
                        });
                      }}
                      className="h-4 w-4 accent-[var(--accent-green)]"
                    />
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <div className="flex items-center gap-3">
                      {category.imageUrl ? (
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-hover)]">
                          <Image
                            src={category.imageUrl}
                            alt={category.name}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-hover)] text-[var(--text-tertiary)]">
                          <FolderTree className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{category.name}</p>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">#{category.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </SellerTableCell>
                  <SellerTableCell className="text-center text-[var(--text-secondary)]">
                    {category.parent?.name || <span className="italic text-[var(--text-tertiary)]">—</span>}
                  </SellerTableCell>
                  <SellerTableCell className="max-w-[36ch] text-[var(--text-secondary)] text-center">
                    {category.description || <span className="italic text-[var(--text-tertiary)]">Aucune description</span>}
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <SellerBadge color={productCount > 0 ? 'success' : 'slate'}>
                      {productCount} produit(s)
                    </SellerBadge>
                  </SellerTableCell>
                  <SellerTableCell className="text-center">
                    <div className="flex flex-wrap gap-2">
                      <SellerButton variant="outline" size="sm" icon={Pencil} onClick={() => openEditModal(category)}>
                        Modifier
                      </SellerButton>
                      <SellerButton
                        variant="outline"
                        size="sm"
                        icon={Trash2}
                        className="border-[var(--accent-red)]/50 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10"
                        onClick={() => setCategoryToDelete(category)}
                      >
                        Supprimer
                      </SellerButton>
                    </div>
                  </SellerTableCell>
                </SellerTableRow>
              );
            })}
          </SellerTableBody>
          <tfoot>
            <tr>
              <td colSpan={6}>
                <SellerPagination page={page} pageSize={pageSize} totalItems={filteredCategories.length} onPageChange={setPage} />
              </td>
            </tr>
          </tfoot>
        </SellerTable>
      )}

      <SellerModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCategory ? 'Modifier la categorie' : 'Ajouter une categorie'}
        description="Renseignez les informations visibles dans le catalogue."
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <SellerButton variant="outline" onClick={() => setIsFormOpen(false)}>
              Annuler
            </SellerButton>
            <SellerButton type="submit" form="category-form" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </SellerButton>
          </div>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <SellerInput
            label="Nom *"
            value={form.name}
            error={getFormError('name')}
            onChange={(event) => {
              setForm((current) => ({ ...current, name: event.target.value }));
              setFormErrors((prev) => prev.filter((e) => e.field !== 'name'));
            }}
            placeholder="Ex: Ordinateurs"
          />
          <SellerInput
            label="Image URL"
            value={form.imageUrl}
            error={getFormError('imageUrl')}
            onChange={(event) => {
              setForm((current) => ({ ...current, imageUrl: event.target.value }));
              setFormErrors((prev) => prev.filter((e) => e.field !== 'imageUrl'));
            }}
            placeholder="https://..."
          />
          {form.imageUrl && (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-hover)]">
                <Image
                  src={form.imageUrl}
                  alt="Apercu"
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)]">Apercu</p>
                <p className="mt-0.5 break-all text-xs text-[var(--text-tertiary)]">{form.imageUrl}</p>
              </div>
            </div>
          )}
          <div>
            <span className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Categorie parente</span>
            <SellerSelect
              value={editParentId || ''}
              onChange={(value) => setEditParentId(value || null)}
              options={[
                { value: '', label: 'Aucune (categorie racine)' },
                ...rootCategories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <SellerTextarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Description courte de la categorie"
          />

          {editingCategory && allCharacteristics.length > 0 && (
            <div>
              <span className="mb-3 block text-sm font-medium text-[var(--text-primary)]">Caractéristiques</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {allCharacteristics.map((char) => {
                  const checked = selectedCharIds.has(char.id);
                  return (
                    <label
                      key={char.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        checked
                          ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedCharIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(char.id)) next.delete(char.id);
                            else next.add(char.id);
                            return next;
                          });
                        }}
                        className="h-4 w-4 accent-[var(--accent-blue)]"
                      />
                      {char.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      </SellerModal>

      <SellerModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        title="Supprimer cette categorie ?"
        description="La suppression est bloquee si des produits sont encore lies a cette categorie."
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <SellerButton variant="outline" onClick={() => setCategoryToDelete(null)}>
              Annuler
            </SellerButton>
            <SellerButton variant="danger" icon={Trash2} disabled={isDeleting} onClick={executeDelete}>
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </SellerButton>
          </div>
        }
      >
        <div className="flex items-start gap-3 rounded-[10px] border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/10 p-4 text-[var(--accent-red)]">
          <XCircle className="mt-0.5 h-5 w-5" />
          <p className="text-sm leading-6">
            {categoryToDelete?.name} sera retiree du catalogue si aucune fiche produit ne l&apos;utilise.
          </p>
        </div>
      </SellerModal>
    </div>
  );
}
