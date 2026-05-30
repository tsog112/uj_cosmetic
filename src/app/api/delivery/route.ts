import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { firestoreToAdminOrder } from '@/lib/services/firestoreAdminService';

export const runtime = 'nodejs';

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
    const validToken = settings.deliveryToken || 'uj-rider-secure-2026';

    if (tokenParam !== validToken) {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй хандалт' }, { status: 401 });
    }

    // Query all orders with status 'shipped'
    const snap = await db.collection('orders').where('status', '==', 'shipped').get();
    let shippedOrders = snap.docs.map(doc => firestoreToAdminOrder(doc.id, doc.data()));

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
  try {
    const { orderId, token, status } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 });
    }

    const db = getAdminDb();
    const settingsDoc = await db.collection('settings').doc('main').get();
    const settings = settingsDoc.data() || {};
    const validToken = settings.deliveryToken || 'uj-rider-secure-2026';

    if (token !== validToken) {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 });
    }

    if (status !== 'delivered') {
      return NextResponse.json({ error: 'Буруу төлөв' }, { status: 400 });
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Захиалга олдсонгүй' }, { status: 404 });
    }

    await orderRef.update({
      status: 'delivered',
      updatedAt: new Date()
    });

    // Send notifications in parallel
    try {
      const orderData = orderSnap.data();
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
