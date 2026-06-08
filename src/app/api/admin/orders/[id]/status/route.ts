import { NextRequest, NextResponse } from 'next/server';
import { ORDER_STATUS_VALUES, normalizeAdminOrderStatus } from '@/lib/constants/admin';
import { prisma } from '@/lib/prisma';
import { updatePostgresAdminOrderStatus } from '@/lib/services/postgresAdminService';
import { sendOrderStatusNotification, sendPostDeliveryReviewInvitation } from '@/lib/emailService';
import { orderStatusNotificationContent } from '@/lib/userOrderNotifications';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export const runtime = 'nodejs';

const EMAIL_STATUSES = new Set(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path}`;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const { status } = await req.json();
    const normalized = normalizeAdminOrderStatus(status);

    if (!ORDER_STATUS_VALUES.includes(normalized)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await updatePostgresAdminOrderStatus(id, normalized);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId) {
      try {
        const copy = orderStatusNotificationContent(normalized, order.orderNumber || order.id);
        await prisma.notification.create({
          data: {
            type: 'ORDER_STATUS',
            userId: order.userId,
            orderId: order.id,
            title: copy.title,
            body: copy.body,
            href: copy.href,
            channel: 'in_app',
            status: 'unread',
          },
        });
      } catch (notificationError) {
        console.error('In-app order notification failed:', notificationError);
      }
    }

    if (normalized === 'delivered') {
      try {
        const firstItem: any = order.items?.[0];
        const productSlug = firstItem?.productSlug || '';
        const href = productSlug ? `/shop/${productSlug}?reviewOrderId=${order.id}` : '/account';
        await prisma.notification.create({ data: {
          type: 'REVIEW_REQUEST',
          userId: order.userId || '',
          orderId: order.id,
          title: 'Сэтгэгдэл бичих боломжтой боллоо',
          body: 'Таны захиалга хүргэгдсэн тул худалдан авсан бүтээгдэхүүндээ сэтгэгдэл үлдээгээрэй.',
          href,
          channel: 'email',
          status: 'unread',
        }});

        if (order.customerEmail && firstItem) {
          await sendPostDeliveryReviewInvitation(order.customerEmail, {
            productName: firstItem.name_mn || firstItem.name || 'UJ Beauty бүтээгдэхүүн',
            reviewUrl: appUrl(href),
          });
        }
      } catch (notificationError) {
        console.error('Review request email notification failed:', notificationError);
      }
    }

    let emailSent = false;
    if (EMAIL_STATUSES.has(normalized) && order.customerEmail) {
      try {
        await sendOrderStatusNotification(order.customerEmail, {
          id: order.id,
          customerName: order.customerName || 'UJ customer',
          status: normalized as 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
          items: (order.items || []).map((item: any) => ({
            name: item.product?.name || item.name_mn || item.name || 'Бүтээгдэхүүн',
            quantity: Number(item.quantity || 1),
            price: Number(item.price || item.product?.price || 0),
          })),
          total: Number(order.total || 0),
          shippingCost: Number(order.shippingCost || 0),
          address: order.shippingAddress || '',
        });
        emailSent = true;
      } catch (emailError: any) {
        console.error('Order status email failed:', emailError?.message || emailError);
      }
    }

    return NextResponse.json({ ...order, emailSent });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
