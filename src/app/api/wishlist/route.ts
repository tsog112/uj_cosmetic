import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authorizeUserRequest } from '@/lib/auth/serverAuth';
import { enforceRateLimit } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type WishlistRow = {
  id: string;
  productId: string;
  createdAt: Date;
  slug: string | null;
  nameMn: string | null;
  name: string | null;
  price: number;
  salePrice: number | null;
  images: unknown;
  stockQuantity: number;
  isVisible: boolean;
  published: boolean;
};

function toWishlistItem(row: WishlistRow, userId: string) {
  const images = Array.isArray(row.images) ? (row.images as string[]) : [];
  return {
    id: row.id,
    userId,
    productId: row.productId,
    productSlug: row.slug || '',
    productName: row.nameMn || row.name || '',
    productImage: images[0] || '/placeholder-product.svg',
    price: Number(row.price || 0),
    salePrice: row.salePrice != null ? Number(row.salePrice) : null,
    inStock: row.isVisible !== false && row.published !== false && Number(row.stockQuantity || 0) > 0,
    createdAt: row.createdAt,
  };
}

export async function GET(req: NextRequest) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const productId = new URL(req.url).searchParams.get('productId');

    if (productId) {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Wishlist" WHERE "userId" = ${auth.uid} AND "productId" = ${productId} LIMIT 1`;
      return NextResponse.json({ inWishlist: rows.length > 0 });
    }

    const rows = await prisma.$queryRaw<WishlistRow[]>`
      SELECT w.id, w."productId", w."createdAt",
             p.slug, p."nameMn", p.name, p.price, p."salePrice", p.images,
             p."stockQuantity", p."isVisible", p.published
      FROM "Wishlist" w
      JOIN "Product" p ON p.id = w."productId"
      WHERE w."userId" = ${auth.uid}
      ORDER BY w."createdAt" DESC`;

    return NextResponse.json({ items: rows.map((row) => toWishlistItem(row, auth.uid)) });
  } catch (error) {
    console.error('Wishlist GET failed:', error);
    return NextResponse.json({ error: 'Failed to load wishlist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimit(req, { key: 'wishlist-write', limit: 60, windowMs: 60_000, identifier: auth.uid });
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const productId = String(body?.productId || '').trim();
    if (!productId) {
      return NextResponse.json({ error: 'productId шаардлагатай' }, { status: 400 });
    }

    await prisma.$executeRaw`
      INSERT INTO "Wishlist" ("id", "userId", "productId", "createdAt")
      VALUES (${randomUUID()}, ${auth.uid}, ${productId}, now())
      ON CONFLICT ("userId", "productId") DO NOTHING`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Wishlist POST failed:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const productId = String(new URL(req.url).searchParams.get('productId') || '').trim();
    if (!productId) {
      return NextResponse.json({ error: 'productId шаардлагатай' }, { status: 400 });
    }

    await prisma.$executeRaw`DELETE FROM "Wishlist" WHERE "userId" = ${auth.uid} AND "productId" = ${productId}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Wishlist DELETE failed:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}
