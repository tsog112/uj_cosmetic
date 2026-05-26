import { NextRequest, NextResponse } from 'next/server';
import type { Query } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { toPublicProduct } from '@/lib/publicDto';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    const db = getAdminDb();
    let query: Query = db.collection('products')
      .where('published', '==', true);

    if (slug) query = query.where('slug', '==', slug).limit(1);
    if (category) query = query.where('category', '==', category);
    if (featured === 'true') query = query.where('featured', '==', true);

    const snap = await query.get();
    const products = snap.docs.map((doc) => toPublicProduct(doc.id, doc.data()));

    if (slug) {
      return NextResponse.json({ product: products[0] ?? null });
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Public products API failed:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
