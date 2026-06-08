import { NextRequest, NextResponse } from 'next/server';
import { authorizeUserRequest, optionalAuthSession } from '@/lib/auth/serverAuth';
import { prisma } from '@/lib/prisma';
import { maskDisplayName } from '@/lib/publicDto';
import { getReviewLikeMeta } from '@/lib/reviewLikes';

export const runtime = 'nodejs';

const VALID_SORTS = new Set(['newest', 'rating_desc', 'rating_asc']);
const REVIEW_WINDOW_DAYS = 90;

function reviewDocId(userId: string, productId: string, orderId: string) {
  return `${userId}_${productId}_${orderId}`;
}

function containsProfanity(text: string) {
  const banned = ['хараал', 'novsh', 'lalr', 'pizda', 'fuck', 'shit'];
  const normalized = text.toLowerCase();
  return banned.some((word) => normalized.includes(word));
}

function cleanText(value: unknown) {
  if (typeof value !== 'string') return '';
  if (!/[ÐÑÒÓ]/.test(value)) return value;
  try {
    return Buffer.from(value, 'latin1').toString('utf8');
  } catch {
    return value;
  }
}

function toPublicReview(review: any, extras?: { likeCount?: number; likedByUser?: boolean }) {
  const content = cleanText(review.content || review.body || '');
  return {
    id: review.id,
    productId: review.productId || '',
    productSlug: review.productSlug || review.product?.slug || '',
    productName: cleanText(review.productName || review.product?.nameMn || review.product?.name || ''),
    userId: '',
    userName: maskDisplayName(cleanText(review.userName || review.user?.displayName || review.user?.name)),
    userEmail: '',
    rating: Math.max(1, Math.min(5, Number(review.rating || 5))),
    content,
    body: content,
    imageUrls: Array.isArray(review.imageUrls) ? review.imageUrls : [],
    orderId: review.orderId || '',
    status: review.status || 'pending',
    featured: Boolean(review.featured),
    editCount: Number(review.editCount || 0),
    approved: review.status === 'visible',
    adminReply: cleanText(review.adminReply || ''),
    likeCount: extras?.likeCount ?? 0,
    likedByUser: Boolean(extras?.likedByUser),
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId') || undefined;
  const featured = searchParams.get('featured') === 'true';
  const sort = VALID_SORTS.has(searchParams.get('sort') || '') ? searchParams.get('sort')! : 'newest';
  const limitParam = Number(searchParams.get('limit') || 0);
  const pageParam = searchParams.get('page');
  const session = await optionalAuthSession(req);
  const viewerId = session?.uid;

  try {
    const where = {
      status: 'visible',
      ...(productId ? { productId } : {}),
      ...(featured ? { featured: true } : {}),
    };
    const orderBy = sort === 'rating_desc'
      ? [{ rating: 'desc' as const }, { createdAt: 'desc' as const }]
      : sort === 'rating_asc'
        ? [{ rating: 'asc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];
    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
    const limit = limitParam > 0 ? limitParam : 6;
    const shouldPaginate = Boolean(pageParam || limitParam > 0);

    const [reviews, totalCount, stats] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { product: true },
        orderBy,
        ...(shouldPaginate ? { skip: (page - 1) * limit, take: limit } : {}),
      }),
      prisma.review.count({ where }),
      prisma.review.findMany({ where, select: { rating: true } }),
    ]);

    const totalRating = stats.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    const starBreakdown = [5, 4, 3, 2, 1].reduce((acc, star) => {
      acc[star] = stats.filter((review) => Math.round(Number(review.rating || 0)) === star).length;
      return acc;
    }, {} as Record<number, number>);

    const reviewIds = reviews.map((review) => review.id);
    const { likeCounts, liked } = await getReviewLikeMeta(reviewIds, viewerId);

    return NextResponse.json({
      reviews: reviews.map((review) =>
        toPublicReview(review, {
          likeCount: likeCounts[review.id] || 0,
          likedByUser: Boolean(liked[review.id]),
        }),
      ),
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: shouldPaginate ? page : 1,
      averageRating: totalCount > 0 ? totalRating / totalCount : 0,
      starBreakdown,
    });
  } catch (error) {
    console.error('Public reviews API failed:', error);
    return NextResponse.json({
      reviews: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      averageRating: 0,
      starBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      warning: 'Reviews are temporarily unavailable.',
    });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const userId = auth.uid;
    const productId = String(body.productId || '').trim();
    const orderId = String(body.orderId || '').trim();
    const content = String(body.content || body.body || '').trim();

    if (!userId || !productId || !orderId) {
      return NextResponse.json({ error: 'Verified order is required.' }, { status: 400 });
    }
    if (content.length < 5 || content.length > 500) {
      return NextResponse.json({ error: 'Сэтгэгдэл 5-500 тэмдэгттэй байх ёстой.' }, { status: 400 });
    }
    if (containsProfanity(content)) {
      return NextResponse.json({ error: 'Сэтгэгдэлд зохисгүй үг орсон байна.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isEmailVerified = user?.emailVerified === true || Boolean(user?.googleId);
    if (!isEmailVerified) {
      return NextResponse.json({ error: 'Сэтгэгдэл бичихийн тулд и-мэйл хаягаа баталгаажуулна уу.' }, { status: 403 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: 'delivered',
        updatedAt: { gte: new Date(Date.now() - REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000) },
        items: { some: { productId } },
      },
      include: { items: { include: { product: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: 'Only delivered purchases within 90 days can be reviewed.' }, { status: 403 });
    }

    const id = reviewDocId(userId, productId, orderId);
    const item = (order.items || []).find((entry) => entry.productId === productId);
    const review = await prisma.review.create({
      data: {
        id,
        productId,
        productSlug: body.productSlug || item?.product?.slug || '',
        productName: body.productName || item?.name || item?.product?.nameMn || item?.product?.name || '',
        userId,
        userName: body.userName || user?.displayName || user?.name || 'UJ хэрэглэгч',
        userEmail: user?.email || '',
        rating: Math.max(1, Math.min(5, Math.round(Number(body.rating || 5)))),
        content,
        body: content,
        imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls.slice(0, 5) : [],
        orderId,
        status: 'pending',
        approved: false,
        featured: false,
        editCount: 0,
        verifiedPurchase: true,
      },
    });

    return NextResponse.json({ id: review.id, status: 'pending' }, { status: 201 });
  } catch (error: any) {
    console.error('Create review API failed:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'This purchase already has a review.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
