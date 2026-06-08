import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreCircuitState, recordFirestoreError } from '@/lib/firestoreCircuitBreaker';
import { rebuildAdminMetricsSnapshot } from '@/lib/services/adminMetricsService';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  const secret = process.env.ADMIN_METRICS_REBUILD_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const queryToken = new URL(req.url).searchParams.get('secret') || '';
  return token === secret || queryToken === secret;
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await rebuildAdminMetricsSnapshot();
    return NextResponse.json({
      success: true,
      generatedAt: snapshot.generatedAt,
      totalProducts: snapshot.stats.totalProducts,
      totalCustomers: snapshot.stats.totalCustomers,
      monthlyRevenue: snapshot.stats.monthlyRevenue,
    });
  } catch (error: any) {
    recordFirestoreError(error);
    console.error('Admin metrics rebuild failed:', error);
    return NextResponse.json({
      error: error?.message || 'Failed to rebuild admin metrics',
      firestoreCircuit: getFirestoreCircuitState(),
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
