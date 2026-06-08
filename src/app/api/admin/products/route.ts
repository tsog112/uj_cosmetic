import { NextRequest, NextResponse } from 'next/server';
import { emptyAdminProducts } from '@/lib/adminFallbacks';
import { ADMIN_ALL_FILTER_VALUE } from '@/lib/constants/admin';
import { createAdminProduct, listAdminProducts } from '@/lib/services/firestoreAdminService';
import { createPostgresAdminProduct, listPostgresAdminProducts } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export async function GET(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      category: searchParams.get('category') || undefined,
      inStock: searchParams.get('inStock') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
      sortBy: searchParams.get('sortBy') || undefined,
      sortDir: (searchParams.get('sortDir') as 'asc' | 'desc') || undefined,
      visibility: searchParams.get('visibility') || undefined,
    };
    const result = await listPostgresAdminProducts(filters).catch(() => listAdminProducts(filters));

    if (searchParams.get('category') === ADMIN_ALL_FILTER_VALUE) {
      // no-op: listAdminProducts already treats missing category as all
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    const { searchParams } = new URL(req.url);
    return NextResponse.json(emptyAdminProducts(parseInt(searchParams.get('page') || '1', 10)));
  }
}

export async function POST(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const { name, categoryId, price, stock } = body;

    if (!name || !categoryId || price === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Missing required fields (name, categoryId, price, stock)' }, { status: 400 });
    }

    const product =
      (await createPostgresAdminProduct(body).catch(() => null))
      || (await createAdminProduct(body));
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
