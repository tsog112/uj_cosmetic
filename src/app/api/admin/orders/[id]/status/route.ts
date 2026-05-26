import { NextRequest, NextResponse } from 'next/server';
import { ORDER_STATUS_VALUES, normalizeAdminOrderStatus } from '@/lib/constants/admin';
import { updateAdminOrderStatus } from '@/lib/services/firestoreAdminService';

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

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
