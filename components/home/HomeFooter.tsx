'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { assets } from "@/assets/assets";
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';

import { footerCategories, footerQuickLinks } from './data';

export default function HomeFooter(): React.ReactElement {
  return (
    <footer className="relative left-1/2 mt-12 w-screen -translate-x-1/2 bg-white px-6 pt-12 md:px-10 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-10 border-b border-slate-200 pb-10 lg:grid-cols-[1.15fr_1fr_1fr_1fr_auto]">
          <div>
            <Link href="/" className="inline-flex items-baseline whitespace-nowrap">
              <Image
                src={assets.logo}
                alt="Plawimadd Group Logo"
                width={280}
                height={70}
                className="h-auto w-[150px] md:w-[190px]"
              />
            </Link>
            <p className="mt-4 max-w-[34ch] text-sm leading-7 text-slate-600">
              Plawimadd Group accompagne le quotidien avec une selection tech moderne, claire et
              accessible.
            </p>

            <div className="mt-5 flex items-center gap-4 text-slate-500">
              <a
                href="https://www.instagram.com/plawimadd?igsh=MXR4NHJvcW9zdXY3"
                target="_blank"
                rel="noreferrer"
              >
                <FaInstagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/share/g/16fq7NamkG/"
                target="_blank"
                rel="noreferrer"
              >
                <FaFacebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.tiktok.com/@plawimadd/video/7479513419507404037"
                target="_blank"
                rel="noreferrer"
              >
                <SiTiktok className="h-5 w-5" />
              </a>
            </div>
          </div>

          <FooterColumn title="Catalogue">
            {footerCategories.map((item) => (
              <FooterLink key={item} href="/all-products" label={item} />
            ))}
          </FooterColumn>

          <FooterColumn title="Raccourcis">
            {footerQuickLinks.map((item) => (
              <FooterLink key={item.label} href={item.href} label={item.label} />
            ))}
          </FooterColumn>

          <FooterColumn title="Infos utiles">
            <FooterText text="Paiement par tranche sur certaines offres etudiantes" />
            <FooterText text="Livraison selon disponibilite" />
            <FooterText text="Service client reactif" />
            <FooterText text="Garantie selon les produits" />
          </FooterColumn>

          <div className="lg:text-right">
            <button className="rounded-full border border-[var(--brand-300)] px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-[rgba(191,219,254,0.22)] hover:text-[var(--brand-700)]">
              Demander un appel
            </button>
            <p className="mt-6 text-2xl font-semibold text-slate-950">+(229) 0197747178</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>Politique de confidentialite et traitement des donnees.</p>
          <p>&copy; {new Date().getFullYear()} Plawimadd Group</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <h4 className="text-base font-semibold text-slate-950">{title}</h4>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }): React.ReactElement {
  return (
    <Link
      href={href}
      className="block text-sm text-slate-600 transition hover:text-[var(--brand-700)]"
    >
      {label}
    </Link>
  );
}

function FooterText({ text }: { text: string }): React.ReactElement {
  return <p className="text-sm text-slate-600">{text}</p>;
}
