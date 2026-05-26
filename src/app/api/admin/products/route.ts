import { NextRequest, NextResponse } from 'next/server';
import { emptyAdminProducts } from '@/lib/adminFallbacks';
import { ADMIN_ALL_FILTER_VALUE } from '@/lib/constants/admin';
import { createAdminProduct, listAdminProducts } from '@/lib/services/firestoreAdminService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await listAdminProducts({
      category: searchParams.get('category') || undefined,
      inStock: searchParams.get('inStock') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    });

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
  try {
    const body = await req.json();
    const { name, categoryId, price, stock } = body;

    if (!name || !categoryId || price === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Missing required fields (name, categoryId, price, stock)' }, { status: 400 });
    }

    const product = await createAdminProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
