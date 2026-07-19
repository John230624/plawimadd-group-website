'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { assets } from "@/assets/assets";
import { ShieldCheck, LockKeyhole } from 'lucide-react';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import {
  SiTiktok,
  SiSamsung,
  SiLg,
  SiHp,
  SiDell,
  SiLenovo,
  SiApple,
  SiAsus,
  SiXiaomi,
  SiSony,
  SiHuawei,
  SiVisa,
} from 'react-icons/si';

import { footerCategories, footerQuickLinks } from './data';

const WHATSAPP_NUMBER_DISPLAY = '01 48 23 26 81';
const WHATSAPP_LINK = 'https://wa.me/2290148232681';

export default function HomeFooter(): React.ReactElement {
  return (
    <footer className="relative left-1/2 mt-12 w-screen -translate-x-1/2 bg-white px-6 pt-12 md:px-10 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        {/* Rangee principale : colonnes simples, une entree par ligne (style epure) */}
        <div className="grid gap-10 border-b border-slate-200 pb-10 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
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
              Plawimadd Group accompagne le quotidien avec une sélection tech moderne, claire et
              accessible.
            </p>

            {/* Toutes les icones de contact et reseaux au meme endroit */}
            <div className="mt-5 flex items-center gap-4 text-slate-500">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="transition hover:text-green-600"
              >
                <FaWhatsapp className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/plawimadd?igsh=MXR4NHJvcW9zdXY3"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="transition hover:text-pink-600"
              >
                <FaInstagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/share/g/16fq7NamkG/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="transition hover:text-blue-600"
              >
                <FaFacebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.tiktok.com/@plawimadd/video/7479513419507404037"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="transition hover:text-slate-900"
              >
                <SiTiktok className="h-5 w-5" />
              </a>
            </div>
          </div>

          <FooterColumn title="Catalogue">
            {footerCategories.map((item) => (
              <FooterLink
                key={item}
                href={`/all-products?category=${encodeURIComponent(item)}`}
                label={item}
              />
            ))}
            <Link
              href="/all-products"
              className="block pt-1 text-sm font-medium text-[var(--brand-700)] transition hover:opacity-80"
            >
              Tout le catalogue →
            </Link>
          </FooterColumn>

          <FooterColumn title="Raccourcis">
            {footerQuickLinks.map((item) => (
              <FooterLink key={item.label} href={item.href} label={item.label} />
            ))}
          </FooterColumn>

          <FooterColumn title="Infos utiles">
            <FooterText text="Paiement par tranche sur certaines offres étudiantes" />
            <FooterText text="Livraison selon disponibilité" />
            <FooterText text="Service client réactif" />
            <FooterText text="Garantie selon les produits" />
          </FooterColumn>

          <div className="lg:text-right">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-green-500/60 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-green-50 hover:text-green-700"
            >
              <FaWhatsapp className="h-4 w-4 text-green-600" />
              Discuter sur WhatsApp
            </a>
            <p className="mt-6 text-2xl font-semibold text-slate-950">{WHATSAPP_NUMBER_DISPLAY}</p>
            <p className="mt-1 text-xs text-slate-500">Lun – Sam, 8h à 19h</p>
          </div>
        </div>

        {/* Bandeau securite + paiements : badges reels sur pastilles blanches (style Alibaba) */}
        <div className="flex flex-col gap-4 border-b border-slate-200 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <SecurityBadge icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />} label="Paiement sécurisé Kkiapay" />
            <SecurityBadge icon={<LockKeyhole className="h-4 w-4 text-emerald-600" />} label="Données protégées (SSL)" />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* MTN MoMo : jaune officiel, texte navy */}
            <PaymentChip>
              <span className="flex h-full items-center gap-1.5 rounded bg-[#FFCC00] px-2">
                <span className="text-[11px] font-extrabold tracking-tight text-[#004F71]">MTN</span>
                <span className="text-[11px] font-bold italic text-[#004F71]">MoMo</span>
              </span>
            </PaymentChip>
            {/* Moov Money : bleu et orange officiels */}
            <PaymentChip>
              <span className="text-[11px] font-extrabold text-[#0060A9]">
                moov <span className="text-[#F39200]">money</span>
              </span>
            </PaymentChip>
            {/* Celtiis Cash */}
            <PaymentChip>
              <span className="text-[11px] font-extrabold text-[#00A5A8]">
                celtiis <span className="font-bold text-slate-700">cash</span>
              </span>
            </PaymentChip>
            {/* Visa : marque officielle */}
            <PaymentChip>
              <SiVisa className="h-6 w-10 text-[#1A1F71]" title="Visa" />
            </PaymentChip>
            {/* Mastercard : les deux cercles officiels */}
            <PaymentChip>
              <svg viewBox="0 0 36 22" className="h-5 w-8" aria-label="Mastercard" role="img">
                <circle cx="13" cy="11" r="10" fill="#EB001B" />
                <circle cx="23" cy="11" r="10" fill="#F79E1B" />
                <path d="M18 3.2a10 10 0 0 1 0 15.6 10 10 0 0 1 0-15.6z" fill="#FF5F00" />
              </svg>
            </PaymentChip>
            <PaymentChip>
              <span className="text-[11px] font-semibold text-slate-600">Espèces</span>
            </PaymentChip>
          </div>
        </div>

        {/* Marques principales : vrais logos vectoriels */}
        <div className="border-b border-slate-200 py-5">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Nos marques principales
            </span>
            <SiSamsung className="h-5 w-14" title="Samsung" />
            <SiApple className="h-5 w-5" title="Apple" />
            <SiHp className="h-6 w-6" title="HP" />
            <SiDell className="h-6 w-6" title="Dell" />
            <SiLenovo className="h-5 w-16" title="Lenovo" />
            <SiAsus className="h-5 w-14" title="Asus" />
            <SiLg className="h-6 w-12" title="LG" />
            <SiXiaomi className="h-5 w-5" title="Xiaomi" />
            <SiSony className="h-5 w-14" title="Sony" />
            <SiHuawei className="h-6 w-6" title="Huawei" />
          </div>
        </div>

        {/* Barre legale : liens separes par des points, copyright a droite */}
        <div className="flex flex-col items-center gap-3 py-6 text-sm text-slate-500 md:flex-row md:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
            <Link href="/privacy-policy" className="transition hover:text-slate-900">
              Politique de confidentialité
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/cookies" className="transition hover:text-slate-900">
              Cookies
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/contact" className="transition hover:text-slate-900">
              Contact
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Plawimadd Group — Tous droits réservés</p>
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

/* Pastille blanche bordee, comme les badges de paiement Alibaba */
function PaymentChip({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="inline-flex h-8 items-center justify-center rounded-md px-2">
      {children}
    </span>
  );
}

function SecurityBadge({ icon, label }: { icon: React.ReactNode; label: string }): React.ReactElement {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 shadow-sm">
      {icon}
      {label}
    </span>
  );
}
