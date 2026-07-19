// lib/invoice-normalized.ts
// Rendu PDF d'une FACTURE NORMALISÉE e-MECeF (conforme DGI Bénin).
// Contient la ventilation des taxes par groupe et le bloc de normalisation
// (NIM, compteurs, code MECeF/DGI, date officielle, QR code).

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_WIDE_BASE64 } from './logo-base64';
import { numberToFrenchWords } from './invoice';
import { TAX_GROUP_LABELS, type EmecefTaxGroup } from './emecef';

// Taux de TVA par groupe de taxe (référence manuel e-MECeF).
const TAX_RATES: Record<EmecefTaxGroup, number> = {
  A: 0, // Exonéré
  B: 0.18, // Taux normal 18%
  C: 0, // Taxe spécifique (hors ventilation TVA)
  D: 0, // Exportation
  E: 0, // Régime TPS (pas de TVA)
  F: 0.10, // Taux réduit indicatif
};

export interface NormalizedInvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number; // TTC
  totalPrice: number; // TTC
  taxGroup: EmecefTaxGroup;
}

export interface NormalizedInvoiceSeller {
  name?: string;
  ifu: string;
  rccm?: string;
  address?: string;
  contact?: string;
}

export interface NormalizedInvoiceNormalization {
  type: string; // FV/FA/EV/EA
  nim?: string | null;
  counters?: string | null;
  ni?: string | null;
  codeMecef?: string | null;
  emecefDate?: Date | string | null;
  qrDataUrl?: string | null; // image du QR (data URL) pré-générée
  environment?: string;
}

export interface NormalizedInvoiceData {
  invoiceNumber: string;
  date: Date;
  currency?: string;
  customerName?: string | null;
  customerIFU?: string | null;
  customerContact?: string | null;
  customerAddress?: string | null;
  items: NormalizedInvoiceItem[];
  total: number;
  seller: NormalizedInvoiceSeller;
  normalization: NormalizedInvoiceNormalization;
}

