'use client';

import React from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Filet de sécurité ultime : remplace le layout racine quand celui-ci plante.
// Aucune dépendance (framer-motion, contextes…) pour garantir le rendu.
export default function GlobalError({ error, reset }: GlobalErrorProps): React.ReactElement {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
            color: '#18181b',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '72px', fontWeight: 800, margin: 0, color: '#e4e4e7' }}>500</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '8px 0' }}>
            Une erreur inattendue est survenue
          </h1>
          <p style={{ color: '#71717a', maxWidth: '420px', lineHeight: 1.6, margin: '0 0 24px' }}>
            Nos équipes ont été notifiées. Vous pouvez réessayer ou revenir à l&apos;accueil.
            {error.digest && (
              <span style={{ display: 'block', fontSize: '12px', marginTop: '8px', color: '#a1a1aa' }}>
                Référence : {error.digest}
              </span>
            )}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={reset}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#18181b',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Réessayer
            </button>
            <a
              href="/"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #d4d4d8',
                background: '#fff',
                color: '#18181b',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
