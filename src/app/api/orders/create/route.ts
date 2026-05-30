import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { sendNewOrderNotificationToAdmin } from '@/lib/emailService';
import { getAddressLabelSnapshot } from '@/lib/addressData';
import type { Order, OrderStatus } from '@/types';

type IncomingOrder = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const orderData = await req.json() as IncomingOrder;
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    const phoneDigits = String(orderData.phone || '').replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      return NextResponse.json({ error: 'Утасны дугаар хамгийн багадаа 8 оронтой байх ёстой.' }, { status: 400 });
    }
    const incomingSnapshot: any = (orderData as any).addressSnapshot || null;
    const regionId = String(incomingSnapshot?.region_id || incomingSnapshot?.regionId || '').trim();
    const districtId = String(incomingSnapshot?.district_id || incomingSnapshot?.districtId || '').trim();
    const khorooId = String(incomingSnapshot?.khoroo_id || incomingSnapshot?.khorooId || '').trim();
    const detail = String(incomingSnapshot?.detail || '').trim();
    if (!regionId || !districtId || !khorooId || detail.length < 5 || detail.length > 200) {
      return NextResponse.json({ error: 'Хүргэлтийн хаяг бүрэн биш байна.' }, { status: 400 });
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

      const year = new Date().getFullYear();
      const counterRef = db.collection('counters').doc(`orders_${year}`);
      const counterSnap = await transaction.get(counterRef);
      let nextSeq = 1;
      if (counterSnap.exists) {
        nextSeq = (counterSnap.data()?.count || 0) + 1;
        transaction.update(counterRef, { count: nextSeq });
      } else {
        transaction.set(counterRef, { count: 1 });
      }
      const orderNumber = `#${year}-${String(nextSeq).padStart(4, '0')}`;

      // Securely recalculate the promo code discount on the backend
      const promoCode = (orderData as any).promoCode || '';
      let discount = 0;
      if (promoCode.trim().toUpperCase() === 'WELCOME10') {
        discount = Math.round(calculatedSubtotal * 0.1);
      }

      const labels = await getAddressLabelSnapshot(regionId, districtId, khorooId);
      if (!labels.region || !labels.district || !labels.khoroo) {
        throw new Error('Хүргэлтийн хаягийн сонголт буруу байна.');
      }
      const addressSnapshot = {
        region_id: regionId,
        district_id: districtId,
        khoroo_id: khorooId,
        region: labels.region.name_mn,
        district: labels.district.name_mn,
        district_short: labels.district.name_short,
        khoroo: labels.khoroo.name_mn,
        detail,
        full_address: `${labels.region.name_mn}, ${labels.district.name_mn}, ${labels.khoroo.name_mn}, ${detail}`,
        full: `${labels.region.name_mn}, ${labels.district.name_mn}, ${labels.khoroo.name_mn}, ${detail}`,
      };
      const shippingCost = Math.round(Number(orderData.shippingCost || 0));
      const total = Math.max(0, Math.round(calculatedSubtotal) - discount) + shippingCost;
      const now = Timestamp.now();

      const persistedOrder = {
        ...orderData,
        id: orderRef.id,
        orderNumber,
        subtotal: Math.round(calculatedSubtotal),
        shippingCost,
        total,
        items: verifiedItems,
        status: 'pending' as OrderStatus,
        promoCode: promoCode || null,
        discount,
        addressSnapshot,
        address: addressSnapshot.full_address,
        phone: phoneDigits,
      };

      transaction.set(orderRef, {
        ...orderData,
        orderNumber,
        subtotal: persistedOrder.subtotal,
        shippingCost,
        total,
        items: verifiedItems,
        status: 'pending' as OrderStatus,
        promoCode: promoCode || null,
        discount,
        addressSnapshot,
        address_snapshot: addressSnapshot,
        address: addressSnapshot.full_address,
        phone: phoneDigits,
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
