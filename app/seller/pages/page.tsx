'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Plus,
  Pencil,
  Search,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerFilterBar from '@/components/seller/SellerFilterBar';
import SellerInput from '@/components/seller/SellerInput';
import SellerModal from '@/components/seller/SellerModal';
import SellerPagination from '@/components/seller/SellerPagination';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerBadge from '@/components/seller/SellerBadge';
import SellerTextarea from '@/components/seller/SellerTextarea';
import StatCard from '@/components/seller/StatCard';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';

interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  updatedAt: string;
}

const pageSize = 10;
const emptyForm = { title: '', slug: '', content: '', published: false };

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function PagesPage(): React.ReactElement {
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pages');
      const data = await res.json();
      setPages(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      toast.error('Impossible de charger les pages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);
  useEffect(() => { setPage(1); }, [searchTerm]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return pages.filter((p) => p.title.toLowerCase().includes(q));
  }, [pages, searchTerm]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPublished = pages.filter((p) => p.published).length;
  const totalDrafts = pages.filter((p) => !p.published).length;

  const openCreate = () => {
    setEditingPage(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (cmsPage: CMSPage) => {
    setEditingPage(cmsPage);
    setForm({
      title: cmsPage.title,
      slug: cmsPage.slug,
      content: cmsPage.content,
      published: cmsPage.published,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('Le titre est requis.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        content: form.content,
        published: form.published,
      };
      const method = editingPage ? 'PUT' : 'POST';
      const url = editingPage ? `/api/admin/pages/${editingPage.id}` : '/api/admin/pages';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur');
      toast.success(editingPage ? 'Page mise à jour.' : 'Page créée.');
      setIsFormOpen(false);
      fetchPages();
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
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
      <SellerSectionHeader
        title="Pages & CMS"
        action={
          <SellerButton icon={Plus} onClick={openCreate}>
            Ajouter une page
          </SellerButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total pages" value={String(pages.length)} description="Toutes les pages" icon={FileText} accentColor="blue" />
        <StatCard title="Publiées" value={String(totalPublished)} description="Pages visibles" icon={FileText} accentColor="green" />
        <StatCard title="Brouillons" value={String(totalDrafts)} description="En cours d'écriture" icon={FileText} accentColor="amber" />
      </div>

      <SellerFilterBar>
        <SellerInput
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par titre"
        />
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--bg-hover)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            {filtered.length} résultat(s)
          </div>
        </div>
      </SellerFilterBar>

      {filtered.length === 0 ? (
        <SellerEmptyState
          title="Aucune page trouvée"
          description="Ajoutez une nouvelle page ou modifiez votre recherche."
          icon={FileText}
          action={
            <SellerButton icon={Plus} onClick={openCreate}>
              Ajouter une page
            </SellerButton>
          }
        />
      ) : (
        <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader className="text-center">Titre</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Slug</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Statut</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Dernière modification</SellerTableCell>
              <SellerTableCell isHeader className="text-center">Actions</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {paginated.map((cmsPage) => (
              <SellerTableRow key={cmsPage.id}>
                <SellerTableCell className="text-center">
                  <span className="font-semibold text-[var(--text-primary)]">{cmsPage.title}</span>
                </SellerTableCell>
                <SellerTableCell className="text-center text-[var(--text-secondary)]">
                  /{cmsPage.slug}
                </SellerTableCell>
                <SellerTableCell className="text-center">
                  <SellerBadge color={cmsPage.published ? 'success' : 'slate'}>
                    {cmsPage.published ? 'Publié' : 'Brouillon'}
                  </SellerBadge>
                </SellerTableCell>
                <SellerTableCell className="text-center text-[var(--text-secondary)]">
                  {new Date(cmsPage.updatedAt).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </SellerTableCell>
                <SellerTableCell className="text-center">
                  <div className="flex gap-2">
                    <SellerButton variant="outline" size="sm" icon={Pencil} onClick={() => openEdit(cmsPage)}>
                      Modifier
                    </SellerButton>
                    <a
                      href={`/page/${cmsPage.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <SellerButton variant="outline" size="sm" icon={ExternalLink}>
                        Aperçu
                      </SellerButton>
                    </a>
                  </div>
                </SellerTableCell>
              </SellerTableRow>
            ))}
          </SellerTableBody>
          <tfoot>
            <tr>
              <td colSpan={5}>
                <SellerPagination page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />
              </td>
            </tr>
          </tfoot>
        </SellerTable>
      )}

      <SellerModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingPage ? 'Modifier la page' : 'Ajouter une page'}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <SellerButton variant="outline" onClick={() => setIsFormOpen(false)}>
              Annuler
            </SellerButton>
            <SellerButton type="submit" form="page-form" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </SellerButton>
          </div>
        }
      >
        <form id="page-form" onSubmit={handleSubmit} className="space-y-4">
          <SellerInput
            label="Titre *"
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((prev) => ({
                ...prev,
                title,
                slug: editingPage ? prev.slug : slugify(title),
              }));
            }}
            placeholder="Titre de la page"
          />
          <SellerInput
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="slug-de-la-page"
            hint="Laissez vide pour génération automatique"
          />
          <SellerTextarea
            label="Contenu"
            rows={12}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Contenu de la page..."
          />
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="h-4 w-4 accent-[var(--accent-green)]"
            />
            <span className="text-sm text-[var(--text-primary)]">Publié</span>
          </label>
        </form>
      </SellerModal>
    </div>
  );
}
