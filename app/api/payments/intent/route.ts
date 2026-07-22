/**
 * Ouverture d'une tentative de paiement.
 *
 * Appelee AVANT l'ouverture du widget. Le panier, les prix et le total sont lus
 * et recalcules depuis la base : rien de ce qui touche a l'argent ne vient du
 * navigateur. Le montant renvoye ici est celui qui sera presente au widget puis
 * re-verifie a la confirmation.
 *
 * Aucune commande n'est creee a ce stade.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import type { IntentItemSnapshot, IntentShippingSnapshot } from '@/lib/payment-settlement';

/** Duree de vie d'une tentative : au-dela, l'acheteur repart du panier. */
const INTENT_TTL_MINUTES = 30;

/** Code ISO utilise par Kkiapay pour le reglement (cf. AppContext, `'XOF'`). */
const SETTLEMENT_CURRENCY = 'XOF';

/**
 * Prix reellement applicable. Un offerPrice superieur au prix courant est
 * ignore : il ne doit jamais servir a facturer plus cher que l'affichage.
 */
function applicablePrice(price: Prisma.Decimal, offerPrice: Prisma.Decimal | null): Prisma.Decimal {
  if (offerPrice && offerPrice.lessThan(price)) return offerPrice;
  return price;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Non authentifie.' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = (await req.json().catch(() => ({}))) as { addressId?: number };
    const addressId = Number(body.addressId);
    if (!Number.isInteger(addressId)) {
      return NextResponse.json(
        { success: false, message: 'Adresse de livraison requise.' },
        { status: 400 }
      );
    }

    // L'adresse doit appartenir a l'acheteur : un id devine ne doit pas
    // permettre de se faire livrer chez quelqu'un d'autre.
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      return NextResponse.json(
        { success: false, message: 'Adresse de livraison introuvable.' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phoneNumber: true, banned: true },
    });
    if (!user || user.banned) {
      return NextResponse.json({ success: false, message: 'Compte indisponible.' }, { status: 403 });
    }

    // ── Le panier fait foi cote serveur ──────────────────────────────────────
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            offerPrice: true,
            visible: true,
            deletedAt: true,
            moqMin: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ success: false, message: 'Votre panier est vide.' }, { status: 400 });
    }

    const unavailable = cartItems.filter(
      (item) => !item.product || item.product.deletedAt !== null || !item.product.visible
    );
    if (unavailable.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Un article de votre panier n'est plus disponible. Retirez-le pour continuer.",
        },
        { status: 409 }
      );
    }

    const belowMoq = cartItems.filter(
      (item) => item.quantity < Math.max(1, item.product.moqMin ?? 1)
    );
    if (belowMoq.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Certains articles n'atteignent pas la quantite minimale de commande.",
        },
        { status: 400 }
      );
    }

    const items: IntentItemSnapshot[] = cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: Number(applicablePrice(item.product.price, item.product.offerPrice)),
    }));

    const amount = items.reduce(
      (total, item) => total.plus(new Prisma.Decimal(item.unitPrice).times(item.quantity)),
      new Prisma.Decimal(0)
    );

    if (amount.lessThanOrEqualTo(0)) {
      return NextResponse.json(
        { success: false, message: 'Le montant de la commande est invalide.' },
        { status: 400 }
      );
    }

    const shipping: IntentShippingSnapshot = {
      addressId: address.id,
      fullName: address.fullName,
      phoneNumber: address.phoneNumber,
      street: address.street,
      area: address.area,
      city: address.city,
      state: address.state,
      country: address.country,
      pincode: address.pincode,
    };

    // Devise de reglement, pas d'affichage : elle est comparee a celle que
    // renvoie Kkiapay. NEXT_PUBLIC_CURRENCY ("CFA") est un libelle d'interface
    // et ferait echouer ce controle sur chaque paiement.
    const currency = SETTLEMENT_CURRENCY;

    const intent = await prisma.paymentIntent.create({
      data: {
        userId,
        amount,
        currency,
        itemsJson: JSON.stringify(items),
        shippingJson: JSON.stringify(shipping),
        userEmail: session.user.email || user.email,
        userPhoneNumber: address.phoneNumber || user.phoneNumber || null,
        expiresAt: new Date(Date.now() + INTENT_TTL_MINUTES * 60_000),
      },
      select: { id: true, amount: true, currency: true },
    });

    console.log(
      `[INTENT] Tentative ${intent.id} ouverte pour ${userId} - ${intent.amount.toString()} ${currency}`
    );

    return NextResponse.json(
      {
        success: true,
        intentId: intent.id,
        amount: Number(intent.amount),
        currency: intent.currency,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[INTENT] Ouverture de tentative impossible:', error);
    return NextResponse.json(
      { success: false, message: "Impossible de preparer le paiement. Reessayez dans un instant." },
      { status: 500 }
    );
  }
}
