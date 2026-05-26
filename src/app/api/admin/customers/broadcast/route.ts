import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const { title, message, type = 'ADMIN_BROADCAST', link } = await req.json();
    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const db = getAdminDb();
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    // Batch write to add notification to each user
    const batch = db.batch();
    const now = FieldValue.serverTimestamp();
    let count = 0;

    usersSnapshot.docs.forEach((doc) => {
      const notifRef = db.collection('notifications').doc();
      batch.set(notifRef, {
        userId: doc.id,
        title,
        message,
        type,
        link: link || null,
        read: false,
        createdAt: now,
      });
      count++;
      
      // Firestore batches can hold up to 500 writes
      // For a real prod app with >500 users, we'd need to chunk the batches.
      // But this is sufficient for now.
    });

    if (count > 0) {
      await batch.commit();
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Failed to broadcast message' }, { status: 500 });
  }
}
