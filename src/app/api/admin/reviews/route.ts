import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';
import {
  deletePostgresAdminReview,
  listPostgresAdminReviews,
  notifyReviewReply,
  updatePostgresAdminReview,
} from '@/lib/services/postgresAdminService';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const search = searchParams.get('search') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));

  try {
    const payload = await listPostgresAdminReviews({ status, search, page, limit });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json({
      reviews: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: page,
      statusCounts: {
        total: 0,
        pending: 0,
        approved: 0,
        visible: 0,
        hidden: 0,
        featured: 0,
        withPhotos: 0,
      },
      warning: 'Reviews are temporarily unavailable.',
    });
  }
}
