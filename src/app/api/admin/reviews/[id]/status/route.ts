import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { approved, status, adminReply, featured } = await req.json();
    const nextStatus = status || (typeof approved === 'boolean' ? (approved ? 'visible' : 'hidden') : undefined);

    if (nextStatus && nextStatus !== 'pending' && nextStatus !== 'visible' && nextStatus !== 'hidden') {
      return NextResponse.json({ error: 'Invalid review status' }, { status: 400 });
    }

    const db = getAdminDb();
    const patch: Record<string, unknown> = {
      adminReply: typeof adminReply === 'string' ? adminReply : undefined,
      admin_reply: typeof adminReply === 'string' ? adminReply : undefined,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (nextStatus) {
      patch.status = nextStatus;
      patch.approved = nextStatus === 'visible';
      if (nextStatus !== 'visible') patch.featured = false;
    }
    if (typeof featured === 'boolean') patch.featured = featured;

    await db.collection('reviews').doc(id).update(patch);
    
    return NextResponse.json({ id, status: nextStatus, approved: nextStatus === 'visible', featured, adminReply });
  } catch (error) {
    console.error('Error updating review status:', error);
    return NextResponse.json({ error: 'Failed to update review status' }, { status: 500 });
  }
}
