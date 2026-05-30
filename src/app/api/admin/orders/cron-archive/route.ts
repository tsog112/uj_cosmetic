import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getAdminDb();
    // Fetch orders that are not archived yet
    const snap = await db.collection('orders').get();
    
    const now = Date.now();
    const batch = db.batch();
    let count = 0;
    const archivedIds: string[] = [];

    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.archived === true) return;

      const status = String(data.status || 'pending').toLowerCase();
      // Use updatedAt if present, otherwise fall back to doc createTime
      const updatedAt = data.updatedAt 
        ? data.updatedAt.toDate().getTime() 
        : (data.createdAt ? data.createdAt.toDate().getTime() : doc.createTime.toDate().getTime());

      let shouldArchive = false;
      if (status === 'delivered') {
        const daysDiff = (now - updatedAt) / (1000 * 60 * 60 * 24);
        if (daysDiff >= 30) {
          shouldArchive = true;
        }
      } else if (status === 'cancelled') {
        const daysDiff = (now - updatedAt) / (1000 * 60 * 60 * 24);
        if (daysDiff >= 7) {
          shouldArchive = true;
        }
      }

      if (shouldArchive) {
        batch.update(doc.ref, {
          archived: true,
          archivedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        archivedIds.push(doc.id);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();

      // Sync to local SQLite db
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.order.updateMany({
          where: { id: { in: archivedIds } },
          data: { archived: true, archivedAt: new Date() }
        });
      } catch (sqliteErr) {
        console.error('Failed to sync cron archive to SQLite:', sqliteErr);
      }
    }

    return NextResponse.json({ success: true, archivedCount: count });
  } catch (error) {
    console.error('Cron auto-archive error:', error);
    return NextResponse.json({ error: 'Cron auto-archive failed' }, { status: 500 });
  }
}
