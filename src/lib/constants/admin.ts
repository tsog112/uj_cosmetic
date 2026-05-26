import type { OrderStatus as FirestoreOrderStatus } from '@/types';

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Хүлээгдэж байна', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  { value: 'confirmed', label: 'Баталгаажсан', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  { value: 'processing', label: 'Бэлтгэгдэж байна', color: 'var(--status-purple)', bg: 'var(--status-purple-bg)' },
  { value: 'shipped', label: 'Илгээгдсэн', color: 'var(--status-blue)', bg: 'var(--status-blue-bg)' },
  { value: 'delivered', label: 'Хүргэгдсэн', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  { value: 'cancelled', label: 'Цуцлагдсан', color: 'var(--status-error)', bg: 'var(--status-error-bg)' },
] as const;

export type OrderStatus = FirestoreOrderStatus;

export const ORDER_STATUS_VALUES = ORDER_STATUSES.map((status) => status.value);
export const PAID_ORDER_STATUS_VALUES: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered'];
export const CANCELLED_ORDER_STATUS: OrderStatus = 'cancelled';
export const PENDING_ORDER_STATUS: OrderStatus = 'pending';

export const ORDER_STATUS_TRANSITIONS: Partial<Record<OrderStatus, Array<{ label: string; status: OrderStatus; danger?: boolean }>>> = {
  pending: [
    { label: 'Баталгаажуулах', status: 'confirmed' },
    { label: 'Цуцлах', status: 'cancelled', danger: true },
  ],
  confirmed: [{ label: 'Бэлтгэж эхлэх', status: 'processing' }],
  processing: [{ label: 'Хүргэлтэд гаргах', status: 'shipped' }],
  shipped: [{ label: 'Хүргэгдсэн болгох', status: 'delivered' }],
};

export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const NOTIFICATION_TYPES = [
  { value: 'ORDER_CONFIRMED', label: 'Захиалга баталгаажлаа', icon: '✅' },
  { value: 'ORDER_SHIPPED', label: 'Захиалга илгээгдлээ', icon: '🚚' },
  { value: 'ORDER_DELIVERED', label: 'Захиалга хүргэгдлээ', icon: '📦' },
  { value: 'ORDER_CANCELLED', label: 'Захиалга цуцлагдлаа', icon: '❌' },
  { value: 'PROMO', label: 'Урамшуулал', icon: '🎁' },
  { value: 'RESTOCK', label: 'Нөөц нөхөгдлөө', icon: '🔄' },
  { value: 'ADMIN_BROADCAST', label: 'Нийтийн мэдэгдэл', icon: '📢' },
] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number]['value'];

export const ADMIN_NAV_ITEMS = [
  { key: 'dashboard', label: 'Самбар', href: '/admin', icon: 'LayoutDashboard' },
  { key: 'orders', label: 'Захиалга', href: '/admin/orders', icon: 'ShoppingBag' },
  { key: 'products', label: 'Бараа', href: '/admin/products', icon: 'Package' },
  { key: 'customers', label: 'Хэрэглэгч', href: '/admin/customers', icon: 'Users' },
  { key: 'reviews', label: 'Сэтгэгдэл', href: '/admin/reviews', icon: 'Star' },
  { key: 'reports', label: 'Тайлан', href: '/admin/analytics', icon: 'BarChart3' },
  { key: 'settings', label: 'Тохиргоо', href: '/admin/settings', icon: 'Settings' },
] as const;

export const ADMIN_SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Самбар', href: '/admin', icon: 'LayoutDashboard' },
  { key: 'orders', label: 'Захиалгууд', href: '/admin/orders', icon: 'ShoppingBag', badgeKey: 'pendingCount' },
  { key: 'products', label: 'Бүтээгдэхүүн', href: '/admin/products', icon: 'Package' },
  { key: 'customers', label: 'Хэрэглэгчид', href: '/admin/customers', icon: 'Users' },
  { key: 'reviews', label: 'Сэтгэгдэл', href: '/admin/reviews', icon: 'Star' },
  { key: 'reports', label: 'Тайлан', href: '/admin/analytics', icon: 'BarChart3' },
  { key: 'settings', label: 'Тохиргоо', href: '/admin/settings', icon: 'Settings' },
] as const;

export const PRODUCT_STOCK_FILTERS = [
  { label: 'Бүгд', value: 'all' },
  { label: 'Нөөцтэй', value: 'inStock' },
  { label: 'Бага нөөц', value: 'low' },
  { label: 'Дууссан', value: 'empty' },
] as const;

export const REVIEW_FILTERS = [
  { value: 'all', label: 'Бүгд' },
  { value: 'pending', label: 'Хүлээгдэж' },
  { value: 'approved', label: 'Нийтлэгдсэн' },
  { value: 'hidden', label: 'Нуугдсан' },
] as const;

export const SETTINGS_SECTIONS = [
  { id: 'store', title: 'Дэлгүүрийн мэдээлэл' },
  { id: 'shipping', title: 'Хүргэлтийн тохиргоо' },
  { id: 'categories', title: 'Ангилал удирдах' },
  { id: 'instagram', title: 'Instagram удирдах' },
  { id: 'system', title: 'Системийн мэдээлэл' },
] as const;

export const DASHBOARD_METRIC_CONFIG = [
  { key: 'todayRevenue', title: 'Өнөөдрийн орлого', href: '/admin/analytics' },
  { key: 'todayOrderCount', title: 'Өнөөдрийн захиалга', href: '/admin/orders' },
  { key: 'pendingCount', title: 'Хүлээгдэж буй', href: '/admin/orders?status=pending' },
  { key: 'lowStockCount', title: 'Нөөц багатай', href: '/admin/products?inStock=low' },
] as const;

export const DASHBOARD_ACTION_CONFIG = [
  { key: 'newProduct', href: '/admin/products/new', label: 'Бараа нэмэх' },
  { key: 'orders', href: '/admin/orders', label: 'Захиалга' },
  { key: 'customers', href: '/admin/customers', label: 'Хэрэглэгч' },
  { key: 'reviews', href: '/admin/reviews', label: 'Сэтгэгдэл' },
] as const;

export const LOW_STOCK_THRESHOLD = 5;
export const ADMIN_ALL_FILTER_VALUE = 'all';
export const INSTAGRAM_FEED_SLOT_COUNT = 6;
export const SETTINGS_FALLBACK_FREE_SHIPPING_THRESHOLD = 0;
export const SETTINGS_FALLBACK_SHIPPING_COST = 0;
export const FREE_SHIPPING_THRESHOLD_DEFAULT = 50000;

export const SYSTEM_INFO_ITEMS = [
  ['Framework', 'Next.js'],
  ['Database', 'Firebase Firestore'],
  ['Admin data', 'SWR + Firestore API'],
  ['Media', 'Cloudinary upload'],
] as const;

/** Normalize legacy uppercase status from URLs or old data */
export function normalizeAdminOrderStatus(status: string | null | undefined): OrderStatus {
  const raw = String(status || 'pending').toLowerCase();
  return (ORDER_STATUS_VALUES.includes(raw as OrderStatus) ? raw : 'pending') as OrderStatus;
}
