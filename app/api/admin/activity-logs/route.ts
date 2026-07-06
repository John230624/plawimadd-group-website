import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityLogWhereInput = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (search) {
      where.OR = [
        { details: { contains: search } },
      ];
    }

    const validSortFields = ['createdAt', 'action', 'entity', 'entityId'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { [orderField]: orderDir },
        skip,
        take: limit,
      }),
    ]);

    const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[];
    let userMap: Record<string, { display: string; email: string }> = {};
    if (userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      userMap = Object.fromEntries(
        users.map((u) => [
          u.id,
          {
            display: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
            email: u.email,
          },
        ])
      );
    }

    // Filtre search sur userName/userEmail côté serveur
    let enriched = logs.map((log) => ({
      ...log,
      userName: log.userId ? userMap[log.userId]?.display || log.userId.slice(0, 8) : 'Système',
      userEmail: log.userId ? userMap[log.userId]?.email || '' : '',
    }));

    // Si search, filtrer aussi sur userName et userEmail
    if (search) {
      const q = search.toLowerCase();
      enriched = enriched.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }

    const totalFiltered = search ? enriched.length : total;

    return NextResponse.json(
      {
        success: true,
        data: enriched,
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit),
      },
      { status: 200 }
    );
  } catch (_error: unknown) {
    console.error('Erreur GET activity-logs:', _error);
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: 'Aucun ID fourni.' }, { status: 400 });
    }

    await prisma.activityLog.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, message: `${ids.length} entrée(s) supprimée(s).` }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur DELETE activity-logs:', _error);
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}
