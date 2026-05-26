import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { approved, status, adminReply } = await req.json();
    const nextStatus = status || (typeof approved === 'boolean' ? (approved ? 'approved' : 'hidden') : null);

    if (nextStatus !== 'pending' && nextStatus !== 'approved' && nextStatus !== 'hidden') {
      return NextResponse.json({ error: 'Invalid review status' }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection('reviews').doc(id).update({
      status: nextStatus,
      approved: nextStatus === 'approved',
      adminReply: typeof adminReply === 'string' ? adminReply : undefined,
      admin_reply: typeof adminReply === 'string' ? adminReply : undefined,
      updatedAt: new Date()
    });
    
    return NextResponse.json({ id, status: nextStatus, approved: nextStatus === 'approved', adminReply });
  } catch (error) {
    console.error('Error updating review status:', error);
    return NextResponse.json({ error: 'Failed to update review status' }, { status: 500 });
  }
}
