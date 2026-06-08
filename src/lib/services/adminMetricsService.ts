import { FieldValue } from 'firebase-admin/firestore';
import { emptyAdminAnalytics, emptyAdminStats, emptyProductStats, emptyRevenueChart } from '@/lib/adminFallbacks';
import { CANCELLED_ORDER_STATUS, LOW_STOCK_THRESHOLD, PAID_ORDER_STATUS_VALUES } from '@/lib/constants/admin';
import { assertFirestoreCircuitClosed, isFirestoreCircuitOpen, recordFirestoreError } from '@/lib/firestoreCircuitBreaker';
import { getAdminDb } from '@/lib/firebaseAdmin';

const METRICS_COLLECTION = 'admin_metrics';
const SUMMARY_DOC = 'summary';
const METRICS_TIMEOUT_MS = 5000;

type AdminMetricsSnapshot = {
  stats: Record<string, any>;
  analytics: Record<string, any>;
  productStats: Record<string, any>;
  revenueCharts: Record<string, Record<string, any>>;
  generatedAt?: string;
  source?: string;
};

function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function withTimeout<T>(promise: Promise<T>, label: string, ms = METRICS_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

function dayLabel(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getRangeStart(range: string, now = new Date()) {
  let startDate = new Date(now);
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
  return startDate;
}

function buildRevenueChart(orders: any[], range: string) {
  const now = new Date();
  const startDate = getRangeStart(range, now);
  const filteredOrders = orders.filter((order) => order.createdAt >= startDate && order.status !== CANCELLED_ORDER_STATUS);
  const labels: string[] = [];
  const revenue: number[] = [];
  const orderCounts: number[] = [];

  if (range === 'today') {
    for (let hour = 0; hour <= now.getHours(); hour += 1) {
      const hourOrders = filteredOrders.filter((order) => order.createdAt.getHours() === hour);
      labels.push(`${hour}:00`);
      revenue.push(hourOrders.reduce((sum, order) => sum + order.total, 0));
      orderCounts.push(hourOrders.length);
    }
  } else if (range === '3m') {
    for (let index = 0; index < 3; index += 1) {
      const month = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1);
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      const monthOrders = filteredOrders.filter((order) => order.createdAt >= month && order.createdAt < nextMonth);
      labels.push(`${month.getMonth() + 1} sar`);
      revenue.push(monthOrders.reduce((sum, order) => sum + order.total, 0));
      orderCounts.push(monthOrders.length);
    }
  } else {
    const days = range === '7d' ? 7 : (range === '30d' || range === '1m') ? 30 : now.getDate();
    const cursor = new Date(startDate);
    for (let index = 0; index < days; index += 1) {
      if (cursor > now) break;
      const nextDay = new Date(cursor);
      nextDay.setDate(cursor.getDate() + 1);
      const dayOrders = filteredOrders.filter((order) => order.createdAt >= cursor && order.createdAt < nextDay);
      labels.push(dayLabel(cursor));
      revenue.push(dayOrders.reduce((sum, order) => sum + order.total, 0));
      orderCounts.push(dayOrders.length);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return { labels, revenue, orders: orderCounts };
}

function countByStatus(orders: any[], status: string) {
  return orders.filter((order) => order.status === status).length;
}

export async function getAdminMetricsSnapshot() {
  try {
    if (isFirestoreCircuitOpen()) return null;
    const db = getAdminDb();
    const doc = await withTimeout(db.collection(METRICS_COLLECTION).doc(SUMMARY_DOC).get(), 'admin metrics read');
    if (!doc.exists) return null;
    return doc.data() as AdminMetricsSnapshot;
  } catch (error) {
    recordFirestoreError(error);
    console.warn('Admin metrics read failed:', error);
    return null;
  }
}

export function getStatsFromMetrics(metrics: AdminMetricsSnapshot | null) {
  return metrics?.stats || null;
}

export function getAnalyticsFromMetrics(metrics: AdminMetricsSnapshot | null) {
  return metrics?.analytics || null;
}

export function getProductStatsFromMetrics(metrics: AdminMetricsSnapshot | null) {
  return metrics?.productStats || null;
}

export function getRevenueChartFromMetrics(metrics: AdminMetricsSnapshot | null, range: string) {
  return metrics?.revenueCharts?.[range] || metrics?.revenueCharts?.['7d'] || null;
}

export async function rebuildAdminMetricsSnapshot() {
  assertFirestoreCircuitClosed();
  const db = getAdminDb();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const oldestChartStart = getRangeStart('3m', now);

  const [
    productsCount,
    usersCount,
    pendingCount,
    productsSnap,
    ordersSnap,
    expensesSnap,
  ] = await Promise.all([
    db.collection('products').count().get(),
    db.collection('users').count().get(),
    db.collection('orders').where('status', '==', 'pending').count().get(),
    db.collection('products').limit(1000).get(),
    db.collection('orders').where('createdAt', '>=', oldestChartStart).limit(5000).get(),
    db.collection('expenses').where('date', '>=', monthStart).limit(500).get(),
  ]);

  const products = productsSnap.docs.map((doc) => {
    const data = doc.data();
    const stock = Number(data.stockQuantity ?? data.stock ?? 0);
    return {
      id: doc.id,
      name: data.name_mn || data.name || 'Untitled',
      category: data.category || data.categoryId || 'other',
      price: Number(data.salePrice ?? data.price ?? 0),
      stock,
      views: Number(data.views || 0),
      visible: data.published !== false && data.isVisible !== false,
      orderCount: Number(data.orderCount || 0),
    };
  });

  const orders = ordersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId || '',
      status: String(data.status || 'pending').toLowerCase(),
      total: Number(data.total || 0),
      items: Array.isArray(data.items) ? data.items : [],
      createdAt: toDate(data.createdAt),
    };
  });

  const activeOrders = orders.filter((order) => order.status !== CANCELLED_ORDER_STATUS);
  const paidOrders = orders.filter((order) => PAID_ORDER_STATUS_VALUES.includes(order.status as any));
  const todayOrders = activeOrders.filter((order) => order.createdAt >= today);
  const thisMonthOrders = activeOrders.filter((order) => order.createdAt >= monthStart);
  const lastMonthOrders = activeOrders.filter((order) => order.createdAt >= firstDayLastMonth && order.createdAt < monthStart);
  const paidMonthOrders = paidOrders.filter((order) => order.createdAt >= monthStart);
  const weekStart = getRangeStart('7d', now);
  const paidWeekOrders = paidOrders.filter((order) => order.createdAt >= weekStart);

  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const monthlyRevenue = thisMonthOrders.reduce((sum, order) => sum + order.total, 0);
  const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);
  const revenueChange = lastMonthRevenue > 0
    ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : monthlyRevenue > 0 ? 100 : 0;

  const productSales = new Map<string, { quantity: number; revenue: number }>();
  paidMonthOrders.forEach((order) => {
    order.items.forEach((item: any) => {
      const productId = String(item.productId || '');
      if (!productId) return;
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const current = productSales.get(productId) || { quantity: 0, revenue: 0 };
      productSales.set(productId, {
        quantity: current.quantity + quantity,
        revenue: current.revenue + quantity * price,
      });
    });
  });

  const productById = new Map(products.map((product) => [product.id, product]));
  const productPerformance = products
    .map((product) => {
      const sales = productSales.get(product.id) || { quantity: 0, revenue: 0 };
      const conversion = product.views > 0 ? Number(((sales.quantity / product.views) * 100).toFixed(1)) : sales.quantity > 0 ? 100 : 0;
      return {
        id: product.id,
        name: product.name,
        views: product.views,
        orders: sales.quantity,
        conversion,
        stock: product.stock,
      };
    })
    .sort((a, b) => b.orders - a.orders || b.views - a.views);

  const topProducts = Array.from(productSales.entries())
    .map(([id, sales]) => ({
      id,
      name: productById.get(id)?.name || 'Untitled',
      category: productById.get(id)?.category || 'other',
      quantity: sales.quantity,
      revenue: sales.revenue,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const lowStockProducts = products
    .filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD)
    .slice(0, 20)
    .map((product) => ({ id: product.id, name: product.name, stock: product.stock }));
  const outOfStockProducts = products
    .filter((product) => product.stock === 0)
    .slice(0, 20)
    .map((product) => ({ id: product.id, name: product.name, stock: 0 }));
  const inventoryRisk = products
    .filter((product) => product.stock <= LOW_STOCK_THRESHOLD)
    .slice(0, 8)
    .map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      stock: product.stock,
      price: product.price,
      visible: product.visible,
      soldCount: product.orderCount,
    }));

  const categories = new Map<string, number>();
  products.forEach((product) => categories.set(product.category, (categories.get(product.category) || 0) + 1));

  const sevenDayChart = buildRevenueChart(orders, '7d');
  const revenueByDay = sevenDayChart.labels.map((label, index) => ({
    date: label,
    revenue: sevenDayChart.revenue[index] || 0,
    orders: sevenDayChart.orders[index] || 0,
  }));
  const totalExpenses = expensesSnap.docs.reduce((sum, doc) => sum + Number(doc.data().amount || 0), 0);
  const pendingPayments = thisMonthOrders.filter((order) => order.status === 'pending');
  const customerOrderCounts = new Map<string, number>();
  activeOrders.forEach((order) => {
    if (order.userId) customerOrderCounts.set(order.userId, (customerOrderCounts.get(order.userId) || 0) + 1);
  });

  const snapshot: AdminMetricsSnapshot = {
    source: 'admin_metrics',
    generatedAt: now.toISOString(),
    stats: {
      ...emptyAdminStats(),
      todayRevenue,
      todayOrderCount: todayOrders.length,
      pendingCount: pendingCount.data().count,
      lowStockCount: products.filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD).length,
      totalProducts: productsCount.data().count,
      totalCustomers: usersCount.data().count,
      monthlyRevenue,
      revenueChange,
      warning: undefined as any,
    },
    analytics: {
      ...emptyAdminAnalytics(),
      summary: {
        monthRevenue: paidMonthOrders.reduce((sum, order) => sum + order.total, 0),
        weekRevenue: paidWeekOrders.reduce((sum, order) => sum + order.total, 0),
        averageOrder: paidWeekOrders.length ? Math.round(paidWeekOrders.reduce((sum, order) => sum + order.total, 0) / paidWeekOrders.length) : 0,
        paidOrderCount: paidWeekOrders.length,
        lowStockCount: products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).length,
        repeatCustomers: Array.from(customerOrderCounts.values()).filter((count) => count > 1).length,
        customerValue: usersCount.data().count ? Math.round(activeOrders.reduce((sum, order) => sum + order.total, 0) / usersCount.data().count) : 0,
        totalCustomers: usersCount.data().count,
        productCount: productsCount.data().count,
        pendingPaymentCount: pendingPayments.length,
        pendingPaymentAmount: pendingPayments.reduce((sum, order) => sum + order.total, 0),
        expenseTracked: true,
        totalExpenses,
        netProfit: paidMonthOrders.reduce((sum, order) => sum + order.total, 0) - totalExpenses,
      },
      revenueByDay,
      statusBreakdown: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
        .map((status) => ({ status, count: countByStatus(thisMonthOrders, status) })),
      topProducts,
      inventoryRisk,
      productPerformance,
      expenses: expensesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), date: toDate(doc.data().date) })),
      warning: undefined as any,
    },
    productStats: {
      ...emptyProductStats(),
      topProducts,
      lowStockProducts,
      outOfStockProducts,
      categories: Array.from(categories.entries()).map(([name, count]) => ({ name, count })),
      warning: undefined as any,
    },
    revenueCharts: {
      today: buildRevenueChart(orders, 'today'),
      '7d': sevenDayChart,
      '1m': buildRevenueChart(orders, '1m'),
      '30d': buildRevenueChart(orders, '30d'),
      month: buildRevenueChart(orders, 'month'),
      '3m': buildRevenueChart(orders, '3m'),
    },
  };

  await db.collection(METRICS_COLLECTION).doc(SUMMARY_DOC).set({
    ...snapshot,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return snapshot;
}
