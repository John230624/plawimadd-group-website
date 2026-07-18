// app/register/page.tsx
'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react'; // Importez React, FormEvent, ChangeEvent
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { FiMail, FiLock, FiUser, FiArrowRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { validatePassword } from '@/lib/passwordPolicy';

/**
 * Composant de la page d'inscription.
 * Permet aux nouveaux utilisateurs de créer un compte ou de s'inscrire via Google.
 * Gère les états de formulaire, les messages d'erreur/succès et la redirection.
 * @returns {React.ReactElement} Le JSX de la page d'inscription.
 */
export default function RegisterPage(): React.ReactElement { // Type le composant comme retournant un React.ReactElement
    const [firstName, setFirstName] = useState<string>(''); // Type l'état comme string
    const [lastName, setLastName] = useState<string>('');   // Type l'état comme string
    const [email, setEmail] = useState<string>('');         // Type l'état comme string
    const [password, setPassword] = useState<string>('');   // Type l'état comme string
    const [isPasswordFocused, setIsPasswordFocused] = useState<boolean>(false);
    const [error, setError] = useState<string>('');         // Type l'état comme string
    const [success, setSuccess] = useState<string>('');     // Type l'état comme string
    const [isLoading, setIsLoading] = useState<boolean>(false); // Type l'état comme boolean
    const router = useRouter();
    const { status } = useSession(); // 'session' n'est pas utilisé directement, seulement 'status'

    // Redirige l'utilisateur s'il est déjà authentifié
    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/');
        }
    }, [status, router]); // Dépendances du useEffect

    /**
     * Gère la soumission du formulaire d'inscription.
     * Envoie les données d'inscription à l'API et gère les réponses.
     * @param {FormEvent<HTMLFormElement>} e L'événement de soumission du formulaire.
     */
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            setError(passwordCheck.message);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, firstName, lastName }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message || 'Inscription réussie ! Redirection...');
                setTimeout(() => router.push('/login'), 2000); // Redirige après 2 secondes
            } else {
                setError(data.message || 'Échec de l’inscription.');
            }
        } catch (err: unknown) { // Type l'erreur comme unknown
            console.error('Erreur réseau ou inattendue:', err);
            // Vérifie si l'erreur est une instance d'Error pour accéder à 'message'
            setError((err instanceof Error) ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Gère l'inscription via Google.
     * Utilise NextAuth.js pour initier le flux d'authentification Google.
     */
    const handleGoogleSignUp = async () => {
        setIsLoading(true);
        try {
            // signIn retourne une Promise<SignInResponse | undefined>
            await signIn('google', { callbackUrl: '/' });
        } catch (err: unknown) { // Type l'erreur comme unknown
            console.error('Erreur lors de l’inscription Google:', err);
            setError((err instanceof Error) ? err.message : 'Une erreur est survenue lors de l’inscription avec Google.');
        } finally {
            setIsLoading(false);
        }
    };

    const isLengthValid = password.length >= 8;
    const isUppercaseValid = /[A-Z]/.test(password);
    const isLowercaseValid = /[a-z]/.test(password);
    const isNumberValid = /[0-9]/.test(password);
    const isSpecialValid = /[^A-Za-z0-9]/.test(password);
    const isPasswordValid = isLengthValid && isUppercaseValid && isLowercaseValid && isNumberValid && isSpecialValid;

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center p-4'>
            <div className='w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden'>
                <div className='p-8'>
                    <div className='text-center mb-8'>
                        <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4'>
                            <FiUser className='h-6 w-6 text-blue-600' aria-hidden='true' /> {/* Icône décorative */}
                        </div>
                        <h2 className='text-2xl font-bold text-gray-800'>Inscription</h2>
                        <p className='text-gray-500 mt-2'>
                            Déjà membre ?{' '}
                            <Link href='/login' className='text-blue-600 hover:underline font-medium'>
                                Connectez-vous ici
                            </Link>
                        </p>
                    </div>

                    {success && (
                        <div className='mb-6 p-3 rounded-lg bg-green-50 border border-green-200 flex items-start' role='alert'>
                            <FiCheckCircle className='text-green-500 mt-0.5 mr-2 flex-shrink-0' aria-hidden='true' />
                            <span className='text-green-700'>{success}</span>
                        </div>
                    )}
                    {error && (
                        <div className='mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start' role='alert'>
                            <FiAlertCircle className='text-red-500 mt-0.5 mr-2 flex-shrink-0' aria-hidden='true' />
                            <span className='text-red-700'>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className='space-y-5'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'> {/* Utilisation de sm:grid-cols-2 pour la responsivité */}
                            <div>
                                <label htmlFor='firstName' className='block text-sm font-medium text-gray-700 mb-1'>
                                    Prénom
                                </label>
                                <div className='relative'>
                                    <FiUser className='absolute top-3 left-3 text-gray-400' aria-hidden='true' />
                                    <input
                                        type='text'
                                        id='firstName'
                                        className='focus:ring-blue-500 focus:border-blue-500 bg-zinc-100 block w-full py-3 pl-10 px-3 border rounded-md'
                                        value={firstName}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)} // Type l'événement onChange
                                        required
                                        aria-label='Votre prénom' // Ajouté pour l'accessibilité
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor='lastName' className='block text-sm font-medium text-gray-700 mb-1'>
                                    Nom
                                </label>
                                <div className='relative'>
                                    <FiUser className='absolute top-3 left-3 text-gray-400' aria-hidden='true' />
                                    <input
                                        type='text'
                                        id='lastName'
                                        className='focus:ring-blue-500 bg-zinc-100 focus:border-blue-500 block w-full py-3 pl-10 px-3 border rounded-md'
                                        value={lastName}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)} // Type l'événement onChange
                                        required
                                        aria-label='Votre nom de famille' // Ajouté pour l'accessibilité
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
                                Adresse email
                            </label>
                            <div className='relative'>
                                <FiMail className='absolute top-3 left-3 text-gray-400' aria-hidden='true' />
                                <input
                                    type='email'
                                    id='email'
                                    className='focus:ring-blue-500 focus:border-blue-500 bg-zinc-100 block w-full py-3 pl-10 px-3 border-gray-300 rounded-md'
                                    value={email}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} // Type l'événement onChange
                                    required
                                    aria-label='Votre adresse email' // Ajouté pour l'accessibilité
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-1'>
                                Mot de passe
                            </label>
                            <div className='relative'>
                                <FiLock className='absolute top-3 left-3 text-gray-400' aria-hidden='true' />
                                <input
                                    type='password'
                                    id='password'
                                    className='focus:ring-blue-500 focus:border-blue-500 bg-zinc-100 block w-full py-3 pl-10 pr-3 border-gray-300 rounded-md'
                                    value={password}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} // Type l'événement onChange
                                    onFocus={() => setIsPasswordFocused(true)}
                                    onBlur={() => setIsPasswordFocused(false)}
                                    required
                                    aria-label='Votre mot de passe' // Ajouté pour l'accessibilité
                                />
                                {isPasswordFocused && !isPasswordValid && (
                                    <div className="absolute left-0 right-0 z-20 mt-1 space-y-1 text-xs text-gray-500 leading-tight bg-white p-3 rounded-lg border border-slate-200 shadow-lg">
                                        <p className="font-semibold text-gray-655 mb-1 text-[11px]">Le mot de passe doit contenir :</p>
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

                        <button
                            type='submit'
                            disabled={isLoading}
                            className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                            aria-label="S'inscrire"
                        >
                        <span className='absolute left-3 inset-y-0 flex items-center pl-3'>
                        {isLoading ? (
                        <div className='animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white'></div>
                        ) : (
                         <FiArrowRight className='h-5 w-5 text-blue-300 group-hover:text-blue-200' aria-hidden='true' />
                            )}
                        </span>
                        {isLoading ? 'Inscription...' : "S'inscrire"}
                    </button>
                    </form>

                    <div className='mt-6'>
                        <div className='relative'>
                            <div className='absolute inset-0 flex items-center'>
                                <div className='w-full border-t border-gray-300'></div>
                            </div>
                            <div className='relative flex justify-center text-sm'>
                                <span className='px-2 bg-white text-gray-500'>Ou continuer avec</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleSignUp}
                            disabled={isLoading}
                            className='mt-6 w-full inline-flex justify-center items-center py-3 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                            aria-label="S'inscrire avec Google"
                            >
                                <FcGoogle className='h-5 w-5 mr-2' aria-hidden='true' />
                            Google
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
