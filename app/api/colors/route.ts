import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const colors = await prisma.color.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(colors);
  } catch {
    return NextResponse.json([]);
  }
}
