// app/order-status/page.tsx
'use client';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAppContext } from '@/context/AppContext';

/**
 * Page de statut de paiement.
 *
 * Elle n'accorde aucun credit a ce que dit le navigateur : elle interroge le
 * serveur jusqu'a ce qu'il tranche. Aucun identifiant de commande n'est affiche
 * ni rendu cliquable tant que la commande n'existe pas reellement en base.
 */

type ViewState = 'checking' | 'paid' | 'failed' | 'pending';

/** Cadence et duree d'interrogation : ~40 s, bien au-dela d'un denouement normal. */
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 40_000;

const OrderStatusPage = (): React.ReactElement => {
  const searchParams = useSearchParams();
  const { loadCartData, fetchUserOrders } = useAppContext();

  const intentId = searchParams.get('intent');
  const transactionId = searchParams.get('tx');

  // Ancien format d'URL, encore emis par le flux de commande etudiante.
  const legacyOrderId = searchParams.get('orderId');
  const legacyStatus = searchParams.get('status');
  const legacyMessage = searchParams.get('message');

  const [view, setView] = useState<ViewState>('checking');
  const [message, setMessage] = useState('Nous confirmons votre paiement...');
  const [orderId, setOrderId] = useState<string | null>(null);

  // Evite que le rafraichissement panier/commandes parte plusieurs fois si le
  // composant se remonte (StrictMode, navigation arriere).
  const settledRef = useRef(false);

  const onPaid = useCallback(
    (id: string) => {
      if (settledRef.current) return;
      settledRef.current = true;
      setOrderId(id);
      setView('paid');
      setMessage('Paiement confirme. Votre commande a bien ete enregistree.');
      // La commande existe deja en base a cet instant : ces rafraichissements
      // ne peuvent pas tomber sur du vide.
      loadCartData();
      fetchUserOrders();
    },
    [loadCartData, fetchUserOrders]
  );

  const onFailed = useCallback((reason: string) => {
    if (settledRef.current) return;
    settledRef.current = true;
    setView('failed');
    setMessage(reason);
    toast.error(reason);
  }, []);

  useEffect(() => {
    if (!intentId) {
      // Compatibilite ascendante : commande etudiante (?status=pending) et
      // paiements inities sur l'ancien flux, encore en vol le temps du deploiement.
      if (legacyStatus === 'success' && legacyOrderId) {
        onPaid(legacyOrderId);
      } else if (legacyStatus === 'failed') {
        onFailed(legacyMessage || "Le paiement n'a pas abouti.");
      } else if (legacyStatus) {
        setView('pending');
        setMessage('Votre commande est en cours de traitement.');
      } else {
        setView('failed');
        setMessage('Reference de paiement absente. Reprenez depuis votre panier.');
      }
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    /** Applique un verdict serveur. Renvoie true si l'issue est definitive. */
    const apply = (payload: { state?: string; orderId?: string; message?: string }): boolean => {
      if (payload.state === 'PAID' && payload.orderId) {
        onPaid(payload.orderId);
        return true;
      }
      if (payload.state === 'FAILED') {
        onFailed(payload.message || "Le paiement n'a pas abouti.");
        return true;
      }
      return false;
    };

    const poll = async (): Promise<void> => {
      if (cancelled) return;

      try {
        const res = await fetch(`/api/payments/intent/${intentId}`, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && apply(data)) return;
      } catch {
        // Reseau instable : on retentera au tour suivant.
      }

      if (cancelled) return;

      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        // Ni succes ni echec dans le delai : surtout ne rien affirmer. Le
        // webhook finira le travail, la commande apparaitra dans le compte.
        setView('pending');
        setMessage(
          "Votre paiement est en cours de confirmation. Si vous avez ete debite, votre commande sera creee automatiquement et vous recevrez un email."
        );
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    const start = async (): Promise<void> => {
      // Voie rapide : le widget vient de nous donner la reference, on demande
      // au serveur de trancher tout de suite plutot que d'attendre le webhook.
      if (transactionId) {
        try {
          const res = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intentId, transactionId }),
          });
          const data = await res.json();
          if (cancelled) return;
          if (res.ok && apply(data)) return;
        } catch {
          // On bascule sur l'interrogation en boucle.
        }
      }
      void poll();
    };

    void start();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [intentId, transactionId, legacyOrderId, legacyStatus, legacyMessage, onPaid, onFailed]);

  const title =
    view === 'paid'
      ? 'Paiement confirme'
      : view === 'failed'
        ? 'Paiement non abouti'
        : view === 'pending'
          ? 'Confirmation en cours'
          : 'Confirmation de votre paiement';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="flex justify-center">
          {view === 'checking' && (
            <Loader2 className="h-20 w-20 text-blue-600 animate-spin" aria-label="Confirmation en cours" />
          )}
          {view === 'paid' && <CheckCircle className="h-20 w-20 text-green-500" aria-label="Paiement confirme" />}
          {view === 'failed' && <XCircle className="h-20 w-20 text-red-500" aria-label="Paiement non abouti" />}
          {view === 'pending' && <Clock className="h-20 w-20 text-yellow-500" aria-label="Confirmation en cours" />}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 leading-relaxed" role="status" aria-live="polite">
            {message}
          </p>
        </div>

        {/* La reference n'est affichee qu'une fois la commande reellement creee. */}
        {view === 'paid' && orderId && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Reference commande :</span>
              <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded border break-all">
                {orderId.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          {view === 'paid' && (
            <>
              <Link
                href="/my-orders"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
              >
                Voir mes commandes
              </Link>
              <Link
                href="/"
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Retour a l&apos;accueil
              </Link>
            </>
          )}

          {view === 'failed' && (
            <>
              <Link
                href="/cart"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
              >
                Retourner au panier
              </Link>
              <Link
                href="/"
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Retour a l&apos;accueil
              </Link>
            </>
          )}

          {view === 'pending' && (
            <>
              <Link
                href="/my-orders"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
              >
                Voir mes commandes
              </Link>
              <Link
                href="/"
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Retour a l&apos;accueil
              </Link>
            </>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {view === 'paid' && 'Vous recevrez un email de confirmation sous peu.'}
            {view === 'failed' && 'Si le probleme persiste, contactez notre support.'}
            {view === 'pending' && 'Inutile de payer une seconde fois.'}
            {view === 'checking' && 'Merci de patienter quelques instants...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function OrderStatusPageWrapper(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
        </div>
      }
    >
      <OrderStatusPage />
    </Suspense>
  );
}
