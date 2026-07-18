// lib/ticket.ts
// Ticket de caisse pour imprimante thermique (58 mm ou 80 mm de large).
// Hauteur calculée dynamiquement selon le contenu. Si la vente possède une
// facture normalisée e-MECeF, les éléments obligatoires (NIM, compteurs, QR)
// sont imprimés sur le ticket.

import { jsPDF } from 'jspdf';

export type TicketWidth = 58 | 80;

export interface TicketItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface TicketNormalization {
  nim?: string | null;
  counters?: string | null;
  ni?: string | null;
  codeMecef?: string | null;
  qrDataUrl?: string | null;
  environment?: string;
}

export interface TicketData {
  width?: TicketWidth;
  companyName: string;
  companyIfu?: string | null;
  companyContact?: string | null;
  companyAddress?: string | null;
  invoiceNumber: string;
  date: Date;
  sellerName?: string | null;
  customerName?: string | null;
  items: TicketItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  remainingBalance: number;
  paymentMethod: string;
  normalization?: TicketNormalization | null;
}

function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'ESPECES',
  TRANSFER: 'VIREMENT',
  BANK_TRANSFER: 'VIREMENT',
  INSTALLMENT: 'CREDIT / TRANCHES',
  MOBILE_MONEY: 'MOBILE MONEY',
  CARD: 'CARTE',
};

export function generateTicketPDF(data: TicketData): jsPDF {
  const width = data.width ?? 80;
  const margin = width === 58 ? 3 : 5;
  const contentW = width - margin * 2;
  const baseFont = width === 58 ? 6.5 : 8;

  // Estimation de hauteur : généreuse, la page est rognée par l'imprimante.
  const qrH = data.normalization?.qrDataUrl ? 34 : 0;
  const estHeight = 60 + data.items.length * 8 + qrH + (data.normalization ? 26 : 0);
  const doc = new jsPDF({ unit: 'mm', format: [width, Math.max(estHeight, 90)] });

  let y = margin + 2;
  const center = width / 2;

  const line = () => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, width - margin, y);
    doc.setLineDashPattern([], 0);
    y += 2.5;
  };

  const text = (s: string, opts?: { bold?: boolean; size?: number; align?: 'left' | 'center' | 'right'; x?: number }) => {
    doc.setFont('courier', opts?.bold ? 'bold' : 'normal');
    doc.setFontSize(opts?.size ?? baseFont);
    const x = opts?.x ?? (opts?.align === 'center' ? center : opts?.align === 'right' ? width - margin : margin);
    const wrapped = doc.splitTextToSize(s, contentW);
    doc.text(wrapped, x, y, { align: opts?.align ?? 'left' });
    y += (Array.isArray(wrapped) ? wrapped.length : 1) * (opts?.size ?? baseFont) * 0.5;
  };

  // --- En-tête ---
  text(data.companyName.toUpperCase(), { bold: true, size: baseFont + 1.5, align: 'center' });
  if (data.companyAddress) text(data.companyAddress, { align: 'center' });
  if (data.companyContact) text(`Tel: ${data.companyContact}`, { align: 'center' });
  if (data.companyIfu) text(`IFU: ${data.companyIfu}`, { align: 'center' });
  y += 1;
  line();

  // --- Méta ---
  text(`Ticket: ${data.invoiceNumber}`, { bold: true });
  text(
    `${data.date.toLocaleDateString('fr-FR')} ${data.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` +
    (data.sellerName ? `  Vendeur: ${data.sellerName}` : ''),
  );
  if (data.customerName) text(`Client: ${data.customerName}`);
  line();

  // --- Articles ---
  for (const item of data.items) {
    text(item.name, { bold: true });
    doc.setFont('courier', 'normal');
    doc.setFontSize(baseFont);
    doc.text(`${item.quantity} x ${fmt(item.unitPrice)}`, margin, y);
    doc.text(fmt(item.totalPrice), width - margin, y, { align: 'right' });
    y += baseFont * 0.55;
  }
  line();

  // --- Totaux ---
  if (data.discount > 0) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(baseFont);
    doc.text('Sous-total', margin, y);
    doc.text(fmt(data.subtotal), width - margin, y, { align: 'right' });
    y += baseFont * 0.55;
    doc.text('Remise', margin, y);
    doc.text(`-${fmt(data.discount)}`, width - margin, y, { align: 'right' });
    y += baseFont * 0.55;
  }
  doc.setFont('courier', 'bold');
  doc.setFontSize(baseFont + 1.5);
  doc.text('TOTAL', margin, y);
  doc.text(`${fmt(data.total)} F`, width - margin, y, { align: 'right' });
  y += (baseFont + 1.5) * 0.6;

  doc.setFont('courier', 'normal');
  doc.setFontSize(baseFont);
  doc.text(METHOD_LABELS[data.paymentMethod] || data.paymentMethod, margin, y);
  doc.text(fmt(data.paidAmount), width - margin, y, { align: 'right' });
  y += baseFont * 0.55;
  if (data.remainingBalance > 0) {
    doc.setFont('courier', 'bold');
    doc.text('RESTE A PAYER', margin, y);
    doc.text(fmt(data.remainingBalance), width - margin, y, { align: 'right' });
    y += baseFont * 0.55;
  }
  line();

  // --- Bloc normalisation e-MECeF ---
  const n = data.normalization;
  if (n) {
    text('FACTURE NORMALISEE e-MECeF', { bold: true, align: 'center' });
    if (n.environment === 'TEST') text('[ TEST ]', { bold: true, align: 'center' });
    if (n.nim) text(`NIM: ${n.nim}`);
    if (n.counters) text(`Compteurs: ${n.counters}`);
    if (n.ni) text(`No: ${n.ni}`);
    if (n.codeMecef) text(`Code: ${n.codeMecef}`);
    if (n.qrDataUrl) {
      const qrSize = width === 58 ? 24 : 30;
      try {
        doc.addImage(n.qrDataUrl, 'PNG', center - qrSize / 2, y, qrSize, qrSize);
        y += qrSize + 2;
      } catch {
        /* QR illisible : le ticket reste valide sans l'image */
      }
    }
    line();
  }

  // --- Pied ---
  text('Merci de votre confiance !', { align: 'center' });
  text('Plawimadd Group', { align: 'center' });

  return doc;
}
