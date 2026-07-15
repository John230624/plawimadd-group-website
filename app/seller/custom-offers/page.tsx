'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle,
  Pencil,
  Plus,
  Trash2,
  XCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-toastify';

import Loading from '@/components/Loading';
import SellerButton from '@/components/seller/SellerButton';
import SellerEmptyState from '@/components/seller/SellerEmptyState';
import SellerInput from '@/components/seller/SellerInput';
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
import SellerTextarea from '@/components/seller/SellerTextarea';

interface CustomOffer {
  id: string;
  title: string;
  description: string;
  badgeText: string;
  image: string;
  detailsJson: string;
  buttonText: string;
  buttonUrl: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  isStudent: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  title: '',
  description: '',
  badgeText: 'PROMO',
  image: '/images/background_etudiant2.jpg',
  buttonText: 'Voir l\'offre',
  buttonUrl: '/offer',
  bgColor: 'bg-slate-950',
  textColor: 'text-white',
  isActive: true,
  isStudent: false,
};

export default function CustomOffersPage(): React.ReactElement {
  const { data: session } = useSession();
  const [offers, setOffers] = useState<CustomOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [bullets, setBullets] = useState<string[]>([]);
  const [newBullet, setNewBullet] = useState('');
  const [editingOffer, setEditingOffer] = useState<CustomOffer | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<CustomOffer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/custom-offer');
      if (response.data.success) {
        setOffers(response.data.offers || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des offres:', error);
      toast.error('Impossible de charger les offres.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleOpenCreate = () => {
    setEditingOffer(null);
    setForm(emptyForm);
    setBullets([]);
    setNewBullet('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (offer: CustomOffer) => {
    setEditingOffer(offer);
    setForm({
      title: offer.title,
      description: offer.description,
      badgeText: offer.badgeText,
      image: offer.image,
      buttonText: offer.buttonText,
      buttonUrl: offer.buttonUrl,
      bgColor: offer.bgColor,
      textColor: offer.textColor,
      isActive: offer.isActive,
      isStudent: offer.isStudent,
    });
    try {
      const parsed = JSON.parse(offer.detailsJson);
      setBullets(Array.isArray(parsed) ? parsed : []);
    } catch {
      setBullets([]);
    }
    setNewBullet('');
    setIsFormOpen(true);
  };

  const handleAddBullet = () => {
    if (!newBullet.trim()) return;
    setBullets([...bullets, newBullet.trim()]);
    setNewBullet('');
  };

  const handleRemoveBullet = (index: number) => {
    setBullets(bullets.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Le titre et la description sont requis.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        detailsJson: JSON.stringify(bullets),
      };

      if (editingOffer) {
        await axios.put(`/api/custom-offer/${editingOffer.id}`, payload);
        toast.success('Offre mise à jour.');
      } else {
        await axios.post('/api/custom-offer', payload);
        toast.success('Offre créée.');
      }

      setIsFormOpen(false);
      fetchOffers();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde de l\'offre.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!offerToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/custom-offer/${offerToDelete.id}`);
      toast.success('Offre supprimée.');
      setOfferToDelete(null);
      fetchOffers();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de l\'offre.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && offers.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 text-left">
      <SellerSectionHeader
        title="Offres personnaliser"
        description="Gérez les offres spéciales et plans d'échelonnement affichés sur le site de façon dynamique."
        action={
          <SellerButton
            onClick={handleOpenCreate}
            icon={Plus}
          >
            Créer une offre
          </SellerButton>
        }
      />

      {offers.length === 0 ? (
        <SellerEmptyState
          title="Aucune offre personnalisée"
          description="Créez des offres pour les afficher en miniature sur les pages de détails produits, panier et accueil."
          icon={Sparkles}
          action={
            <SellerButton icon={Plus} onClick={handleOpenCreate}>
              Créer une offre
            </SellerButton>
          }
        />
      ) : (
        <div className="rounded-[4px] border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <SellerTable>
            <SellerTableHeader>
              <SellerTableRow>
                <SellerTableCell isHeader>Badge</SellerTableCell>
                <SellerTableCell isHeader>Titre</SellerTableCell>
                <SellerTableCell isHeader>Description</SellerTableCell>
                <SellerTableCell isHeader>Style / Couleur</SellerTableCell>
                <SellerTableCell isHeader>Type</SellerTableCell>
                <SellerTableCell isHeader>Statut</SellerTableCell>
                <SellerTableCell isHeader className="text-right">Actions</SellerTableCell>
              </SellerTableRow>
            </SellerTableHeader>
            <SellerTableBody>
              {offers.map((offer) => (
                <SellerTableRow key={offer.id}>
                  <SellerTableCell>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-slate-900 border border-slate-700 text-slate-100 rounded-[2px]">
                      {offer.badgeText}
                    </span>
                  </SellerTableCell>
                  <SellerTableCell className="font-bold text-slate-200">
                    {offer.title}
                  </SellerTableCell>
                  <SellerTableCell className="max-w-[250px] truncate text-slate-400">
                    {offer.description}
                  </SellerTableCell>
                  <SellerTableCell>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-3.5 w-3.5 rounded-[2px] border border-slate-700 ${offer.bgColor}`} />
                      <span className="text-xs text-slate-400 font-mono">{offer.bgColor}</span>
                    </div>
                  </SellerTableCell>
                  <SellerTableCell>
                    {offer.isStudent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400">
                        <Sparkles className="h-3 w-3" />
                        Offre Étudiante
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Standard</span>
                    )}
                  </SellerTableCell>
                  <SellerTableCell>
                    {offer.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <XCircle className="h-3 w-3" />
                        Inactif
                      </span>
                    )}
                  </SellerTableCell>
                  <SellerTableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(offer)}
                        className="p-1.5 rounded-[2px] border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition"
                        title="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setOfferToDelete(offer)}
                        className="p-1.5 rounded-[2px] border border-red-950 bg-red-950/20 text-red-400 hover:text-red-300 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </SellerTableCell>
                </SellerTableRow>
              ))}
            </SellerTableBody>
          </SellerTable>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <SellerModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingOffer ? 'Modifier l\'offre' : 'Créer une offre'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SellerInput
              label="Titre de l'offre"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Offre Étudiante"
              required
            />
            <SellerInput
              label="Texte du badge"
              value={form.badgeText}
              onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
              placeholder="Ex: ÉTUDIANT"
            />
          </div>

          <SellerTextarea
            label="Description courte"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Décrivez l'offre ou les conditions de paiement"
            required
            rows={2}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SellerInput
              label="Image de fond (URL)"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="Ex: /images/background_etudiant2.jpg"
            />
            <SellerInput
              label="Lien / URL du bouton"
              value={form.buttonUrl}
              onChange={(e) => setForm({ ...form, buttonUrl: e.target.value })}
              placeholder="Ex: /offer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SellerInput
              label="Texte du bouton"
              value={form.buttonText}
              onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
              placeholder="Ex: Activer mon offre"
            />
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-350 uppercase">Couleur d'arrière-plan</label>
              <SellerSelect
                value={form.bgColor}
                onChange={(val) => setForm({ ...form, bgColor: val })}
                options={[
                  { value: 'bg-slate-950', label: 'Noir Charbon (bg-slate-955)' },
                  { value: 'bg-indigo-950', label: 'Bleu Royal Nuit (bg-indigo-950)' },
                  { value: 'bg-red-950', label: 'Rouge Sombre Premium (bg-red-950)' },
                  { value: 'bg-emerald-950', label: 'Vert Émeraude Profond (bg-emerald-950)' },
                  { value: 'bg-slate-900', label: 'Ardoise (bg-slate-900)' },
                  { value: 'bg-zinc-950', label: 'Zinc Foncé (bg-zinc-955)' },
                ]}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-350 uppercase">Couleur du texte</label>
              <SellerSelect
                value={form.textColor}
                onChange={(val) => setForm({ ...form, textColor: val })}
                options={[
                  { value: 'text-white', label: 'Blanc (text-white)' },
                  { value: 'text-slate-100', label: 'Blanc Cassé (text-slate-100)' },
                  { value: 'text-yellow-400', label: 'Jaune Or (text-yellow-400)' },
                ]}
              />
            </div>
          </div>

          {/* Bullet Points Details */}
          <div className="border border-[var(--border)] p-4 rounded-[4px] bg-[var(--bg-outer)]/50 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Points clés / Détails de l'offre</h4>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newBullet}
                onChange={(e) => setNewBullet(e.target.value)}
                placeholder="Ex: Paiement en 3 tranches : 50%, puis 25% et 25%"
                className="flex-1 rounded-[2px] border border-[var(--border)] bg-[var(--bg-hover)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
              />
              <button
                type="button"
                onClick={handleAddBullet}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 text-xs font-bold rounded-[2px] border border-slate-700 transition"
              >
                Ajouter
              </button>
            </div>

            <ul className="space-y-1.5 max-h-36 overflow-y-auto">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-center justify-between gap-3 bg-[var(--bg-hover)] px-3 py-1.5 rounded-[2px] border border-[var(--border)] text-xs text-slate-300">
                  <span className="truncate">{bullet}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBullet(idx)}
                    className="text-red-400 hover:text-red-300 p-0.5"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {bullets.length === 0 && (
                <p className="text-[11px] text-slate-500 italic">Aucun point clé ajouté pour le moment.</p>
              )}
            </ul>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded-[2px] border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              Rendre l'offre active immédiatement
            </label>

            <label className="flex items-center gap-2 text-xs text-indigo-400 font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isStudent}
                onChange={(e) => setForm({ ...form, isStudent: e.target.checked })}
                className="rounded-[2px] border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              Définir comme Offre Étudiante principale (sera toujours affichée en premier)
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
            <SellerButton
              type="button"
              onClick={() => setIsFormOpen(false)}
              variant="outline"
            >
              Annuler
            </SellerButton>
            <SellerButton
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </SellerButton>
          </div>
        </form>
      </SellerModal>

      {/* DELETE CONFIRM MODAL */}
      <SellerModal
        isOpen={!!offerToDelete}
        onClose={() => setOfferToDelete(null)}
        title="Confirmer la suppression"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-950/20 border border-red-900/50 p-4 rounded-[4px]">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Attention</h4>
              <p className="mt-1 text-xs text-slate-300 leading-5">
                Êtes-vous sûr de vouloir supprimer l'offre <strong>{offerToDelete?.title}</strong> ? Cette action est irréversible.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2.5">
            <SellerButton
              onClick={() => setOfferToDelete(null)}
              variant="outline"
            >
              Annuler
            </SellerButton>
            <SellerButton
              onClick={handleDelete}
              variant="danger"
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </SellerButton>
          </div>
        </div>
      </SellerModal>
    </div>
  );
}
