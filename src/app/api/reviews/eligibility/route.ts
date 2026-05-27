import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const REVIEW_WINDOW_DAYS = 90;

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function docId(userId: string, productId: string, orderId: string) {
  return `${userId}_${productId}_${orderId}`;
}

function serializeDate(date: Date | null) {
  return date ? date.toISOString() : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = String(searchParams.get('userId') || '').trim();
    const productId = String(searchParams.get('productId') || '').trim();
    const requestedOrderId = String(searchParams.get('orderId') || searchParams.get('reviewOrderId') || '').trim();

    if (!userId || !productId) {
      return NextResponse.json({ state: 'C', eligible: false, message: 'Нэвтэрч орсны дараа баталгаат худалдан авалтын сэтгэгдэл бичих боломжтой.' });
    }

    const db = getAdminDb();
    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data() || {};
    const isEmailVerified = userData.email_verified === true || Boolean(userData.google_id);
    if (!isEmailVerified) {
      return NextResponse.json({
        state: 'F',
        eligible: false,
        message: 'Сэтгэгдэл бичихийн тулд и-мэйл хаягаа баталгаажуулна уу.',
        email: userData.email || null,
      });
    }

    const ordersSnap = await db.collection('orders').where('userId', '==', userId).get();
    const matchingOrders = ordersSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as any))
      .filter((order) => !requestedOrderId || order.id === requestedOrderId)
      .filter((order) => Array.isArray(order.items) && order.items.some((item: any) => item.productId === productId));

    if (!matchingOrders.length) {
      return NextResponse.json({ state: 'C', eligible: false, message: 'Энэ бүтээгдэхүүнийг худалдан авсан баталгаатай захиалга олдсонгүй.' });
    }

    for (const order of matchingOrders) {
      const review = await db.collection('reviews').doc(docId(userId, productId, order.id)).get();
      if (review.exists) {
        const data = review.data() || {};
        return NextResponse.json({
          state: 'B',
          eligible: false,
          message: Number(data.editCount || 0) >= 1 ? 'Энэ худалдан авалтын сэтгэгдлийг нэг удаа зассан байна.' : 'Энэ худалдан авалтад сэтгэгдэл бичсэн байна.',
          orderId: order.id,
          orderStatus: order.status || 'pending',
          existingReview: {
            id: review.id,
            ...data,
            createdAt: serializeDate(toDate(data.createdAt)),
            updatedAt: serializeDate(toDate(data.updatedAt)),
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
    const activeOrder = deliveredOrders.find((order) => {
      const deliveredAt = toDate(order.deliveredAt || order.updatedAt);
      return deliveredAt && now - deliveredAt.getTime() <= REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    });

    if (!activeOrder) {
      const order = deliveredOrders[0];
      return NextResponse.json({
        state: 'E',
        eligible: false,
        message: 'Хүргэгдсэнээс хойш 90 хоног өнгөрсөн тул сэтгэгдэл бичих хугацаа дууссан байна.',
        orderId: order.id,
        orderStatus: order.status || 'delivered',
        deliveredAt: serializeDate(toDate(order.deliveredAt || order.updatedAt)),
      });
    }

    return NextResponse.json({
      state: 'A',
      eligible: true,
      message: 'Баталгаат худалдан авалт. Та сэтгэгдэл бичиж болно.',
      orderId: activeOrder.id,
      orderStatus: activeOrder.status || 'delivered',
      deliveredAt: serializeDate(toDate(activeOrder.deliveredAt || activeOrder.updatedAt)),
    });
  } catch (error) {
    console.error('Review eligibility API failed:', error);
    return NextResponse.json({ error: 'Failed to check review eligibility' }, { status: 500 });
  }
}
