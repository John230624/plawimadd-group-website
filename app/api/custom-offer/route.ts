import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    let offers = await prisma.customOffer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (offers.length === 0) {
      const defaultStudentOffer = await prisma.customOffer.create({
        data: {
          title: "Offre Étudiante",
          description: "Bénéficiez de facilités de paiement exclusives sur vos équipements d'études.",
          badgeText: "ÉTUDIANT",
          image: "/images/background_etudiant2.jpg",
          detailsJson: JSON.stringify([
            "Paiement en 3 tranches : 50%, puis 25% et 25%",
            "Réservé aux étudiants de Cotonou & Calavi",
            "Validation de dossier en moins de 24h"
          ]),
          buttonText: "Activer mon offre",
          buttonUrl: "/offer",
          bgColor: "bg-slate-955",
          textColor: "text-white",
          isActive: true,
          isStudent: true,
        },
      });
      offers = [defaultStudentOffer];
    }

    return NextResponse.json({ success: true, offers }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult = await authorizeAdminRequest(req);
  if (!authResult.authorized || !authResult.userId) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      badgeText,
      image,
      detailsJson,
      buttonText,
      buttonUrl,
      bgColor,
      textColor,
      isActive,
      isStudent,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, message: 'Le titre et la description sont requis.' },
        { status: 400 }
      );
    }

    // If this is set as the student offer, make sure to unset isStudent on any other offer
    if (isStudent) {
      await prisma.customOffer.updateMany({
        where: { isStudent: true },
        data: { isStudent: false },
      });
    }

    const offer = await prisma.customOffer.create({
      data: {
        title,
        description,
        badgeText: badgeText || 'PROMO',
        image: image || '/images/background_etudiant2.jpg',
        detailsJson: detailsJson || '[]',
        buttonText: buttonText || "Voir l'offre",
        buttonUrl: buttonUrl || '/offer',
        bgColor: bgColor || 'bg-slate-950',
        textColor: textColor || 'text-white',
        isActive: isActive !== undefined ? isActive : true,
        isStudent: isStudent !== undefined ? isStudent : false,
      },
    });

    await logActivity({
      userId: authResult.userId,
      action: 'CREATE',
      entity: 'CUSTOM_OFFER',
      entityId: offer.id,
      details: `Offre personnalisée "${title}" créée`,
    });

    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'offre:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur.' },
      { status: 500 }
    );
  }
}
