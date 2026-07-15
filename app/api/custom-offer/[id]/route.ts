import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const authResult = await authorizeAdminRequest(req);
  if (!authResult.authorized || !authResult.userId) {
    return authResult.response!;
  }

  const { id } = await params;

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

    const existingOffer = await prisma.customOffer.findUnique({
      where: { id },
    });

    if (!existingOffer) {
      return NextResponse.json(
        { success: false, message: 'Offre introuvable.' },
        { status: 404 }
      );
    }

    // If setting as student offer, unset isStudent on any other offer
    if (isStudent) {
      await prisma.customOffer.updateMany({
        where: { isStudent: true },
        data: { isStudent: false },
      });
    }

    const offer = await prisma.customOffer.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingOffer.title,
        description: description !== undefined ? description : existingOffer.description,
        badgeText: badgeText !== undefined ? badgeText : existingOffer.badgeText,
        image: image !== undefined ? image : existingOffer.image,
        detailsJson: detailsJson !== undefined ? detailsJson : existingOffer.detailsJson,
        buttonText: buttonText !== undefined ? buttonText : existingOffer.buttonText,
        buttonUrl: buttonUrl !== undefined ? buttonUrl : existingOffer.buttonUrl,
        bgColor: bgColor !== undefined ? bgColor : existingOffer.bgColor,
        textColor: textColor !== undefined ? textColor : existingOffer.textColor,
        isActive: isActive !== undefined ? isActive : existingOffer.isActive,
        isStudent: isStudent !== undefined ? isStudent : existingOffer.isStudent,
      },
    });

    await logActivity({
      userId: authResult.userId,
      action: 'UPDATE',
      entity: 'CUSTOM_OFFER',
      entityId: id,
      details: `Offre personnalisée "${offer.title}" mise à jour`,
    });

    return NextResponse.json({ success: true, offer }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'offre:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const authResult = await authorizeAdminRequest(req);
  if (!authResult.authorized || !authResult.userId) {
    return authResult.response!;
  }

  const { id } = await params;

  try {
    const existingOffer = await prisma.customOffer.findUnique({
      where: { id },
    });

    if (!existingOffer) {
      return NextResponse.json(
        { success: false, message: 'Offre introuvable.' },
        { status: 404 }
      );
    }

    await prisma.customOffer.delete({
      where: { id },
    });

    await logActivity({
      userId: authResult.userId,
      action: 'DELETE',
      entity: 'CUSTOM_OFFER',
      entityId: id,
      details: `Offre personnalisée "${existingOffer.title}" supprimée`,
    });

    return NextResponse.json({ success: true, message: 'Offre supprimée.' }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'offre:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur.' },
      { status: 500 }
    );
  }
}
