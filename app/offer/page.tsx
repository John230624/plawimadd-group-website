'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CreditCard,
  GraduationCap,
  Laptop,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

import HomeFooter from '@/components/home/HomeFooter';
import StudentInstallmentRequestModal from '@/components/student/StudentInstallmentRequestModal';
import type { StudentInstallmentRequest } from '@/lib/types';

const advantages = [
  {
    icon: GraduationCap,
    title: 'Offres pensees pour les etudiants',
    text: "Des propositions utiles pour les cours, les projets, le memoire et le travail quotidien.",
  },
  {
    icon: CreditCard,
    title: 'Paiement par tranche',
    text: 'Une formule plus souple pour avancer sans etre bloque par un paiement unique.',
  },
  {
    icon: Laptop,
    title: 'Equipements vraiment pertinents',
    text: 'Ordinateurs, audio et accessoires choisis pour repondre a un besoin concret.',
  },
  {
    icon: BadgeCheck,
    title: 'Suivi simple et clair',
    text: "L'equipe vous accompagne pour comprendre l'offre et finaliser la bonne solution.",
  },
];

const steps = [
  {
    step: '01',
    title: 'Choisir le bon produit',
    text: "Nous partons de votre usage reel: bureautique, cours, creation, memoire ou travail freelance.",
  },
  {
    step: '02',
    title: 'Valider la formule',
    text: 'Nous verifions avec vous la formule de paiement par tranche la plus adaptee.',
  },
  {
    step: '03',
    title: 'Confirmer et suivre',
    text: 'Une fois la solution retenue, vous avancez avec plus de clarte et un meilleur confort.',
  },
];

const offerPoints = [
  'Possibilite de paiement en plusieurs etapes selon le produit.',
  'Orientation sur les references les plus pertinentes pour etudes et productivite.',
  'Accompagnement humain pour comprendre les modalites avant validation.',
];

