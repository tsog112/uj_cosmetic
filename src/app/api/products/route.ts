import { NextRequest, NextResponse } from 'next/server';
import type { Query } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { toPublicProduct } from '@/lib/publicDto';
import catalog from '@/data/pdf-products.json';

export const runtime = 'nodejs';

function fallbackProducts(filters: { slug?: string | null; category?: string | null; featured?: string | null }) {
  let products = (catalog.products || [])
    .map((product: any) => toPublicProduct(product.id || product.slug, product))
    .filter((product) => product.published !== false);

  if (filters.slug) products = products.filter((product) => product.slug === filters.slug);
  if (filters.category) products = products.filter((product) => product.category === filters.category);
  if (filters.featured === 'true') products = products.filter((product) => product.featured === true);

  return products;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');

  try {
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
    const products = fallbackProducts({ slug, category, featured });
    if (slug) {
      return NextResponse.json({
        product: products[0] ?? null,
        warning: 'Firestore products are temporarily unavailable; using local catalog fallback.',
      });
    }
    return NextResponse.json({
      products,
      warning: 'Firestore products are temporarily unavailable; using local catalog fallback.',
    });
  }
}
