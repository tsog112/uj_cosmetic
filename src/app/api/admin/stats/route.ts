import { NextResponse } from 'next/server';
import { emptyAdminStats } from '@/lib/adminFallbacks';
import { recordFirestoreError } from '@/lib/firestoreCircuitBreaker';
import { getAdminMetricsSnapshot, getStatsFromMetrics } from '@/lib/services/adminMetricsService';
import { getPostgresAdminStats } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export async function GET() {
  try {
    const postgresStats = await getPostgresAdminStats().catch(() => null);
    if (postgresStats) return NextResponse.json(postgresStats);

    const metricsStats = getStatsFromMetrics(await getAdminMetricsSnapshot());
    if (metricsStats) return NextResponse.json(metricsStats);

    return NextResponse.json(emptyAdminStats());
  } catch (error) {
    recordFirestoreError(error);
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(emptyAdminStats());
  }
}
