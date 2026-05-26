import { NextRequest, NextResponse } from 'next/server';
import { emptyRevenueChart } from '@/lib/adminFallbacks';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { CANCELLED_ORDER_STATUS } from '@/lib/constants/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';

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
    } else if (range === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const snap = await db.collection('orders')
      .where('createdAt', '>=', startDate)
      .get();

    const orders = snap.docs.map(doc => {
      const data = doc.data();
      return {
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        total: Number(data.total || 0),
        status: data.status,
      };
    }).filter(o => o.status !== CANCELLED_ORDER_STATUS);

    const labels: string[] = [];
    const revenue: number[] = [];
    const orderCounts: number[] = [];

    if (range === 'today') {
      // Group by hour
      for (let i = 0; i <= now.getHours(); i++) {
        const hourOrders = orders.filter(o => o.createdAt.getHours() === i);
        labels.push(`${i}:00`);
        revenue.push(hourOrders.reduce((sum, o) => sum + o.total, 0));
        orderCounts.push(hourOrders.length);
      }
    } else {
      // Group by day
      const days = range === '7d' ? 7 : (range === '30d' || range === '1m') ? 30 : range === '3m' ? 92 : now.getDate();
      const tempStart = new Date(startDate);
      
      if (range === '3m') {
        for (let i = 0; i < 3; i++) {
          const month = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
          const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
          const monthOrders = orders.filter(o => o.createdAt >= month && o.createdAt < nextMonth);
          labels.push(`${month.getMonth() + 1} сар`);
          revenue.push(monthOrders.reduce((sum, o) => sum + o.total, 0));
          orderCounts.push(monthOrders.length);
        }
      } else {
      for (let i = 0; i < days; i++) {
        if (tempStart > now) break;
        
        const nextDay = new Date(tempStart);
        nextDay.setDate(tempStart.getDate() + 1);
        
        const dayOrders = orders.filter(o => o.createdAt >= tempStart && o.createdAt < nextDay);
        
        labels.push(`${tempStart.getMonth() + 1}/${tempStart.getDate()}`);
        revenue.push(dayOrders.reduce((sum, o) => sum + o.total, 0));
        orderCounts.push(dayOrders.length);
        
        tempStart.setDate(tempStart.getDate() + 1);
      }
      }
    }

    return NextResponse.json({
      labels,
      revenue,
      orders: orderCounts
    });
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    return NextResponse.json(emptyRevenueChart());
  }
}
