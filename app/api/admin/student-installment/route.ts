import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission } from '@/lib/authUtils';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult = await authorizeByPermission(req, 'students.view');
  if (!authResult.authorized) return authResult.response!;

  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const statusFilter = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const search = url.searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      where.createdAt = createdAt;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { studentEmail: { contains: search } },
        { studentIdNumber: { contains: search } },
        { schoolName: { contains: search } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.studentInstallmentRequest.findMany({
        where: where as any,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          reviewedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.studentInstallmentRequest.count({ where: where as any }),
    ]);

    return NextResponse.json({
      success: true,
      requests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, { status: 200 });
  } catch (error) {
    console.error('Erreur recuperation demandes etudiantes (admin):', error);
    return NextResponse.json({ success: false, message: 'Erreur serveur.' }, { status: 500 });
  }
}
