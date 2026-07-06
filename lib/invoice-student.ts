import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

const primary = [37, 99, 235] as const;
const gray = [107, 114, 128] as const;
const dark = [17, 24, 39] as const;
const lightGray = [243, 244, 246] as const;

function drawHeader(doc: jsPDF, pageWidth: number, invoiceNumber: string, date: Date): void {
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('PLAWIMADD GROUP', 20, 20);
  doc.setFontSize(10);
  doc.text('Programme etudiant', 20, 30);

  doc.setFontSize(12);
  doc.text(`N° ${invoiceNumber}`, pageWidth - 20, 20, { align: 'right' });
  doc.setFontSize(9);
  doc.text(`Date: ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - 20, 28, { align: 'right' });

  doc.setDrawColor(...primary);
  doc.setLineWidth(0.5);
  doc.line(20, 44, pageWidth - 20, 44);
}

function drawStudentInfo(doc: jsPDF, pageWidth: number, yPos: number, data: StudentPlanData): number {
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Etudiant:', 20, yPos);
  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.text(data.studentName, 20, yPos + 5);
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text(`Ecole: ${data.schoolName}`, 20, yPos + 11);
  doc.text(`Email: ${data.studentEmail}`, 20, yPos + 16);

  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.text(`Montant total: ${data.totalAmount.toLocaleString('fr-FR')} FCFA`, pageWidth - 20, yPos + 5, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Paiement en 3 tranches (50% / 25% / 25%)', pageWidth - 20, yPos + 12, { align: 'right' });

  return yPos + 24;
}

function drawInstallmentStatus(doc: jsPDF, pageWidth: number, yPos: number, installments: StudentInstallment[], totalPaid: number, remainingAmount: number): number {
  const statusLabels: Record<string, string> = {
    PENDING: 'En attente',
    PAID: 'Payee',
    OVERDUE: 'En retard',
    CANCELLED: 'Annulee',
  };

  (doc as any).autoTable({
    startY: yPos,
    head: [['Tranche', 'Montant', 'Echeance', 'Statut', 'Payee le']],
    body: installments.map((inst) => [
      `Tranche ${inst.installmentNumber} (${inst.installmentNumber === 1 ? '50%' : '25%'})`,
      `${inst.amount.toLocaleString('fr-FR')} FCFA`,
      inst.dueDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      statusLabels[inst.status] || inst.status,
      inst.paidAt
        ? new Date(inst.paidAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        : '-',
    ]),
    foot: [
      ['', '', '', 'Total paye', `${totalPaid.toLocaleString('fr-FR')} FCFA`],
    ],
    theme: 'grid',
    headStyles: { fillColor: primary as any, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: lightGray as any, textColor: dark as any, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: dark as any },
    alternateRowStyles: { fillColor: lightGray as any },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
    margin: { left: 20, right: 20 },
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

function drawFooter(doc: jsPDF, pageWidth: number, yPos: number, isComplete: boolean): void {
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.setFont('Helvetica', 'bold');

  if (isComplete) {
    doc.setTextColor(22, 163, 74);
    doc.text('SOLDE ENTIEREMENT REGLE', pageWidth / 2, yPos, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text('Cette facture definitive annule et remplace toutes les factures partielles precedentes.', pageWidth / 2, yPos + 6, { align: 'center' });
  } else {
    doc.setTextColor(234, 179, 8);
    doc.text('FACTURE PARTIELLE', pageWidth / 2, yPos, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text('Ceci est une facture partielle. La facture definitive sera emise apres complet paiement.', pageWidth / 2, yPos + 6, { align: 'center' });
  }

  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text('Plawimadd Group - Programme de financement etudiant', pageWidth / 2, 275, { align: 'center' });
  doc.text('Contact: support@plawimadd.com | Tel: +225 XX XX XX XX', pageWidth / 2, 280, { align: 'center' });
}

export function generateStudentPaymentPlanPDF(data: StudentPlanData): jsPDF {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, pageWidth, data.invoiceNumber, data.orderDate);
  const infoEnd = drawStudentInfo(doc, pageWidth, 52, data);
  drawInstallmentStatus(doc, pageWidth, infoEnd, data.installments, 0, data.totalAmount);
  drawFooter(doc, pageWidth, 260, false);

  return doc;
}


