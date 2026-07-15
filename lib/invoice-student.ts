import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_BASE64 } from './logo-base64';


interface StudentInstallment {
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  status: string;
  paidAt?: Date | null;
  paymentReference?: string | null;
}

interface StudentPlanData {
  studentName: string;
  schoolName: string;
  studentEmail: string;
  invoiceNumber: string;
  orderDate: Date;
  totalAmount: number;
  installments: StudentInstallment[];
}

function formatAmount(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function numberToFrenchWords(n: number): string {
  if (n === 0) return 'zéro';

  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  function convertUnder100(val: number): string {
    if (val < 10) return units[val];
    if (val < 20) return teens[val - 10];
    const ten = Math.floor(val / 10);
    const unit = val % 10;

    if (ten === 7) {
      return 'soixante-' + (unit === 1 ? 'et-onze' : teens[unit]);
    }
    if (ten === 9) {
      return 'quatre-vingt-' + teens[unit];
    }
    if (unit === 0) {
      return ten === 8 ? 'quatre-vingts' : tens[ten];
    }
    if (unit === 1) {
      return tens[ten] + '-et-un';
    }
    return tens[ten] + '-' + units[unit];
  }

  function convertUnder1000(val: number): string {
    if (val < 100) return convertUnder100(val);
    const hundred = Math.floor(val / 100);
    const remainder = val % 100;
    let result = '';
    if (hundred === 1) {
      result = 'cent';
    } else {
      result = units[hundred] + ' cent';
      if (remainder === 0) result += 's';
    }
    if (remainder > 0) {
      result += ' ' + convertUnder100(remainder);
    }
    return result;
  }

  function convert(val: number): string {
    if (val === 0) return '';
    if (val < 1000) return convertUnder1000(val);
    if (val < 1000000) {
      const thousands = Math.floor(val / 1000);
      const remainder = val % 1000;
      let result = '';
      if (thousands === 1) {
        result = 'mille';
      } else {
        result = convertUnder1000(thousands) + ' mille';
      }
      if (remainder > 0) {
        result += ' ' + convertUnder1000(remainder);
      }
      return result;
    }
    if (val < 1000000000) {
      const millions = Math.floor(val / 1000000);
      const remainder = val % 1000000;
      let result = convertUnder1000(millions) + ' million';
      if (millions > 1) result += 's';
      if (remainder > 0) {
        result += ' ' + convert(remainder);
      }
      return result;
    }
    return val.toString();
  }

  return convert(n).trim().replace(/\s+/g, ' ');
}

export function generateStudentPaymentPlanPDF(data: StudentPlanData): jsPDF {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header Left - Company Logo and Information
  doc.addImage(LOGO_BASE64, 'PNG', 15, 8, 30, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('IFU : 3202226549581', 50, 18);
  doc.text('RCCM : RB/ABC/22 B 6030', 50, 23);

  // Header Right - Invoice Meta Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('FACTURE - PAIEMENT ETUDIANT', pageWidth - 15, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Facture # ${data.invoiceNumber}`, pageWidth - 15, 20, { align: 'right' });
  doc.text(`Date : ${formatDate(data.orderDate)}`, pageWidth - 15, 25, { align: 'right' });

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, 33, pageWidth - 15, 33);

  // Seller Details Table
  autoTable(doc, {
    startY: 36,
    margin: { left: 15 },
    tableWidth: 120,
    body: [
      [
        'Adresse',
        "GODOMEY\nA COTE DE L'IMMEUBLE PEACE AND LOVE EN FACE DU TRAFIC LOCAL DE L'ECHANGEUR DE GODOMEY\nABOMEY CALAVI",
      ],
      [
        'Contact',
        `97918000 / 97747178\nplawimaddgroupbeninbranch1@gmail.com`,
      ],
    ],
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 1,
      textColor: [0, 0, 0] as any,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 18 },
      1: { cellWidth: 102 },
    },
  });

  const sellerEndY = (doc as any).lastAutoTable.finalY || 55;
  const clientStartY = Math.max(sellerEndY + 4, 45);

  // Student Details Box
  autoTable(doc, {
    startY: clientStartY,
    margin: { left: 15, right: 15 },
    head: [['CLIENT / ETUDIANT']],
    body: [
      ['Nom', data.studentName],
      ['IFU', ''],
      ['École', data.schoolName],
      ['Email', data.studentEmail],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240] as any,
      textColor: [0, 0, 0] as any,
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [0, 0, 0] as any,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      1: { cellWidth: 160 },
    },
    styles: {
      lineColor: [200, 200, 200] as any,
      lineWidth: 0.1,
    },
  });

  const clientEndY = (doc as any).lastAutoTable.finalY || 80;
  const itemsStartY = clientEndY + 6;

  const statusLabels: Record<string, string> = {
    PENDING: 'En attente',
    PAID: 'Payée',
    OVERDUE: 'En retard',
    CANCELLED: 'Annulée',
  };

  // Installments Table
  autoTable(doc, {
    startY: itemsStartY,
    margin: { left: 15, right: 15 },
    head: [['Tranche', 'Montant (T.T.C.)', 'Échéance', 'Statut', 'Date de Paiement']],
    body: data.installments.map((inst) => [
      `Tranche ${inst.installmentNumber} (${inst.installmentNumber === 1 ? '50%' : '25%'})`,
      `${formatAmount(inst.amount)} FCFA`,
      formatDate(new Date(inst.dueDate)),
      statusLabels[inst.status] || inst.status,
      inst.paidAt ? formatDate(new Date(inst.paidAt)) : '-',
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240] as any,
      textColor: [0, 0, 0] as any,
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [0, 0, 0] as any,
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'right', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 35 },
    },
    styles: {
      lineColor: [200, 200, 200] as any,
      lineWidth: 0.1,
    },
  });

  const itemsEndY = (doc as any).lastAutoTable.finalY || 130;
  const taxSectionStartY = itemsEndY + 8;

  // Header Ventilation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('--- VENTILATION DES IMPOTS ---', 15, taxSectionStartY);

  // Tax Table
  autoTable(doc, {
    startY: taxSectionStartY + 2,
    margin: { left: 15 },
    tableWidth: 110,
    head: [['Groupe', 'Total', 'Imposable', 'Impôt']],
    body: [
      ['E - TPS', '', formatAmount(data.totalAmount), ''],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240] as any,
      textColor: [0, 0, 0] as any,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [0, 0, 0] as any,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 25 },
      1: { halign: 'right', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 25 },
    },
    styles: {
      lineColor: [200, 200, 200] as any,
      lineWidth: 0.1,
    },
  });

  const taxEndY = (doc as any).lastAutoTable.finalY || 160;

  // Total Box on the right
  const totalBoxX = 140;
  const totalBoxY = taxSectionStartY + 2;
  const totalBoxW = 55;
  const totalBoxH = 13;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(totalBoxX, totalBoxY, totalBoxW, totalBoxH);
  doc.rect(totalBoxX + 0.6, totalBoxY + 0.6, totalBoxW - 1.2, totalBoxH - 1.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total : ${formatAmount(data.totalAmount)} FCFA`, totalBoxX + totalBoxW / 2, totalBoxY + totalBoxH / 2 + 3.5, { align: 'center' });

  // Payment Breakdown Section
  const paymentSectionStartY = Math.max(taxEndY, totalBoxY + totalBoxH) + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('--- REPARTITION DES PAIEMENTS ---', 15, paymentSectionStartY);

  const totalPaid = data.installments
    .filter((inst) => inst.status === 'PAID')
    .reduce((sum, inst) => sum + inst.amount, 0);

  const paymentRows = [
    ['DÉJÀ PAYÉ', formatAmount(totalPaid)],
  ];
  if (data.totalAmount - totalPaid > 0) {
    paymentRows.push(['RESTE A PAYER', formatAmount(data.totalAmount - totalPaid)]);
  }

  autoTable(doc, {
    startY: paymentSectionStartY + 2,
    margin: { left: 15 },
    tableWidth: 90,
    head: [['Type de paiement', 'Payé']],
    body: paymentRows,
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240] as any,
      textColor: [0, 0, 0] as any,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [0, 0, 0] as any,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 50 },
      1: { halign: 'right', cellWidth: 40 },
    },
    styles: {
      lineColor: [200, 200, 200] as any,
      lineWidth: 0.1,
    },
  });

  const paymentEndY = (doc as any).lastAutoTable.finalY || 190;
  const sentenceStartY = paymentEndY + 8;

  // Final amount in letters
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const phrase = `Arrêté la présente facture à la somme de ${numberToFrenchWords(data.totalAmount)} francs CFA TTC`;
  const splitPhrase = doc.splitTextToSize(phrase, pageWidth - 30);
  doc.text(splitPhrase, 15, sentenceStartY);

  // Footer note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Merci de votre confiance.', pageWidth / 2, pageHeight - 12, { align: 'center' });
  doc.text('Plawimadd Group - Programme de financement étudiant', pageWidth / 2, pageHeight - 8, { align: 'center' });

  return doc;
}
