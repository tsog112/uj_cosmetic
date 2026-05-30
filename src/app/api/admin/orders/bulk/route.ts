import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { firestoreToAdminOrder } from '@/lib/services/firestoreAdminService';
import { sendOrderStatusNotification, sendPostDeliveryReviewInvitation } from '@/lib/emailService';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const EMAIL_STATUSES = new Set(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const ACTION_STATUS_MAP: Record<string, string> = {
  confirm_payment: 'confirmed',
  prepare: 'processing',
  ship: 'shipped',
  deliver: 'delivered',
  cancel: 'cancelled',
};

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path}`;
}

export async function PATCH(req: NextRequest) {
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

    const db = getAdminDb();
    let updatedCount = 0;
    let skippedCount = 0;
    const updatedOrders: any[] = [];

    // Process order updates in bulk using a Firestore batch for speed and atomic consistency
    const batch = db.batch();
    
    // Fetch and validate status transitions for all orders first
    const orderDocs = await Promise.all(
      order_ids.map(id => db.collection('orders').doc(id).get())
    );

    for (const doc of orderDocs) {
      if (!doc.exists) {
        skippedCount++;
        continue;
      }

      const data = doc.data()!;

      if (action === 'archive') {
        batch.update(doc.ref, {
          archived: true,
          archivedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        updatedCount++;
        continue;
      } else if (action === 'unarchive') {
        batch.update(doc.ref, {
          archived: false,
          archivedAt: null,
          updatedAt: FieldValue.serverTimestamp(),
        });
        updatedCount++;
        continue;
      }

      const currentStatus = data.status || 'pending';
      let nextStatus = '';

      if (action === 'advance') {
        const currentIndex = STATUS_FLOW.indexOf(currentStatus);
        if (currentIndex !== -1 && currentIndex < STATUS_FLOW.length - 1) {
          nextStatus = STATUS_FLOW[currentIndex + 1];
        } else {
          skippedCount++;
          continue;
        }
      } else {
        const mapped = ACTION_STATUS_MAP[action];
        if (mapped && currentStatus !== mapped) {
          nextStatus = mapped;
        } else {
          skippedCount++;
          continue;
        }
      }

      if (nextStatus) {
        batch.update(doc.ref, {
          status: nextStatus,
          updatedAt: FieldValue.serverTimestamp(),
        });
        
        // Push the update order info for post-commit email dispatch
        updatedOrders.push({
          id: doc.id,
          newStatus: nextStatus,
          orderData: firestoreToAdminOrder(doc.id, { ...data, status: nextStatus, updatedAt: new Date() }),
        });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await batch.commit();
      
      // Sync to SQLite in bulk if the action is archive/unarchive
      if (action === 'archive' || action === 'unarchive') {
        try {
          const { PrismaClient } = await import('@prisma/client');
          const prisma = new PrismaClient();
          const archived = action === 'archive';
          const archivedAt = archived ? new Date() : null;
          await prisma.order.updateMany({
            where: { id: { in: order_ids } },
            data: { archived, archivedAt }
          });
        } catch (err) {
          console.error('Failed to sync bulk archive status to SQLite:', err);
        }
      }
      
      // Dispatch background emails and schedule review invites for all updated orders in parallel
      void Promise.allSettled(
        updatedOrders.map(async (entry) => {
          const { id, newStatus, orderData } = entry;
          
          // Handle Delivered review notifications and invitation emails
          if (newStatus === 'delivered') {
            try {
              const firstItem: any = orderData.items?.[0];
              const productSlug = firstItem?.productSlug || '';
              const href = productSlug ? `/shop/${productSlug}?reviewOrderId=${orderData.id}` : '/account';
              
              await db.collection('notifications').add({
                type: 'REVIEW_REQUEST',
                userId: orderData.userId || '',
                orderId: orderData.id,
                title: 'Сэтгэгдэл бичих боломжтой боллоо',
                body: 'Таны захиалга хүргэгдсэн тул худалдан авсан бүтээгдэхүүндээ сэтгэгдэл үлдээгээрэй.',
                href,
                channel: 'email',
                status: 'scheduled',
                createdAt: new Date(),
                scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
              });

              if (orderData.customerEmail && firstItem) {
                await sendPostDeliveryReviewInvitation(orderData.customerEmail, {
                  productName: firstItem.product?.name || firstItem.name_mn || firstItem.name || 'UJ Beauty бүтээгдэхүүн',
                  reviewUrl: appUrl(href),
                });
              }
            } catch (err) {
              console.error(`Post-delivery notifications for order ${id} failed:`, err);
            }
          }

          // Handle standard status change notification email
          if (EMAIL_STATUSES.has(newStatus) && orderData.customerEmail) {
            try {
              await sendOrderStatusNotification(orderData.customerEmail, {
                id: orderData.id,
                customerName: orderData.customerName || 'UJ customer',
                status: newStatus as 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
                items: (orderData.items || []).map((item: any) => ({
                  name: item.product?.name || item.name_mn || item.name || 'Бүтээгдэхүүн',
                  quantity: Number(item.quantity || 1),
                  price: Number(item.price || item.product?.price || 0),
                })),
                total: Number(orderData.total || 0),
                shippingCost: Number(orderData.shippingCost || 0),
                address: orderData.shippingAddress || '',
              });
            } catch (err) {
              console.error(`Status email for order ${id} failed:`, err);
            }
          }
        })
      );
    }

    return NextResponse.json({ updatedCount, skippedCount });
  } catch (error) {
    console.error('Bulk order processing failed:', error);
    return NextResponse.json({ error: 'Failed to process bulk orders' }, { status: 500 });
  }
}
