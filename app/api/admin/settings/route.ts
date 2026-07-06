import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const settings = await prisma.siteSetting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return NextResponse.json(result, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur GET settings:', _error);
    return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  try {
    const body = await req.json() as Record<string, string>;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return NextResponse.json({ success: false, message: 'Corps de requête vide.' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(body)) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    const updated = await prisma.siteSetting.findMany();
    const result: Record<string, string> = {};
    for (const s of updated) {
      result[s.key] = s.value;
    }

    await logActivity({ userId: authResult.userId, action: 'UPDATE', entity: 'SETTINGS', entityId: null, details: `Mise à jour des paramètres : ${Object.keys(body).join(', ')}` });

    return NextResponse.json({ success: true, settings: result }, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur PUT settings:', _error);
    return NextResponse.json({ success: false, message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
