import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const db = getAdminDb();
    const ordersSnap = await db.collection('orders').get();
    
    const orders = ordersSnap.docs.map(doc => {
      const data = doc.data();
      let createdAt = new Date();
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else {
          createdAt = new Date(data.createdAt);
        }
      }
      return {
        id: doc.id,
        createdAt,
        ref: doc.ref,
        orderNumber: data.orderNumber
      };
    });

    // Sort orders by creation date ascending
    orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Year-based sequential counters
    const yearCounters: Record<number, number> = {};
    let updatedCount = 0;

    const batch = db.batch();

    for (const order of orders) {
      const year = order.createdAt.getFullYear() || new Date().getFullYear();
      if (!yearCounters[year]) {
        yearCounters[year] = 0;
      }
      yearCounters[year]++;
      
      const expectedNumber = `${year}-${String(yearCounters[year]).padStart(4, '0')}`;
      
      if (!order.orderNumber || order.orderNumber !== expectedNumber) {
        batch.update(order.ref, { orderNumber: expectedNumber });
        updatedCount++;
      }
    }

    // Sync/write counters
    for (const [year, count] of Object.entries(yearCounters)) {
      const counterRef = db.collection('counters').doc(`orders_${year}`);
      batch.set(counterRef, { count }, { merge: true });
    }

    if (updatedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({ success: true, total: orders.length, updated: updatedCount, yearCounters });
  } catch (error: any) {
    console.error('Backfill sequential IDs failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
