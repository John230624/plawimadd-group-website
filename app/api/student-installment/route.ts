import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeLoggedInUser } from '@/lib/authUtils';
import { studentInstallmentSchema } from '@/lib/validation';
import { logActivity } from '@/lib/logActivity';
import { ZodError } from 'zod';

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
    console.error('Erreur lors de la récupération des demandes étudiantes:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' },
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
    const parsed = studentInstallmentSchema.omit({ requestedMonths: true }).parse(body);
    const {
      fullName,
      phoneNumber,
      schoolName,
      studentEmail,
      studentIdNumber,
      notes,
    } = parsed;
    const { documentUrl } = body;

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

    await logActivity({
      userId: authResult.userId,
      action: 'CREATE',
      entity: 'STUDENT_INSTALLMENT',
      entityId: request.id,
      details: `Demande d'échelonnement étudiant créée`,
    });

    return NextResponse.json({ success: true, request }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Erreur lors de la création de la demande étudiante:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' },
      { status: 500 }
    );
  }
}
