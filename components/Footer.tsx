// components/Footer.tsx
'use client'; // Client Component (Next.js 15 compatible)

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { assets } from "@/assets/assets";
import {
  FaHome,
  FaTags,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaMapMarkerAlt,
  FaFacebook,
  FaInstagram,
} from "react-icons/fa";
import { AiFillFileText } from "react-icons/ai";
import { SiTiktok } from "react-icons/si";

const fixedCategories: string[] = [
  "Écouteurs",
  "Télévisions",
  "Téléphones",
  "Accessoires",
  "Ordinateurs",
];

const logoWidth = 600;
const logoHeight = 150;

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-300 rounded-t-xl shadow-lg">
      <div className="container mx-auto p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {/* Logo + Présentation */}
          <div className="flex flex-col items-start space-y-0">
            <Image
              className="h-auto w-44 rounded-lg shadow-lg transition-transform duration-300 transform hover:scale-105 md:w-56"
              src={assets.logo as StaticImageData}
              alt="Company Logo"
              width={logoWidth}
              height={logoHeight}
              priority
            />
            <p className="text-sm leading-relaxed">
              Plawimadd Group vous inspire et simplifie votre quotidien, avec des produits fiables et accessibles pour répondre à tous vos besoins.
            </p>
            <div className="flex space-x-4 mt-4">
              <SocialLink href="https://www.facebook.com/share/g/16fq7NamkG/" icon={<FaFacebook />} label="Facebook" />
              <SocialLink href="https://www.tiktok.com/@plawimadd/video/7479513419507404037" icon={<SiTiktok />} label="TikTok" />
              <SocialLink href="https://www.instagram.com/plawimadd?igsh=MXR4NHJvcW9zdXY3" icon={<FaInstagram />} label="Instagram" />
            </div>
          </div>

          {/* Navigation */}
          <FooterSection title="Navigation">
            <FooterLink href="/" icon={<FaHome />} label="Accueil" />
            <FooterLink href="/offers" icon={<FaTags />} label="Offres" />
            <FooterLink href="/all-products" icon={<FaHome />} label="Boutique" />
            <FooterLink href="/contact" icon={<FaPhone />} label="Contactez-nous" />
            <FooterLink href="/privacy-policy" icon={<AiFillFileText />} label="Politique de confidentialité" />
          </FooterSection>

          {/* Catégories */}
          <FooterSection title="Catégories">
            {fixedCategories.map((category) => (
              <FooterLink
                key={category}
                href={`/all-products?category=${encodeURIComponent(category)}`}
                icon={<FaTags />}
                label={category}
              />
            ))}
          </FooterSection>

          {/* Contact */}
          <FooterSection title="Nous contacter">
            <ContactInfo icon={<FaMapMarkerAlt />} text="Abomey Calavi en face du Collège Bakhita, Bénin" />
            <ContactInfo icon={<FaPhone />} text="+(229) 0197747178" tel />
            <ContactInfo icon={<FaPhone />} text="+(229) 0197918000" tel />
            <ContactInfo icon={<FaPhone />} text="+(229) 0148232681" tel />
            <ContactInfo icon={<FaEnvelope />} text="plawimaddgroup1beninbranch@gmail.com" email />
            <ContactInfo icon={<FaClock />} text="Lundi-Samedi: 09h-21h" />
          </FooterSection>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-gray-900/80 py-4 pt-0 rounded-b-lg text-center">
        <p className="text-gray-500 text-sm">
          Développé par Tiburce & Jean. &copy; {new Date().getFullYear()} Plawimadd Group. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

function FooterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center text-gray-400 hover:text-blue-400 transition-colors capitalize">
        <span className="mr-3 text-blue-400">{icon}</span>
        {label}
      </Link>
    </li>
  );
}

function ContactInfo({
  icon,
  text,
  tel,
  email,
}: {
  icon: React.ReactNode;
  text: string;
  tel?: boolean;
  email?: boolean;
}) {
  if (tel) {
    return (
      <div className="flex items-center">
        <span className="mr-3 text-blue-400 flex-shrink-0">{icon}</span>
        <a href={`tel:${text.replace(/\s+/g, '')}`} className="hover:text-blue-400 transition-colors">
          {text}
        </a>
      </div>
    );
  }
  if (email) {
    return (
      <div className="flex items-center">
        <span className="mr-3 text-blue-400 flex-shrink-0">{icon}</span>
        <a href={`mailto:${text}`} className="hover:text-blue-400 transition-colors">
          {text}
        </a>
      </div>
    );
  }
  return (
    <div className="flex items-start">
      <span className="mt-1 mr-3 text-blue-400 flex-shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-gray-400 hover:text-blue-400 transition-colors"
    >
      <span className="text-2xl">{icon}</span>
    </a>
  );
}
