'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Upload, Link as LinkIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import Image from 'next/image';

import Loading from '@/components/Loading';
import SellerButton from '@/components/seller/SellerButton';
import SellerInput from '@/components/seller/SellerInput';
import SellerTextarea from '@/components/seller/SellerTextarea';
import SellerModal from '@/components/seller/SellerModal';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';

interface HeroSlide {
  id: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  video?: string | null;
  category: string;
  bgColor: string;
  accentColor: string;
  layout: string;
  order: number;
}

interface Category {
  id: string;
  name: string;
}

export default function ContentPage(): React.ReactElement {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);
  
  // Form states
  const [titleInput, setTitleInput] = useState('');
  const [taglineInput, setTaglineInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [bgColorInput, setBgColorInput] = useState('#e2e7f3');
  const [accentColorInput, setAccentColorInput] = useState('#3b82f6');
  const [layoutInput, setLayoutInput] = useState('left');
  const [orderInput, setOrderInput] = useState(0);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchAll = async () => {
    try {
      const res = await fetch('/api/hero-slides');
      const data = await res.json();
      if (data.success && Array.isArray(data.slides)) {
        setSlides(data.slides);
      }
    } catch {
      toast.error('Erreur lors du chargement des diapositives.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
        if (data.length > 0) {
          setCategoryInput(data[0].name);
        }
      }
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchCategories();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setTitleInput('');
    setTaglineInput('');
    setDescriptionInput('');
    setImageInput('');
    setVideoInput('');
    if (categories.length > 0) {
      setCategoryInput(categories[0].name);
    } else {
      setCategoryInput('Televiseurs');
    }
    setBgColorInput('#e2e7f3');
    setAccentColorInput('#3b82f6');
    setLayoutInput('left');
    setOrderInput(slides.length);
    setShowModal(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditing(slide);
    setTitleInput(slide.title);
    setTaglineInput(slide.tagline);
    setDescriptionInput(slide.description);
    setImageInput(slide.image);
    setVideoInput(slide.video || '');
    setCategoryInput(slide.category);
    setBgColorInput(slide.bgColor);
    setAccentColorInput(slide.accentColor);
    setLayoutInput(slide.layout);
    setOrderInput(slide.order);
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors du téléversement.');
      setImageInput(data.imageUrl);
      toast.success('Image téléversée avec succès.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du téléversement.');
    } finally {
      setUploadingImage(false);
    }
  };

  const save = async () => {
    if (!titleInput.trim()) { toast.error('Le titre est requis.'); return; }
    if (!taglineInput.trim()) { toast.error('Le sous-titre/tagline est requis.'); return; }
    if (!descriptionInput.trim()) { toast.error('La description est requise.'); return; }
    if (!imageInput.trim()) { toast.error("L'image est requise."); return; }
    if (!categoryInput.trim()) { toast.error('La catégorie est requise.'); return; }

    setSaving(true);
    try {
      const url = editing ? `/api/admin/hero-slides/${editing.id}` : '/api/admin/hero-slides';
      const method = editing ? 'PUT' : 'POST';
      const body = {
        title: titleInput.trim(),
        tagline: taglineInput.trim(),
        description: descriptionInput.trim(),
        image: imageInput.trim(),
        video: videoInput.trim(),
        category: categoryInput.trim(),
        bgColor: bgColorInput,
        accentColor: accentColorInput,
        layout: layoutInput,
        order: Number(orderInput),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la sauvegarde.');
      
      toast.success(editing ? 'Diapositive modifiée avec succès.' : 'Diapositive créée avec succès.');
      setShowModal(false);
      await fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/hero-slides/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression.');
      toast.success('Diapositive supprimée avec succès.');
      setDeleteTarget(null);
      await fetchAll();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <SellerSectionHeader
          title="Gestion du contenu Héro"
          description="Gérez les diapositives dynamiques du carrousel de la page d'accueil."
        />
        <SellerButton variant="primary" icon={Plus} onClick={openAdd}>
          Ajouter une diapositive
        </SellerButton>
      </div>

      {slides.length === 0 ? (
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center text-[var(--text-secondary)]">
          Aucune diapositive trouvée. Ajoutez-en une pour commencer !
        </div>
      ) : (
        <SellerTable>
          <SellerTableHeader>
            <SellerTableRow>
              <SellerTableCell isHeader>Ordre</SellerTableCell>
              <SellerTableCell isHeader>Aperçu</SellerTableCell>
              <SellerTableCell isHeader>Titre / Tagline</SellerTableCell>
              <SellerTableCell isHeader>Catégorie</SellerTableCell>
              <SellerTableCell isHeader>Mise en page</SellerTableCell>
              <SellerTableCell isHeader>Couleur</SellerTableCell>
              <SellerTableCell isHeader className="text-right">Actions</SellerTableCell>
            </SellerTableRow>
          </SellerTableHeader>
          <SellerTableBody>
            {slides.map((slide) => (
              <SellerTableRow key={slide.id}>
                <SellerTableCell className="font-semibold text-[var(--text-primary)]">
                  {slide.order}
                </SellerTableCell>
                <SellerTableCell>
                  <div 
                    className="relative h-12 w-20 overflow-hidden border border-[var(--border)] flex items-center justify-center p-1 rounded"
                    style={{ backgroundColor: slide.bgColor }}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      width={64}
                      height={36}
                      className="object-contain max-h-full max-w-full"
                    />
                  </div>
                </SellerTableCell>
                <SellerTableCell>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{slide.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{slide.tagline}</p>
                  </div>
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)]">
                  {slide.category}
                </SellerTableCell>
                <SellerTableCell className="text-[var(--text-secondary)] capitalize">
                  {slide.layout === 'left' ? 'Gauche' : slide.layout === 'right' ? 'Droite' : 'Centré'}
                </SellerTableCell>
                <SellerTableCell>
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="inline-block h-3.5 w-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: slide.bgColor }}
                    />
                    <span className="text-xs font-mono text-[var(--text-secondary)] uppercase">{slide.bgColor}</span>
                  </div>
                </SellerTableCell>
                <SellerTableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <SellerButton
                      variant="ghost"
                      size="sm"
                      icon={Pencil}
                      onClick={() => openEdit(slide)}
                    >
                      Modifier
                    </SellerButton>
                    <SellerButton
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => setDeleteTarget(slide)}
                    >
                      Supprimer
                    </SellerButton>
                  </div>
                </SellerTableCell>
              </SellerTableRow>
            ))}
          </SellerTableBody>
        </SellerTable>
      )}

      {/* Modal d'Ajout / Modification */}
      <SellerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Modifier la diapositive' : 'Ajouter une diapositive'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <SellerButton variant="ghost" onClick={() => setShowModal(false)}>
              Annuler
            </SellerButton>
            <SellerButton variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </SellerButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SellerInput
              label="Titre principal"
              placeholder="Ex: Téléviseurs intelligents"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
            />
            <SellerInput
              label="Sous-titre / Tagline"
              placeholder="Ex: IMMERSION TOTALE"
              value={taglineInput}
              onChange={(e) => setTaglineInput(e.target.value)}
            />
          </div>

          <SellerTextarea
            label="Description"
            placeholder="Décrivez les points forts du produit..."
            rows={3}
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Dropdown Catégories */}
            <div>
              <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Catégorie cible (Lien)</span>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
                {/* Fallback si aucune catégorie chargée */}
                {categories.length === 0 && (
                  <>
                    <option value="Televiseurs">Televiseurs</option>
                    <option value="Ordinateurs">Ordinateurs</option>
                    <option value="Smartphones">Smartphones</option>
                    <option value="Audio">Audio</option>
                  </>
                )}
              </select>
            </div>

            {/* Dropdown Layout */}
            <div>
              <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Disposition</span>
              <select
                value={layoutInput}
                onChange={(e) => setLayoutInput(e.target.value)}
                className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
              >
                <option value="left">Gauche (Texte à gauche, produit à droite)</option>
                <option value="right">Droite (Produit à gauche, texte à droite)</option>
                <option value="center">Centré (Texte en haut, produit en bas)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Background Color avec color picker */}
            <div className="flex gap-2 items-center">
              <SellerInput
                label="Couleur d'arrière-plan"
                placeholder="#e2e7f3"
                value={bgColorInput}
                onChange={(e) => setBgColorInput(e.target.value)}
                className="flex-1"
              />
              <div className="mt-6 shrink-0">
                <input
                  type="color"
                  value={bgColorInput.startsWith('#') && bgColorInput.length === 7 ? bgColorInput : '#e2e7f3'}
                  onChange={(e) => setBgColorInput(e.target.value)}
                  className="w-11 h-11 rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] cursor-pointer overflow-hidden p-0"
                />
              </div>
            </div>

            {/* Accent Color avec color picker */}
            <div className="flex gap-2 items-center">
              <SellerInput
                label="Couleur d'accentuation"
                placeholder="#3b82f6"
                value={accentColorInput}
                onChange={(e) => setAccentColorInput(e.target.value)}
                className="flex-1"
              />
              <div className="mt-6 shrink-0">
                <input
                  type="color"
                  value={accentColorInput.startsWith('#') && accentColorInput.length === 7 ? accentColorInput : '#3b82f6'}
                  onChange={(e) => setAccentColorInput(e.target.value)}
                  className="w-11 h-11 rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] cursor-pointer overflow-hidden p-0"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SellerInput
              label="Ordre d'affichage"
              type="number"
              min="0"
              placeholder="0"
              value={orderInput}
              onChange={(e) => setOrderInput(Number(e.target.value))}
            />

            <div>
              <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Image du produit</span>
              <div className="flex gap-2 items-center">
                <SellerInput
                  placeholder="Sélectionner ou téléverser..."
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  className="flex-1"
                />
                <label 
                  htmlFor="slide-image-file" 
                  className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] cursor-pointer hover:bg-[var(--bg-hover)] transition ${uploadingImage ? 'animate-pulse pointer-events-none' : ''}`}
                >
                  <Upload className="h-4 w-4 text-[var(--text-secondary)]" />
                  <input
                    type="file"
                    id="slide-image-file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              Vidéo (optionnel — remplace l&apos;image)
            </span>
            <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-input)] px-4 py-3 text-sm transition hover:border-[var(--accent-blue)] hover:bg-[var(--bg-hover)] ${uploadingVideo ? 'pointer-events-none opacity-60' : ''}`}>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  if (file.size > 50 * 1024 * 1024) { toast.error('Vidéo trop volumineuse (50 Mo max).'); return; }
                  setUploadingVideo(true);
                  try {
                    const fd = new FormData();
                    fd.append('video', file);
                    const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (!res.ok || !data.imageUrl) throw new Error(data.message || 'Echec de l\'upload');
                    setVideoInput(data.imageUrl);
                    toast.success('Vidéo téléchargée.');
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Echec de l\'upload de la vidéo.');
                  } finally {
                    setUploadingVideo(false);
                  }
                }}
              />
              <span className="text-[var(--text-secondary)]">
                {uploadingVideo ? 'Envoi de la vidéo en cours…' : videoInput.trim() ? 'Remplacer la vidéo' : 'Choisir une vidéo depuis votre PC (MP4, WebM — 50 Mo max)'}
              </span>
            </label>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Si une vidéo est définie, elle est lue à la place de l&apos;image (en boucle, sans son).
            </p>
          </div>

          {videoInput.trim() ? (
            <div className="mt-2 overflow-hidden rounded-xl border border-[var(--border)] bg-black shadow-lg">
              <video
                src={videoInput.trim()}
                autoPlay
                loop
                muted
                playsInline
                className="max-h-56 w-full object-contain"
              />
              <div className="flex items-center justify-between bg-[var(--bg-card)] px-3 py-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Aperçu vidéo</span>
                <button
                  type="button"
                  onClick={() => setVideoInput('')}
                  className="text-xs font-medium text-[var(--accent-red)] transition hover:opacity-80"
                >
                  Retirer la vidéo
                </button>
              </div>
            </div>
          ) : imageInput && (
            <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-outer)] p-3 flex items-center justify-center relative min-h-[120px]" style={{ backgroundColor: bgColorInput }}>
              <div className="relative h-28 w-48">
                <Image
                  src={imageInput}
                  alt="Aperçu diapositive"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </SellerModal>

      {/* Modal de Confirmation Suppression */}
      <SellerModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer la diapositive ?"
        description="Êtes-vous sûr de vouloir supprimer cette diapositive ? Cette action est irréversible."
        footer={
          <div className="flex justify-end gap-3">
            <SellerButton variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </SellerButton>
            <SellerButton variant="danger" onClick={confirmDelete}>
              Supprimer
            </SellerButton>
          </div>
        }
      >
        {deleteTarget && (
          <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-outer)] p-4">
            <div className="relative h-14 w-24 overflow-hidden border border-[var(--border)] bg-zinc-200 flex items-center justify-center p-1 rounded">
              <Image
                src={deleteTarget.image}
                alt={deleteTarget.title}
                width={80}
                height={45}
                className="object-contain max-h-full max-w-full"
              />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{deleteTarget.title}</p>
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{deleteTarget.tagline}</p>
            </div>
          </div>
        )}
      </SellerModal>
    </div>
  );
}
