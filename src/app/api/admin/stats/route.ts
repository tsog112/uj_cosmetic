import { NextResponse } from 'next/server';
import { emptyAdminStats } from '@/lib/adminFallbacks';
import { getAdminStats } from '@/lib/services/firestoreAdminService';

export async function GET() {
  try {
    const stats = await getAdminStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(emptyAdminStats());
  }
}
