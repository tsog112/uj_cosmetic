import { NextRequest, NextResponse } from 'next/server';
import { authorizeUserRequest } from '@/lib/auth/serverAuth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const orders = await prisma.order.findMany({
      where: { userId: auth.uid },
      include: {
        items: {
          include: {
            product: { select: { slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const slugByProductId = new Map<string, string>();
    const missingIds = new Set<string>();
    for (const order of orders) {
      for (const item of order.items) {
        const slug = item.product?.slug?.trim();
        if (slug) slugByProductId.set(item.productId, slug);
        else missingIds.add(item.productId);
      }
    }
    if (missingIds.size) {
      const extras = await prisma.product.findMany({
        where: { id: { in: [...missingIds] } },
        select: { id: true, slug: true },
      });
      for (const product of extras) {
        if (product.slug?.trim()) slugByProductId.set(product.id, product.slug.trim());
      }
    }

    const payload = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      customerName: order.customerName,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        productId: item.productId,
        productSlug: slugByProductId.get(item.productId) || '',
        name_mn: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      })),
    }));

    return NextResponse.json(payload);
  } catch (error: unknown) {
    console.error('orders/mine failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to load orders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
