'use client';

import React, { ChangeEvent, FormEvent, useState } from 'react';
import {
  Clock3,
  Mail,
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
    value: 'Abomey-Calavi, en face du Collège Sainte Bakhita, Bénin',
    link: 'https://maps.app.goo.gl/9AQTrkay7GJqoGgMA',
  },
  {
    icon: Phone,
    title: 'Téléphone / WhatsApp',
    value: '+229 01 97 74 71 78',
    link: 'https://wa.me/2290197747178',
  },
  {
    icon: Mail,
    title: 'Email',
    value: 'plawimaddgroup1beninbranch@gmail.com',
    link: 'mailto:plawimaddgroup1beninbranch@gmail.com',
  },
  {
    icon: Clock3,
    title: 'Horaires',
    value: 'Lundi - Samedi, 09h - 21h',
    link: undefined,
  },
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

      toast.success('Message envoyé avec succès.');
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
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-0 pt-6 md:px-6 lg:px-8">
        {/* En-tête de page */}
        <section className="px-2 pb-2 md:px-0">
          <div className="px-3 py-4 md:px-0 md:py-0 text-left">
            <p className="text-sm text-slate-500">Accueil / Contact</p>
            <h1 className="mt-2 text-2.5xl font-extrabold tracking-tight text-slate-900">
              Contactez-nous
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Une question sur nos produits, un besoin de support ou d'accompagnement ? Notre équipe est à votre écoute.
            </p>
          </div>
        </section>

        {/* Section principale en 2 colonnes */}
        <section className="px-2 pb-2 pt-6 md:px-0">
          <div className="grid gap-6 px-3 py-4 md:px-0 md:py-0 lg:grid-cols-[1fr_400px]">
            {/* Colonne Gauche : Formulaire */}
            <div className="bg-white p-6 border border-slate-100 rounded-lg shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 text-left">
                  Envoyez-nous un message
                </h2>
                <p className="mt-1 text-xs text-slate-400 font-medium text-left">
                  Nous répondons généralement en moins de 24h.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Votre nom complet"
                    label="Nom complet"
                  />
                  <Field
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="votre.email@exemple.com"
                    label="Adresse email"
                  />
                </div>

                <Field
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Sujet de votre message"
                  label="Sujet"
                />

                <div className="flex flex-col gap-1.5 text-left">
                  <label htmlFor="message" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Votre message
                  </label>
                  <textarea
                    required
                    id="message"
                    rows={6}
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Comment pouvons-nous vous aider ? Expliquez-nous votre besoin en détail..."
                    className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:ring-4 focus:ring-slate-800/5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--brand-700)] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[var(--brand-800)] disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
              </form>
            </div>

            {/* Colonne Droite : Coordonnées et Carte */}
            <div className="space-y-6">
              {/* Coordonnées */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-left">
                  Nos coordonnées
                </h2>
                <div className="grid gap-3">
                  {contactCards.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="flex gap-4 items-start bg-white p-4 border border-slate-100 rounded-lg shadow-sm"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-700 border border-transparent">
                          <Icon className="h-5 w-5 text-slate-655" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-slate-900 leading-normal">
                            {item.link ? (
                              <a
                                href={item.link}
                                target={item.link.startsWith('mailto:') ? undefined : '_blank'}
                                rel={item.link.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                                className="hover:underline transition"
                              >
                                {item.value}
                              </a>
                            ) : (
                              item.value
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Localisation Interactive (Google Maps) */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-left">
                  Notre localisation
                </h2>
                <div className="overflow-hidden rounded-lg border border-slate-100 shadow-sm bg-white p-1">
                  <iframe
                    src="https://maps.google.com/maps?q=6.4363227,2.3394416&z=16&output=embed"
                    width="100%"
                    height="280"
                    className="rounded-md border-0 block"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localisation de Plawimadd Group"
                  ></iframe>
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
  label,
}: {
  type: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  label: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={name} className="text-xs font-bold text-slate-755 uppercase tracking-wider">
        {label}
      </label>
      <input
        required
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-md border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:ring-4 focus:ring-slate-800/5"
      />
    </div>
  );
}