function formatAmount(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

const TYPE_LABELS: Record<string, string> = {
  FV: 'FACTURE DE VENTE (NORMALISÉE)',
  EV: 'FACTURE DE VENTE EXONÉRÉE (NORMALISÉE)',
  FA: "FACTURE D'AVOIR (NORMALISÉE)",
  EA: "FACTURE D'AVOIR EXONÉRÉE (NORMALISÉE)",
};

export function generateNormalizedInvoicePDF(data: NormalizedInvoiceData): jsPDF {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // --- En-tête émetteur ---
  doc.addImage(LOGO_WIDE_BASE64, 'PNG', 15, 10, 55, 8.87);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`IFU : ${data.seller.ifu}`, 15, 24);
  if (data.seller.rccm) doc.text(`RCCM : ${data.seller.rccm}`, 15, 28.5);
  if (data.seller.name) doc.text(data.seller.name, 15, 33);

  // --- Titre / méta ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(TYPE_LABELS[data.normalization.type] || 'FACTURE NORMALISÉE', pageWidth - 15, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Facture # ${data.invoiceNumber}`, pageWidth - 15, 20, { align: 'right' });
  doc.text(`Date : ${formatDate(data.date)}`, pageWidth - 15, 25, { align: 'right' });
  if (data.normalization.environment === 'TEST') {
    doc.setTextColor(200, 130, 20);
    doc.setFont('helvetica', 'bold');
    doc.text('[ ENVIRONNEMENT DE TEST ]', pageWidth - 15, 30, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, 35.5, pageWidth - 15, 35.5);

  // --- Bloc émetteur (adresse/contact) ---
  autoTable(doc, {
    startY: 38,
    margin: { left: 15 },
    tableWidth: 120,
    body: [
      ['Adresse', data.seller.address || ''],
      ['Contact', data.seller.contact || ''],
    ],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1, textColor: [0, 0, 0] as [number, number, number] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 18 }, 1: { cellWidth: 102 } },
  });

  const sellerEndY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 50;

  // --- Bloc client ---
  autoTable(doc, {
    startY: Math.max(sellerEndY + 4, 45),
    margin: { left: 15, right: 15 },
    head: [['CLIENT']],
    body: [
      ['Nom', data.customerName || 'Client divers'],
      ['IFU', data.customerIFU || ''],
      ['Adresse', data.customerAddress || ''],
      ['Contact', data.customerContact || ''],
    ],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontStyle: 'bold', fontSize: 8.5, cellPadding: 2 },
    bodyStyles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0] as [number, number, number] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 20 }, 1: { cellWidth: 160 } },
    styles: { lineColor: [200, 200, 200] as [number, number, number], lineWidth: 0.1 },
  });

  const clientEndY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 80;

  // --- Articles ---
  autoTable(doc, {
    startY: clientEndY + 6,
    margin: { left: 15, right: 15 },
    head: [['#', 'Désignation', 'Gr.', 'P.U. TTC', 'Qté', 'Montant TTC']],
    body: data.items.map((item, index) => [
      index + 1,
      item.name,
      item.taxGroup,
      formatAmount(item.unitPrice),
      item.quantity,
      formatAmount(item.totalPrice),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontStyle: 'bold', fontSize: 8.5, cellPadding: 2.5 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: [0, 0, 0] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { halign: 'left' },
      2: { cellWidth: 12, halign: 'center' },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 34 },
    },
    styles: { lineColor: [200, 200, 200] as [number, number, number], lineWidth: 0.1 },
  });

  const itemsEndY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 130;

  // --- Ventilation des taxes par groupe ---
  const groups = new Map<EmecefTaxGroup, { ttc: number }>();
  for (const it of data.items) {
    const g = groups.get(it.taxGroup) || { ttc: 0 };
    g.ttc += it.totalPrice;
    groups.set(it.taxGroup, g);
  }

  const taxRows: (string | number)[][] = [];
  let totalHT = 0;
  let totalTax = 0;
  for (const [group, agg] of groups) {
    const rate = TAX_RATES[group] ?? 0;
    const ht = rate > 0 ? agg.ttc / (1 + rate) : agg.ttc;
    const tax = agg.ttc - ht;
    totalHT += ht;
    totalTax += tax;
    taxRows.push([
      TAX_GROUP_LABELS[group] || group,
      formatAmount(agg.ttc),
      formatAmount(ht),
      formatAmount(tax),
    ]);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('--- VENTILATION DES IMPÔTS ---', 15, itemsEndY + 8);

  autoTable(doc, {
    startY: itemsEndY + 10,
    margin: { left: 15 },
    tableWidth: 120,
    head: [['Groupe', 'Total TTC', 'Base HT', 'TVA']],
    body: taxRows,
    foot: [['TOTAL', formatAmount(data.total), formatAmount(totalHT), formatAmount(totalTax)]],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontStyle: 'bold', fontSize: 8, cellPadding: 2 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: [0, 0, 0] as [number, number, number] },
    footStyles: { fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { halign: 'left', cellWidth: 45 },
      1: { halign: 'right', cellWidth: 27 },
      2: { halign: 'right', cellWidth: 27 },
      3: { halign: 'right', cellWidth: 21 },
    },
    styles: { lineColor: [200, 200, 200] as [number, number, number], lineWidth: 0.1 },
  });

  const taxEndY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 160;

  // --- Total encadré ---
  const boxX = 145;
  const boxY = itemsEndY + 10;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(boxX, boxY, 50, 13);
  doc.rect(boxX + 0.6, boxY + 0.6, 48.8, 11.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`Total : ${formatAmount(data.total)}`, boxX + 25, boxY + 8.5, { align: 'center' });

  // --- Montant en lettres ---
  const wordsY = Math.max(taxEndY, boxY + 13) + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const phrase = `Arrêté la présente facture à la somme de ${numberToFrenchWords(data.total)} francs CFA TTC.`;
  const splitPhrase = doc.splitTextToSize(phrase, pageWidth - 30);
  doc.text(splitPhrase, 15, wordsY);

  // --- Bloc de normalisation (obligatoire DGI) ---
  const n = data.normalization;
  const normY = wordsY + (Array.isArray(splitPhrase) ? splitPhrase.length * 4 : 4) + 4;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  const normBoxH = 34;
  doc.rect(15, normY, pageWidth - 30, normBoxH);

  // QR à droite
  if (n.qrDataUrl) {
    try {
      doc.addImage(n.qrDataUrl, 'PNG', pageWidth - 15 - 30, normY + 2, 30, 30);
    } catch {
      /* QR invalide : on ignore silencieusement, le reste reste conforme */
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('FACTURE NORMALISÉE e-MECeF', 18, normY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const lines = [
    `NIM : ${n.nim || '—'}`,
    `Compteurs : ${n.counters || '—'}`,
    `N° normalisé : ${n.ni || '—'}`,
    `Code MECeF/DGI : ${n.codeMecef || '—'}`,
    `Date e-MECeF : ${n.emecefDate ? formatDate(new Date(n.emecefDate)) : '—'}`,
  ];
  lines.forEach((l, i) => {
    doc.text(doc.splitTextToSize(l, pageWidth - 30 - 36), 18, normY + 12 + i * 4.4);
  });

  // --- Pied de page ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Facture normalisée conforme à la réglementation DGI Bénin (e-MECeF).', pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
}
