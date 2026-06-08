import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Сэтгэгдлийн like-ийн тоо болон тухайн хэрэглэгч like дарсан эсэхийг Postgres-оос уншина.
 * (Raw SQL ашигласан нь Prisma client дахин generate шаардахгүйгээр ажиллахын тулд.)
 */
export async function getReviewLikeMeta(reviewIds: string[], viewerId?: string) {
  if (!reviewIds.length) return { likeCounts: {} as Record<string, number>, liked: {} as Record<string, boolean> };

  const likeCounts: Record<string, number> = {};
  const liked: Record<string, boolean> = {};
  reviewIds.forEach((id) => {
    likeCounts[id] = 0;
    liked[id] = false;
  });

  try {
    const counts = await prisma.$queryRaw<Array<{ reviewId: string; count: number }>>`
      SELECT "reviewId", COUNT(*)::int AS count
      FROM "ReviewLike"
      WHERE "reviewId" IN (${Prisma.join(reviewIds)})
      GROUP BY "reviewId"`;
    counts.forEach((row) => {
      likeCounts[row.reviewId] = Number(row.count || 0);
    });

    if (viewerId) {
      const likedRows = await prisma.$queryRaw<Array<{ reviewId: string }>>`
        SELECT "reviewId"
        FROM "ReviewLike"
        WHERE "userId" = ${viewerId} AND "reviewId" IN (${Prisma.join(reviewIds)})`;
      likedRows.forEach((row) => {
        liked[row.reviewId] = true;
      });
    }
  } catch (error) {
    console.warn('getReviewLikeMeta failed:', error);
  }

  return { likeCounts, liked };
}
