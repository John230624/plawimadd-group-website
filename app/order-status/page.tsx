// app/order-status/page.tsx
'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';

/**
 * Composant de la page de statut de commande.
 * Affiche le statut d'un paiement (succès, échec, en attente) basé sur les paramètres d'URL.
 * Met à jour le panier et l'historique des commandes en conséquence.
 * @returns {React.ReactElement} Le JSX de la page de statut de commande.
 */
const OrderStatusPage = (): React.ReactElement => {
    const searchParams = useSearchParams();
    const { loadCartData, fetchUserOrders } = useAppContext();

    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending' | 'error'>('loading');
    const [message, setMessage] = useState<string>('Vérification du statut de votre paiement...');
    const [orderRef, setOrderRef] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        // Récupération des paramètres d'URL
        const receivedStatus = searchParams.get('status');
        const receivedOrderId = searchParams.get('orderId');
        const receivedMessage = searchParams.get('message');

        console.log("🔄 OrderStatus - Paramètres reçus:", {
            status: receivedStatus,
            orderId: receivedOrderId,
            message: receivedMessage
        });

        // Définir la référence de la commande interne
        setOrderRef(receivedOrderId);

        if (receivedStatus === 'success') {
            setStatus('success');
            setMessage('Paiement réussi ! Votre commande est en cours de traitement.');
            
            // Mettre à jour les données utilisateur
            setTimeout(() => {
                loadCartData(); // Vide le panier
                fetchUserOrders(); // Rafraîchit les commandes de l'utilisateur
            }, 1000);
            
        } else if (receivedStatus === 'failed') {
            setStatus('failed');
            setMessage(receivedMessage 
                ? `Le paiement a échoué : ${receivedMessage}`
                : 'Le paiement a échoué ou a été annulé. Veuillez réessayer.'
            );
        } else if (receivedStatus === 'pending') {
            setStatus('pending');
            setMessage('Votre paiement est en cours de traitement. Veuillez patienter...');
        } else if (receivedStatus === 'error') {
            setStatus('error');
            setMessage(receivedMessage 
                ? `Erreur technique : ${receivedMessage}`
                : 'Une erreur est survenue lors du traitement de votre commande.'
            );
        } else {
            // Cas par défaut si le statut n'est pas clair ou si la page est chargée sans paramètres
            setStatus('pending');
            setMessage('Statut de paiement en vérification. Nous traitons votre commande.');
        }
    }, [searchParams, loadCartData, fetchUserOrders, isClient]);

    // Récupération des paramètres pour l'affichage
    const kkiapayTransactionId = searchParams.get('transaction_id');
    const transactionId = searchParams.get('transactionId');

    if (!isClient) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
                    <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                {/* Icône de statut */}
                <div className="flex justify-center">
                    {status === 'loading' && (
                        <Loader2 className="h-20 w-20 text-blue-600 animate-spin" aria-label="Chargement du statut du paiement" />
                    )}
                    {status === 'success' && (
                        <div className="relative">
                            <CheckCircle className="h-20 w-20 text-green-500" aria-label="Paiement réussi" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                        </div>
                    )}
                    {status === 'failed' && (
                        <XCircle className="h-20 w-20 text-red-500" aria-label="Paiement échoué" />
                    )}
                    {status === 'pending' && (
                        <Clock className="h-20 w-20 text-yellow-500" aria-label="Paiement en attente" />
                    )}
                    {status === 'error' && (
                        <XCircle className="h-20 w-20 text-orange-500" aria-label="Erreur technique" />
                    )}
                </div>

                {/* Titre */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {status === 'success' && 'Paiement Réussi !'}
                        {status === 'failed' && 'Paiement Échoué'}
                        {status === 'pending' && 'Paiement en Cours'}
                        {status === 'error' && 'Erreur Technique'}
                        {status === 'loading' && 'Vérification en Cours'}
                    </h1>
                    
                    <p className="text-gray-600 leading-relaxed" role="status" aria-live="polite">
                        {message}
                    </p>
                </div>

                {/* Informations de la commande */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {orderRef && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Référence commande:</span>
                            <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded border">
                                {orderRef}
                            </span>
                        </div>
                    )}
                    
                    {transactionId && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">ID Transaction:</span>
                            <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded border break-all">
                                {transactionId}
                            </span>
                        </div>
                    )}
                    
                    {kkiapayTransactionId && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">ID Kkiapay:</span>
                            <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded border break-all">
                                {kkiapayTransactionId}
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-4">
                    {status === 'success' && (
                        <>
                            <Link
                                href="/my-orders"
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
                                aria-label="Voir mes commandes"
                            >
                                📦 Voir mes commandes
                            </Link>
                            <Link
                                href="/"
                                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-colors"
                                aria-label="Retour à l'accueil"
                            >
                                🏠 Retour à l&apos;accueil
                            </Link>
                        </>
                    )}
                    
                    {status === 'failed' && (
                        <>
                            <Link
                                href="/cart"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
                                aria-label="Retourner au panier"
                            >
                                🛒 Retourner au panier
                            </Link>
                            <Link
                                href="/"
                                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-colors"
                                aria-label="Retour à l'accueil"
                            >
                                🏠 Retour à l&apos;accueil
                            </Link>
                        </>
                    )}
                    
                    {(status === 'pending' || status === 'loading' || status === 'error') && (
                        <>
                            <Link
                                href="/my-orders"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
                                aria-label="Vérifier mes commandes"
                            >
                                🔍 Vérifier mes commandes
                            </Link>
                            <Link
                                href="/"
                                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-colors"
                                aria-label="Retour à l'accueil"
                            >
                                🏠 Retour à l&apos;accueil
                            </Link>
                        </>
                    )}
                </div>

                {/* Message d'information supplémentaire */}
                <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        {status === 'success' && 'Vous recevrez un email de confirmation sous peu.'}
                        {status === 'failed' && 'Si le problème persiste, contactez notre support.'}
                        {status === 'pending' && 'Cette opération peut prendre quelques minutes.'}
                        {status === 'error' && 'Notre équipe technique a été notifiée.'}
                        {status === 'loading' && 'Merci de patienter...'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default function OrderStatusPageWrapper(): React.ReactElement {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" /></div>}>
      <OrderStatusPage />
    </Suspense>
  );
}