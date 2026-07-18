'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
import { signOut } from 'next-auth/react';
import { validatePassword } from '@/lib/passwordPolicy';

import Loading from '@/components/Loading';
import SellerButton from '@/components/seller/SellerButton';
import SellerInput from '@/components/seller/SellerInput';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export default function SettingsPage(): React.ReactElement {
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
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);

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
    fetchProfile();
  }, [fetchProfile]);

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
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      toast.error(passwordCheck.message);
      return;
    }
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
        // Sign out user and redirect to home page
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

  const isLengthValid = newPassword.length >= 8;
  const isUppercaseValid = /[A-Z]/.test(newPassword);
  const isLowercaseValid = /[a-z]/.test(newPassword);
  const isNumberValid = /[0-9]/.test(newPassword);
  const isSpecialValid = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordValid = isLengthValid && isUppercaseValid && isLowercaseValid && isNumberValid && isSpecialValid;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-8 max-w-4xl mx-auto pb-12">
      <SellerSectionHeader title="Paramètres personnels" />

      {/* Profile Form */}
      <form onSubmit={handleUpdateProfile} className="rounded-xl bg-[var(--bg-outer)] border border-[var(--border)] p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <User className="h-5 w-5 text-[var(--accent-blue)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Informations de profil</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <SellerInput
            label="Prénom"
            value={profile.firstName}
            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
            placeholder="Jean"
            required
          />
          <SellerInput
            label="Nom"
            value={profile.lastName}
            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
            placeholder="Kintossou"
            required
          />
          <SellerInput
            label="Adresse Email (non modifiable)"
            type="email"
            value={profile.email}
            disabled
            icon={Mail}
            className="opacity-60 cursor-not-allowed"
          />
          <SellerInput
            label="Numéro de Téléphone"
            type="tel"
            value={profile.phoneNumber}
            onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
            placeholder="+229 97 91 80 00"
            icon={Phone}
          />
        </div>
        <div className="mt-6 flex justify-end">
          <SellerButton type="submit" icon={Save} disabled={profileSaving}>
            {profileSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </SellerButton>
        </div>
      </form>

      {/* Password Change Form */}
      <form onSubmit={handleChangePassword} className="rounded-xl bg-[var(--bg-outer)] border border-[var(--border)] p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Lock className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Modifier le mot de passe</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <SellerInput
            label="Mot de passe actuel"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <div className="flex flex-col">
            <div className="relative">
              <SellerInput
                label="Nouveau mot de passe"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setIsNewPasswordFocused(true)}
                onBlur={() => setIsNewPasswordFocused(false)}
                placeholder="••••••••"
                required
              />
              {isNewPasswordFocused && !isPasswordValid && (
                <div className="absolute left-0 right-0 z-20 mt-1 p-3 rounded-lg border border-slate-200 bg-white shadow-lg text-xs space-y-1.5 transition-all duration-200">
                  <p className="font-semibold text-slate-700 mb-1 text-[11px]">Le mot de passe doit contenir :</p>
                  <div className="flex items-center gap-1.5">
                    <span className={isLengthValid ? "text-green-600 font-bold flex items-center gap-1" : "text-red-500 flex items-center gap-1"}>
                      {isLengthValid ? "✓" : "○"} Au moins 8 caractères
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={isUppercaseValid ? "text-green-600 font-bold flex items-center gap-1" : "text-red-500 flex items-center gap-1"}>
                      {isUppercaseValid ? "✓" : "○"} Au moins une lettre majuscule
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={isLowercaseValid ? "text-green-600 font-bold flex items-center gap-1" : "text-red-500 flex items-center gap-1"}>
                      {isLowercaseValid ? "✓" : "○"} Au moins une lettre minuscule
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={isNumberValid ? "text-green-600 font-bold flex items-center gap-1" : "text-red-500 flex items-center gap-1"}>
                      {isNumberValid ? "✓" : "○"} Au moins un chiffre
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={isSpecialValid ? "text-green-600 font-bold flex items-center gap-1" : "text-red-500 flex items-center gap-1"}>
                      {isSpecialValid ? "✓" : "○"} Au moins un caractère spécial
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <SellerInput
            label="Confirmer le nouveau mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <div className="mt-6 flex justify-end">
          <SellerButton type="submit" icon={Key} disabled={passwordSaving} variant="outline">
            {passwordSaving ? 'Modification...' : 'Modifier le mot de passe'}
          </SellerButton>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="rounded-xl bg-[var(--bg-outer)] border border-red-200 dark:border-red-900/30 p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 text-red-500">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Zone de danger</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Une fois que vous supprimez votre compte, cette action est irréversible. Vos données personnelles seront effacées, et toutes vos sessions de vente ou historiques seront anonymisés pour préserver les registres de transactions obligatoires de l'entreprise.
        </p>
        <div className="flex justify-start">
          <SellerButton
            type="button"
            variant="danger"
            icon={Trash2}
            onClick={() => setShowDeleteModal(true)}
          >
            Supprimer mon compte
          </SellerButton>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md bg-[var(--bg-outer)] border border-[var(--border)] rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Confirmation de suppression</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Voulez-vous vraiment supprimer votre compte ? Cette action est définitive.
              </p>
              <div className="w-full mt-2 text-left bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
                <p className="text-xs text-red-800 dark:text-red-300">
                  Pour confirmer la suppression de votre compte, veuillez saisir le mot <strong>SUPPRIMER</strong> dans le champ ci-dessous.
                </p>
              </div>
              <input
                type="text"
                placeholder="Saisissez SUPPRIMER"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-inner)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-red-500 mt-2 text-center font-bold tracking-wider"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <SellerButton
                variant="outline"
                disabled={deleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                Annuler
              </SellerButton>
              <SellerButton
                variant="danger"
                disabled={deleting || deleteConfirmText !== 'SUPPRIMER'}
                onClick={handleDeleteAccount}
              >
                {deleting ? 'Suppression...' : 'Confirmer la suppression'}
              </SellerButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
