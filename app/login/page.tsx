// app/login/page.tsx
'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react'; // Import FormEvent and ChangeEvent
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { FiMail, FiLock, FiUser, FiArrowRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

// Import the User interface from your centralized types file
import { User } from '@/lib/types'; // Ensure the path is correct

/**
 * Composant de la page de connexion.
 * Permet aux utilisateurs de se connecter via des identifiants ou Google.
 * Gère les états de chargement, d'erreur et de succès.
 * @returns {React.ReactElement} Le JSX de la page de connexion.
 */
export default function LoginPage(): React.ReactElement {
    const [email, setEmail] = useState<string>(''); // Type the state as string
    const [password, setPassword] = useState<string>(''); // Type the state as string
    const [error, setError] = useState<string>(''); // Type the state as string
    const [success, setSuccess] = useState<string>(''); // Type the state as string
    const [isLoading, setIsLoading] = useState<boolean>(false); // Type the state as boolean
    const router = useRouter();
    const { data: session, status } = useSession();
    const { setCurrentUser } = useAppContext();

    useEffect(() => {
        if (status === 'authenticated') {
            if (session.user) {
                // Now that types/next-auth.d.ts is extended, we can directly access token and role
                const userFromSession: User = {
                    id: session.user.id ? String(session.user.id) : (session.user.email || 'unknown_id'),
                    name: session.user.name || null,
                    email: session.user.email || null,
                    image: session.user.image || null,
                    role: session.user.role,   // Direct access, no more 'as any'
                };
                setCurrentUser(userFromSession);
            }
            const role = session.user?.role;
            router.replace(role === 'ADMIN' || role === 'SELLER' ? '/seller' : '/');
        }
    }, [session, status, router, setCurrentUser]);

    // Type the form submission event
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                if (result.error === 'CredentialsSignin') {
                    setError('Adresse email ou mot de passe incorrect.');
                } else {
                    setError(result.error);
                }
            } else {
                setSuccess('Connexion réussie ! Redirection...');
            }
        } catch (err: unknown) { // Type the error as unknown
            console.error('Erreur inattendue lors de la connexion:', err);
            setError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signIn('google', { callbackUrl: '/' });
        } catch (err: unknown) { // Type the error as unknown
            console.error('Erreur lors de la connexion Google:', err);
            setError('Une erreur est survenue lors de la connexion avec Google.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                            <FiUser className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Connexion</h2>
                        <p className="text-gray-500 mt-2">
                            Pas encore membre ?{' '}
                            <Link href="/register" className="text-blue-600 hover:underline font-medium">
                                Créer un compte
                            </Link>
                        </p>
                    </div>

                    {success && (
                        <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 flex items-start" role="alert">
                            <FiCheckCircle className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-green-700">{success}</span>
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start" role="alert">
                            <FiAlertCircle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-red-700">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Adresse email
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiMail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-3 border-gray-300 rounded-md"
                                    value={email}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} // Type the onChange event
                                    required
                                    placeholder="email@plawimadd.com"
                                    aria-label="Adresse email" // Added for accessibility
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mot de passe
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-3 border-gray-300 rounded-md"
                                    value={password}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} // Type the onChange event
                                    required
                                    placeholder="••••••••"
                                    aria-label="Mot de passe" // Added for accessibility
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    aria-label="Se souvenir de moi" // Added for accessibility
                                />
                                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                                    Se souvenir de moi
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link href="/mot-de-passe-oublie" className="font-medium text-blue-600 hover:text-blue-500">
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            disabled={isLoading} // Disable button during loading
                            aria-label="Se connecter" // Added for accessibility
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                ) : (
                                    <FiArrowRight className="h-5 w-5 text-blue-300 group-hover:text-blue-200" />
                                )}
                            </span>
                            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleGoogleSignIn}
                                className="w-full inline-flex justify-center items-center py-3 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                disabled={isLoading}
                                aria-label="Se connecter avec Google"
                            >
                                <FcGoogle className="h-5 w-5 mr-2" />
                                Google
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
