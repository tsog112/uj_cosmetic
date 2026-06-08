import type { OrderStatus as FirestoreOrderStatus } from '@/types';

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Төлбөр хүлээж байна', color: 'var(--color-status-pending-text)', bg: 'var(--color-status-pending-bg)' },
  { value: 'confirmed', label: 'Төлбөр баталгаажсан', color: 'var(--color-status-confirmed-text)', bg: 'var(--color-status-confirmed-bg)' },
  { value: 'processing', label: 'Захиалга бэлдэж байна', color: 'var(--color-status-prep-text)', bg: 'var(--color-status-prep-bg)' },
  { value: 'shipped', label: 'Хүргэлтэд гарсан', color: 'var(--color-status-shipped-text)', bg: 'var(--color-status-shipped-bg)' },
  { value: 'delivered', label: 'Хүргэгдсэн', color: 'var(--color-status-done-text)', bg: 'var(--color-status-done-bg)' },
  { value: 'cancelled', label: 'Цуцлагдсан', color: 'var(--color-status-cancel-text)', bg: 'var(--color-status-cancel-bg)' },
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
  { value: 'ORDER_CONFIRMED', label: 'Захиалга баталгаажлаа', icon: 'check' },
  { value: 'ORDER_SHIPPED', label: 'Захиалга хүргэлтэд гарлаа', icon: 'truck' },
  { value: 'ORDER_DELIVERED', label: 'Захиалга хүргэгдлээ', icon: 'home' },
  { value: 'ORDER_CANCELLED', label: 'Захиалга цуцлагдлаа', icon: 'x' },
  { value: 'PROMO', label: 'Хямдрал', icon: 'gift' },
  { value: 'RESTOCK', label: 'Бараа нөөцлөгдлөө', icon: 'package' },
  { value: 'ADMIN_BROADCAST', label: 'Ерөнхий мэдэгдэл', icon: 'megaphone' },
] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number]['value'];

export const ADMIN_NAV_ITEMS = [
  { key: 'dashboard', label: 'Самбар', href: '/admin', icon: 'LayoutDashboard', mobileTab: true },
  { key: 'orders', label: 'Захиалга', href: '/admin/orders', icon: 'ShoppingBag', badgeKey: 'pendingCount' as const, mobileTab: true },
  { key: 'products', label: 'Бүтээгдэхүүн', href: '/admin/products', icon: 'Package', mobileTab: true },
  { key: 'customers', label: 'Хэрэглэгчид', href: '/admin/customers', icon: 'Users', mobileTab: true },
  { key: 'reviews', label: 'Сэтгэгдэл', href: '/admin/reviews', icon: 'Star', mobileTab: true },
  { key: 'reports', label: 'Тайлан', href: '/admin/analytics', icon: 'BarChart3', mobileTab: false },
  { key: 'settings', label: 'Тохиргоо', href: '/admin/settings', icon: 'Settings', mobileTab: true },
] as const;

export const ADMIN_MOBILE_TAB_ITEMS = ADMIN_NAV_ITEMS.filter((item) => item.mobileTab);

export function getAdminNavTitle(pathname: string): string {
  if (pathname === '/admin') return 'Самбар';
  const match = [...ADMIN_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => item.href !== '/admin' && pathname.startsWith(item.href));
  return match?.label ?? 'Админ';
}

export const PRODUCT_STOCK_FILTERS = [
  { label: 'Бүгд', value: 'all' },
  { label: 'Нөөцтэй', value: 'inStock' },
  { label: 'Нөөц бага', value: 'low' },
  { label: 'Дууссан', value: 'empty' },
] as const;

export const PRODUCT_VISIBILITY_FILTERS = [
  { label: 'Бүгд', value: 'all' },
  { label: 'Харагдаж байгаа', value: 'visible' },
  { label: 'Нуугдсан', value: 'hidden' },
] as const;

export const PRODUCT_SORT_FILTERS = [
  { label: 'Сүүлд нэмсэн', value: 'newest', sortDir: 'desc' as const },
  { label: 'Их захиалгатай', value: 'orders', sortDir: 'desc' as const },
  { label: 'Нэр (А → Я)', value: 'name', sortDir: 'asc' as const },
  { label: 'Нөөц ихээс бага', value: 'stock', sortDir: 'desc' as const },
  { label: 'Нөөц багаас их', value: 'stock', sortDir: 'asc' as const },
] as const;

