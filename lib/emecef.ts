// lib/emecef.ts
// Intégration de l'API e-MECeF / SFE-MCF de la DGI Bénin (facture normalisée).
//
// Contrat officiel (https://developper.impots.bj/sygmef-emcf) :
//   - Auth : header "Authorization: Bearer <token>"
//   - POST /api/invoice                → crée un brouillon, renvoie { uid }
//   - PUT  /api/invoice/{uid}/confirm  → confirme, renvoie NIM/QR/compteurs/date
//   - GET  /api/invoice                → statut du service
//   - GET  /api/info/{status|taxGroups|invoiceTypes|paymentTypes} → référentiels
//
// La réponse de confirmation n'a pas un schéma 100 % figé selon les versions :
// on stocke toujours la réponse brute et on extrait les champs de façon défensive.

import prisma from '@/lib/prisma';

export type EmecefEnvironment = 'TEST' | 'PROD';
export type EmecefInvoiceType = 'FV' | 'FA' | 'EV' | 'EA';
export type EmecefTaxGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const BASE_URLS: Record<EmecefEnvironment, string> = {
  TEST: 'https://developper.impots.bj/sygmef-emcf',
  PROD: 'https://sygmef.impots.bj/emcf',
};

// Groupes de taxe e-MECeF (référence : manuel DGI). Le libellé sert au PDF.
export const TAX_GROUP_LABELS: Record<EmecefTaxGroup, string> = {
  A: 'A - Exonéré',
  B: 'B - Taux normal 18%',
  C: 'C - Taxe spécifique',
  D: 'D - Exportation (0%)',
  E: 'E - Régime TPS',
  F: 'F - Taux réduit',
};

export interface EmecefConfig {
  enabled: boolean;
  environment: EmecefEnvironment;
  token: string;
  ifu: string;
  defaultTaxGroup: EmecefTaxGroup;
  aib: string | null; // 'A' | 'B' | null
  autoNormalizeOnline: boolean; // normaliser automatiquement les paiements du site
  baseUrl: string;
}

export interface EmecefItemInput {
  name: string;
  price: number; // prix unitaire TTC
  quantity: number;
  taxGroup?: EmecefTaxGroup;
}

export interface EmecefClientInput {
  name?: string | null;
  ifu?: string | null;
  contact?: string | null;
  address?: string | null;
}

export interface EmecefInvoiceInput {
  type: EmecefInvoiceType;
  operatorName: string;
  client?: EmecefClientInput;
  items: EmecefItemInput[];
  reference?: string | null; // uid de la facture d'origine (pour un avoir FA/EA)
}

export interface EmecefConfirmResult {
  uid: string;
  nim: string | null;
  counters: string | null;
  ni: string | null;
  codeMecef: string | null;
  qrCode: string | null;
  dateTime: string | null;
  raw: unknown;
}

export class EmecefError extends Error {
  code?: string;
  status?: number;
  raw?: unknown;
  constructor(message: string, opts?: { code?: string; status?: number; raw?: unknown }) {
    super(message);
    this.name = 'EmecefError';
    this.code = opts?.code;
    this.status = opts?.status;
    this.raw = opts?.raw;
  }
}

const SETTING_KEYS = {
  enabled: 'emecef.enabled',
  environment: 'emecef.environment',
  token: 'emecef.token',
  ifu: 'emecef.ifu',
  defaultTaxGroup: 'emecef.defaultTaxGroup',
  aib: 'emecef.aib',
  autoNormalizeOnline: 'emecef.autoNormalizeOnline',
} as const;

/**
 * Charge la configuration e-MECeF depuis les réglages (table site_settings),
 * avec repli sur les variables d'environnement pour les valeurs sensibles.
 */
export async function getEmecefConfig(): Promise<EmecefConfig> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Object.values(SETTING_KEYS) } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  const environment: EmecefEnvironment =
    (map[SETTING_KEYS.environment] || process.env.EMECEF_ENV || 'TEST').toUpperCase() === 'PROD'
      ? 'PROD'
      : 'TEST';

  const token = (map[SETTING_KEYS.token] || process.env.EMECEF_TOKEN || '').trim();
  const ifu = (map[SETTING_KEYS.ifu] || process.env.EMECEF_IFU || '').trim();
  const aibRaw = (map[SETTING_KEYS.aib] || '').trim().toUpperCase();

  const defaultTaxGroup = ((map[SETTING_KEYS.defaultTaxGroup] || 'B').trim().toUpperCase() as EmecefTaxGroup);

  return {
    enabled: map[SETTING_KEYS.enabled] === 'true',
    environment,
    token,
    ifu,
    defaultTaxGroup: (['A', 'B', 'C', 'D', 'E', 'F'].includes(defaultTaxGroup) ? defaultTaxGroup : 'B'),
    aib: aibRaw === 'A' || aibRaw === 'B' ? aibRaw : null,
    autoNormalizeOnline: map[SETTING_KEYS.autoNormalizeOnline] === 'true',
    baseUrl: BASE_URLS[environment],
  };
}

