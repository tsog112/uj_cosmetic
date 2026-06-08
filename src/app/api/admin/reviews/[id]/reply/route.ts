import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';
import {
  notifyReviewReply,
  updatePostgresAdminReview,
} from '@/lib/services/postgresAdminService';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const { adminReply } = await req.json();

    if (typeof adminReply !== 'string' || !adminReply.trim()) {
      return NextResponse.json({ error: 'Хариу заавал бичнэ үү.' }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const trimmedReply = adminReply.trim();
    const updated = await updatePostgresAdminReview(id, { adminReply: trimmedReply });
    if (!updated) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (trimmedReply !== String(existing.adminReply || '').trim()) {
      try {
        await notifyReviewReply({
          id,
          userId: existing.userId,
          productName: existing.productName,
          productSlug: existing.productSlug,
          adminReply: trimmedReply,
        });
      } catch (notificationError) {
        console.error('Review reply notification failed:', notificationError);
      }
    }

    return NextResponse.json({
      id,
      adminReply: updated.adminReply,
      notified: trimmedReply !== String(existing.adminReply || '').trim(),
    });
  } catch (error) {
    console.error('Error saving review reply:', error);
    return NextResponse.json({ error: 'Failed to save review reply' }, { status: 500 });
  }
}
