import { NextResponse } from 'next/server';
import { isFirestoreCircuitOpen, recordFirestoreError } from '@/lib/firestoreCircuitBreaker';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';
import { cached } from '@/lib/serverCache';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

export const runtime = 'nodejs';

type NotificationItem = {
  id: string;
  type: 'order' | 'user' | 'stock';
  title: string;
  body: string;
  date: string;
  href: string;
  isCritical?: boolean;
};

function parseDate(value: any): Date {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') return value.toDate();
  if (value._seconds) return new Date(value._seconds * 1000);
  if (value.seconds) return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function emptyPayload(warnings: string[] = []) {
  return {
    notifications: [],
    pendingCount: 0,
    lowStockCount: 0,
    ...(warnings.length ? { warnings } : {}),
  };
}

function withTimeout<T>(promise: Promise<T>, label: string, ms = 800): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

async function getPostgresPayload() {
  return cached('admin-notifications:postgres', 20_000, async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const notifications: NotificationItem[] = [];

    const [pendingCount, pendingOrders, newUsers, lowStockCount, lowStockProducts] = await Promise.all([
      prisma.order.count({ where: { status: 'pending', archived: false } }),
      prisma.order.findMany({
        where: { status: 'pending', archived: false },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          total: true,
          createdAt: true,
        },
      }),
      prisma.user.findMany({
        where: { role: { not: 'admin' }, createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, displayName: true, name: true, email: true, createdAt: true },
      }),
      prisma.product.count({
        where: {
          OR: [
            { stock: { lte: 5 } },
            { stockQuantity: { lte: 5 } },
          ],
        },
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { stock: { lte: 5 } },
            { stockQuantity: { lte: 5 } },
          ],
        },
        orderBy: [{ stock: 'asc' }, { updatedAt: 'desc' }],
        take: 20,
        select: { id: true, name: true, nameMn: true, stock: true, stockQuantity: true, updatedAt: true },
      }),
    ]);

    pendingOrders.forEach((order) => {
      notifications.push({
        id: `order-${order.id}`,
        type: 'order',
        title: 'Шинэ захиалга',
        body: `${order.customerName || order.customerEmail || 'Хэрэглэгч'} - ${Number(order.total || 0).toLocaleString('mn-MN')}₮`,
        date: order.createdAt.toISOString(),
        href: `/admin/orders?id=${order.id}`,
        isCritical: true,
      });
    });

    newUsers.forEach((user) => {
      notifications.push({
        id: `user-${user.id}`,
        type: 'user',
        title: 'Шинэ хэрэглэгч',
        body: `${user.displayName || user.name || user.email || 'Нэргүй'} бүртгүүллээ.`,
        date: user.createdAt.toISOString(),
        href: '/admin/customers',
        isCritical: false,
      });
    });

    lowStockProducts.forEach((product) => {
      const stock = Number(product.stockQuantity || product.stock || 0);
      notifications.push({
        id: `stock-${product.id}`,
        type: 'stock',
        title: stock === 0 ? 'Нөөц дууссан' : 'Нөөц дуусах гэж байна',
        body: `${product.nameMn || product.name || 'Бүтээгдэхүүн'} (${stock} үлдсэн)`,
        date: product.updatedAt.toISOString(),
        href: `/admin/products/${product.id}/edit`,
        isCritical: stock === 0,
      });
    });

    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      notifications: notifications.slice(0, 30),
      pendingCount,
      lowStockCount,
    };
  });
}