/** Vérifie que la config est exploitable (token + ifu). Lève une EmecefError sinon. */
export function assertUsable(config: EmecefConfig): void {
  if (!config.enabled) {
    throw new EmecefError("La normalisation e-MECeF est désactivée dans les réglages.", { code: 'DISABLED' });
  }
  if (!config.token) {
    throw new EmecefError("Jeton API e-MECeF manquant (réglages ou variable d'environnement EMECEF_TOKEN).", { code: 'NO_TOKEN' });
  }
  if (!config.ifu) {
    throw new EmecefError("IFU émetteur manquant dans les réglages e-MECeF.", { code: 'NO_IFU' });
  }
}

async function emecefFetch(
  config: EmecefConfig,
  path: string,
  method: 'GET' | 'POST' | 'PUT',
  body?: unknown,
): Promise<{ status: number; data: unknown }> {
  const url = `${config.baseUrl}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch (err) {
    throw new EmecefError(`Connexion à l'API e-MECeF impossible : ${(err as Error).message}`, { code: 'NETWORK' });
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text };
    }
  }

  if (!res.ok) {
    const d = (data ?? {}) as Record<string, unknown>;
    throw new EmecefError(
      (d.errorDesc as string) || (d.message as string) || `Erreur e-MECeF HTTP ${res.status}`,
      { code: (d.errorCode as string) || String(res.status), status: res.status, raw: data },
    );
  }

  return { status: res.status, data };
}

function pick<T = string>(obj: Record<string, unknown>, keys: string[]): T | null {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k] as T;
  }
  return null;
}

/** Construit le corps de requête POST /api/invoice conforme au SDK e-MCF. */
export function buildInvoicePayload(config: EmecefConfig, input: EmecefInvoiceInput): Record<string, unknown> {
  const items = input.items.map((it) => ({
    name: it.name.slice(0, 250),
    price: Math.round(it.price),
    quantity: it.quantity,
    taxGroup: it.taxGroup || config.defaultTaxGroup,
  }));

  const payload: Record<string, unknown> = {
    ifu: config.ifu,
    type: input.type,
    items,
    operator: { name: input.operatorName || 'Vendeur' },
  };

  if (config.aib) payload.aib = config.aib;

  const client = input.client;
  if (client && (client.name || client.ifu || client.contact || client.address)) {
    payload.client = {
      ...(client.ifu ? { ifu: client.ifu } : {}),
      ...(client.name ? { name: client.name } : {}),
      ...(client.contact ? { contact: client.contact } : {}),
      ...(client.address ? { address: client.address } : {}),
    };
  }

  if (input.reference) payload.reference = input.reference;

  return payload;
}

/** GET /api/invoice — statut du service (contrôle de connectivité + token). */
export async function checkStatus(config: EmecefConfig): Promise<unknown> {
  assertUsable(config);
  const { data } = await emecefFetch(config, '/api/invoice', 'GET');
  return data;
}

/** POST /api/invoice — crée un brouillon, renvoie l'uid. */
export async function createDraft(
  config: EmecefConfig,
  input: EmecefInvoiceInput,
): Promise<{ uid: string; raw: unknown; payload: Record<string, unknown> }> {
  assertUsable(config);
  const payload = buildInvoicePayload(config, input);
  const { data } = await emecefFetch(config, '/api/invoice', 'POST', payload);
  const d = (data ?? {}) as Record<string, unknown>;
  const uid = pick(d, ['uid', 'id']);
  if (!uid) {
    throw new EmecefError("Réponse e-MECeF sans 'uid' à la création du brouillon.", { code: 'NO_UID', raw: data });
  }
  return { uid, raw: data, payload };
}

/** PUT /api/invoice/{uid}/confirm — finalise et récupère les éléments normalisés. */
export async function confirmInvoice(config: EmecefConfig, uid: string): Promise<EmecefConfirmResult> {
  assertUsable(config);
  const { data } = await emecefFetch(config, `/api/invoice/${encodeURIComponent(uid)}/confirm`, 'PUT');
  const d = (data ?? {}) as Record<string, unknown>;

  return {
    uid,
    nim: pick(d, ['nim', 'nimMecef', 'machineId']),
    counters: pick(d, ['counters', 'counter', 'compteurs']),
    ni: pick(d, ['ni', 'invoiceNumber', 'numero']),
    codeMecef: pick(d, ['codeMECeFDGI', 'codeMecefDgi', 'codeMecef', 'signature', 'code']),
    qrCode: pick(d, ['qrCode', 'qrcode', 'qr']),
    dateTime: pick(d, ['dateTime', 'datetime', 'date', 'invoiceDate']),
    raw: data,
  };
}

/**
 * Orchestration haut niveau : crée le brouillon puis le confirme.
 * Retourne les éléments normalisés + les payloads bruts pour traçabilité.
 */
export async function createAndConfirm(
  config: EmecefConfig,
  input: EmecefInvoiceInput,
): Promise<{ confirm: EmecefConfirmResult; requestPayload: Record<string, unknown>; draftRaw: unknown }> {
  const draft = await createDraft(config, input);
  const confirm = await confirmInvoice(config, draft.uid);
  return { confirm, requestPayload: draft.payload, draftRaw: draft.raw };
}
