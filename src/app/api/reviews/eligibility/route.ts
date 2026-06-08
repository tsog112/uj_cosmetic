import { NextRequest, NextResponse } from 'next/server';
import { authorizeUserRequest } from '@/lib/auth/serverAuth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const REVIEW_WINDOW_DAYS = 90;

function docId(userId: string, productId: string, orderId: string) {
  return `${userId}_${productId}_${orderId}`;
}

function serializeDate(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

export async function GET(req: NextRequest) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const userId = auth.uid;
    const productId = String(searchParams.get('productId') || '').trim();
    const requestedOrderId = String(searchParams.get('orderId') || searchParams.get('reviewOrderId') || '').trim();

    if (!productId) {
      return NextResponse.json({ state: 'C', eligible: false, message: 'Сэтгэгдэл бичихийн тулд баталгаат худалдан авалт шаардлагатай.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isEmailVerified = user?.emailVerified === true || Boolean(user?.googleId);
    if (!isEmailVerified) {
      return NextResponse.json({
        state: 'F',
        eligible: false,
        message: 'Сэтгэгдэл бичихийн тулд и-мэйл хаягаа баталгаажуулна уу.',
        email: user?.email || null,
      });
    }

    const matchingOrders = await prisma.order.findMany({
      where: {
        userId,
        ...(requestedOrderId ? { id: requestedOrderId } : {}),
        items: { some: { productId } },
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (!matchingOrders.length) {
      return NextResponse.json({ state: 'C', eligible: false, message: 'Энэ бүтээгдэхүүнийг худалдан авсан баталгаатай захиалга олдсонгүй.' });
    }

    for (const order of matchingOrders) {
      const review = await prisma.review.findUnique({ where: { id: docId(userId, productId, order.id) } });
      if (review) {
        return NextResponse.json({
          state: 'B',
          eligible: false,
          message: review.editCount >= 1 ? 'Энэ худалдан авалтын сэтгэгдлийг нэг удаа зассан байна.' : 'Энэ худалдан авалтад сэтгэгдэл бичсэн байна.',
          orderId: order.id,
          orderStatus: order.status || 'pending',
          existingReview: {
            ...review,
            createdAt: serializeDate(review.createdAt),
            updatedAt: serializeDate(review.updatedAt),
          },
        });
      }
    }

    const deliveredOrders = matchingOrders.filter((order) => String(order.status || '').toLowerCase() === 'delivered');
    if (!deliveredOrders.length) {
      const order = matchingOrders[0];
      return NextResponse.json({
        state: 'D',
        eligible: false,
        message: 'Захиалга хүргэгдсэний дараа сэтгэгдэл бичих боломжтой.',
        orderId: order.id,
        orderStatus: order.status || 'pending',
      });
    }

    const now = Date.now();
    const activeOrder = deliveredOrders.find((order) => now - order.updatedAt.getTime() <= REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    if (!activeOrder) {
      const order = deliveredOrders[0];
      return NextResponse.json({
        state: 'E',
        eligible: false,
        message: 'Хүргэгдсэнээс хойш 90 хоног өнгөрсөн тул сэтгэгдэл бичих хугацаа дууссан байна.',
        orderId: order.id,
        orderStatus: order.status || 'delivered',
        deliveredAt: serializeDate(order.updatedAt),
      });
    }

    return NextResponse.json({
      state: 'A',
      eligible: true,
      message: 'Баталгаат худалдан авалт. Та сэтгэгдэл бичиж болно.',
      orderId: activeOrder.id,
      orderStatus: activeOrder.status || 'delivered',
      deliveredAt: serializeDate(activeOrder.updatedAt),
    });
  } catch (error) {
    console.error('Review eligibility API failed:', error);
    return NextResponse.json({ error: 'Failed to check review eligibility' }, { status: 500 });
  }
}