export default function OfferPage(): React.ReactElement {
  const { status } = useSession();
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
  const [latestRequest, setLatestRequest] = React.useState<StudentInstallmentRequest | null>(null);

  React.useEffect(() => {
    const fetchRequests = async () => {
      if (status !== 'authenticated') {
        setLatestRequest(null);
        return;
      }

      try {
        const response = await axios.get('/api/student-installment');
        const requests = response.data?.requests || [];
        setLatestRequest(requests[0] || null);
      } catch (error) {
        console.error(error);
      }
    };

    fetchRequests();
  }, [status]);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-0 pt-8 md:px-6 lg:px-8">
        <section className="px-2 pb-2 md:px-0">
          <div className="grid gap-6 rounded-[2rem] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] md:p-6 lg:grid-cols-[1.04fr_0.96fr] lg:p-8">
            <div className="flex flex-col justify-center rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(237,244,253,0.88),rgba(255,255,255,0.98))] p-6 md:p-7">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand-700)]">
                Offres etudiantes
              </p>
              <h1 className="mt-4 max-w-[12ch] text-[2.45rem] font-semibold leading-[0.98] tracking-[-0.06em] text-slate-950 md:text-[3.35rem]">
                S&apos;equiper serieusement, sans se bloquer.
              </h1>
              <p className="mt-5 max-w-[62ch] text-sm leading-8 text-slate-500 md:text-[0.98rem]">
                Nous avons pense cette page pour les etudiants qui ont besoin d&apos;un materiel
                utile, fiable et presentable, avec une modalite de paiement par tranche plus
                accessible et plus realiste.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/all-products"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-700)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)]"
                >
                  Voir le catalogue
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-300)] px-6 py-3.5 text-sm font-medium text-slate-700 transition hover:bg-[rgba(191,219,254,0.18)] hover:text-[var(--brand-700)]"
                >
                  Demander des informations
                </Link>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Soumettre un dossier etudiant
                </button>
              </div>

              <div className="mt-8 rounded-[1.45rem] bg-white/92 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--brand-700)]">
                  En pratique
                </p>
                <div className="mt-4 space-y-3">
                  {offerPoints.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[var(--brand-500)]" />
                      <p className="text-sm leading-7 text-slate-500">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {latestRequest ? (
                <div className="mt-5 rounded-[1.45rem] border border-[rgba(148,163,184,0.14)] bg-white/92 p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--brand-700)]">
                    Statut de votre dossier
                  </p>
                  <p className="mt-2 text-[1.05rem] font-semibold text-slate-950">
                    {latestRequest.status === 'APPROVED'
                      ? 'Votre dossier etudiant est approuve.'
                      : latestRequest.status === 'REJECTED'
                        ? 'Votre dossier etudiant a ete refuse.'
                        : 'Votre dossier etudiant est en cours de verification.'}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    {latestRequest.status === 'APPROVED'
                      ? 'Vous pouvez maintenant utiliser le paiement par tranche depuis le panier, avec 50% au depart puis 25% et 25% sur les deux mois suivants.'
                      : latestRequest.status === 'REJECTED'
                        ? 'Vous pouvez soumettre un nouveau dossier plus complet si necessaire.'
                        : 'Notre equipe verifie votre justificatif avant d activer le plan fixe a 3 tranches dans le panier.'}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="relative min-h-[460px] overflow-hidden rounded-[1.8rem]">
              <Image
                src="/images/background_etudiant1.jpg"
                alt="Offre etudiante Plawimadd Group"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.42))]" />
              <div className="absolute inset-x-6 bottom-6 rounded-[1.5rem] bg-white/92 p-5 backdrop-blur md:p-6">
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--brand-700)]">
                  Paiement par tranche
                </p>
                <p className="mt-2 text-[1.18rem] font-semibold text-slate-950">
                  Une solution plus souple pour mieux repartir votre effort
                </p>
                <p className="mt-2 text-sm leading-7 text-white">
                  Nous adaptons la discussion autour du produit, de votre besoin et des
                  modalites possibles avant validation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-2 pb-2 pt-8 md:px-0">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {advantages.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[1.7rem] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
                >
                  <div className="w-fit rounded-2xl bg-[rgba(191,219,254,0.22)] p-3 text-[var(--brand-700)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-[1.2rem] font-semibold text-slate-950">{item.title}</h2>
                  <p className="mt-3 text-sm leading-8 text-slate-500">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="px-2 pb-2 pt-8 md:px-0">
          <div className="grid gap-6 lg:grid-cols-[0.98fr_1.02fr]">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
              <div className="relative h-[260px]">
                <Image
                  src="/images/background_etudiant2.jpg"
                  alt="Etudiant avec materiel"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.32))]" />
              </div>

              <div className="p-6 lg:p-8">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand-700)]">
                  A qui s&apos;adresse cette page ?
                </p>
                <h2 className="mt-3 text-[1.95rem] font-semibold tracking-[-0.05em] text-slate-950">
                  Aux etudiants qui veulent un choix intelligent
                </h2>
                <p className="mt-4 text-sm leading-8 text-slate-500">
                  Si vous avez besoin d&apos;un ordinateur pour les cours, d&apos;un casque pour
                  travailler, d&apos;accessoires utiles ou d&apos;un equipement plus fiable pour votre
                  quotidien, cette offre est pensee pour vous orienter proprement.
                </p>

                <div className="mt-7 rounded-[1.45rem] bg-[rgba(237,244,253,0.55)] p-5">
                  <div className="flex items-start gap-3">
                    <BookOpenCheck className="mt-1 h-5 w-5 shrink-0 text-[var(--brand-700)]" />
                    <p className="text-sm leading-7 text-slate-500">
                      L&apos;objectif n&apos;est pas seulement de vendre un produit, mais de proposer
                      une solution plus tenable et plus utile pour vos etudes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] lg:p-8">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--brand-700)]">
                Modalites
              </p>
              <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-slate-950">
                Comment cela se passe
              </h2>

              <div className="mt-8 space-y-5">
                {steps.map((item) => (
                  <div
                    key={item.step}
                    className="grid gap-4 rounded-[1.45rem] bg-[rgba(248,250,252,0.82)] p-5 md:grid-cols-[68px_1fr]"
                  >
                    <div className="text-[1.2rem] font-semibold text-[var(--brand-700)]">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-[1.08rem] font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-500">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[1.55rem] border border-[rgba(148,163,184,0.14)] bg-[linear-gradient(180deg,rgba(237,244,253,0.7),rgba(255,255,255,1))] p-5 md:p-6">
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--brand-700)]">
                  Besoin de verifier votre cas ?
                </p>
                <p className="mt-3 text-sm leading-8 text-slate-500">
                  Contactez-nous pour discuter du produit vise, de votre usage et de la
                  possibilite de paiement par tranche avant de vous engager.
                </p>

                <Link
                  href="/contact"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-700)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)]"
                >
                  Contacter l&apos;equipe
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />

      <StudentInstallmentRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={(request) => setLatestRequest(request)}
      />
    </div>
  );
}
