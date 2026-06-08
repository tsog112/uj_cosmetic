import { NextRequest, NextResponse } from 'next/server';
import { authorizeUserRequest } from '@/lib/auth/serverAuth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function cleanText(value: unknown) {
  if (typeof value !== 'string') return '';
  if (!/[ÐÑÒÓ]/.test(value)) return value;
  try {
    return Buffer.from(value, 'latin1').toString('utf8');
  } catch {
    return value;
  }
}

function toOwnerReview(review: {
  id: string;
  productId: string;
  productSlug: string | null;
  productName: string | null;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  rating: number;
  content: string | null;
  body: string | null;
  imageUrls: unknown;
  orderId: string | null;
  status: string;
  featured: boolean;
  editCount: number;
  adminReply: string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: { slug?: string; nameMn?: string | null; name?: string } | null;
}) {
  const content = cleanText(review.content || review.body || '');
  return {
    id: review.id,
    productId: review.productId,
    productSlug: review.productSlug || review.product?.slug || '',
    productName: cleanText(review.productName || review.product?.nameMn || review.product?.name || ''),
    userId: review.userId,
    userName: cleanText(review.userName || ''),
    userEmail: review.userEmail || '',
    rating: Math.max(1, Math.min(5, Number(review.rating || 5))),
    content,
    body: content,
    imageUrls: Array.isArray(review.imageUrls) ? (review.imageUrls as string[]) : [],
    orderId: review.orderId || '',
    status: review.status || 'pending',
    featured: Boolean(review.featured),
    editCount: Number(review.editCount || 0),
    approved: review.status === 'visible',
    adminReply: cleanText(review.adminReply || ''),
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

/** Хэрэглэгчийн өөрийн бүх сэтгэгдэл (profile хуудас). */
export async function GET(req: NextRequest) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const reviews = await prisma.review.findMany({
      where: { userId: auth.uid },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ reviews: reviews.map(toOwnerReview) });
  } catch (error) {
    console.error('Mine reviews API failed:', error);
    return NextResponse.json({ reviews: [] });
  }
}
