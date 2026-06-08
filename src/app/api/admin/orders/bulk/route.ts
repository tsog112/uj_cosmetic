import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOrderStatusNotification, sendPostDeliveryReviewInvitation } from '@/lib/emailService';
import { bulkUpdatePostgresAdminOrders } from '@/lib/services/postgresAdminService';
import { orderStatusNotificationContent } from '@/lib/userOrderNotifications';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export const runtime = 'nodejs';

const EMAIL_STATUSES = new Set(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path}`;
}

export async function PATCH(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const { order_ids, action } = body;

    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json({ error: 'Order IDs list must be a non-empty array' }, { status: 400 });
    }

    const validActions = ['advance', 'confirm_payment', 'prepare', 'ship', 'deliver', 'cancel', 'archive', 'unarchive'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

    const { updatedCount, skippedCount, updatedOrders } = await bulkUpdatePostgresAdminOrders(order_ids, action);

    if (updatedCount > 0 && !['archive', 'unarchive'].includes(action)) {
      void Promise.allSettled(
        updatedOrders.map(async (orderData) => {
          const newStatus = orderData.status;

          if (orderData.userId) {
            try {
              const copy = orderStatusNotificationContent(newStatus, orderData.orderNumber || orderData.id);
              await prisma.notification.create({
                data: {
                  type: 'ORDER_STATUS',
                  userId: orderData.userId,
                  orderId: orderData.id,
                  title: copy.title,
                  body: copy.body,
                  href: copy.href,
                  channel: 'in_app',
                  status: 'unread',
                },
              });
            } catch (err) {
              console.error(`In-app notification for order ${orderData.id} failed:`, err);
            }
          }

          if (newStatus === 'delivered') {
            try {
              const firstItem: any = orderData.items?.[0];
              const productSlug = firstItem?.productSlug || '';
              const href = productSlug ? `/shop/${productSlug}?reviewOrderId=${orderData.id}` : '/account';

              if (orderData.userId) {
                await prisma.notification.create({
                  data: {
                    type: 'REVIEW_REQUEST',
                    userId: orderData.userId,
                    orderId: orderData.id,
                    title: 'Сэтгэгдэл бичих боломжтой боллоо',
                    body: 'Таны захиалга хүргэгдсэн тул худалдан авсан бүтээгдэхүүндээ сэтгэгдэл үлдээгээрэй.',
                    href,
                    channel: 'email',
                    status: 'unread',
                  },
                });
              }

              if (orderData.customerEmail && firstItem) {
                await sendPostDeliveryReviewInvitation(orderData.customerEmail, {
                  productName: firstItem.product?.name || firstItem.name || 'UJ Beauty бүтээгдэхүүн',
                  reviewUrl: appUrl(href),
                });
              }
            } catch (err) {
              console.error(`Post-delivery notifications for order ${orderData.id} failed:`, err);
            }
          }

          if (EMAIL_STATUSES.has(newStatus) && orderData.customerEmail) {
            try {
              await sendOrderStatusNotification(orderData.customerEmail, {
                id: orderData.id,
                customerName: orderData.customerName || 'UJ customer',
                status: newStatus as 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
                items: (orderData.items || []).map((item: any) => ({
                  name: item.product?.name || item.name || 'Бүтээгдэхүүн',
                  quantity: Number(item.quantity || 1),
                  price: Number(item.price || item.product?.price || 0),
                })),
                total: Number(orderData.total || 0),
                shippingCost: Number(orderData.shippingCost || 0),
                address: orderData.shippingAddress || '',
              });
            } catch (err) {
              console.error(`Status email for order ${orderData.id} failed:`, err);
            }
          }
        }),
      );
    }

    return NextResponse.json({ updatedCount, skippedCount });
  } catch (error) {
    console.error('Bulk order processing failed:', error);
    return NextResponse.json({ error: 'Failed to process bulk orders' }, { status: 500 });
  }
}
