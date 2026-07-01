import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeUser, AuthResult } from '@/lib/authUtils';
import { addressSchema } from '@/lib/validation';
import { ZodError } from 'zod';

interface Context {
  params: Promise<{
    userId: string;
  }>;
}

// Structure de données de l'adresse (Doit correspondre au schéma Prisma)
interface AddressPayload {
  id?: number;
  fullName: string;
  phoneNumber: string;
  pincode?: string | null;
  area: string;
  city: string;
  state: string;
  street?: string | null;
  country?: string;
  isDefault?: boolean;
}

/**
 * GET - Récupérer toutes les adresses d’un utilisateur
 */
export async function GET(req: NextRequest, context: Context): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeUser(req, context);
  if (!authResult.authorized) return authResult.response!;

  // L'ID utilisateur est extrait de la session après l'autorisation
  const userId = authResult.userId!; 

  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, addresses }, { status: 200 });
  } catch (error) {
    console.error('Erreur récupération adresses:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur lors de la récupération des adresses.' },
      { status: 500 }
    );
  }
}

/**
 * POST - Ajouter une nouvelle adresse
 */
export async function POST(req: NextRequest, context: Context): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeUser(req, context);
  if (!authResult.authorized) return authResult.response!;
  
  const userId = authResult.userId!;

  try {
    const data: AddressPayload = await req.json();
    const parsed = addressSchema.parse(data);

    if (parsed.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        fullName: parsed.fullName,
        phoneNumber: parsed.phoneNumber,
        pincode: parsed.pincode ?? null,
        area: parsed.area,
        city: parsed.city,
        state: parsed.state,
        street: parsed.street ?? null,
        country: parsed.country ?? 'Unknown',
        isDefault: parsed.isDefault ?? false,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Adresse ajoutée.', addressId: newAddress.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Erreur ajout adresse Prisma:', error); 
    return NextResponse.json(
      { success: false, message: 'Erreur serveur lors de l\u2019ajout de l\u2019adresse.' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Mettre à jour une adresse existante
 */
export async function PUT(req: NextRequest, context: Context): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeUser(req, context);
  if (!authResult.authorized) return authResult.response!;

  const userId = authResult.userId!;

  try {
    const data: AddressPayload = await req.json();
    const { id: addressId, ...rest } = data;
    const parsed = addressSchema.parse(rest);

    if (!addressId) {
      return NextResponse.json(
        { success: false, message: 'ID requis.' },
        { status: 400 }
      );
    }

    if (parsed.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, NOT: { id: addressId } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.updateMany({
      where: { id: addressId, userId },
      data: {
        fullName: parsed.fullName,
        phoneNumber: parsed.phoneNumber,
        pincode: parsed.pincode ?? null,
        area: parsed.area,
        city: parsed.city,
        state: parsed.state,
        street: parsed.street ?? null,
        country: parsed.country ?? 'Unknown',
        isDefault: parsed.isDefault ?? false,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ success: false, message: 'Adresse non trouvée ou non autorisée.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Adresse mise à jour.' }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Erreur mise à jour adresse:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur lors de la mise à jour.' },
      { status: 500 }
    );
  }
}