import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { checkQPayInvoice } from '@/lib/qpay';

export const runtime = 'nodejs';

async function markPaid(orderId: string, invoiceId: string) {
  const payment = await checkQPayInvoice(invoiceId);
  const paidRow = payment.rows?.find(row => row.payment_status === 'PAID');
  const paidAmount = Number(payment.paid_amount || paidRow?.payment_amount || 0);
  const paid = Boolean(paidRow) || Number(payment.count || 0) > 0;

  if (paid) {
    await getAdminDb().collection('orders').doc(orderId).set({
      status: 'confirmed',
      paymentStatus: 'paid',
      qpayPaidAmount: paidAmount,
      qpayPaymentId: paidRow?.payment_id || '',
      paidAt: paidRow?.payment_date ? new Date(paidRow.payment_date) : new Date(),
      updatedAt: new Date(),
    }, { merge: true });
  }

  return {
    paid,
    paidAmount,
    paymentId: paidRow?.payment_id || '',
  };
}

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const orderSnap = await getAdminDb().collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderSnap.data()!;
    if (!order.qpayInvoiceId) {
      return NextResponse.json({ error: 'QPay invoice not found' }, { status: 400 });
    }

    const result = await markPaid(orderId, order.qpayInvoiceId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('QPay check error:', error);
    return NextResponse.json({ error: error.message || 'QPay check failed' }, { status: 500 });
  }
}