export async function GET() {
  const warnings: string[] = [];

  try {
    const postgresPayload = await getPostgresPayload().catch((error) => {
      console.error('Failed to fetch PostgreSQL notifications:', error);
      warnings.push('postgres');
      return null;
    });

    if (postgresPayload) {
      return NextResponse.json({
        ...postgresPayload,
        ...(warnings.length ? { warnings } : {}),
      });
    }

    if (isFirestoreCircuitOpen()) {
      return NextResponse.json(emptyPayload(['firestore-circuit-open']));
    }

    const db = getAdminDb();
    const notifications: NotificationItem[] = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let pendingCount = 0;
    let lowStockCount = 0;

    await Promise.all([
      withTimeout(
        db.collection('orders').where('status', '==', 'pending').limit(20).get(),
        'order notifications',
      )
        .then((pendingSnap) => {
          pendingCount = pendingSnap.size;
          pendingSnap.forEach((doc) => {
            const data = doc.data();
            const date = parseDate(data.createdAt);
            notifications.push({
              id: `order-${doc.id}`,
              type: 'order',
              title: '\u0428\u0438\u043d\u044d \u0437\u0430\u0445\u0438\u0430\u043b\u0433\u0430',
              body: `${data.customerName || data.email || '\u0425\u044d\u0440\u044d\u0433\u043b\u044d\u0433\u0447'} - ${Number(data.total || 0).toLocaleString('mn-MN')}\u20ae`,
              date: date.toISOString(),
              href: `/admin/orders?id=${doc.id}`,
              isCritical: true,
            });
          });
        })
        .catch((error) => {
          recordFirestoreError(error);
          console.error('Failed to fetch order notifications:', error);
          warnings.push('orders');
        }),

      withTimeout(
        db.collection('users').orderBy('createdAt', 'desc').limit(10).get(),
        'user notifications',
      )
        .then((usersSnap) => {
          usersSnap.forEach((doc) => {
            const data = doc.data();
            const date = parseDate(data.createdAt);
            if (date >= sevenDaysAgo && data.role !== 'admin') {
              notifications.push({
                id: `user-${doc.id}`,
                type: 'user',
                title: '\u0428\u0438\u043d\u044d \u0445\u044d\u0440\u044d\u0433\u043b\u044d\u0433\u0447',
                body: `${data.displayName || data.name || data.email || '\u041d\u044d\u0440\u0433\u04af\u0439'} \u0431\u04af\u0440\u0442\u0433\u04af\u04af\u043b\u043b\u044d\u044d.`,
                date: date.toISOString(),
                href: '/admin/customers',
                isCritical: false,
              });
            }
          });
        })
        .catch((error) => {
          recordFirestoreError(error);
          console.error('Failed to fetch user notifications:', error);
          warnings.push('users');
        }),

      withTimeout(db.collection('products').limit(100).get(), 'stock notifications')
        .then((productsSnap) => {
          productsSnap.forEach((doc) => {
            const data = doc.data();
            const stock = Number(data.stockQuantity ?? data.stock ?? 0);
            if (stock >= 0 && stock <= 5) {
              const date = parseDate(data.updatedAt);
              lowStockCount += 1;
              notifications.push({
                id: `stock-${doc.id}`,
                type: 'stock',
                title: stock === 0
                  ? '\u041d\u04e9\u04e9\u0446 \u0434\u0443\u0443\u0441\u0441\u0430\u043d'
                  : '\u041d\u04e9\u04e9\u0446 \u0434\u0443\u0443\u0441\u0430\u0445 \u0433\u044d\u0436 \u0431\u0430\u0439\u043d\u0430',
                body: `${data.name_mn || data.name || '\u0411\u04af\u0442\u044d\u044d\u0433\u0434\u044d\u0445\u04af\u04af\u043d'} (${stock} \u04af\u043b\u0434\u0441\u044d\u043d)`,
                date: date.toISOString(),
                href: `/admin/products/${doc.id}/edit`,
                isCritical: stock === 0,
              });
            }
          });
        })
        .catch((error) => {
          recordFirestoreError(error);
          console.error('Failed to fetch stock notifications:', error);
          warnings.push('products');
        }),
    ]);

    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      notifications: notifications.slice(0, 30),
      pendingCount,
      lowStockCount,
      ...(warnings.length ? { warnings } : {}),
    });
  } catch (error) {
    recordFirestoreError(error);
    console.error('Error initializing notifications API:', error);
    return NextResponse.json(emptyPayload(['firebase-admin']));
  }
}
