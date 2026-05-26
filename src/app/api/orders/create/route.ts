import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { sendNewOrderNotificationToAdmin } from '@/lib/emailService';
import type { Order, OrderStatus } from '@/types';

type IncomingOrder = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const orderData = await req.json() as IncomingOrder;
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc();

    let savedOrder: any = null;

    await db.runTransaction(async (transaction) => {
      let calculatedSubtotal = 0;
      const verifiedItems = [];

      for (const item of orderData.items) {
        const productRef = db.collection('products').doc(item.productId);
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const product = productSnap.data() || {};
        const stockQuantity = Number(product.stockQuantity ?? product.stock ?? 0);
        const requestedQuantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
        if (product.published === false || product.isVisible === false || stockQuantity < requestedQuantity) {
          throw new Error(`"${product.name_mn || product.name || item.name_mn}" барааны нөөц хүрэлцэхгүй байна.`);
        }

        const actualPrice = Number(product.salePrice ?? product.price ?? item.price ?? 0);
        calculatedSubtotal += actualPrice * requestedQuantity;
        verifiedItems.push({
          productId: item.productId,
          productSlug: product.slug ?? item.productSlug ?? '',
          name_mn: product.name_mn ?? product.name ?? item.name_mn,
          price: Math.round(actualPrice),
          quantity: requestedQuantity,
          imageUrl: Array.isArray(product.images) ? product.images[0] || '' : item.imageUrl || '',
        });

        const nextStockQuantity = Math.max(0, stockQuantity - requestedQuantity);
        transaction.update(productRef, {
          stockQuantity: nextStockQuantity,
          inStock: nextStockQuantity > 0,
          orderCount: FieldValue.increment(requestedQuantity),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      const shippingCost = Math.round(Number(orderData.shippingCost || 0));
      const total = Math.round(calculatedSubtotal) + shippingCost;
      const now = Timestamp.now();

      const persistedOrder = {
        ...orderData,
        id: orderRef.id,
        subtotal: Math.round(calculatedSubtotal),
        shippingCost,
        total,
        items: verifiedItems,
        status: 'pending' as OrderStatus,
      };

      transaction.set(orderRef, {
        ...orderData,
        subtotal: persistedOrder.subtotal,
        shippingCost,
        total,
        items: verifiedItems,
        status: 'pending' as OrderStatus,
        createdAt: now,
        updatedAt: now,
      });

      savedOrder = persistedOrder;
    });

    if (savedOrder) {
      try {
        const settingsDoc = await db.collection('settings').doc('main').get();
        const settings = settingsDoc.data() || {};
        await sendNewOrderNotificationToAdmin({
          id: orderRef.id,
          customerName: savedOrder.customerName,
          phone: savedOrder.phone,
          address: savedOrder.address,
          items: savedOrder.items,
          total: savedOrder.total,
          bankAccount: `${settings.bankName || 'Банк'}: ${settings.bankAccount || '-'}`,
        });
      } catch (emailError: any) {
        console.error('Admin new order email failed:', emailError?.message || emailError);
      }
    }

    return NextResponse.json({ id: orderRef.id });
  } catch (error: any) {
    console.error('Create order API failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 400 });
  }
}
