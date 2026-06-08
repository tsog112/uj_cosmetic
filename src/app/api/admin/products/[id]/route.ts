import { NextRequest, NextResponse } from 'next/server';
import { deleteAdminProduct, getAdminProduct, patchAdminProduct, updateAdminProduct } from '@/lib/services/firestoreAdminService';
import { deletePostgresAdminProduct, getPostgresAdminProduct, patchPostgresAdminProduct, upsertPostgresAdminProduct } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = (await getPostgresAdminProduct(id).catch(() => null)) || (await getAdminProduct(id));

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, categoryId, price, stock } = body;

    if (!name || !categoryId || price === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedProduct =
      (await upsertPostgresAdminProduct(id, body).catch(() => null))
      || (await updateAdminProduct(id, body));
    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deletePostgresAdminProduct(id).catch(() => null);
    await deleteAdminProduct(id);
    return NextResponse.json({ id });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await req.json();
    const updatedProduct =
      (await patchPostgresAdminProduct(id, body).catch(() => null))
      || (await patchAdminProduct(id, body));
    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error patching product:', error);
    return NextResponse.json({ error: 'Failed to patch product' }, { status: 500 });
  }
}
