import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Non authentifie.' }, { status: 401 });
    }

    const installments = await prisma.studentInstallment.findMany({
      where: { order: { userId: session.user.id } },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ order: { createdAt: 'desc' } }, { installmentNumber: 'asc' }],
    });

    return NextResponse.json({ success: true, data: installments });
  } catch (error) {
    console.error('Erreur chargement echeances:', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
