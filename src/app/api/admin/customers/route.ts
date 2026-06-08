import { NextRequest, NextResponse } from 'next/server';
import { emptyAdminCustomers } from '@/lib/adminFallbacks';
import { listAdminCustomers } from '@/lib/services/firestoreAdminService';
import { listPostgresAdminCustomers } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export async function GET(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
      sortBy: searchParams.get('sortBy') || undefined,
      role: searchParams.get('role') || undefined,
    };

    const result = await listPostgresAdminCustomers(filters).catch(() =>
      listAdminCustomers(filters.search, filters.page, filters.limit, filters.role || 'all'),
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching customers:', error);
    const { searchParams } = new URL(req.url);
    return NextResponse.json(emptyAdminCustomers(parseInt(searchParams.get('page') || '1', 10)));
  }
}
