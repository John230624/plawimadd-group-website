import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

interface CreateInstallmentOrderPayload {
  id: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  shippingAddress: {
    id?: number;
    fullName: string;
    phoneNumber: string;
    area: string;
    city: string;
    state: string;
    street: string;
    country: string;
    pincode: string;
  };
  userEmail: string;
  userPhoneNumber: string | null;
  currency: string;
  installmentRequestId: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Non authentifie.' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = (await req.json()) as CreateInstallmentOrderPayload;

    if (
      !body.id ||
      !body.items?.length ||
      !body.totalAmount ||
      !body.shippingAddress ||
      !body.installmentRequestId
    ) {
      return NextResponse.json(
        { success: false, message: 'Dossier de commande incomplet.' },
        { status: 400 }
      );
    }

    const approvedRequest = await prisma.studentInstallmentRequest.findFirst({
      where: {
        id: body.installmentRequestId,
        userId,
        status: 'APPROVED',
      },
    });

    if (!approvedRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucune demande etudiante approuvee n'est disponible pour cette commande.",
        },
        { status: 403 }
      );
    }

    const firstInstallmentAmount = body.totalAmount / 2;
    const secondInstallmentAmount = body.totalAmount / 4;
    const thirdInstallmentAmount = body.totalAmount - firstInstallmentAmount - secondInstallmentAmount;

    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          id: body.id,
          userId,
          totalAmount: new Prisma.Decimal(body.totalAmount),
          status: OrderStatus.ON_HOLD,
          paymentStatus: PaymentStatus.PENDING,
          currency: body.currency,
          shippingAddressLine1: body.shippingAddress.street ?? '',
          shippingAddressLine2: body.shippingAddress.area,
          shippingCity: body.shippingAddress.city,
          shippingState: body.shippingAddress.state,
          shippingZipCode: body.shippingAddress.pincode,
          shippingCountry: body.shippingAddress.country,
          shippingAddressId: body.shippingAddress.id || null,
          userEmail: body.userEmail,
          userPhoneNumber: body.userPhoneNumber,
          orderDate: new Date(),
          orderItems: {
            create: body.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtOrder: new Prisma.Decimal(item.price),
            })),
          },
        },
      });

      await tx.payment.create({
        data: {
          orderId: body.id,
          paymentMethod: 'INSTALLMENT_STUDENT_50_25_25',
          transactionId: body.installmentRequestId,
          amount: new Prisma.Decimal(firstInstallmentAmount),
          currency: body.currency,
          status: PaymentStatus.PENDING,
          paymentDate: null,
        },
      });

      await tx.cartItem.deleteMany({
        where: { userId },
      });
    });

    return NextResponse.json(
      {
        success: true,
        orderId: body.id,
        paymentPlan: {
          months: 3,
          firstInstallmentAmount,
          secondInstallmentAmount,
          thirdInstallmentAmount,
        },
        message: 'Commande de paiement par tranche enregistree avec succes.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la creation de la commande etudiante:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' },
      { status: 500 }
    );
  }
}
