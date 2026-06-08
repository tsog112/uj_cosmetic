import { NextRequest, NextResponse } from 'next/server';
import type { Query } from 'firebase-admin/firestore';
import { assertFirestoreCircuitClosed, recordFirestoreError } from '@/lib/firestoreCircuitBreaker';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { toPublicProduct } from '@/lib/publicDto';
import { listPostgresPublicProducts } from '@/lib/services/postgresAdminService';
export const runtime = 'nodejs';

function emptyProductsResponse(filters: { slug?: string | null; page?: string | null; limit?: string | null }) {
  if (filters.slug) return { product: null };
  const page = parseInt(filters.page || '1', 10);
  const limit = parseInt(filters.limit || '12', 10);
  return { products: [], totalCount: 0, totalPages: 1, currentPage: page, limit };
}

let cachedProducts: any[] = [];
let cacheTime = 0;

function withTimeout<T>(promise: Promise<T>, label: string, ms = 1000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

async function getCachedProducts(db: any) {
  const now = Date.now();
  if (cachedProducts.length > 0 && now - cacheTime < 60 * 1000) {
    return cachedProducts;
  }
  const snap: any = await withTimeout(db.collection('products').where('published', '==', true).get(), 'public products');
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
    const postgresResult = await listPostgresPublicProducts({ slug, category, featured, page: pageParam, limit: limitParam });
    if (slug) return NextResponse.json({ product: postgresResult.products[0] ?? null });
    return NextResponse.json(postgresResult);
  } catch (postgresError) {
    console.warn('Postgres public products failed, using Firestore/local fallback:', postgresError);
  }

  try {
    assertFirestoreCircuitClosed();
    const db = getAdminDb();

    if (slug) {
      const snap: any = await withTimeout(db.collection('products').where('slug', '==', slug).limit(1).get(), 'public product by slug');
      const products = snap.docs.map((doc: any) => toPublicProduct(doc.id, doc.data()));
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
    recordFirestoreError(error);
    console.error('Public products API failed:', error);
    const empty = emptyProductsResponse({ slug, page: pageParam, limit: limitParam });
    return NextResponse.json({
      ...empty,
      warning: 'Products are temporarily unavailable.',
    });
  }
}
