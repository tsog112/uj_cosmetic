import { NextRequest, NextResponse } from 'next/server';
import { emptyRevenueChart } from '@/lib/adminFallbacks';
import { CANCELLED_ORDER_STATUS } from '@/lib/constants/admin';
import { recordFirestoreError } from '@/lib/firestoreCircuitBreaker';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getAdminMetricsSnapshot, getRevenueChartFromMetrics } from '@/lib/services/adminMetricsService';
import { getPostgresRevenueChart } from '@/lib/services/postgresAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

function withTimeout<T>(promise: Promise<T>, label: string, ms = 1500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

export async function GET(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '7d';

  try {
    const postgresChart = await getPostgresRevenueChart(range).catch(() => null);
    if (postgresChart) return NextResponse.json(postgresChart);

    const metricsChart = getRevenueChartFromMetrics(await getAdminMetricsSnapshot(), range);
    if (metricsChart) return NextResponse.json(metricsChart);

    if (process.env.ADMIN_ALLOW_LIVE_STATS_FALLBACK !== 'true') {
      return NextResponse.json(emptyRevenueChart());
    }

    const db = getAdminDb();
    const now = new Date();
    let startDate = new Date();

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '7d') {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '30d' || range === '1m') {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '3m') {
      startDate.setMonth(now.getMonth() - 2);
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const snap = await withTimeout(
      db.collection('orders').where('createdAt', '>=', startDate).limit(2000).get(),
      'revenue chart',
    );
    const orders = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        total: Number(data.total || 0),
        status: data.status,
      };
    }).filter((order) => order.status !== CANCELLED_ORDER_STATUS);

    const labels: string[] = [];
    const revenue: number[] = [];
    const orderCounts: number[] = [];

    if (range === 'today') {
      for (let hour = 0; hour <= now.getHours(); hour += 1) {
        const hourOrders = orders.filter((order) => order.createdAt.getHours() === hour);
        labels.push(`${hour}:00`);
        revenue.push(hourOrders.reduce((sum, order) => sum + order.total, 0));
        orderCounts.push(hourOrders.length);
      }
    } else {
      const days = range === '7d' ? 7 : (range === '30d' || range === '1m') ? 30 : range === '3m' ? 92 : now.getDate();
      const cursor = new Date(startDate);
      for (let index = 0; index < days; index += 1) {
        if (cursor > now) break;
        const nextDay = new Date(cursor);
        nextDay.setDate(cursor.getDate() + 1);
        const dayOrders = orders.filter((order) => order.createdAt >= cursor && order.createdAt < nextDay);
        labels.push(`${cursor.getMonth() + 1}/${cursor.getDate()}`);
        revenue.push(dayOrders.reduce((sum, order) => sum + order.total, 0));
        orderCounts.push(dayOrders.length);
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return NextResponse.json({ labels, revenue, orders: orderCounts });
  } catch (error) {
    recordFirestoreError(error);
    console.error('Error fetching revenue chart data:', error);
    return NextResponse.json(emptyRevenueChart());
  }
}