export function productSortFilterKey(filter: (typeof PRODUCT_SORT_FILTERS)[number]) {
  return `${filter.value}-${filter.sortDir}`;
}

export const CUSTOMER_ROLE_FILTERS = [
  { label: 'Бүгд', value: 'all' },
  { label: 'Хэрэглэгч', value: 'customer' },
  { label: 'Админ', value: 'admin' },
] as const;

export const CUSTOMER_SORT_FILTERS = [
  { label: 'Сүүлд бүртгэгдсэн', value: 'newest' },
  { label: 'Их захиалгатай', value: 'orders' },
  { label: 'Их зарцуулсан', value: 'spent' },
] as const;

/** Admin product card stock badge threshold (display only). */
export const STOCK_DISPLAY_THRESHOLD = 10;

export const REVIEW_FILTERS = [
  { value: 'all', label: 'Бүгд' },
  { value: 'pending', label: 'Хүлээгдэж буй' },
  { value: 'visible', label: 'Нийтлэгдсэн' },
  { value: 'hidden', label: 'Нуугдсан' },
] as const;

export const SETTINGS_SECTIONS = [
  { id: 'store', title: 'Дэлгүүрийн мэдээлэл' },
  { id: 'home', title: 'Нүүр хуудас' },
  { id: 'about', title: 'Бидний тухай' },
  { id: 'shipping', title: 'Хүргэлтийн тохиргоо' },
  { id: 'categories', title: 'Ангиллын тохиргоо' },
  { id: 'instagram', title: 'Instagram тохиргоо' },
  { id: 'system', title: 'Системийн мэдээлэл' },
] as const;

export const TRUST_ITEM_ICONS = ['Truck', 'BadgeCheck', 'RotateCcw', 'MessageCircle', 'ShieldPlus', 'Heart', 'Sparkles', 'Gem'] as const;

export const DASHBOARD_METRIC_CONFIG = [
  { key: 'todayRevenue', title: 'Өнөөдрийн орлого', href: '/admin/analytics' },
  { key: 'todayOrderCount', title: 'Өнөөдрийн захиалга', href: '/admin/orders' },
  { key: 'pendingCount', title: 'Хүлээгдэж буй', href: '/admin/orders?status=pending' },
  { key: 'lowStockCount', title: 'Нөөц бага', href: '/admin/products?inStock=low' },
] as const;

export const DASHBOARD_ACTION_CONFIG = [
  { key: 'newProduct', href: '/admin/products/new', label: 'Бүтээгдэхүүн нэмэх' },
  { key: 'orders', href: '/admin/orders', label: 'Захиалга харах' },
  { key: 'customers', href: '/admin/customers', label: 'Хэрэглэгчид' },
  { key: 'reviews', href: '/admin/reviews', label: 'Сэтгэгдэл' },
] as const;

export const LOW_STOCK_THRESHOLD = 5;
export const ADMIN_ALL_FILTER_VALUE = 'all';
/** Улаанбаатар хотын region_id (Монгол хаягийн сан) */
export const ULAANBAATAR_REGION_ID = '1';
export const INSTAGRAM_FEED_SLOT_COUNT = 6;
export const SETTINGS_FALLBACK_FREE_SHIPPING_THRESHOLD = 0;
export const SETTINGS_FALLBACK_SHIPPING_COST = 0;
export const FREE_SHIPPING_THRESHOLD_DEFAULT = 50000;

export const SYSTEM_INFO_ITEMS = [
  ['Framework', 'Next.js'],
  ['Database', 'PostgreSQL + Firebase fallback'],
  ['Admin data', 'SWR + cached API'],
  ['Media', 'Cloudinary upload'],
] as const;

export function normalizeAdminOrderStatus(status: string | null | undefined): OrderStatus {
  const raw = String(status || 'pending').toLowerCase();
  return (ORDER_STATUS_VALUES.includes(raw as OrderStatus) ? raw : 'pending') as OrderStatus;
}
