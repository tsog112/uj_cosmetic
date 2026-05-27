import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

function containsProfanity(text: string) {
  const banned = ['хараал', 'novsh', 'lalr', 'pizda', 'fuck', 'shit'];
  const normalized = text.toLowerCase();
  return banned.some((word) => normalized.includes(word));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const db = getAdminDb();
    const ref = db.collection('reviews').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    const current = snap.data() || {};
    if (Number(current.editCount || 0) >= 1) {
      return NextResponse.json({ error: 'Сэтгэгдлийг зөвхөн нэг удаа засах боломжтой.' }, { status: 403 });
    }

    await ref.update({
      rating: Math.max(1, Math.min(5, Math.round(Number(body.rating || current.rating || 5)))),
      content,
      body: content,
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls.slice(0, 5) : [],
      status: 'pending',
      approved: false,
      featured: false,
      editCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id, status: 'pending' });
  } catch (error) {
    console.error('Update review API failed:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
