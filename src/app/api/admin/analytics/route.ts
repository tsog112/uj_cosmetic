import { NextResponse } from 'next/server';
import { emptyAdminAnalytics } from '@/lib/adminFallbacks';
import { getAdminAnalytics } from '@/lib/services/firestoreAdminService';

export async function GET() {
  try {
    const analytics = await getAdminAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(emptyAdminAnalytics());
  }
}
