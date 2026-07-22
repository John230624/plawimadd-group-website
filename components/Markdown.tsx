'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

/**
 * Rendu d'un texte Markdown redige par un vendeur.
 *
 * Securite : le HTML brut n'est PAS interprete. react-markdown l'echappe par
 * defaut tant qu'on ne branche pas `rehype-raw` — ne l'ajoutez pas ici, ce
 * serait ouvrir une injection de script sur une fiche produit publique.
 * Les URL sont filtrees par le `urlTransform` par defaut, qui rejette les
 * protocoles dangereux (`javascript:`, `data:`).
 *
 * `remark-breaks` conserve les retours a la ligne simples : les descriptions
 * deja saisies avant le passage au Markdown gardent leur mise en forme au lieu
 * d'etre agglutinees en un seul paragraphe.
 */
export default function Markdown({
  content,
  className = '',
}: {
  content: string | null | undefined;
  className?: string;
}): React.ReactElement | null {
  if (!content?.trim()) return null;

  return (
    <div
      className={`prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-[#222] prose-p:text-[#555] prose-li:text-[#555] prose-strong:text-[#222] prose-a:text-[#2563eb] prose-img:rounded-lg ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Un lien redige par un vendeur pointe vers l'exterieur : on coupe
          // l'acces a `window.opener` et on n'offre pas de signal SEO.
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {children}
            </a>
          ),
          // Un tableau large ne doit pas faire deborder la page sur mobile.
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
