import { NextRequest, NextResponse } from 'next/server';
import { authorizeUserRequest } from '@/lib/auth/serverAuth';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function containsProfanity(text: string) {
  const banned = ['хараал', 'novsh', 'lalr', 'pizda', 'fuck', 'shit'];
  const normalized = text.toLowerCase();
  return banned.some((word) => normalized.includes(word));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const content = String(body.content || body.body || '').trim();

    if (content.length < 5 || content.length > 500) {
      return NextResponse.json({ error: 'Сэтгэгдэл 5-500 тэмдэгттэй байх ёстой.' }, { status: 400 });
    }
    if (containsProfanity(content)) {
      return NextResponse.json({ error: 'Сэтгэгдэлд зохисгүй үг орсон байна.' }, { status: 400 });
    }

    const current = await prisma.review.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    if (current.userId !== auth.uid) {
      return NextResponse.json({ error: 'You can only edit your own review.' }, { status: 403 });
    }
    if (current.editCount >= 1) {
      return NextResponse.json({ error: 'Сэтгэгдлийг зөвхөн нэг удаа засах боломжтой.' }, { status: 403 });
    }

    await prisma.review.update({
      where: { id },
      data: {
        rating: Math.max(1, Math.min(5, Math.round(Number(body.rating || current.rating || 5)))),
        content,
        body: content,
        imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls.slice(0, 5) : [],
        status: 'pending',
        approved: false,
        featured: false,
        editCount: { increment: 1 },
      },
    });

    return NextResponse.json({ id, status: 'pending' });
  } catch (error) {
    console.error('Update review API failed:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeUserRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const userId = auth.uid;

    const current = await prisma.review.findUnique({ where: { id } });
    let firestoreDoc: FirebaseFirestore.DocumentSnapshot | null = null;
    try {
      firestoreDoc = await getAdminDb().collection('reviews').doc(id).get();
    } catch {
      firestoreDoc = null;
    }

    const ownerId = current?.userId || String(firestoreDoc?.data()?.userId || '');
    if (!ownerId || ownerId !== userId) {
      return NextResponse.json({ error: 'You can only delete your own review.' }, { status: 403 });
    }

    if (current) {
      await prisma.review.delete({ where: { id } });
    }
    if (firestoreDoc?.exists) {
      await getAdminDb().collection('reviews').doc(id).delete();
    }

    if (!current && !firestoreDoc?.exists) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    console.error('Delete review API failed:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
