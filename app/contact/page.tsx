'use client';

import React, { ChangeEvent, FormEvent, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Clock3,
  Headphones,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';
import { toast } from 'react-toastify';

import HomeFooter from '@/components/home/HomeFooter';

interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const initialForm: ContactFormState = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

const contactCards = [
  {
    icon: MapPin,
    title: 'Adresse',
    value: 'Abomey-Calavi, en face du College Bakhita',
  },
  {
    icon: Phone,
    title: 'Telephone',
    value: '+(229) 0197747178',
  },
  {
    icon: Clock3,
    title: 'Horaires',
    value: 'Lundi - Samedi, 09h - 21h',
  },
  {
    icon: Headphones,
    title: 'Support',
    value: 'Questions produits, suivi de commande, paiement par tranche.',
  },
];

const supportHighlights = [
  'Reponse rapide pour vos demandes de produits et disponibilites.',
  'Accompagnement sur les offres etudiantes et les paiements par tranche.',
  'Orientation claire avant achat et suivi apres commande.',
];

export default function ContactPage(): React.ReactElement {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible d'envoyer votre message.");
      }

      toast.success('Message envoye avec succes.');
      setForm(initialForm);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-0 pt-8 md:px-6 lg:px-8">
        <section className="px-2 pb-2 md:px-0">
          <div className="grid gap-6 rounded-[2rem] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] md:p-6 lg:grid-cols-[1.02fr_0.98fr] lg:p-8">
            <div className="flex flex-col justify-center rounded-[1.7rem] bg-[linear-gradient(180deg,rgba(237,244,253,0.86),rgba(255,255,255,0.98))] p-6 md:p-7">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand-700)]">
                Contact
              </p>
              <h1 className="mt-4 max-w-[11ch] text-[2.5rem] font-semibold leading-[0.98] tracking-[-0.06em] text-slate-950 md:text-[3.35rem]">
                Restons proches de votre besoin.
              </h1>
              <p className="mt-5 max-w-[58ch] text-sm leading-8 text-slate-500 md:text-[0.98rem]">
                Pour une demande produit, un suivi de commande, une orientation achat ou une
                offre etudiante, nous vous repondons avec une approche claire, utile et rapide.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {contactCards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.4rem] bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-[rgba(191,219,254,0.22)] p-3 text-[var(--brand-700)]">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                          <p className="mt-2 text-sm leading-7 text-slate-500">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative min-h-[420px] overflow-hidden rounded-[1.8rem]">
              <Image
                src="/images/home/newsletter-handshake.jpg"
                alt="Accompagnement client Plawimadd Group"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.1),rgba(15,23,42,0.42))]" />
              <div className="absolute inset-x-6 bottom-6 rounded-[1.5rem] bg-white/92 p-5 backdrop-blur md:p-6">
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--brand-700)]">
                  Support utile
                </p>
                <p className="mt-2 text-[1.18rem] font-semibold text-slate-950">
                  Une equipe qui vous oriente sans vous compliquer le parcours
                </p>

                <div className="mt-4 space-y-3">
                  {supportHighlights.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-2.5 w-2.5 rounded-full bg-white" />
                      <p className="text-sm leading-7 text-white">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-2 pb-2 pt-8 md:px-0">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.94fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] lg:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand-700)]">
                    Formulaire
                  </p>
                  <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-slate-950">
                    Envoyez-nous votre message
                  </h2>
                </div>
                <div className="hidden rounded-full bg-[rgba(191,219,254,0.2)] px-4 py-2 text-sm font-medium text-[var(--brand-700)] md:inline-flex">
                  Reponse rapide
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Votre nom"
                  />
                  <Field
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Votre email"
                  />
                </div>

                <Field
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Sujet"
                />

                <textarea
                  required
                  rows={7}
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Expliquez-nous votre besoin"
                  className="w-full rounded-[1.15rem] border border-[rgba(148,163,184,0.2)] bg-[rgba(248,250,252,0.82)] px-4 py-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-300)] focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-700)] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)] disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
              </form>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
              <div className="relative h-[220px]">
                <Image
                  src="/images/hero-bg.jpg"
                  alt="Boutique Plawimadd Group"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.34))]" />
                <div className="absolute inset-x-6 bottom-6 rounded-full bg-white/92 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur w-fit">
                  Abomey-Calavi, Benin
                </div>
              </div>

              <div className="p-6 lg:p-8">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand-700)]">
                  Venir nous voir
                </p>
                <h2 className="mt-3 text-[1.95rem] font-semibold tracking-[-0.05em] text-slate-950">
                  Une adresse simple a trouver
                </h2>
                <p className="mt-4 text-sm leading-8 text-slate-500">
                  Nous sommes situes en face du College Bakhita. Vous pouvez aussi nous appeler
                  avant de passer pour verifier la disponibilite d&apos;un produit ou discuter
                  d&apos;une offre etudiante.
                </p>

                <div className="mt-7 rounded-[1.5rem] bg-[rgba(237,244,253,0.55)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Besoin d&apos;un retour rapide ?</p>
                      <p className="mt-2 text-sm leading-7 text-slate-500">
                        Appelez-nous ou ecrivez-nous pour avancer plus vite sur votre demande.
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[var(--brand-700)]" />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <InfoBadge label="Telephone" value="+(229) 0197747178" />
                  <InfoBadge label="Disponibilite" value="09h - 21h" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}

function Field({
  type,
  name,
  value,
  onChange,
  placeholder,
}: {
  type: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}): React.ReactElement {
  return (
    <input
      required
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-[1.15rem] border border-[rgba(148,163,184,0.2)] bg-[rgba(248,250,252,0.82)] px-4 py-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-300)] focus:bg-white"
    />
  );
}

function InfoBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="rounded-[1.15rem] border border-[rgba(148,163,184,0.12)] bg-white px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
