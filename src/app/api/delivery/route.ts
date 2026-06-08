import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { firestoreToAdminOrder } from '@/lib/services/firestoreAdminService';
import { listPostgresShippedOrders, markPostgresOrderDelivered } from '@/lib/services/postgresAdminService';
import { enforceRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

function resolveDeliveryToken(settings: Record<string, unknown>): string | null {
  const fromSettings = String(settings.deliveryToken || '').trim();
  if (fromSettings) return fromSettings;
  const fromEnv = String(process.env.DELIVERY_API_TOKEN || '').trim();
  if (fromEnv) return fromEnv;
  return null;
}

// Grouping and Address Helper
function getOrderRegionInfo(order: any) {
  if (order.addressSnapshot) {
    try {
      const snap = typeof order.addressSnapshot === 'string'
        ? JSON.parse(order.addressSnapshot)
        : order.addressSnapshot;
      const region = snap.region || '';
      const district = snap.district || '';
      const isUB = region.includes('Улаанбаатар') || region.includes('УБ');
      return {
        regionName: isUB ? 'Улаанбаатар' : region,
        districtName: district,
        districtShort: snap.district_short || district,
        khoroo: snap.khoroo || '',
        detail: snap.detail || '',
        isUB
      };
    } catch (err) {
      console.error('Error parsing address snapshot:', err);
    }
  }

  const addr = String(order.shippingAddress || '');
  const isUB = addr.includes('Улаанбаатар') || addr.includes('УБ') || addr.includes('БЗД') || addr.includes('СБД') || addr.includes('ХУД') || addr.includes('ЧД') || addr.includes('БГД') || addr.includes('СХД') || addr.includes('НД') || addr.includes('ЗД');

  let regionName = 'Орон нутаг';
  let districtName = '';
  let districtShort = '';
  
  if (isUB) {
    regionName = 'Улаанбаатар';
    if (addr.includes('Баянзүрх') || addr.includes('БЗД')) { districtName = 'Баянзүрх дүүрэг'; districtShort = 'БЗД'; }
    else if (addr.includes('Сүхбаатар') || addr.includes('СБД')) { districtName = 'Сүхбаатар дүүрэг'; districtShort = 'СБД'; }
    else if (addr.includes('Хан-Уул') || addr.includes('ХУД')) { districtName = 'Хан-Уул дүүрэг'; districtShort = 'ХУД'; }
    else if (addr.includes('Чингэлтэй') || addr.includes('ЧД')) { districtName = 'Чингэлтэй дүүрэг'; districtShort = 'ЧД'; }
    else if (addr.includes('Баянгол') || addr.includes('БГД')) { districtName = 'Баянгол дүүрэг'; districtShort = 'БГД'; }
    else if (addr.includes('Сонгинохайрхан') || addr.includes('СХД')) { districtName = 'Сонгинохайрхан дүүрэг'; districtShort = 'СХД'; }
    else if (addr.includes('Налайх') || addr.includes('НД')) { districtName = 'Налайх дүүрэг'; districtShort = 'НД'; }
    else if (addr.includes('Зайсан') || addr.includes('ЗД')) { districtName = 'Зайсан дүүрэг'; districtShort = 'ЗД'; }
    else if (addr.includes('Хэнтий') || addr.includes('ХЭД')) { districtName = 'Хэнтий дүүрэг'; districtShort = 'ХЭД'; }
    else { districtName = 'Бусад дүүрэг'; districtShort = 'Бусад'; }
  } else {
    const aimags = ['Дархан', 'Орхон', 'Эрдэнэт', 'Сэлэнгэ', 'Завхан', 'Хөвсгөл', 'Өвөрхангай', 'Өмнөговь', 'Баянхонгор', 'Архангай', 'Баян-Өлгий', 'Булган', 'Говь-Алтай', 'Говьсүмбэр', 'Дорнод', 'Дорноговь', 'Дундговь', 'Сүхбаатар', 'Төв', 'Увс', 'Ховд', 'Хэнтий'];
    for (const aimag of aimags) {
      if (addr.toLowerCase().includes(aimag.toLowerCase())) {
        regionName = aimag.includes('аймаг') ? aimag : `${aimag} аймаг`;
        break;
      }
    }
    const parts = addr.split(',');
    if (parts.length > 1) {
      districtName = parts[1].trim();
      districtShort = districtName;
    } else {
      districtName = 'Бусад сум';
      districtShort = 'Бусад';
    }
  }

  return {
    regionName,
    districtName,
    districtShort,
    khoroo: '',
    detail: addr,
    isUB
  };
}

export async function GET(req: NextRequest) {
  const limited = await enforceRateLimit(req, { key: 'delivery-get', limit: 30, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const tokenParam = searchParams.get('token');

    if (!tokenParam) {
      return NextResponse.json({ error: 'Түлхүүр хоосон байна' }, { status: 400 });
    }

    const db = getAdminDb();
    const settingsDoc = await db.collection('settings').doc('main').get();
    const settings = settingsDoc.data() || {};
    const validToken = resolveDeliveryToken(settings);
    if (!validToken) {
      return NextResponse.json({ error: 'Хүргэлтийн API тохируулагдаагүй байна' }, { status: 503 });
    }
    if (tokenParam !== validToken) {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 401 });
    }

    // Postgres-first: шинэ захиалгууд Postgres-д, хуучин нь Firestore-д байж болно.
    // Хоёуланг нь нэгтгэж (Postgres давуу эрхтэй) id-аар давхцлыг арилгана.
    const merged = new Map<string, any>();
    try {
      const pgOrders = await listPostgresShippedOrders();
      pgOrders.forEach((order) => merged.set(order.id, order));
    } catch (error) {
      console.warn('Postgres shipped orders failed, using Firestore only:', error);
    }
    try {
      const snap = await db.collection('orders').where('status', '==', 'shipped').get();
      snap.docs.forEach((doc) => {
        if (!merged.has(doc.id)) merged.set(doc.id, firestoreToAdminOrder(doc.id, doc.data()));
      });
    } catch (error) {
      console.warn('Firestore shipped orders failed:', error);
    }
    let shippedOrders = Array.from(merged.values());

    // Filter by date if provided
    if (dateParam) {
      shippedOrders = shippedOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        // Format to local date string (Asia/Ulaanbaatar)
        const year = orderDate.toLocaleDateString('en-US', { timeZone: 'Asia/Ulaanbaatar', year: 'numeric' });
        const month = orderDate.toLocaleDateString('en-US', { timeZone: 'Asia/Ulaanbaatar', month: '2-digit' });
        const day = orderDate.toLocaleDateString('en-US', { timeZone: 'Asia/Ulaanbaatar', day: '2-digit' });
        const orderDateStr = `${year}-${month}-${day}`;
        return orderDateStr === dateParam;
      });
    }

    // Attach parsed region/district info to each order
    const ordersWithRegions = shippedOrders.map(order => {
      const regionInfo = getOrderRegionInfo(order);
      return {
        ...order,
        regionInfo
      };
    });

    return NextResponse.json({
      success: true,
      orders: ordersWithRegions,
      storeName: settings.storeName || 'UJ Cosmetic',
      storePhone: settings.storePhone || settings.phone || ''
    });

  } catch (error: any) {
    console.error('Rider api GET failed:', error);
    return NextResponse.json({ error: error.message || 'Дотоод алдаа гарлаа' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const limited = await enforceRateLimit(req, { key: 'delivery-patch', limit: 30, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const { orderId, token, status } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 });
    }

    const db = getAdminDb();
    const settingsDoc = await db.collection('settings').doc('main').get();
    const settings = settingsDoc.data() || {};
    const validToken = resolveDeliveryToken(settings);
    if (!validToken) {
      return NextResponse.json({ error: 'Хүргэлтийн API тохируулагдаагүй байна' }, { status: 503 });
    }
    if (token !== validToken) {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 });
    }

    if (status !== 'delivered') {
      return NextResponse.json({ error: 'Буруу төлөв' }, { status: 400 });
    }

    // Postgres-first: захиалга Postgres-д байвал тэндээ, эс бөгөөс Firestore-д шинэчилнэ.
    let orderData: any = null;
    const pgOrder = await markPostgresOrderDelivered(orderId).catch((error) => {
      console.warn('Postgres deliver failed:', error);
      return null;
    });

    if (pgOrder) {
      orderData = {
        customerName: pgOrder.customerName,
        customerEmail: pgOrder.customerEmail,
        total: pgOrder.total,
        shippingCost: pgOrder.shippingCost,
        shippingAddress: pgOrder.shippingAddress,
        items: pgOrder.items.map((item) => ({ name: item.name, name_mn: item.name })),
        userId: pgOrder.userId,
      };
    } else {
      const orderRef = db.collection('orders').doc(orderId);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists) {
        return NextResponse.json({ error: 'Захиалга олдсонгүй' }, { status: 404 });
      }
      await orderRef.update({ status: 'delivered', updatedAt: new Date() });
      orderData = orderSnap.data();
    }

    // Хэрэглэгчид Postgres мэдэгдэл (нэвтэрсэн хэрэглэгчийн захиалга бол)
    if (orderData?.userId) {
      try {
        const { notifyPostgresUsers } = await import('@/lib/services/postgresAdminService');
        await notifyPostgresUsers([orderData.userId], {
          title: 'Захиалга хүргэгдлээ',
          message: 'Таны захиалга амжилттай хүргэгдлээ. Сэтгэгдлээ үлдээгээрэй!',
          type: 'ORDER',
          href: '/profile/orders',
        });
      } catch (err) {
        console.error('Postgres delivery notification failed:', err);
      }
    }

    // Send notifications in parallel
    try {
      const customerEmail = orderData?.customerEmail || orderData?.email;
      if (customerEmail) {
        const { sendOrderStatusNotification, sendPostDeliveryReviewInvitation } = await import('@/lib/emailService');
        await sendOrderStatusNotification(customerEmail, {
          id: orderId,
          customerName: orderData?.customerName || 'UJ customer',
          status: 'delivered',
          items: orderData?.items || [],
          total: Number(orderData?.total || 0),
          shippingCost: Number(orderData?.shippingCost || 0),
          address: orderData?.address || orderData?.shippingAddress || '',
        });
        await sendPostDeliveryReviewInvitation(customerEmail, {
          productName: orderData?.items?.[0]?.name_mn || orderData?.items?.[0]?.name || 'UJ Beauty бүтээгдэхүүн',
          reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account`
        }).catch(err => console.error('Rider delivery review email failed:', err));
      }
    } catch (err) {
      console.error('Failed sending post-delivery notifications:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Rider api PATCH failed:', error);
    return NextResponse.json({ error: error.message || 'Алдаа гарлаа' }, { status: 500 });
  }
}
