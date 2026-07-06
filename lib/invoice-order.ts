import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface InvoiceOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoicePayment {
  method: string;
  amount: number;
  reference: string | null;
  paidAt: Date;
}

interface InvoiceOrderData {
  invoiceNumber: string;
  orderId: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: string | null;
  items: InvoiceOrderItem[];
  payments: InvoicePayment[];
  totalAmount: number;
  totalPaid: number;
  currency: string;
  type: 'standard' | 'student' | 'pos';
  isFullyPaid: boolean;
}

const primary = [37, 99, 235] as const;
const gray = [107, 114, 128] as const;
const dark = [17, 24, 39] as const;
const lightGray = [243, 244, 246] as const;
const green = [22, 163, 74] as const;
const amber = [217, 119, 6] as const;

const methodLabels: Record<string, string> = {
  CASH: 'Especes',
  MOBILE_MONEY: 'Mobile Money',
  CARD: 'Carte bancaire',
  BANK_TRANSFER: 'Virement bancaire',
  INSTALLMENT_STUDENT: 'Echelonnement etudiant',
  KKiapay: 'Kkiapay',
};

export function generateOrderInvoicePDF(data: InvoiceOrderData): jsPDF {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('PLAWIMADD GROUP', 20, 20);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);

  const typeLabel = data.type === 'student' ? 'FACTURE - PAIEMENT ETUDIANT'
    : data.type === 'pos' ? 'FACTURE - VENTE EN MAGASIN'
    : 'FACTURE';
  doc.text(typeLabel, 20, 32);
  doc.setFont('Helvetica', 'normal');

  doc.setFontSize(12);
  doc.text(`N° ${data.invoiceNumber}`, pageWidth - 20, 20, { align: 'right' });
  doc.setFontSize(9);
  doc.text(`Date: ${data.orderDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - 20, 28, { align: 'right' });
  doc.text(`Ref: ${data.orderId.slice(0, 8)}`, pageWidth - 20, 34, { align: 'right' });

  doc.setDrawColor(...primary);
  doc.setLineWidth(0.5);
  doc.line(20, 49, pageWidth - 20, 49);

  // Customer info
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Client:', 20, 58);
  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.text(data.customerName, 20, 63);
  doc.setFontSize(8);
  doc.setTextColor(...gray);

  if (data.customerEmail) doc.text(`Email: ${data.customerEmail}`, 20, 69);
  if (data.customerPhone) doc.text(`Tel: ${data.customerPhone}`, 20, 74);

  // Shipping address
  if (data.shippingAddress) {
    const addrY = data.customerPhone ? 80 : 75;
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text('Adresse livraison:', pageWidth - 90, 58);
    doc.setFontSize(8);
    doc.setTextColor(...dark);
    doc.text(data.shippingAddress, pageWidth - 90, 63, { maxWidth: 70 });
  }

  // Paid / remaining summary
  const infoEnd = data.shippingAddress ? 85 : (!data.customerPhone ? 72 : 80);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.text(`Total: ${data.totalAmount.toLocaleString('fr-FR')} ${data.currency}`, pageWidth - 20, infoEnd, { align: 'right' });

  if (data.totalPaid > 0) {
    const paidY = infoEnd + 5;
    doc.setTextColor(...green);
    doc.text(`Paye: ${data.totalPaid.toLocaleString('fr-FR')} ${data.currency}`, pageWidth - 20, paidY, { align: 'right' });
    if (!data.isFullyPaid) {
      doc.setTextColor(...amber);
      doc.text(`Reste: ${(data.totalAmount - data.totalPaid).toLocaleString('fr-FR')} ${data.currency}`, pageWidth - 20, paidY + 5, { align: 'right' });
    }
  }
  doc.setFont('Helvetica', 'normal');

  // Order items table
  (doc as any).autoTable({
    startY: infoEnd + 12,
    head: [['#', 'Produit', 'Qté', 'Prix unit.', 'Total']],
    body: data.items.map((item, index) => [
      index + 1,
      item.name,
      item.quantity,
      `${item.unitPrice.toLocaleString('fr-FR')} ${data.currency}`,
      `${item.totalPrice.toLocaleString('fr-FR')} ${data.currency}`,
    ]),
    foot: [
      ['', '', '', 'Sous-total', `${data.items.reduce((s, i) => s + i.totalPrice, 0).toLocaleString('fr-FR')} ${data.currency}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: primary as any, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: lightGray as any, textColor: dark as any, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: dark as any },
    alternateRowStyles: { fillColor: lightGray as any },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });

  // Payments table
  const itemsEnd = (doc as any).lastAutoTable.finalY + 8;

  (doc as any).autoTable({
    startY: itemsEnd,
    head: [['Mode de paiement', 'Reference', 'Montant', 'Date']],
    body: data.payments.map((p) => [
      methodLabels[p.method] || p.method,
      p.reference || '-',
      `${p.amount.toLocaleString('fr-FR')} ${data.currency}`,
      p.paidAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    ]),
    foot: [
      ['', '', `Total paye: ${data.totalPaid.toLocaleString('fr-FR')} ${data.currency}`, ''],
    ],
    theme: 'grid',
    headStyles: { fillColor: primary as any, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: lightGray as any, textColor: dark as any, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: dark as any },
    alternateRowStyles: { fillColor: lightGray as any },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'center' },
    },
    margin: { left: 20, right: 20 },
  });

  // Status
  const endY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);

  if (data.isFullyPaid) {
    doc.setTextColor(...green);
    doc.text('FACTURE SOLDEE', pageWidth / 2, endY, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text('Tous les paiements ont ete recus. Merci de votre confiance !', pageWidth / 2, endY + 6, { align: 'center' });
  } else if (data.totalPaid > 0) {
    doc.setTextColor(...amber);
    doc.text('FACTURE PARTIELLEMENT SOLDEE', pageWidth / 2, endY, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(`Reste a payer: ${(data.totalAmount - data.totalPaid).toLocaleString('fr-FR')} ${data.currency}`, pageWidth / 2, endY + 6, { align: 'center' });
  } else {
    doc.setTextColor(...amber);
    doc.text('EN ATTENTE DE PAIEMENT', pageWidth / 2, endY, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text('Aucun paiement enregistre pour cette commande.', pageWidth / 2, endY + 6, { align: 'center' });
  }

  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text('Plawimadd Group - Votre partenaire technologique', pageWidth / 2, 275, { align: 'center' });
  doc.text('Contact: support@plawimadd.com | Tel: +225 XX XX XX XX', pageWidth / 2, 280, { align: 'center' });

  return doc;
}
