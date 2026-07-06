import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeLoggedInUser, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeLoggedInUser(req);
  if (!authResult.authorized) return authResult.response!;
  const userId = authResult.userId!;

  try {
    const { items, customerName, customerPhone, discount, discountReason, paymentMethod } = await req.json();

    if (!items?.length) return NextResponse.json({ message: 'Panier vide' }, { status: 400 });

    const totalAmount = items.reduce((sum: number, item: { unitPrice: number; quantity: number }) => sum + item.unitPrice * item.quantity, 0);
    const discountNum = Math.min(Math.max(0, Number(discount || 0)), totalAmount);
    const finalAmount = Math.max(0, totalAmount - discountNum);

    // Generate invoice number
    const date = new Date();
    const prefix = `FACT-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-`;
    const count = await prisma.posTransaction.count({
      where: { invoiceNumber: { startsWith: prefix } },
    });
    const invoiceNumber = `${prefix}${String(count + 1).padStart(4, '0')}`;

    // Get or create session (outside transaction - idempotent)
    let session = await prisma.posSession.findFirst({
      where: { userId, status: 'OPEN' },
    });
    if (!session) {
      session = await prisma.posSession.create({
        data: { userId, status: 'OPEN' },
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });

    // Wrap all writes in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const transaction = await tx.posTransaction.create({
        data: {
          sessionId: session.id,
          userId,
          customerName,
          customerPhone,
          totalAmount,
          discount: discountNum,
          discountReason,
          finalAmount,
          paymentMethod: paymentMethod || 'CASH',
          invoiceNumber,
          items: {
            create: items.map((item: { productId: string; quantity: number; unitPrice: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const orderId = `POS-${transaction.id}`;
      await tx.order.create({
        data: {
          id: orderId,
          userId,
          totalAmount: finalAmount,
          status: 'PAID_SUCCESS',
          paymentStatus: 'COMPLETED',
          currency: 'XOF',
          shippingAddressLine1: 'Vente en magasin',
          shippingCity: 'Magasin',
          shippingState: 'POS',
          shippingCountry: 'CI',
          userEmail: user?.email || 'pos@plawimadd.com',
          orderDate: new Date(),
          orderItems: {
            create: items.map((item: { productId: string; quantity: number; unitPrice: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtOrder: item.unitPrice,
            })),
          },
        },
      });

      await tx.orderPayment.create({
        data: {
          orderId,
          amount: finalAmount,
          paymentMethod: paymentMethod || 'CASH',
          reference: invoiceNumber,
          notes: discountNum > 0 ? `Remise: ${discountNum} XOF - ${discountReason || ''}`.trim() : null,
          paidAt: new Date(),
        },
      });

      return { transaction, orderId };
    });

    await logActivity({
      userId,
      action: 'POS_SALE',
      entity: 'POS_TRANSACTION',
      entityId: result.transaction.id,
      details: `Vente POS #${invoiceNumber}: ${items.length} article(s), total ${finalAmount} XOF, remise ${discountNum} XOF`,
    });

    return NextResponse.json({
      success: true,
      invoiceNumber,
      transactionId: result.transaction.id,
      orderId: result.orderId,
      totalAmount: finalAmount,
      itemsCount: items.length,
    }, { status: 201 });

  } catch (error) {
    console.error('POS Checkout Error:', error);
    return NextResponse.json({ message: 'Erreur lors de la vente' }, { status: 500 });
  }
}
