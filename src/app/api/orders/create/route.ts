import { NextRequest, NextResponse } from 'next/server';
import { optionalAuthSession } from '@/lib/auth/serverAuth';
import { resolveCoupon } from '@/lib/coupons';
import { enforceRateLimit } from '@/lib/rateLimit';
import { getAddressLabelSnapshot } from '@/lib/addressData';
import { validatePhoneNumber } from '@/lib/phoneUtils';
import { toE164 } from '@/lib/currency';
import { sendNewOrderNotificationToAdmin } from '@/lib/emailService';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { invalidatePostgresAdminCache } from '@/lib/services/postgresAdminService';
import type { Order } from '@/types';

type IncomingOrder = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;

export const runtime = 'nodejs';

/**
 * Захиалгын дугаарыг Postgres sequence-ээр атомик үүсгэнэ.
 * count()+1 нь concurrent орчинд давхцал үүсгэдэг тул sequence ашиглана
 * (lock-free, гацаалтгүй). Амжилтгүй захиалгад дугаарын завсар үлдэж болох ч
 * энэ нь хүлээн зөвшөөрөгдөх бөгөөд давхцлаас илүү дээр.
 */
async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = `order_seq_${year}`;
  await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "${seq}"`);
  const rows = await prisma.$queryRawUnsafe<Array<{ n: bigint }>>(`SELECT nextval('"${seq}"') AS n`);
  const n = Number(rows?.[0]?.n ?? 1);
  return `#${year}-${String(n).padStart(4, '0')}`;
}

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, { key: 'orders-create', limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const session = await optionalAuthSession(req);
    const orderData = await req.json() as IncomingOrder;
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const market = (orderData as any).market === 'KR' ? 'KR' : 'MN';
    const currency = (orderData as any).currency === 'KRW' ? 'KRW' : 'MNT';
    const phoneRaw = String(orderData.phone || '');
    const phoneCountry = String((orderData as any).phoneCountry || (market === 'KR' ? '+82' : '+976'));
    let phoneLocal = String((orderData as any).phoneLocal || '').replace(/\D/g, '');
    if (!phoneLocal) {
      const allDigits = phoneRaw.replace(/\D/g, '');
      const codeDigits = phoneCountry.replace(/\D/g, '');
      phoneLocal = allDigits.startsWith(codeDigits) ? allDigits.slice(codeDigits.length) : allDigits;
    }
    const phoneCheck = validatePhoneNumber(phoneCountry, phoneLocal);
    if (!phoneCheck.isValid) {
      return NextResponse.json({ error: phoneCheck.error || 'Утасны дугаар буруу байна.' }, { status: 400 });
    }
    const phoneDigits = toE164(phoneCountry, phoneLocal).replace(/\D/g, '');

    const incomingSnapshot: any = (orderData as any).addressSnapshot || null;
    let addressSnapshot: Prisma.InputJsonValue;
    let shippingAddress: string;

    if (market === 'KR') {
      const zonecode = String(incomingSnapshot?.zonecode || '').trim();
      const roadAddress = String(incomingSnapshot?.roadAddress || '').trim();
      const detail = String(incomingSnapshot?.detail || '').trim();
      if (!zonecode || !roadAddress || detail.length < 3 || detail.length > 200) {
        return NextResponse.json({ error: '한국 배송 주소가 완전하지 않습니다.' }, { status: 400 });
      }
      const full = String(incomingSnapshot?.full || `[${zonecode}] ${roadAddress}, ${detail}`);
      addressSnapshot = {
        type: 'kr',
        zonecode,
        roadAddress,
        jibunAddress: String(incomingSnapshot?.jibunAddress || ''),
        buildingName: String(incomingSnapshot?.buildingName || ''),
        detail,
        full,
        full_address: full,
      };
      shippingAddress = full;
    } else {
      const regionId = String(incomingSnapshot?.region_id || incomingSnapshot?.regionId || '').trim();
      const districtId = String(incomingSnapshot?.district_id || incomingSnapshot?.districtId || '').trim();
      const khorooId = String(incomingSnapshot?.khoroo_id || incomingSnapshot?.khorooId || '').trim();
      const detail = String(incomingSnapshot?.detail || '').trim();
      if (!regionId || !districtId || !khorooId || detail.length < 5 || detail.length > 200) {
        return NextResponse.json({ error: 'Хүргэлтийн хаяг бүрэн биш байна.' }, { status: 400 });
      }

      const labels = await getAddressLabelSnapshot(regionId, districtId, khorooId);
      if (!labels.region || !labels.district || !labels.khoroo) {
        return NextResponse.json({ error: 'Хүргэлтийн хаягийн сонголт буруу байна.' }, { status: 400 });
      }

      addressSnapshot = {
        type: 'mn',
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
      shippingAddress = String(addressSnapshot.full_address);
    }

    const paymentMethod = String((orderData as any).paymentMethod || 'bank_transfer');
    if (market === 'KR' && paymentMethod === 'qpay') {
      return NextResponse.json({ error: 'Солонгос захиалгад QPay ашиглах боломжгүй.' }, { status: 400 });
    }

    const orderNumber = await nextOrderNumber();
    let savedOrder: any = null;
    const createdOrder = await prisma.$transaction(async (tx) => {
      let calculatedSubtotal = 0;
      const verifiedItems: Array<{
        productId: string;
        productSlug: string;
        name_mn: string;
        price: number;
        quantity: number;
        imageUrl: string;
      }> = [];

      for (const item of orderData.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        const requestedQuantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
        if (product.published === false || product.isVisible === false) {
          throw new Error(`"${product.nameMn || product.name || item.name_mn}" бараа одоогоор боломжгүй байна.`);
        }

        // Атомик нөөц хасалт — concurrent захиалгад илүү зарахаас (oversell) сэргийлнэ.
        // Уншсан утга дээр биш, нөхцөлт UPDATE-ийн нөлөөлсөн мөрийн тоон дээр түшиглэнэ.
        const decremented = await tx.product.updateMany({
          where: { id: product.id, stockQuantity: { gte: requestedQuantity } },
          data: {
            stockQuantity: { decrement: requestedQuantity },
            stock: { decrement: requestedQuantity },
            orderCount: { increment: requestedQuantity },
          },
        });
        if (decremented.count === 0) {
          throw new Error(`"${product.nameMn || product.name || item.name_mn}" барааны нөөц хүрэлцэхгүй байна.`);
        }

        const actualPrice = Number(product.salePrice ?? product.price ?? item.price ?? 0);
        const images = Array.isArray(product.images) ? product.images : [];
        calculatedSubtotal += actualPrice * requestedQuantity;
        verifiedItems.push({
          productId: item.productId,
          productSlug: product.slug || item.productSlug || '',
          name_mn: product.nameMn || product.name || item.name_mn || '',
          price: Math.round(actualPrice),
          quantity: requestedQuantity,
          imageUrl: String(images[0] || item.imageUrl || ''),
        });
      }

      const subtotal = Math.round(calculatedSubtotal);
      // Хөнгөлөлтийг ХЭЗЭЭ Ч клиентээс авахгүй — сервер талд дахин тооцоолно
      const resolved = await resolveCoupon((orderData as any).promoCode, subtotal);
      const promoCode = resolved?.code || null;
      const discount = resolved?.discount || 0;
      const shippingCost = Math.round(Number(orderData.shippingCost || 0));
      const total = Math.max(0, subtotal - discount) + shippingCost;

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: session?.uid ?? null,
          customerName: orderData.customerName || '',
          customerEmail: (orderData as any).customerEmail || (orderData as any).email || '',
          customerPhone: phoneDigits,
          phone: phoneDigits,
          status: 'pending',
          subtotal,
          shippingCost,
          discount,
          total,
          promoCode,
          shippingAddress,
          addressSnapshot,
          market,
          currency,
          paymentMethod,
          paymentStatus: String((orderData as any).paymentStatus || 'unpaid'),
          items: {
            create: verifiedItems.map((item) => ({
              productId: item.productId,
              name: item.name_mn,
              imageUrl: item.imageUrl,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: true },
      });

      savedOrder = {
        ...orderData,
        id: order.id,
        orderNumber,
        subtotal,
        shippingCost,
        total,
        items: verifiedItems,
        status: 'pending',
        promoCode: promoCode || null,
        discount,
        addressSnapshot,
        address: shippingAddress,
        phone: toE164(phoneCountry, phoneLocal),
        market,
        currency,
      };

      return order;
    });

    invalidatePostgresAdminCache();

    if (savedOrder) {
      try {
        const settingsRow = await prisma.setting.findUnique({ where: { key: 'store_settings' } }).catch(() => null);
        const settings = (settingsRow?.value || {}) as any;
        const bankLabel = market === 'KR'
          ? `${settings.krBankName || 'Bank'}: ${settings.krBankAccount || '-'}`
          : `${settings.bankName || 'Банк'}: ${settings.bankAccount || '-'}`;
        await sendNewOrderNotificationToAdmin({
          id: createdOrder.id,
          customerName: savedOrder.customerName,
          phone: savedOrder.phone,
          address: savedOrder.address,
          items: savedOrder.items,
          total: savedOrder.total,
          bankAccount: bankLabel,
        });
      } catch (emailError: any) {
        console.error('Admin new order email failed:', emailError?.message || emailError);
      }
    }

    return NextResponse.json({ id: createdOrder.id });
  } catch (error: any) {
    console.error('Create order API failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 400 });
  }
}
