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
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col px-4 pb-12 pt-8 md:px-6">
        {/* Hero Section - Split Layout similar to popup */}
        <section className="pb-6">
          <div className="grid gap-6 bg-white border border-slate-150 p-6 rounded-[2px] shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
            
            {/* Left Content Column */}
            <div className="flex flex-col justify-between p-2 lg:p-4 text-left">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                  Plawimadd Group
                </span>
                <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-3.5xl max-w-[18ch]">
                  S&apos;équiper pour ses études, en toute sérénité.
                </h1>
                <p className="mt-4 max-w-[54ch] text-xs leading-6 text-slate-500 font-medium">
                  Nous facilitons l&apos;accès au matériel informatique et technologique pour les étudiants. Bénéficiez de conditions de paiement souples : réglez 50% aujourd&apos;hui et étalez le solde sur deux mensualités fixes de 25%.
                </p>

                <div className="mt-6 border border-slate-100 bg-slate-50 p-4 rounded-[2px]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                    En pratique :
                  </p>
                  <div className="mt-3.5 space-y-2.5">
                    {offerPoints.map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <span className="text-red-500 font-bold text-xs shrink-0">★</span>
                        <p className="text-xs leading-5 text-slate-600 font-semibold">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link
                  href="/all-products"
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold transition rounded-[2px]"
                >
                  Voir le catalogue
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 text-xs font-bold transition rounded-[2px]"
                >
                  Soumettre un dossier
                </button>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2.5 text-xs font-bold transition rounded-[2px]"
                >
                  Demander conseil
                </Link>
              </div>

              {/* Status info if request exists */}
              {latestRequest ? (
                <div className="mt-6 border-t border-slate-100 pt-4 text-left">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    Statut de votre demande :
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      latestRequest.status === 'APPROVED' ? 'bg-green-500' : latestRequest.status === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <p className="text-xs font-bold text-slate-800">
                      {latestRequest.status === 'APPROVED'
                        ? 'Dossier approuvé'
                        : latestRequest.status === 'REJECTED'
                          ? 'Dossier refusé'
                          : 'Dossier en cours de vérification'}
                    </p>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-5 text-slate-500 font-medium">
                    {latestRequest.status === 'APPROVED'
                      ? 'Votre plan de paiement par tranche en 3 fois (50%, 25%, 25%) est activé et disponible lors du passage de votre commande.'
                      : latestRequest.status === 'REJECTED'
                        ? 'Votre demande n&apos;a pas pu être validée. Vous pouvez soumettre un nouveau justificatif ou contacter l&apos;assistance.'
                        : 'Notre équipe vérifie actuellement vos documents de scolarité pour activer votre plan de paiement.'}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Right Visual Image Column */}
            <div className="relative min-h-[300px] lg:min-h-auto overflow-hidden rounded-[2px]">
              <Image
                src="/images/offer_classy.jpg"
                alt="Offre étudiante Plawimadd Group"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute inset-x-5 bottom-5 rounded-[2px] bg-slate-950/75 p-5 backdrop-blur-sm border border-white/10 text-left">
                <span className="text-[9px] font-bold uppercase tracking-widest text-red-500">
                  Formule tranches
                </span>
                <p className="mt-1 text-sm font-extrabold text-white">
                  Équilibrez vos dépenses intelligemment
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-300 font-medium">
                  Réglez une partie maintenant et terminez sans stress sur les mois suivants, selon vos possibilités.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Advantages Cards Grid */}
        <section className="py-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="bg-white p-6 border border-slate-150 rounded-[2px] shadow-sm text-left flex flex-col justify-between"
                >
                  <div>
                    <div className="w-fit bg-slate-50 text-slate-800 p-2.5 rounded-[2px] border border-slate-100">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h2 className="mt-4.5 text-sm font-extrabold text-slate-900">{item.title}</h2>
                    <p className="mt-2 text-xs leading-5 text-slate-500 font-medium">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Details and Steps Split Section */}
        <section className="py-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            
            {/* Target Audience Card */}
            <div className="bg-white border border-slate-150 rounded-[2px] overflow-hidden shadow-sm flex flex-col justify-between text-left">
              <div className="relative h-[220px]">
                <Image
                  src="/images/background_etudiant2.jpg"
                  alt="Étudiant équipé"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
              </div>

              <div className="p-6">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                  Bénéficiaires
                </span>
                <h2 className="mt-1.5 text-lg font-extrabold text-slate-900">
                  À qui s&apos;adresse ce programme ?
                </h2>
                <p className="mt-2 text-xs leading-5 text-slate-500 font-medium">
                  Si vous êtes inscrit dans un établissement d&apos;enseignement secondaire ou supérieur et avez besoin d&apos;un ordinateur pour vos cours, vos projets de mémoire ou votre travail quotidien, vous êtes pleinement éligible à cette offre d&apos;accompagnement.
                </p>

                <div className="mt-5 flex items-start gap-2.5 bg-slate-50 p-4 rounded-[2px] border-l-2 border-slate-900">
                  <BookOpenCheck className="h-4.5 w-4.5 shrink-0 text-slate-800 mt-0.5" />
                  <p className="text-xs leading-5 text-slate-650 font-semibold">
                    Notre objectif est de vous permettre d&apos;acquérir du matériel fiable et de qualité professionnelle sans compromettre votre équilibre budgétaire.
                  </p>
                </div>
              </div>
            </div>

            {/* Steps Guide Card */}
            <div className="bg-white border border-slate-150 p-6 rounded-[2px] shadow-sm text-left flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                  Parcours
                </span>
                <h2 className="mt-1.5 text-lg font-extrabold text-slate-900">
                  Comment procéder en 3 étapes
                </h2>

                <div className="mt-6 space-y-4">
                  {steps.map((item) => (
                    <div
                      key={item.step}
                      className="flex gap-4 items-start border-l border-slate-200 bg-slate-50/50 p-4 rounded-[2px]"
                    >
                      <div className="text-xs font-extrabold text-slate-800 tracking-tight shrink-0 bg-white border border-slate-250 w-7 h-7 flex items-center justify-center rounded-[2px]">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-900">{item.title}</h3>
                        <p className="mt-1 text-[11px] leading-[17px] text-slate-500 font-medium">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col gap-2">
                <p className="text-[11px] leading-5 text-slate-500 font-medium">
                  Une question sur la validation ou les documents requis ? Contactez nos conseillers.
                </p>
                <Link
                  href="/contact"
                  className="mt-1 inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition rounded-[2px] w-fit"
                >
                  Contacter un conseiller
                  <ArrowRight className="h-3.5 w-3.5" />
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
