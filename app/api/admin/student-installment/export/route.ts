import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest } from '@/lib/authUtils';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const requests = await prisma.studentInstallmentRequest.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'Nom complet;Telephone;Email etudiant;Ecole;Numero carte;Document;Notes etudiant;Statut;Notes admin;Revu par;Date soumission;Date validation\n';
    const rows = requests.map((r) => {
      const reviewedByName = r.reviewedBy
        ? `${r.reviewedBy.firstName || ''} ${r.reviewedBy.lastName || ''}`.trim()
        : '';
      return [
        r.fullName,
        r.phoneNumber,
        r.studentEmail,
        r.schoolName,
        r.studentIdNumber,
        r.documentUrl,
        (r.notes || '').replace(/;/g, ','),
        r.status,
        (r.adminNote || '').replace(/;/g, ','),
        reviewedByName,
        r.createdAt.toISOString(),
        r.reviewedAt ? r.reviewedAt.toISOString() : '',
      ].join(';');
    }).join('\n');

    const csv = '\uFEFF' + header + rows;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="demandes-etudiantes-export.csv"',
      },
    });
  } catch (error) {
    console.error('Erreur export CSV demandes:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
