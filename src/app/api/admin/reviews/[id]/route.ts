import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const db = getAdminDb();
    await db.collection('reviews').doc(id).delete();
    
    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
