import { NextResponse } from 'next/server';
import { emptyAdminAnalytics } from '@/lib/adminFallbacks';
import { recordFirestoreError } from '@/lib/firestoreCircuitBreaker';
import { getAnalyticsFromMetrics, getAdminMetricsSnapshot } from '@/lib/services/adminMetricsService';
import { getPostgresAdminAnalytics } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export async function GET() {
  try {
    const postgresAnalytics = await getPostgresAdminAnalytics().catch(() => null);
    if (postgresAnalytics) return NextResponse.json(postgresAnalytics);

    const metricsAnalytics = getAnalyticsFromMetrics(await getAdminMetricsSnapshot());
    if (metricsAnalytics) return NextResponse.json(metricsAnalytics);

    return NextResponse.json(emptyAdminAnalytics());
  } catch (error) {
    recordFirestoreError(error);
    console.error('Error fetching analytics:', error);
    return NextResponse.json(emptyAdminAnalytics());
  }
}
