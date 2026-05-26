import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

function parseDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate();
  if (val._seconds) return new Date(val._seconds * 1000);
  if (val.seconds) return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

export async function GET() {
  try {
    const db = getAdminDb();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // 1. Get recent pending orders (fetch all pending and sort in memory to avoid composite index)
    const pendingSnap = await db.collection('orders')
      .where('status', '==', 'pending')
      .get();
      
    // 2. Get recent users (last 7 days)
    const usersSnap = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
      
    // 3. Get products and filter low stock in memory to support older docs that
    // may use either stockQuantity or stock.
    const productsSnap = await db.collection('products').get();

    const notifications: any[] = [];

    pendingSnap.forEach(doc => {
      const data = doc.data();
      const date = parseDate(data.createdAt);
      notifications.push({
        id: `order-${doc.id}`,
        type: 'order',
        title: 'Шинэ захиалга',
        body: `${data.customerName || data.email || 'Хэрэглэгч'} - ${Number(data.total || 0).toLocaleString('mn-MN')}₮`,
        date: date.toISOString(),
        href: `/admin/orders?id=${doc.id}`,
        isCritical: true,
      });
    });

    usersSnap.forEach(doc => {
      const data = doc.data();
      const date = parseDate(data.createdAt);
      if (date >= sevenDaysAgo && data.role !== 'admin') {
        notifications.push({
          id: `user-${doc.id}`,
          type: 'user',
          title: 'Шинэ хэрэглэгч',
          body: `${data.displayName || data.name || data.email || 'Нэргүй'} бүртгүүллээ.`,
          date: date.toISOString(),
          href: `/admin/customers`,
          isCritical: false,
        });
      }
    });

    productsSnap.forEach(doc => {
      const data = doc.data();
      const stock = Number(data.stockQuantity ?? data.stock ?? 0);
      if (stock >= 0 && stock <= 5) {
        const date = parseDate(data.updatedAt);
        notifications.push({
          id: `stock-${doc.id}`,
          type: 'stock',
          title: stock === 0 ? 'Нөөц дууссан' : 'Нөөц дуусаж байна',
          body: `${data.name_mn || data.name} (${stock}ш үлдсэн)`,
          date: date.toISOString(),
          href: `/admin/products/${doc.id}/edit`,
          isCritical: stock === 0,
        });
      }
    });

    // Sort all notifications by date descending
    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      notifications: notifications.slice(0, 30), // Return top 30
      pendingCount: pendingSnap.size,
      lowStockCount: notifications.filter((item) => item.type === 'stock').length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
