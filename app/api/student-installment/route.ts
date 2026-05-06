import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeLoggedInUser } from '@/lib/authUtils';

interface StudentInstallmentPayload {
  fullName: string;
  phoneNumber: string;
  schoolName: string;
  studentEmail: string;
  studentIdNumber: string;
  documentUrl: string;
  notes?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult = await authorizeLoggedInUser(req);
  if (!authResult.authorized || !authResult.userId) {
    return authResult.response!;
  }

  try {
    const requests = await prisma.studentInstallmentRequest.findMany({
      where: { userId: authResult.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, requests }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Impossible de recuperer les demandes etudiantes.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult = await authorizeLoggedInUser(req);
  if (!authResult.authorized || !authResult.userId) {
    return authResult.response!;
  }

  try {
    const body = (await req.json()) as StudentInstallmentPayload;
    const {
      fullName,
      phoneNumber,
      schoolName,
      studentEmail,
      studentIdNumber,
      documentUrl,
      notes,
    } = body;

    if (
      !fullName ||
      !phoneNumber ||
      !schoolName ||
      !studentEmail ||
      !studentIdNumber ||
      !documentUrl
    ) {
      return NextResponse.json(
        { success: false, message: 'Veuillez remplir tous les champs obligatoires.' },
        { status: 400 }
      );
    }

    const existingPendingRequest = await prisma.studentInstallmentRequest.findFirst({
      where: {
        userId: authResult.userId,
        status: 'PENDING',
      },
    });

    if (existingPendingRequest) {
      return NextResponse.json(
        {
          success: false,
          message: 'Une demande en attente existe deja pour ce compte.',
        },
        { status: 409 }
      );
    }

    const request = await prisma.studentInstallmentRequest.create({
      data: {
        userId: authResult.userId,
        fullName,
        phoneNumber,
        schoolName,
        studentEmail,
        studentIdNumber,
        requestedMonths: 3,
        documentUrl,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, request }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la creation de la demande etudiante.' },
      { status: 500 }
    );
  }
}
