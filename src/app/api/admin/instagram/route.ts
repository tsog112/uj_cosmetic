import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('instagramFeed').orderBy('order', 'asc').get();
    const slots = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching instagram feed:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const slots = await req.json();
    const db = getAdminDb();
    const batch = db.batch();

    for (const slot of slots) {
      if (!slot.id) continue;
      const ref = db.collection('instagramFeed').doc(slot.id);
      batch.set(ref, {
        imageUrl: slot.imageUrl || '',
        instagramUrl: slot.instagramUrl || '',
        order: slot.order || 0
      }, { merge: true });
    }

    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating instagram feed:', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}
