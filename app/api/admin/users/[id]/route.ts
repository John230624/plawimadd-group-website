import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeAdminRequest, AuthResult } from '@/lib/authUtils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult: AuthResult = await authorizeAdminRequest(req);
  if (!authResult.authorized) return authResult.response!;

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
        roles: {
          include: {
            role: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
        banned: true,
        bannedAt: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            area: true,
            city: true,
            state: true,
            country: true,
            street: true,
            pincode: true,
            isDefault: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        cartItems: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            currency: true,
            orderItems: {
              select: {
                id: true,
                quantity: true,
                priceAtOrder: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        studentInstallmentRequests: {
          select: {
            id: true,
            fullName: true,
            schoolName: true,
            studentEmail: true,
            status: true,
            requestedMonths: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user || (user.role === 'ADMINSUPRA' && authResult.userRole !== 'ADMINSUPRA')) {
      return NextResponse.json({ message: 'Utilisateur non trouvé.' }, { status: 404 });
    }

    const formatted = {
      ...user,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      totalOrders: user.orders.length,
      totalReviews: user.reviews.length,
      totalAddresses: user.addresses.length,
      cartValue: user.cartItems.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
      ),
    };

    return NextResponse.json(formatted, { status: 200 });
  } catch (_error: unknown) {
    console.error('Erreur GET utilisateur détail:', _error);
    return NextResponse.json({ message: "Erreur serveur. Veuillez réessayer plus tard." }, { status: 500 });
  }
}
