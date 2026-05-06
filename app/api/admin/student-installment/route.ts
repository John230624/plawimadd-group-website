import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest } from '@/lib/authUtils';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const requests = await prisma.studentInstallmentRequest.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
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
