import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

/** Нүүр хуудсын Instagram feed — зөвхөн унших, нууцгүй */
export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('instagramFeed').orderBy('order', 'asc').get();
    const slots = snap.docs.map((d) => ({
      id: d.id,
      imageUrl: d.data().imageUrl || '',
      instagramUrl: d.data().instagramUrl || '',
      order: d.data().order || 0,
    }));
    return NextResponse.json(slots);
  } catch (error) {
    console.error('instagram-feed GET failed:', error);
    return NextResponse.json([]);
  }
}
