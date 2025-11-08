import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeUser, AuthResult } from '@/lib/authUtils';

interface Context {
  params: {
    userId: string;
  };
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

    // Validation basique: Ajout d'une vérification stricte pour les champs requis
    if (!data.fullName || !data.phoneNumber || !data.area || !data.city || !data.state) {
      // ⚠️ IMPORTANT: Ceci attrape les erreurs si le formulaire côté client n'envoie pas ces champs.
      return NextResponse.json(
        { success: false, message: 'Champs obligatoires manquants: fullName, phoneNumber, area, city, state.' },
        { status: 400 }
      );
    }

    // Si adresse par défaut, retirer le default sur les autres
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        pincode: data.pincode ?? null, // Utilisation de ?? pour s'assurer que si undefined, c'est null
        area: data.area,
        city: data.city,
        state: data.state,
        street: data.street ?? null,
        country: data.country ?? 'Unknown',
        isDefault: data.isDefault ?? false,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Adresse ajoutée.', addressId: newAddress.id },
      { status: 201 }
    );
  } catch (error) {
    // ⚠️ Très important pour le débogage côté serveur
    console.error('Erreur ajout adresse Prisma:', error); 
    return NextResponse.json(
      { success: false, message: 'Erreur serveur lors de l’ajout de l’adresse.' },
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

    if (!data.id || !data.fullName || !data.phoneNumber || !data.area || !data.city || !data.state) {
      return NextResponse.json(
        { success: false, message: 'ID et champs obligatoires manquants.' },
        { status: 400 }
      );
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, NOT: { id: data.id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.updateMany({
      where: { id: data.id, userId },
      data: {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        pincode: data.pincode ?? null,
        area: data.area,
        city: data.city,
        state: data.state,
        street: data.street ?? null,
        country: data.country ?? 'Unknown',
        isDefault: data.isDefault ?? false,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ success: false, message: 'Adresse non trouvée ou non autorisée.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Adresse mise à jour.' }, { status: 200 });
  } catch (error) {
    console.error('Erreur mise à jour adresse:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur lors de la mise à jour.' },
      { status: 500 }
    );
  }
}