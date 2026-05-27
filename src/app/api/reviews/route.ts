import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, type Query } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { toPublicReview } from '@/lib/publicDto';

export const runtime = 'nodejs';

const VALID_SORTS = new Set(['newest', 'rating_desc', 'rating_asc']);
const REVIEW_WINDOW_DAYS = 90;

function toDate(value: any): Date {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function reviewDocId(userId: string, productId: string, orderId: string) {
  return `${userId}_${productId}_${orderId}`;
}

function containsProfanity(text: string) {
  const banned = ['хараал', 'novsh', 'lalr', 'pizda', 'fuck', 'shit'];
  const normalized = text.toLowerCase();
  return banned.some((word) => normalized.includes(word));
}

async function findEligibleOrder(db: FirebaseFirestore.Firestore, userId: string, productId: string, orderId?: string) {
  let query: Query = db.collection('orders').where('userId', '==', userId);
  const snap = await query.get();
  const orders = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as any))
    .filter((order) => !orderId || order.id === orderId)
    .filter((order) => Array.isArray(order.items) && order.items.some((item: any) => item.productId === productId));

  const delivered = orders.filter((order) => String(order.status || '').toLowerCase() === 'delivered');
  const now = Date.now();
  const freshDelivered = delivered.find((order) => {
    const deliveredAt = toDate(order.deliveredAt || order.updatedAt);
    return now - deliveredAt.getTime() <= REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  });

  return { orders, delivered, freshDelivered };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const featured = searchParams.get('featured') === 'true';
    const sort = VALID_SORTS.has(searchParams.get('sort') || '') ? searchParams.get('sort')! : 'newest';
    const limitParam = Number(searchParams.get('limit') || 0);
    const pageParam = searchParams.get('page');

    const db = getAdminDb();
    
    const snap = await db.collection('reviews').get();
    const visibleDocs = snap.docs.filter((doc) => {
      const data = doc.data();
      const isVisible = data.status === 'visible' || (!data.status && data.approved === true);
      return isVisible
        && (!productId || data.productId === productId)
        && (!featured || data.featured === true);
    });

    const totalCount = visibleDocs.length;
    const totalRating = visibleDocs.reduce((sum, doc) => sum + Number(doc.data().rating || 0), 0);
    const averageRating = totalCount > 0 ? totalRating / totalCount : 0;
    const starBreakdown = [5, 4, 3, 2, 1].reduce((acc, star) => {
      acc[star] = visibleDocs.filter((doc) => Math.round(Number(doc.data().rating || 0)) === star).length;
      return acc;
    }, {} as Record<number, number>);

    const allReviews = visibleDocs.map((doc: any) => toPublicReview(doc.id, doc.data()))
      .sort((a, b) => {
        if (sort === 'rating_desc') return b.rating - a.rating || b.createdAt.getTime() - a.createdAt.getTime();
        if (sort === 'rating_asc') return a.rating - b.rating || b.createdAt.getTime() - a.createdAt.getTime();
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

    let reviews: any[] = [];
    let totalPages = 1;
    let currentPage = 1;

    if (pageParam || limitParam > 0) {
      const page = parseInt(pageParam || '1', 10);
      const limit = limitParam > 0 ? limitParam : 6;
      const start = (page - 1) * limit;
      
      currentPage = page;
      totalPages = Math.ceil(totalCount / limit) || 1;
      reviews = allReviews.slice(start, start + limit);
    } else {
      reviews = allReviews;
    }

    return NextResponse.json({
      reviews,
      totalCount,
      totalPages,
      currentPage,
      averageRating,
      starBreakdown,
    });
  } catch (error) {
    console.error('Public reviews API failed:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = String(body.userId || '').trim();
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

    const db = getAdminDb();
    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data() || {};
    const isEmailVerified = userData.email_verified === true || Boolean(userData.google_id);
    if (!isEmailVerified) {
      return NextResponse.json({ error: 'Сэтгэгдэл бичихийн тулд и-мэйл хаягаа баталгаажуулна уу.' }, { status: 403 });
    }

    const { freshDelivered } = await findEligibleOrder(db, userId, productId, orderId);
    if (!freshDelivered) {
      return NextResponse.json({ error: 'Only delivered purchases within 90 days can be reviewed.' }, { status: 403 });
    }

    const id = reviewDocId(userId, productId, orderId);
    const ref = db.collection('reviews').doc(id);
    const existing = await ref.get();
    if (existing.exists) {
      return NextResponse.json({ error: 'This purchase already has a review.', id }, { status: 409 });
    }

    const item = (freshDelivered.items || []).find((entry: any) => entry.productId === productId) || {};
    await ref.set({
      productId,
      productSlug: body.productSlug || item.productSlug || '',
      productName: body.productName || item.name_mn || item.name || '',
      userId,
      userName: body.userName || 'UJ хэрэглэгч',
      userEmail: '',
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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id, status: 'pending' }, { status: 201 });
  } catch (error) {
    console.error('Create review API failed:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
