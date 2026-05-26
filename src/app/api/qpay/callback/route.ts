import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { checkQPayInvoice } from '@/lib/qpay';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const orderRef = getAdminDb().collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const invoiceId = orderSnap.data()?.qpayInvoiceId;
    if (!invoiceId) {
      return NextResponse.json({ error: 'QPay invoice not found' }, { status: 400 });
    }

    const payment = await checkQPayInvoice(invoiceId);
    const paidRow = payment.rows?.find(row => row.payment_status === 'PAID');

    if (paidRow || Number(payment.count || 0) > 0) {
      await orderRef.set({
        status: 'confirmed',
        paymentStatus: 'paid',
        qpayPaidAmount: Number(payment.paid_amount || paidRow?.payment_amount || 0),
        qpayPaymentId: paidRow?.payment_id || '',
        paidAt: paidRow?.payment_date ? new Date(paidRow.payment_date) : new Date(),
        updatedAt: new Date(),
      }, { merge: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('QPay callback error:', error);
    return NextResponse.json({ error: error.message || 'QPay callback failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
