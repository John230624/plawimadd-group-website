'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { assets } from "@/assets/assets";
import { ShieldCheck, LockKeyhole, Truck } from 'lucide-react';
import { FaFacebook, FaInstagram, FaWhatsapp, FaCcVisa, FaCcMastercard } from 'react-icons/fa';
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
} from 'react-icons/si';

import { footerCategories, footerQuickLinks } from './data';

const WHATSAPP_NUMBER_DISPLAY = '01 48 23 26 81';
const WHATSAPP_LINK = 'https://wa.me/2290148232681';

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
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {footerCategories.map((item) => (
                <FooterLink key={item} href="/all-products" label={item} />
              ))}
            </div>
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

        {/* Marques principales : televiseurs, ordinateurs, smartphones */}
        <div className="border-b border-slate-200 py-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Nos marques principales
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4 text-slate-400">
            <SiSamsung className="h-5 w-14" title="Samsung" />
            <SiApple className="h-5 w-5" title="Apple" />
            <SiHp className="h-6 w-6" title="HP" />
            <SiDell className="h-6 w-6" title="Dell" />
            <SiLenovo className="h-5 w-16" title="Lenovo" />
            <SiAsus className="h-5 w-14" title="Asus" />
            <SiLg className="h-6 w-12" title="LG" />
            <SiXiaomi className="h-5 w-5" title="Xiaomi" />
          </div>
        </div>

        {/* Paiements et garanties de securite */}
        <div className="grid gap-6 border-b border-slate-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Moyens de paiement
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                MTN MoMo
              </span>
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                Moov Money
              </span>
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Celtiis Cash
              </span>
              <FaCcVisa className="h-7 w-10 text-slate-500" title="Visa" />
              <FaCcMastercard className="h-7 w-10 text-slate-500" title="Mastercard" />
              <span className="inline-flex items-center rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Especes en boutique
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:items-end md:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Securite</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 md:justify-end">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Paiement securise Kkiapay
              </span>
              <span className="inline-flex items-center gap-1.5">
                <LockKeyhole className="h-4 w-4 text-emerald-600" />
                Donnees protegees
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-emerald-600" />
                Retrait en boutique
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/privacy-policy" className="transition hover:text-slate-900">
              Politique de confidentialite
            </Link>
            <Link href="/cookies" className="transition hover:text-slate-900">
              Cookies
            </Link>
            <Link href="/contact" className="transition hover:text-slate-900">
              Contact
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Plawimadd Group — Tous droits reserves</p>
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
