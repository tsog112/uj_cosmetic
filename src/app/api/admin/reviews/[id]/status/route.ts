import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';
import {
  notifyReviewReply,
  updatePostgresAdminReview,
} from '@/lib/services/postgresAdminService';

export const runtime = 'nodejs';

const VALID_STATUSES = new Set(['pending', 'visible', 'hidden']);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const { approved, status, adminReply, featured } = await req.json();
    const nextStatus = status || (typeof approved === 'boolean' ? (approved ? 'visible' : 'hidden') : undefined);

    if (nextStatus && !VALID_STATUSES.has(nextStatus)) {
      return NextResponse.json({ error: 'Invalid review status' }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updated = await updatePostgresAdminReview(id, {
      status: nextStatus,
      adminReply: typeof adminReply === 'string' ? adminReply : undefined,
      featured,
    });

    if (
      typeof adminReply === 'string'
      && adminReply.trim()
      && adminReply.trim() !== String(existing.adminReply || '').trim()
    ) {
      try {
        await notifyReviewReply({
          id,
          userId: existing.userId,
          productName: existing.productName,
          productSlug: existing.productSlug,
          adminReply: adminReply.trim(),
        });
      } catch (notificationError) {
        console.error('Review reply notification failed:', notificationError);
      }
    }

    return NextResponse.json({
      id,
      status: updated?.status ?? existing.status,
      approved: (updated?.status ?? existing.status) === 'visible',
      featured: updated?.featured ?? existing.featured,
      adminReply: updated?.adminReply ?? existing.adminReply,
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    return NextResponse.json({ error: 'Failed to update review status' }, { status: 500 });
  }
}
