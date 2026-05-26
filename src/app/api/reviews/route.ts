import { NextRequest, NextResponse } from 'next/server';
import type { Query } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { toPublicReview } from '@/lib/publicDto';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const limitParam = Number(searchParams.get('limit') || 0);

    const db = getAdminDb();
    let query: Query = db.collection('reviews')
      .where('approved', '==', true);

    if (productId) query = query.where('productId', '==', productId);

    const snap = await query.get();
    const reviews = snap.docs
      .map((doc) => toPublicReview(doc.id, doc.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({
      reviews: limitParam > 0 ? reviews.slice(0, limitParam) : reviews,
    });
  } catch (error) {
    console.error('Public reviews API failed:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
