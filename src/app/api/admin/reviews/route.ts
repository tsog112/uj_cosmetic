import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search')?.toLowerCase() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const db = getAdminDb();
    const snap = await db.collection('reviews').orderBy('createdAt', 'desc').get();
    
    let allReviews = snap.docs.map(doc => {
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
        status: data.status || (data.approved ? 'approved' : 'pending'),
        approved: data.status ? data.status === 'approved' : Boolean(data.approved),
        adminReply: data.admin_reply || data.adminReply || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    });

    const statusCounts = {
      total: allReviews.length,
      pending: allReviews.filter(r => r.status === 'pending').length,
      approved: allReviews.filter(r => r.status === 'approved').length,
      hidden: allReviews.filter(r => r.status === 'hidden').length,
      withPhotos: allReviews.filter(r => r.imageUrls.length > 0).length,
    };

    if (status !== 'all') {
      allReviews = allReviews.filter(r => r.status === status);
    }

    if (search) {
      allReviews = allReviews.filter(r => 
        r.productName.toLowerCase().includes(search) ||
        r.userName.toLowerCase().includes(search) ||
        r.content.toLowerCase().includes(search)
      );
    }

    const totalCount = allReviews.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const start = (page - 1) * limit;
    const reviews = allReviews.slice(start, start + limit);

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
