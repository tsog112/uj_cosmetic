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

let cachedProducts: any[] = [];
let cacheTime = 0;

async function getCachedProducts(db: any) {
  const now = Date.now();
  if (cachedProducts.length > 0 && now - cacheTime < 60 * 1000) {
    return cachedProducts;
  }
  const snap = await db.collection('products').where('published', '==', true).get();
  cachedProducts = snap.docs.map((doc: any) => toPublicProduct(doc.id, doc.data()));
  cacheTime = now;
  return cachedProducts;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  try {
    const db = getAdminDb();

    if (slug) {
      const snap = await db.collection('products').where('slug', '==', slug).limit(1).get();
      const products = snap.docs.map((doc) => toPublicProduct(doc.id, doc.data()));
      return NextResponse.json({ product: products[0] ?? null });
    }

    let products = await getCachedProducts(db);

    if (category && category !== 'all') {
      products = products.filter((p) => p.category === category);
    }
    if (featured === 'true') {
      products = products.filter((p) => p.featured === true);
    }

    const totalCount = products.length;
    let totalPages = 1;
    let currentPage = 1;

    if (pageParam || limitParam) {
      const page = parseInt(pageParam || '1', 10);
      const limit = parseInt(limitParam || '12', 10);
      currentPage = page;
      totalPages = Math.ceil(totalCount / limit) || 1;
      products = products.slice((page - 1) * limit, page * limit);
    }

    return NextResponse.json({
      products,
      totalCount,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error('Public products API failed:', error);
    let products = fallbackProducts({ slug, category, featured });
    if (slug) {
      return NextResponse.json({
        product: products[0] ?? null,
        warning: 'Firestore products are temporarily unavailable; using local catalog fallback.',
      });
    }

    const totalCount = products.length;
    let totalPages = 1;
    let currentPage = 1;

    if (pageParam || limitParam) {
      const page = parseInt(pageParam || '1', 10);
      const limit = parseInt(limitParam || '12', 10);
      currentPage = page;
      totalPages = Math.ceil(totalCount / limit) || 1;
      products = products.slice((page - 1) * limit, page * limit);
    }

    return NextResponse.json({
      products,
      totalCount,
      totalPages,
      currentPage,
      warning: 'Firestore products are temporarily unavailable; using local catalog fallback.',
    });
  }
}
