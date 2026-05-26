import { NextRequest, NextResponse } from 'next/server';
import { emptyAdminCustomers } from '@/lib/adminFallbacks';
import { listAdminCustomers } from '@/lib/services/firestoreAdminService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await listAdminCustomers(search, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching customers:', error);
    const { searchParams } = new URL(req.url);
    return NextResponse.json(emptyAdminCustomers(parseInt(searchParams.get('page') || '1', 10)));
  }
}
