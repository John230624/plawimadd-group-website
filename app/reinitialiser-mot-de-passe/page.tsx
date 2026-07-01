// app/reinitialiser-mot-de-passe/page.tsx
'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiLock, FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi'; // Import des icônes

/**
 * Composant de la page de réinitialisation de mot de passe.
 * Permet à un utilisateur de définir un nouveau mot de passe en utilisant un jeton de réinitialisation.
 * @returns {React.ReactElement} Le JSX de la page de réinitialisation de mot de passe.
 */
export default function ResetPasswordPageWrapper(): React.ReactElement {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" /></div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}

function ResetPasswordPage(): React.ReactElement { // Type le composant comme retournant un React.ReactElement
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState<string>(''); // Type l'état comme string
    const [newPassword, setNewPassword] = useState<string>(''); // Type l'état comme string
    const [confirmPassword, setConfirmPassword] = useState<string>(''); // Type l'état comme string
    const [message, setMessage] = useState<string>(''); // Type l'état comme string
    const [error, setError] = useState<string>(''); // Type l'état comme string
    const [isLoading, setIsLoading] = useState<boolean>(false); // Type l'état comme boolean

    // Récupère le jeton de réinitialisation depuis l'URL
    useEffect(() => {
        const tokenFromUrl: string | null = searchParams.get('token'); // Type tokenFromUrl
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            setError('Jeton de réinitialisation manquant dans l\'URL.');
        }
    }, [searchParams]); // Dépendance du useEffect

    /**
     * Gère la soumission du formulaire de réinitialisation de mot de passe.
     * Valide les entrées et envoie la requête à l'API.
     * @param {FormEvent<HTMLFormElement>} e L'événement de soumission du formulaire.
     */
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

        if (!token) {
            setError('Jeton de réinitialisation manquant.');
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
            setIsLoading(false);
            return;
        }

        try {
            // L'URL de l'API doit être relative si la route est sur le même domaine,
            // ou utiliser baseUrl si vous l'avez dans un contexte global.
            // Pour Vercel, '/api/users/reinitialiser-mot-de-passe' est généralement correct.
            const response = await fetch('/api/users/reinitialiser-mot-de-passe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setTimeout(() => {
                    // MODIFIÉ : Redirige vers l'URL complète de votre application Vercel
                    // Note: router.push('/') est souvent suffisant pour rediriger vers la racine du domaine actuel.
                    // L'utilisation de l'URL complète peut être utile pour des cas spécifiques ou si des problèmes de redirection relative persistent.
                    router.push('https://plawimadd-group-9gcrfo40b-john-johns-projects-596db80b.vercel.app'); 
                }, 3000); // Délai de 3 secondes avant la redirection
            } else {
                setError(data.message || 'Une erreur est survenue lors de la réinitialisation.');
            }
        } catch (err: unknown) { // Type l'erreur comme unknown
            console.error('Erreur réseau:', err);
            setError('Erreur de connexion au serveur.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center p-4'>
            <div className='w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden'>
                <div className='p-8'>
                    <div className='text-center mb-8'>
                        <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4'>
                            <FiLock className='h-6 w-6 text-blue-600' aria-hidden='true' /> {/* Icône décorative pour le titre */}
                        </div>
                        <h2 className='text-2xl font-bold text-gray-800'>Réinitialiser votre mot de passe</h2>
                        <p className='text-gray-500 mt-2'>
                            Entrez votre nouveau mot de passe ci-dessous.
                        </p>
                    </div>

                    {message && (
                        <div className='mb-6 p-3 rounded-lg bg-green-50 border border-green-200 flex items-start' role='alert'>
                            <FiCheckCircle className='text-green-500 mt-0.5 mr-2 flex-shrink-0' aria-hidden='true' />
                            <span className='text-green-700'>{message}</span>
                        </div>
                    )}
                    {error && (
                        <div className='mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start' role='alert'>
                            <FiAlertCircle className='text-red-500 mt-0.5 mr-2 flex-shrink-0' aria-hidden='true' />
                            <span className='text-red-700'>{error}</span>
                        </div>
                    )}

                    {!token ? (
                        <p className='text-red-500 text-center' role='status'>{error || 'Chargement du jeton...'}</p>
                    ) : (
                        <form onSubmit={handleSubmit} className='space-y-5'>
                            <div>
                                <label htmlFor='newPassword' className='block text-sm font-medium text-gray-700 mb-1'>
                                    Nouveau mot de passe
                                </label>
                                <div className='relative rounded-md shadow-sm'>
                                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                        <FiLock className='h-5 w-5 text-gray-400' aria-hidden='true' /> {/* Icône dans le champ nouveau mot de passe */}
                                    </div>
                                    <input
                                        type='password'
                                        id='newPassword'
                                        className='focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-3 border-gray-300 rounded-md'
                                        value={newPassword}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} // Type l'événement onChange
                                        required
                                        placeholder='••••••••'
                                        aria-label='Nouveau mot de passe' // Ajouté pour l'accessibilité
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700 mb-1'>
                                    Confirmer le nouveau mot de passe
                                </label>
                                <div className='relative rounded-md shadow-sm'>
                                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                        <FiLock className='h-5 w-5 text-gray-400' aria-hidden='true' /> {/* Icône dans le champ confirmer mot de passe */}
                                    </div>
                                    <input
                                        type='password'
                                        id='confirmPassword'
                                        className='focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-3 border-gray-300 rounded-md'
                                        value={confirmPassword}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} // Type l'événement onChange
                                        required
                                        placeholder='••••••••'
                                        aria-label='Confirmer le nouveau mot de passe' // Ajouté pour l'accessibilité
                                    />
                                </div>
                            </div>

                            <button
                                type='submit'
                                disabled={isLoading} // Désactive le bouton pendant le chargement
                                className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                                aria-label='Réinitialiser le mot de passe' // Ajouté pour l'accessibilité
                            >
                                <span className='absolute left-0 inset-y-0 flex items-center pl-3'>
                                    {isLoading ? (
                                        <div className='animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white'></div>
                                    ) : (
                                        <FiArrowRight className='h-5 w-5 text-blue-300 group-hover:text-blue-200' aria-hidden='true' />
                                    )}
                                </span>
                                {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                            </button>
                        </form>
                    )}

                    <p className='mt-6 text-center text-sm'>
                        <Link href='/login' className='font-medium text-blue-600 hover:text-blue-500'>
                            Retour à la connexion
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
