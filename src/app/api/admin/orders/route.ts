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

    const dateFrom = searchParams.get('dateFrom') || searchParams.get('date_from') || undefined;
    const dateTo = searchParams.get('dateTo') || searchParams.get('date_to') || undefined;
    const priceMin = searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined;
    const priceMax = searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined;
    const city = searchParams.get('city') || undefined;
    const archived = searchParams.get('archived') === 'true';

    const result = await listAdminOrders({
      status,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
      dateFrom,
      dateTo,
      priceMin,
      priceMax,
      city,
      archived,
      regionId: searchParams.get('region_id') || searchParams.get('regionId') || undefined,
      districtId: searchParams.get('district_id') || searchParams.get('districtId') || undefined,
      khorooId: searchParams.get('khoroo_id') || searchParams.get('khorooId') || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    const { searchParams } = new URL(req.url);
    return NextResponse.json(emptyAdminOrders(parseInt(searchParams.get('page') || '1', 10)));
  }
}
