import { NextRequest, NextResponse } from 'next/server';
import { emptyAdminOrders } from '@/lib/adminFallbacks';
import { normalizeAdminOrderStatus } from '@/lib/constants/admin';
import { listAdminOrders } from '@/lib/services/firestoreAdminService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get('status');
    const status =
      rawStatus && rawStatus !== 'all' ? normalizeAdminOrderStatus(rawStatus) : undefined;

    const result = await listAdminOrders({
      status,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    const { searchParams } = new URL(req.url);
    return NextResponse.json(emptyAdminOrders(parseInt(searchParams.get('page') || '1', 10)));
  }
}
