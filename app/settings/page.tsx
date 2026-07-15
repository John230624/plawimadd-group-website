'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Lock,
  Trash2,
  Save,
  Key,
  AlertTriangle,
  Mail,
  Phone,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { signOut, useSession } from 'next-auth/react';

import HomeFooter from '@/components/home/HomeFooter';
import Loading from '@/components/Loading';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export default function CustomerSettingsPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (data.success && data.user) {
        setProfile({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          phoneNumber: data.user.phoneNumber || '',
        });
      } else {
        toast.error(data.message || 'Impossible de charger le profil.');
      }
    } catch {
      toast.error('Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, fetchProfile, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phoneNumber: profile.phoneNumber || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Profil mis à jour avec succès.');
      } else {
        toast.error(data.message || 'Erreur lors de la mise à jour du profil.');
      }
    } catch {
      toast.error('Erreur lors de la mise à jour du profil.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Mot de passe modifié avec succès.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || 'Erreur lors du changement de mot de passe.');
      }
    } catch {
      toast.error('Erreur lors du changement de mot de passe.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      toast.error("Veuillez saisir 'SUPPRIMER' pour confirmer la suppression.");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Compte supprimé avec succès.');
        signOut({ callbackUrl: '/' });
      } else {
        toast.error(data.message || 'Erreur lors de la suppression du compte.');
        setDeleting(false);
      }
    } catch {
      toast.error('Erreur de connexion lors de la suppression du compte.');
      setDeleting(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50/40">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/40">
      <main className="mx-auto flex w-full max-w-[1140px] flex-1 flex-col px-4 py-8 sm:px-6">
        
        {/* Navigation fil d'Ariane */}
        <nav className="mb-6">
          <ol className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <li><Link href="/" className="hover:text-[#ff6a00] transition-colors">Accueil</Link></li>
            <li>/</li>
            <li><Link href="/my-orders" className="hover:text-[#ff6a00] transition-colors">Mon compte</Link></li>
            <li>/</li>
            <li className="text-slate-650 font-bold">Paramètres</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-8">Paramètres de mon compte</h1>

        <div className="space-y-8 max-w-3xl">
          {/* Profile form */}
          <form onSubmit={handleUpdateProfile} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2.5">
              <User className="h-5 w-5 text-[#ff6a00]" />
              <h2 className="text-base font-bold text-slate-900">Informations personnelles</h2>
            </div>
            
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-slate-500">Prénom</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  placeholder="Jean"
                  required
                  className="h-10 rounded-lg border border-slate-200 px-3.5 text-xs outline-none focus:border-[#ff6a00] transition"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-slate-500">Nom</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  placeholder="Kintossou"
                  required
                  className="h-10 rounded-lg border border-slate-200 px-3.5 text-xs outline-none focus:border-[#ff6a00] transition"
                />
              </div>
              <div className="flex flex-col sm:col-span-2">
                <label className="mb-1 text-xs font-semibold text-slate-500">Adresse Email (non modifiable)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="h-10 w-full rounded-lg border border-slate-100 bg-slate-50 pl-10 pr-3.5 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:col-span-2">
                <label className="mb-1 text-xs font-semibold text-slate-500">Numéro de Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                    placeholder="+229 97 91 80 00"
                    className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3.5 text-xs outline-none focus:border-[#ff6a00] transition"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#e05d00] disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {profileSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>

          {/* Password Form */}
          <form onSubmit={handleChangePassword} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Sécurité du compte</h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-slate-500">Mot de passe actuel</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10 rounded-lg border border-slate-200 px-3.5 text-xs outline-none focus:border-[#ff6a00] transition"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-slate-500">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10 rounded-lg border border-slate-200 px-3.5 text-xs outline-none focus:border-[#ff6a00] transition"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold text-slate-500">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10 rounded-lg border border-slate-200 px-3.5 text-xs outline-none focus:border-[#ff6a00] transition"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Key className="h-4 w-4" />
                {passwordSaving ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </div>
          </form>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-200 bg-red-50/20 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-base font-bold">Zone de danger</h2>
            </div>
            
            <p className="text-xs leading-relaxed text-slate-600 mb-6">
              Une fois que vous supprimez votre compte, cette action est définitive. Toutes vos données d'adresse et de panier seront effacées. Vos factures et historiques de commandes seront anonymisés de manière irréversible pour la comptabilité du site.
            </p>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-650 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer mon compte
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-left">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Voulez-vous vraiment supprimer votre compte ?</h3>
              <p className="text-xs text-slate-500">
                Cette action est définitive et entraînera la désactivation et l'anonymisation immédiate de vos données.
              </p>
              
              <div className="w-full mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-left">
                <p className="text-[11px] text-red-800 leading-normal">
                  Pour valider, veuillez saisir le mot <strong>SUPPRIMER</strong> ci-dessous.
                </p>
              </div>

              <input
                type="text"
                placeholder="SUPPRIMER"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-red-500 text-center font-bold tracking-wider"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3.5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="h-10 rounded-xl border border-slate-250 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleting || deleteConfirmText !== 'SUPPRIMER'}
                onClick={handleDeleteAccount}
                className="h-10 rounded-xl bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      <HomeFooter />
    </div>
  );
}
