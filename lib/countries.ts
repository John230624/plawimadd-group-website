/**
 * Liste de pays desservis + utilitaires de correspondance (nom <-> code <-> drapeau).
 * Utilise par la navbar (adresse de livraison) et le carnet d'adresses.
 */
export interface CountryInfo {
  code: string; // Code ISO2 majuscule, ex: "BJ"
  iso: string; // Code ISO2 minuscule pour flagcdn, ex: "bj"
  name: string; // Nom affiche, ex: "Benin"
  dial: string; // Indicatif telephonique, ex: "+229"
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'BJ', iso: 'bj', name: 'Benin', dial: '+229' },
  { code: 'TG', iso: 'tg', name: 'Togo', dial: '+228' },
  { code: 'CI', iso: 'ci', name: "Cote d'Ivoire", dial: '+225' },
  { code: 'NG', iso: 'ng', name: 'Nigeria', dial: '+234' },
  { code: 'GH', iso: 'gh', name: 'Ghana', dial: '+233' },
  { code: 'SN', iso: 'sn', name: 'Senegal', dial: '+221' },
  { code: 'BF', iso: 'bf', name: 'Burkina Faso', dial: '+226' },
  { code: 'ML', iso: 'ml', name: 'Mali', dial: '+223' },
  { code: 'NE', iso: 'ne', name: 'Niger', dial: '+227' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .toLowerCase()
    .trim();
}

export function getCountryByCode(code?: string | null): CountryInfo | undefined {
  if (!code) return undefined;
  const target = normalize(code);
  return COUNTRIES.find((c) => normalize(c.code) === target);
}

export function getCountryByName(name?: string | null): CountryInfo | undefined {
  if (!name) return undefined;
  const target = normalize(name);
  return (
    COUNTRIES.find((c) => normalize(c.name) === target) ||
    COUNTRIES.find((c) => normalize(c.code) === target)
  );
}

export function resolveCountry(value?: string | null): CountryInfo | undefined {
  return getCountryByCode(value) || getCountryByName(value);
}
