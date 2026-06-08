import { NextRequest, NextResponse } from 'next/server';
import { assertUserId, authorizeUserRequest, authErrorResponse } from '@/lib/auth/serverAuth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const uid = String(body?.uid || '').trim();
    if (!uid) {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 });
    }
    try {
      assertUserId(auth, uid);
    } catch (error) {
      return authErrorResponse(error);
    }

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { userId: uid } }),
      prisma.order.deleteMany({ where: { userId: uid } }),
      prisma.user.deleteMany({ where: { id: uid } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json({ error: error.message }, { status: (error as { status: number }).status });
    }
    console.error('Account delete API failed:', error);
    return NextResponse.json({ error: 'Failed to delete account data' }, { status: 500 });
  }
}
