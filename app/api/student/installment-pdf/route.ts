import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { generateStudentPaymentPlanPDF } from '@/lib/invoice-student';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Non authentifie.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId requis.' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'ADMINSUPRA' || session.user.role === 'SELLER';

    const order = await prisma.order.findFirst({
      where: isAdmin ? { id: orderId } : { id: orderId, userId: session.user.id },
      include: {
        studentInstallments: { orderBy: { installmentNumber: 'asc' } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Commande introuvable.' }, { status: 404 });
    }

    const studentRequest = await prisma.studentInstallmentRequest.findFirst({
      where: { userId: isAdmin ? order.userId : session.user.id, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
    });

    const pdf = generateStudentPaymentPlanPDF({
      studentName: studentRequest?.fullName || session.user.name || 'Etudiant',
      schoolName: studentRequest?.schoolName || 'Non renseigne',
      studentEmail: studentRequest?.studentEmail || session.user.email || '',
      invoiceNumber: order.id.slice(0, 8).toUpperCase(),
      orderDate: order.createdAt,
      totalAmount: Number(order.totalAmount),
      installments: order.studentInstallments.map((inst) => ({
        installmentNumber: inst.installmentNumber,
        amount: Number(inst.amount),
        dueDate: inst.dueDate,
        status: inst.status,
      })),
    });

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="plan-paiement-${order.id.slice(0, 8)}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Erreur generation PDF etudiant:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
