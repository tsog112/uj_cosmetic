import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search')?.toLowerCase() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const db = getAdminDb();
    
    // 1. Fetch all reviews from Firestore (index-free since there's no native composite filter)
    const snap = await db.collection('reviews').get();
    
    const allReviews = snap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        productId: data.productId || '',
        productSlug: data.productSlug || '',
        productName: data.productName || '',
        userId: data.userId || '',
        userName: data.userName || '',
        userEmail: data.userEmail || '',
        rating: Number(data.rating || 0),
        content: data.content || '',
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
        status: data.status === 'visible' || data.status === 'hidden' || data.status === 'pending'
          ? data.status
          : data.approved === true ? 'visible' : 'pending',
        approved: data.status ? data.status === 'visible' : Boolean(data.approved),
        featured: Boolean(data.featured),
        orderId: data.orderId || '',
        verifiedPurchase: data.verifiedPurchase !== false && Boolean(data.orderId),
        editCount: Number(data.editCount || 0),
        adminReply: data.admin_reply || data.adminReply || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    });

    // Sort by date in memory (descending)
    allReviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 2. Compute status counts precisely in memory (extremely fast and cheap)
    const statusCounts = {
      total: allReviews.length,
      pending: allReviews.filter(r => r.status === 'pending').length,
      approved: allReviews.filter(r => r.status === 'visible').length,
      visible: allReviews.filter(r => r.status === 'visible').length,
      hidden: allReviews.filter(r => r.status === 'hidden').length,
      featured: allReviews.filter(r => r.featured).length,
      withPhotos: allReviews.filter(r => r.imageUrls.length > 0).length,
    };

    let filteredReviews = allReviews;

    // 3. Filter in memory
    if (status !== 'all') {
      filteredReviews = filteredReviews.filter(r => r.status === status);
    }

    if (search) {
      filteredReviews = filteredReviews.filter((r: any) => 
        r.productName.toLowerCase().includes(search) ||
        r.userName.toLowerCase().includes(search) ||
        r.content.toLowerCase().includes(search)
      );
    }

    const totalCount = filteredReviews.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const start = (page - 1) * limit;
    const reviews = filteredReviews.slice(start, start + limit);

    return NextResponse.json({
      reviews,
      totalCount,
      totalPages,
      currentPage: page,
      statusCounts
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
