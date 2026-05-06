import { assets } from '@/assets/assets';
import {
  BadgeCheck,
  HeartHandshake,
  MessageCircleMore,
  Truck,
  WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StaticImageData } from 'next/image';

export interface WhyChooseUsItem {
  title: string;
  icon: LucideIcon;
}

export interface CatalogItem {
  title: string;
  image: string;
  widthClass: string;
}

export interface PromoBannerContent {
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  image: string;
}

export interface NewsletterContent {
  title: string;
  description: string;
  image: string;
}

export interface HomeShowcaseProduct {
  id: string;
  name: string;
  image: string;
  priceLabel: string;
  oldPriceLabel?: string;
  discountLabel?: string;
  availabilityLabel: string;
}

export const whyChooseUsItems: WhyChooseUsItem[] = [
  { title: 'Garantie sur une selection de produits', icon: BadgeCheck },
  { title: 'Verification avant validation de commande', icon: HeartHandshake },
  { title: 'Paiement et retour plus simples', icon: WalletCards },
  { title: 'Livraison rapide selon disponibilite', icon: Truck },
  { title: 'Des avis clients qui renforcent la confiance', icon: MessageCircleMore },
];

export const catalogItems: CatalogItem[] = [
  { title: 'Montres connectees', image: '/images/catalog/catalog-smartwatch.jpg', widthClass: 'w-[280px]' },
  { title: 'Ordinateurs', image: '/images/catalog/catalog-laptop.jpg', widthClass: 'w-[280px]' },
  { title: 'Televiseurs', image: '/images/catalog/catalog-tv.jpg', widthClass: 'w-[280px]' },
  { title: 'Casques audio', image: '/images/catalog/catalog-headphones.jpg', widthClass: 'w-[280px]' },
  { title: 'Machines a cafe', image: '/images/catalog/catalog-coffee-machine.jpg', widthClass: 'w-[240px]' },
  { title: 'Smartphones', image: '/images/catalog/catalog-smartphone.jpg', widthClass: 'w-[420px]' },
  { title: 'Consoles et gaming', image: '/images/catalog/catalog-gaming.jpg', widthClass: 'w-[260px]' },
  { title: 'Ecouteurs', image: '/images/catalog/catalog-earbuds.jpg', widthClass: 'w-[240px]' },
];

export const studentOfferBanner: PromoBannerContent = {
  eyebrow: 'Offres etudiantes',
  title: 'Des equipements utiles pour les etudes avec paiement par tranche.',
  description:
    'Ordinateurs, smartphones, montres et accessoires penses pour les etudiants, avec des modalites plus souples pour payer progressivement.',
  buttonLabel: 'Voir les offres',
  image: '/images/background_etudiant2.jpg',
};

export const giftIdeasBanner: PromoBannerContent = {
  eyebrow: 'Idees cadeaux',
  title: 'Besoin d une idee cadeau electronique qui marque vraiment ?',
  description:
    'Retrouvez des appareils utiles, beaux et faciles a offrir pour un anniversaire, une remise de diplome ou une attention speciale.',
  buttonLabel: 'Explorer',
  image: '/images/home/gift-banner.jpg',
};

export const newsletterContent: NewsletterContent = {
  title: 'Recevoir nos nouveautes, remises et offres speciales ?',
  description:
    'Laissez votre email pour etre informe des nouvelles offres, des campagnes et des bons plans etudiants de Plawimadd Group.',
  image: '/images/home/newsletter-handshake.jpg',
};

export const bestSellerShowcaseProducts: HomeShowcaseProduct[] = [
  {
    id: 'showcase-phone-1',
    name: 'Samsung Galaxy S23 256GB',
    image: '/images/samsung_s23phone_image.png',
    priceLabel: '589 000 FCFA',
    availabilityLabel: 'Disponible',
  },
  {
    id: 'showcase-laptop-1',
    name: 'MacBook Air 13 pouces',
    image: '/images/macbook_image.png',
    priceLabel: '865 000 FCFA',
    availabilityLabel: 'Disponible',
  },
  {
    id: 'showcase-watch-1',
    name: 'Montre connectee Venu',
    image: '/images/venu_watch_image.png',
    priceLabel: '189 000 FCFA',
    availabilityLabel: 'Disponible',
  },
  {
    id: 'showcase-headphone-1',
    name: 'Casque Bose QuietComfort',
    image: '/images/bose_headphone_image.png',
    priceLabel: '245 000 FCFA',
    availabilityLabel: 'Disponible',
  },
  {
    id: 'showcase-earbuds-1',
    name: 'AirPods Pro',
    image: '/images/apple_earphone_image.png',
    priceLabel: '169 000 FCFA',
    availabilityLabel: 'Disponible',
  },
];

export const studentOfferShowcaseProducts: HomeShowcaseProduct[] = [
  {
    id: 'student-phone-1',
    name: 'iPhone etudiant 128GB',
    image: '/images/samsung_s23phone_image.png',
    priceLabel: '429 000 FCFA',
    oldPriceLabel: '489 000 FCFA',
    discountLabel: '-12%',
    availabilityLabel: 'Disponible',
  },
  {
    id: 'student-laptop-1',
    name: 'MacBook Air pour les cours',
    image: '/images/macbook_image.png',
    priceLabel: '745 000 FCFA',
    oldPriceLabel: '829 000 FCFA',
    discountLabel: '-10%',
    availabilityLabel: 'Disponible',
  },
  {
    id: 'student-watch-1',
    name: 'Montre connectee Samsung',
    image: '/images/venu_watch_image.png',
    priceLabel: '159 000 FCFA',
    oldPriceLabel: '187 000 FCFA',
    discountLabel: '-15%',
    availabilityLabel: 'Disponible',
  },
  {
    id: 'student-earbuds-1',
    name: 'AirPods etudiant',
    image: '/images/apple_earphone_image.png',
    priceLabel: '139 000 FCFA',
    oldPriceLabel: '158 000 FCFA',
    discountLabel: '-12%',
    availabilityLabel: 'Disponible',
  },
  {
    id: 'student-headphone-1',
    name: 'Casque audio pour revisions',
    image: '/images/bose_headphone_image.png',
    priceLabel: '214 000 FCFA',
    oldPriceLabel: '246 000 FCFA',
    discountLabel: '-13%',
    availabilityLabel: 'Disponible',
  },
];

export const footerCategories = [
  'Ordinateurs',
  'Smartphones',
  'Montres connectees',
  'Audio',
  'Electromenager',
];

export const footerQuickLinks = [
  { label: 'Catalogue', href: '/all-products' },
  { label: 'Offres etudiantes', href: '/offer' },
  { label: 'Contact', href: '/contact' },
  { label: 'Confidentialite', href: '/privacy-policy' },
];

export const footerLogo: StaticImageData = assets.logo;
