import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authorizeUserRequest } from '@/lib/auth/serverAuth';
import { enforceRateLimit } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimit(req, { key: 'review-like', limit: 60, windowMs: 60_000, identifier: auth.uid });
  if (limited) return limited;

  try {
    const { id: reviewId } = await params;
    const userId = auth.uid;

    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "ReviewLike" WHERE "reviewId" = ${reviewId} AND "userId" = ${userId} LIMIT 1`;

    let liked: boolean;
    if (existing.length) {
      await prisma.$executeRaw`DELETE FROM "ReviewLike" WHERE "reviewId" = ${reviewId} AND "userId" = ${userId}`;
      liked = false;
    } else {
      // ON CONFLICT — давхар дарахад (race) алдаа гаргахгүй
      await prisma.$executeRaw`
        INSERT INTO "ReviewLike" ("id", "reviewId", "userId", "createdAt")
        VALUES (${randomUUID()}, ${reviewId}, ${userId}, now())
        ON CONFLICT ("reviewId", "userId") DO NOTHING`;
      liked = true;
    }

    const countRows = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count FROM "ReviewLike" WHERE "reviewId" = ${reviewId}`;
    const likeCount = Number(countRows?.[0]?.count || 0);

    return NextResponse.json({ liked, likeCount });
  } catch (error) {
    console.error('Review like API failed:', error);
    return NextResponse.json({ error: 'Failed to update like' }, { status: 500 });
  }
}
