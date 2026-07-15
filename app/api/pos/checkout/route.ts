import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeByPermission, AuthResult } from '@/lib/authUtils';
import { logActivity } from '@/lib/logActivity';
import { Prisma } from '@prisma/client';

interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

class PosCheckoutError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizeItems(items: unknown): CheckoutItemInput[] {
  if (!Array.isArray(items)) return [];

  const merged = new Map<string, number>();
  for (const raw of items) {
    const item = raw as { productId?: unknown; quantity?: unknown };
    const productId = typeof item.productId === 'string' ? item.productId : '';
    const quantity = Number(item.quantity || 0);
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) continue;
    merged.set(productId, (merged.get(productId) || 0) + Math.floor(quantity));
  }

  return Array.from(merged.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeByPermission(req, 'pos.sell');
  if (!authResult.authorized) return authResult.response!;
  const userId = authResult.userId!;

  try {
    const body = await req.json();
    const items = normalizeItems(body.items);
    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
    const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';
    const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail.trim() : '';
    const customerIFU = typeof body.customerIFU === 'string' ? body.customerIFU.trim() : '';
    const customerAddress = typeof body.customerAddress === 'string' ? body.customerAddress.trim() : '';
    const discount = Number(body.discount || 0);
    const discountReason = typeof body.discountReason === 'string' ? body.discountReason.trim() : '';
    const paymentType = typeof body.paymentType === 'string' ? body.paymentType : 'CASH';
    const paidAmount = Number(body.paidAmount || 0);
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;

    const validPaymentTypes = ['CASH', 'TRANSFER', 'INSTALLMENT'];
    if (!validPaymentTypes.includes(paymentType)) {
      return NextResponse.json({ message: 'Type de paiement invalide. Utilisez CASH, TRANSFER ou INSTALLMENT.' }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ message: 'Panier vide' }, { status: 400 });
    }
    if (!customerName) {
      return NextResponse.json({ message: 'Le nom du client est requis pour une vente physique.' }, { status: 400 });
    }

    const date = new Date();
    const prefix = `FACT-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-`;
    const count = await prisma.posTransaction.count({
      where: { invoiceNumber: { startsWith: prefix } },
    });
    const invoiceNumber = `${prefix}${String(count + 1).padStart(4, '0')}`;

    let session = await prisma.posSession.findFirst({
      where: { userId, status: 'OPEN' },
    });
    if (!session) {
      session = await prisma.posSession.create({
        data: { userId, status: 'OPEN' },
      });
    }

    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.map((item) => item.productId) }, visible: true },
        select: {
          id: true,
          name: true,
          price: true,
          offerPrice: true,
          stock: true,
        },
      });

      const productMap = new Map(products.map((product) => [product.id, product]));
      const saleItems = items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new PosCheckoutError('Produit introuvable ou indisponible.');
        }
        if (product.stock < item.quantity) {
          throw new PosCheckoutError(`Stock insuffisant pour ${product.name}.`);
        }

        const unitPrice = Number(product.offerPrice ?? product.price);
        return {
          productId: item.productId,
          name: product.name,
          quantity: item.quantity,
          unitPrice,
          totalPrice: unitPrice * item.quantity,
        };
      });

      const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const discountNum = Math.min(Math.max(0, Number.isFinite(discount) ? discount : 0), totalAmount);
      const finalAmount = Math.max(0, totalAmount - discountNum);

      let actualPaid = 0;
      let remaining = finalAmount;

      if (paymentType === 'INSTALLMENT') {
        const validPaid = Math.max(0, Math.min(Number.isFinite(paidAmount) ? paidAmount : 0, finalAmount));
        actualPaid = validPaid;
        remaining = finalAmount - validPaid;
      } else {
        actualPaid = finalAmount;
        remaining = 0;
      }

      const transaction = await tx.posTransaction.create({
        data: {
          sessionId: session.id,
          userId,
          customerName,
          customerPhone: customerPhone || null,
          customerEmail: customerEmail || null,
          customerIFU: customerIFU || null,
          customerAddress: customerAddress || null,
          totalAmount,
          discount: discountNum,
          discountReason: discountNum > 0 ? (discountReason || 'Remise manuelle') : null,
          finalAmount,
          paidAmount: actualPaid,
          remainingBalance: remaining,
          dueDate: dueDate,
          paymentMethod: paymentType,
          invoiceNumber,
          items: {
            create: saleItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of saleItems) {
        const updateResult = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });
        if (updateResult.count !== 1) {
          throw new PosCheckoutError(`Stock insuffisant pour ${item.name}.`);
        }
      }

      const orderId = `POS-${transaction.id}`;
      const orderStatus = paymentType === 'INSTALLMENT' && remaining > 0 ? 'PROCESSING' : 'PAID_SUCCESS';
      const orderPaymentStatus = paymentType === 'INSTALLMENT' && remaining > 0 ? 'PENDING' : 'COMPLETED';

      await tx.order.create({
        data: {
          id: orderId,
          userId,
          totalAmount: finalAmount,
          status: orderStatus,
          paymentStatus: orderPaymentStatus,
          currency: 'XOF',
          shippingAddressLine1: `Vente physique - ${customerName}`,
          shippingCity: 'Magasin',
          shippingState: 'POS',
          shippingCountry: 'CI',
          userEmail: customerEmail || seller?.email || 'pos@plawimadd.com',
          userPhoneNumber: customerPhone || null,
          orderDate: new Date(),
          orderItems: {
            create: saleItems.map((item) => ({
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
          amount: actualPaid,
          paymentMethod: paymentType,
          reference: invoiceNumber,
          recordedById: userId,
          notes: discountNum > 0
            ? `Remise: ${discountNum} XOF - ${discountReason || 'Remise manuelle'}${remaining > 0 ? `. Reste: ${remaining} XOF` : ''}`
            : (remaining > 0 ? `Acompte: ${actualPaid} XOF, Reste: ${remaining} XOF` : null),
          paidAt: new Date(),
        },
      });

      return { transaction, orderId, finalAmount, discountNum, itemsCount: saleItems.length, paymentType, paidAmount: actualPaid, remainingBalance: remaining };
    });

    await logActivity({
      userId,
      action: 'POS_SALE',
      entity: 'POS_TRANSACTION',
      entityId: result.transaction.id,
      details: `Vente POS #${invoiceNumber}: ${result.itemsCount} article(s), total ${result.finalAmount} XOF, paiement ${result.paymentType}${result.remainingBalance > 0 ? `, acompte ${result.paidAmount} XOF, reste ${result.remainingBalance} XOF` : ''}`,
    });

    return NextResponse.json({
      success: true,
      invoiceNumber,
      transactionId: result.transaction.id,
      orderId: result.orderId,
      totalAmount: result.finalAmount,
      itemsCount: result.itemsCount,
      paymentType: result.paymentType,
      paidAmount: result.paidAmount,
      remainingBalance: result.remainingBalance,
    }, { status: 201 });
  } catch (error) {
    console.error('POS Checkout Error:', error);
    if (error instanceof PosCheckoutError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: 'Erreur lors de la vente' }, { status: 500 });
  }
}
