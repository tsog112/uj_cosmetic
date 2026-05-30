import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { addressSnapshot, shippingAddress } = await req.json();

    if (!addressSnapshot || !shippingAddress) {
      return NextResponse.json({ error: 'Missing address data' }, { status: 400 });
    }

    const db = getAdminDb();
    
    // Update Firestore
    await db.collection('orders').doc(id).set(
      {
        addressSnapshot: typeof addressSnapshot === 'string' ? addressSnapshot : JSON.stringify(addressSnapshot),
        shippingAddress,
        updatedAt: new Date()
      },
      { merge: true }
    );

    // Update SQLite fallback
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.order.update({
        where: { id },
        data: {
          addressSnapshot: typeof addressSnapshot === 'string' ? addressSnapshot : JSON.stringify(addressSnapshot),
          shippingAddress
        }
      });
    } catch (dbErr) {
      console.error('Failed to sync updated address to SQLite:', dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order address:', error);
    return NextResponse.json({ error: 'Failed to update order address' }, { status: 500 });
  }
}
