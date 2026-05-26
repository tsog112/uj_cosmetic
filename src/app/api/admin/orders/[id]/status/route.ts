import { NextRequest, NextResponse } from 'next/server';
import { ORDER_STATUS_VALUES, normalizeAdminOrderStatus } from '@/lib/constants/admin';
import { updateAdminOrderStatus } from '@/lib/services/firestoreAdminService';
import { sendOrderStatusNotification } from '@/lib/emailService';

export const runtime = 'nodejs';

const EMAIL_STATUSES = new Set(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    const normalized = normalizeAdminOrderStatus(status);

    if (!ORDER_STATUS_VALUES.includes(normalized)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await updateAdminOrderStatus(id, normalized);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let emailSent = false;
    if (EMAIL_STATUSES.has(normalized) && order.customerEmail) {
      try {
        await sendOrderStatusNotification(order.customerEmail, {
          id: order.id,
          customerName: order.customerName || 'UJ customer',
          status: normalized as 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
          items: (order.items || []).map((item: any) => ({
            name: item.product?.name || item.name_mn || item.name || 'Бүтээгдэхүүн',
            quantity: Number(item.quantity || 1),
            price: Number(item.price || item.product?.price || 0),
          })),
          total: Number(order.total || 0),
          shippingCost: Number(order.shippingCost || 0),
          address: order.shippingAddress || '',
        });
        emailSent = true;
      } catch (emailError: any) {
        console.error('Order status email failed:', emailError?.message || emailError);
      }
    }

    return NextResponse.json({ ...order, emailSent });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
