import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  customerName?: string | null;
  customerPhone?: string | null;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountReason?: string | null;
  total: number;
  paymentMethod: string;
  sellerName?: string;
  sellerPhone?: string;
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const primary = [37, 99, 235] as const;
  const gray = [107, 114, 128] as const;
  const dark = [17, 24, 39] as const;
  const lightGray = [243, 244, 246] as const;

  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('PLAWIMADD GROUP', 20, 20);
  doc.setFontSize(10);
  doc.text('Facture Normalisee', 20, 30);

  doc.setFontSize(12);
  doc.text(`N° ${data.invoiceNumber}`, pageWidth - 20, 20, { align: 'right' });
  doc.setFontSize(9);
  doc.text(`Date: ${data.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth - 20, 28, { align: 'right' });

  doc.setDrawColor(...primary);
  doc.setLineWidth(0.5);
  doc.line(20, 44, pageWidth - 20, 44);

  let yPos = 52;
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Vendeur:', 20, yPos);
  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.text(data.sellerName || 'Plawimadd Group', 20, yPos + 5);
  if (data.sellerPhone) {
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text(`Tel: ${data.sellerPhone}`, 20, yPos + 11);
  }

  if (data.customerName) {
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text('Client:', pageWidth - 80, yPos);
    doc.setTextColor(...dark);
    doc.setFontSize(10);
    doc.text(data.customerName, pageWidth - 80, yPos + 5);
    if (data.customerPhone) {
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      doc.text(`Tel: ${data.customerPhone}`, pageWidth - 80, yPos + 11);
    }
  }

  yPos = 75;
  (doc as any).autoTable({
    startY: yPos,
    head: [['#', 'Produit', 'Qté', 'Prix unit.', 'Total']],
    body: data.items.map((item, index) => [
      index + 1,
      item.name,
      item.quantity,
      `${item.unitPrice.toLocaleString('fr-FR')} FCFA`,
      `${item.totalPrice.toLocaleString('fr-FR')} FCFA`,
    ]),
    foot: [
      ['', '', '', 'Sous-total', `${data.subtotal.toLocaleString('fr-FR')} FCFA`],
      ...(data.discount > 0 ? [['', '', '', 'Remise', `-${data.discount.toLocaleString('fr-FR')} FCFA`]] : []),
      ['', '', '', 'TOTAL', `${data.total.toLocaleString('fr-FR')} FCFA`],
    ],
    theme: 'grid',
    headStyles: { fillColor: primary as any, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: lightGray as any, textColor: dark as any, fontStyle: 'bold', fontSize: 10 },
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

  if (data.discount > 0 && data.discountReason) {
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text(`Motif de la remise: ${data.discountReason}`, 20, finalY);
  }

  const tableEnd = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Mode de paiement:', 20, tableEnd);
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  const methodLabels: Record<string, string> = { CASH: 'Especes', MOBILE_MONEY: 'Mobile Money', CARD: 'Carte bancaire' };
  doc.text(methodLabels[data.paymentMethod] || data.paymentMethod, 20, tableEnd + 5);

  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text('Merci de votre confiance !', pageWidth / 2, 275, { align: 'center' });
  doc.text('Plawimadd Group - Votre partenaire technologique', pageWidth / 2, 280, { align: 'center' });

  return doc;
}
