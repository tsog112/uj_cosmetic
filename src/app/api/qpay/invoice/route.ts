import { NextResponse } from 'next/server';
import { createQPayInvoice } from '@/lib/qpay';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderSnap.data()!;
    const invoice = await createQPayInvoice({
      orderId,
      customerCode: order.userId || order.phone || 'customer',
      description: `UJ Cosmetic захиалга #${orderId.slice(0, 8)}`,
      amount: Number(order.total || 0),
    });

    await orderRef.set({
      paymentMethod: 'qpay',
      paymentStatus: 'pending',
      qpayInvoiceId: invoice.invoice_id,
      qpayQrText: invoice.qr_text || '',
      qpayQrImage: invoice.qr_image || '',
      qpayShortUrl: invoice.qPay_shortUrl || '',
      updatedAt: new Date(),
    }, { merge: true });

    return NextResponse.json({
      invoiceId: invoice.invoice_id,
      qrText: invoice.qr_text || '',
      qrImage: invoice.qr_image || '',
      shortUrl: invoice.qPay_shortUrl || '',
      urls: invoice.urls || [],
    });
  } catch (error: any) {
    console.error('QPay invoice error:', error);
    return NextResponse.json({ error: error.message || 'QPay invoice failed' }, { status: 500 });
  }
}
