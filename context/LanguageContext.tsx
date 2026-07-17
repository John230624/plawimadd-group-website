'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Locale = 'fr' | 'en';

interface LanguageContextType {
  locale: Locale;
  toggleLocale: () => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  fr: {
    'sidebar.admin': 'Admin',
    'sidebar.dashboard': 'Tableau de bord',
    'sidebar.users': 'Utilisateurs',
    'sidebar.orders': 'Commandes',
    'sidebar.invoices': 'Factures',
    'sidebar.emecef': 'Facture normalisée',
    'sidebar.dashboard': 'Tableau de bord',
    'sidebar.cashRegister': 'Caisse',
    'sidebar.catalog': 'Catalogue',
    'sidebar.stock': 'Stock',
    'sidebar.stockMovements': 'Mouvements',
    'sidebar.usersSection': 'Utilisateurs',
    'sidebar.taxation': 'Fiscalité',
    'sidebar.products': 'Produits',
    'sidebar.categories': 'Catégories',
    'sidebar.characteristics': 'Caractéristiques',
    'sidebar.colors': 'Couleurs',
    'sidebar.stocks': 'Stocks',
    'sidebar.sales': 'Ventes',
    'sidebar.pos': 'Boutique',
    'sidebar.promotions': 'Promotions',
    'sidebar.reviews': 'Avis clients',
    'sidebar.payments': 'Journal paiements',
    'sidebar.students': 'Etudiants',
    'sidebar.studentRequests': 'Demandes etudiantes',
    'sidebar.studentInstallments': 'Echeanciers',
    'sidebar.customOffers': 'Offres personnaliser',
    'sidebar.content': 'Contenu',
    'sidebar.cmsPages': 'Pages CMS',
    'sidebar.importExport': 'Import / Export',
    'sidebar.config': 'Configuration',
    'sidebar.settings': 'Paramètres',
    'sidebar.reports': 'Rapports',
    'sidebar.roles': 'Rôles & Permissions',
    'sidebar.activityLog': 'Suivi',
    'sidebar.trash': 'Corbeille',
    'sidebar.search': 'Rechercher...',
    'theme.dark': 'Mode sombre',
    'theme.light': 'Mode clair',
    'lang.french': 'Français',
    'lang.english': 'English',
    'help.title': 'Aide & Support',
    'help.description': 'Besoin d\'aide ? Consultez les ressources ci-dessous.',
    'help.contact': 'Nous contacter',
    'help.contactDesc': 'Envoyez-nous un message via notre formulaire de contact.',
    'help.faq': 'Questions fréquentes',
    'help.faqDesc': 'Consultez notre FAQ pour des réponses rapides.',
    'help.supportEmail': 'Email support',
    'profile.settings': 'Paramètres',
    'profile.theme': 'Thème',
    'profile.language': 'Langue',
    'profile.help': 'Aide',
    'profile.home': 'Accueil',
    'profile.logout': 'Déconnexion',
  },
  en: {
    'sidebar.admin': 'Admin',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.users': 'Users',
    'sidebar.orders': 'Orders',
    'sidebar.invoices': 'Invoices',
    'sidebar.emecef': 'Normalized invoice',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.cashRegister': 'Cash register',
    'sidebar.catalog': 'Catalog',
    'sidebar.stock': 'Stock',
    'sidebar.stockMovements': 'Movements',
    'sidebar.usersSection': 'Users',
    'sidebar.taxation': 'Taxation',
    'sidebar.products': 'Products',
    'sidebar.categories': 'Categories',
    'sidebar.characteristics': 'Characteristics',
    'sidebar.colors': 'Colors',
    'sidebar.stocks': 'Stock',
    'sidebar.sales': 'Sales',
    'sidebar.pos': 'Shop',
    'sidebar.promotions': 'Promotions',
    'sidebar.reviews': 'Reviews',
    'sidebar.payments': 'Payments log',
    'sidebar.students': 'Students',
    'sidebar.studentRequests': 'Student requests',
    'sidebar.studentInstallments': 'Installments',
    'sidebar.customOffers': 'Custom Offers',
    'sidebar.content': 'Content',
    'sidebar.cmsPages': 'CMS Pages',
    'sidebar.importExport': 'Import / Export',
    'sidebar.config': 'Configuration',
    'sidebar.settings': 'Settings',
    'sidebar.reports': 'Reports',
    'sidebar.roles': 'Roles & Permissions',
    'sidebar.activityLog': 'Activity log',
    'sidebar.trash': 'Trash',
    'sidebar.search': 'Search...',
    'theme.dark': 'Dark mode',
    'theme.light': 'Light mode',
    'lang.french': 'Français',
    'lang.english': 'English',
    'help.title': 'Help & Support',
    'help.description': 'Need help? Check out the resources below.',
    'help.contact': 'Contact us',
    'help.contactDesc': 'Send us a message via our contact form.',
    'help.faq': 'FAQ',
    'help.faqDesc': 'Check our FAQ for quick answers.',
    'help.supportEmail': 'Support email',
    'profile.settings': 'Settings',
    'profile.theme': 'Theme',
    'profile.language': 'Language',
    'profile.help': 'Help',
    'profile.home': 'Home',
    'profile.logout': 'Logout',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'plawimadd-locale';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('fr');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === 'fr' || stored === 'en') {
      setLocale(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale, mounted]);

  const toggleLocale = () => {
    setLocale((prev) => (prev === 'fr' ? 'en' : 'fr'));
  };

  const t = (key: string): string => {
    return translations[locale][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
