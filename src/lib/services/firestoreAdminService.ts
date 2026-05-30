import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { type OrderStatus } from '@/types';
import { LOW_STOCK_THRESHOLD } from '@/lib/constants/admin';

const PAID_STATUSES: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered'];
const CANCELLED_STATUS: OrderStatus = 'cancelled';
const PENDING_STATUS: OrderStatus = 'pending';

function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function normalizeOrderStatus(status: unknown): OrderStatus {
  const raw = String(status || 'pending').toLowerCase();
  const allowed: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  return allowed.includes(raw as OrderStatus) ? (raw as OrderStatus) : 'pending';
}

export function parseProductImages(images: unknown): string[] {
  if (Array.isArray(images)) return images.filter(Boolean) as string[];
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return images ? [images] : [];
    }
  }
  return [];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `product-${Date.now()}`;
}

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  description: string | null;
  ingredients: string | null;
  howToUse: string | null;
  price: number;
  salePrice: number | null;
  costPrice?: number | null;
  saleUntil?: Date | null;
  stock: number;
  lowStockThreshold?: number;
  isVisible: boolean;
  isFeatured: boolean;
  featuredSince?: Date | null;
  featuredUntil?: Date | null;
  featuredPosition?: 'home' | 'category' | 'both';
  showFeaturedBadge?: boolean;
  notifyOnFeature?: boolean;
  showOnHome?: boolean;
  showInSearch?: boolean;
  specs?: Record<string, string>;
  images: string[];
  categoryId: string;
  category?: { name: string };
  views?: number;
  orderCount?: number;
};

export function firestoreToAdminProduct(id: string, data: FirebaseFirestore.DocumentData, categoriesMap?: Record<string, string>): AdminProduct {
  const categoryId = String(data.category || 'other');
  const categoryName = categoriesMap?.[categoryId] || categoryId;
  const stock = Number(data.stockQuantity ?? data.stock ?? 0);

  return {
    id,
    slug: String(data.slug || id),
    name: String(data.name_mn || data.name || ''),
    brand: data.brand ? String(data.brand) : data.name_en ? String(data.name_en) : null,
    description: data.description_mn ? String(data.description_mn) : null,
    ingredients: data.ingredients ? String(data.ingredients) : null,
    howToUse: data.howToUse ? String(data.howToUse) : null,
    price: Number(data.price || 0),
    salePrice: data.salePrice != null ? Number(data.salePrice) : null,
    costPrice: data.costPrice != null ? Number(data.costPrice) : null,
    saleUntil: data.saleUntil ? toDate(data.saleUntil) : data.saleEndDate ? toDate(data.saleEndDate) : null,
    stock,
    lowStockThreshold: Number(data.lowStockThreshold ?? LOW_STOCK_THRESHOLD),
    isVisible: data.published !== false,
    isFeatured: Boolean(data.is_featured ?? data.isFeatured ?? data.featured ?? false),
    featuredSince: data.featured_since ? toDate(data.featured_since) : data.featuredSince ? toDate(data.featuredSince) : null,
    featuredUntil: data.featured_until ? toDate(data.featured_until) : data.featuredUntil ? toDate(data.featuredUntil) : null,
    featuredPosition: data.featuredPosition === 'home' || data.featuredPosition === 'category' || data.featuredPosition === 'both' ? data.featuredPosition : 'home',
    showFeaturedBadge: data.showFeaturedBadge !== false,
    notifyOnFeature: Boolean(data.notifyOnFeature ?? false),
    showOnHome: data.showOnHome !== false,
    showInSearch: data.showInSearch !== false,
    specs: data.specs && typeof data.specs === 'object' && !Array.isArray(data.specs) ? data.specs as Record<string, string> : {},
    images: parseProductImages(data.images),
    categoryId,
    category: { name: categoryName },
    views: Number(data.views || 0),
    orderCount: Number(data.orderCount || 0),
  };
}

export function adminPayloadToFirestore(body: Record<string, unknown>, existingSlug?: string) {
  const name = String(body.name || '').trim();
  const categoryId = String(body.categoryId || 'other');
  const stock = parseInt(String(body.stock ?? '0'), 10) || 0;
  const slug = existingSlug || slugify(name);

  return {
    slug,
    name_mn: name,
    name_en: body.brand ? String(body.brand) : name,
    brand: body.brand ? String(body.brand) : null,
    description_mn: body.description ? String(body.description) : '',
    ingredients: body.ingredients ? String(body.ingredients) : '',
    howToUse: body.howToUse ? String(body.howToUse) : '',
    price: parseFloat(String(body.price ?? '0')) || 0,
    salePrice: body.salePrice ? parseFloat(String(body.salePrice)) : null,
    costPrice: body.costPrice ? parseFloat(String(body.costPrice)) : null,
    saleUntil: body.saleUntil ? new Date(String(body.saleUntil)) : null,
    saleEndDate: body.saleUntil ? new Date(String(body.saleUntil)) : null,
    videoUrl: null,
    category: categoryId,
    images: parseProductImages(body.images),
    featured: Boolean(body.isFeatured ?? body.featured ?? false),
    isFeatured: Boolean(body.isFeatured ?? body.featured ?? false),
    is_featured: Boolean(body.isFeatured ?? body.featured ?? false),
    featuredSince: body.featuredSince ? new Date(String(body.featuredSince)) : null,
    featured_since: body.featuredSince ? new Date(String(body.featuredSince)) : null,
    featuredUntil: body.featuredUntil ? new Date(String(body.featuredUntil)) : null,
    featured_until: body.featuredUntil ? new Date(String(body.featuredUntil)) : null,
    featuredPosition: body.featuredPosition || 'home',
    showFeaturedBadge: body.showFeaturedBadge !== false,
    notifyOnFeature: Boolean(body.notifyOnFeature ?? false),
    showOnHome: body.showOnHome !== false,
    showInSearch: body.showInSearch !== false,
    lowStockThreshold: parseInt(String(body.lowStockThreshold ?? LOW_STOCK_THRESHOLD), 10) || LOW_STOCK_THRESHOLD,
    specs: body.specs && typeof body.specs === 'object' && !Array.isArray(body.specs) ? body.specs : {},
    published: body.isVisible !== false,
    inStock: stock > 0,
    stockQuantity: stock,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export async function patchAdminProduct(id: string, body: Record<string, unknown>) {
  const db = getAdminDb();
  const ref = db.collection('products').doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  if ('stock' in body) {
    const stock = Math.max(0, parseInt(String(body.stock ?? '0'), 10) || 0);
    patch.stockQuantity = stock;
    patch.stock = stock;
    patch.inStock = stock > 0;
  }

  if ('isFeatured' in body) {
    const isFeatured = Boolean(body.isFeatured);
    patch.featured = isFeatured;
    patch.isFeatured = isFeatured;
    patch.is_featured = isFeatured;
    patch.featuredSince = isFeatured ? FieldValue.serverTimestamp() : null;
    patch.featured_since = isFeatured ? FieldValue.serverTimestamp() : null;
    patch.featuredUntil = body.featuredUntil ? new Date(String(body.featuredUntil)) : null;
    patch.featured_until = body.featuredUntil ? new Date(String(body.featuredUntil)) : null;
  }

  if ('featuredPosition' in body) patch.featuredPosition = body.featuredPosition;
  if ('showFeaturedBadge' in body) patch.showFeaturedBadge = Boolean(body.showFeaturedBadge);
  if ('notifyOnFeature' in body) patch.notifyOnFeature = Boolean(body.notifyOnFeature);
  if ('showOnHome' in body) patch.showOnHome = Boolean(body.showOnHome);
  if ('showInSearch' in body) patch.showInSearch = Boolean(body.showInSearch);
  if ('lowStockThreshold' in body) patch.lowStockThreshold = Math.max(0, parseInt(String(body.lowStockThreshold ?? LOW_STOCK_THRESHOLD), 10) || LOW_STOCK_THRESHOLD);
  if ('specs' in body && body.specs && typeof body.specs === 'object' && !Array.isArray(body.specs)) patch.specs = body.specs;

  if ('isVisible' in body) {
    const isVisible = Boolean(body.isVisible);
    patch.published = isVisible;
    
    // Also update inStock based on stock availability if visibility changes
    const currentStock = 'stock' in body ? Math.max(0, parseInt(String(body.stock ?? '0'), 10) || 0) : Number(existing.data()?.stockQuantity ?? 0);
    patch.inStock = isVisible && currentStock > 0;
  }

  await ref.set(patch, { merge: true });
  const saved = await ref.get();
  return firestoreToAdminProduct(saved.id, saved.data()!);
}

export async function listAdminProducts(filters?: {
  category?: string;
  inStock?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const db = getAdminDb();
  
  // Fetch categories map for product details
  const categoriesSnap = await db.collection('categories').get();
  const categoriesMap: Record<string, string> = {};
  categoriesSnap.docs.forEach(doc => {
    categoriesMap[doc.id] = doc.data().name_mn || doc.data().name || doc.id;
  });

  const snap = await db.collection('products').get();
  let items = snap.docs.map((doc) => firestoreToAdminProduct(doc.id, doc.data(), categoriesMap));

  if (filters?.category && filters.category !== 'all') {
    items = items.filter((item) => item.categoryId === filters.category);
  }

  if (filters?.inStock === 'true' || filters?.inStock === 'inStock') {
    items = items.filter((item) => item.stock > 0);
  } else if (filters?.inStock === 'false' || filters?.inStock === 'outOfStock' || filters?.inStock === 'empty') {
    items = items.filter((item) => item.stock === 0);
  } else if (filters?.inStock === 'low' || filters?.inStock === 'lowStock') {
    items = items.filter((item) => item.stock > 0 && item.stock <= LOW_STOCK_THRESHOLD);
  }

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    items = items.filter((item) =>
      [item.name, item.brand, item.slug, item.categoryId, item.category?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }

  items.sort((a, b) => b.id.localeCompare(a.id));

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const totalCount = items.length;
  const start = (page - 1) * limit;

  return {
    products: items.slice(start, start + limit),
    totalCount,
    totalPages: Math.ceil(totalCount / limit) || 1,
    currentPage: page,
  };
}

export async function getAdminProduct(id: string) {
  const db = getAdminDb();
  const doc = await db.collection('products').doc(id).get();
  if (!doc.exists) return null;
  const product = firestoreToAdminProduct(doc.id, doc.data()!);
  return { ...product, images: product.images };
}

export async function createAdminProduct(body: Record<string, unknown>) {
  const db = getAdminDb();
  const payload = adminPayloadToFirestore(body);
  const slug = payload.slug as string;

  const existing = await db.collection('products').where('slug', '==', slug).limit(1).get();
  const ref = existing.empty ? db.collection('products').doc(slug) : db.collection('products').doc();

  await ref.set({
    ...payload,
    views: 0,
    orderCount: 0,
    createdAt: FieldValue.serverTimestamp(),
  });

  const saved = await ref.get();
  return firestoreToAdminProduct(saved.id, saved.data()!);
}

export async function updateAdminProduct(id: string, body: Record<string, unknown>) {
  const db = getAdminDb();
  const existing = await db.collection('products').doc(id).get();
  if (!existing.exists) return null;

  const currentSlug = existing.data()?.slug as string | undefined;
  const payload = adminPayloadToFirestore(body, currentSlug);
  await db.collection('products').doc(id).set(payload, { merge: true });

  const saved = await db.collection('products').doc(id).get();
  return firestoreToAdminProduct(saved.id, saved.data()!);
}

export async function deleteAdminProduct(id: string) {
  const db = getAdminDb();
  await db.collection('products').doc(id).delete();
}

export async function setAdminProductVisibility(id: string, isVisible: boolean) {
  const db = getAdminDb();
  const stockSnap = await db.collection('products').doc(id).get();
  const stock = Number(stockSnap.data()?.stockQuantity ?? 0);
  await db.collection('products').doc(id).set(
    {
      published: isVisible,
      inStock: isVisible && stock > 0,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export function firestoreToAdminOrder(id: string, data: FirebaseFirestore.DocumentData) {
  const createdAt = toDate(data.createdAt);
  const items = Array.isArray(data.items) ? data.items : [];
  const addressSnapshot = data.addressSnapshot || data.address_snapshot || null;
  const parsedAddress = typeof addressSnapshot === 'string'
    ? (() => { try { return JSON.parse(addressSnapshot); } catch { return null; } })()
    : addressSnapshot;
  const orderNumber = data.orderNumber || `#${createdAt.getFullYear()}-${id.slice(0, 4).toUpperCase()}`;
  const hasLegacyOtherAddress = 
    !parsedAddress || 
    (!parsedAddress.districtId && !parsedAddress.district_id) ||
    /Бусад| бусад |other/i.test(String(data.address || data.shippingAddress || parsedAddress?.district || parsedAddress?.district_name || ''));

  return {
    id,
    orderNumber: String(orderNumber).startsWith('#') ? orderNumber : `#${orderNumber}`,
    userId: data.userId || null,
    customerName: data.customerName || '',
    customerPhone: data.phone || data.customerPhone || '',
    customerEmail: data.customerEmail || data.email || '',
    shippingAddress: data.address || data.shippingAddress || parsedAddress?.full_address || parsedAddress?.full || '',
    addressSnapshot: parsedAddress,
    addressWarning: hasLegacyOtherAddress ? 'Хаяг тодорхойгүй' : '',
    total: Number(data.total || 0),
    subtotal: Number(data.subtotal || 0),
    shippingCost: Number(data.shippingCost || 0),
    status: normalizeOrderStatus(data.status),
    items: items.map((item: Record<string, unknown>, index: number) => ({
      id: `${id}-item-${index}`,
      productId: String(item.productId || ''),
      productSlug: String(item.productSlug || ''),
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
      product: {
        name: String(item.name_mn || item.productName || 'Бүтээгдэхүүн'),
        images: item.imageUrl ? JSON.stringify([item.imageUrl]) : '[]',
        price: Number(item.price || 0),
      },
    })),
    user: data.userId
      ? { name: data.customerName || '', phone: data.phone || '' }
      : null,
    archived: Boolean(data.archived || false),
    archivedAt: data.archivedAt ? toDate(data.archivedAt) : null,
    createdAt,
    updatedAt: toDate(data.updatedAt),
  };
}

export async function listAdminOrders(filters?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  regionId?: string;
  districtId?: string;
  khorooId?: string;
  priceMin?: number;
  priceMax?: number;
  city?: string;
  archived?: boolean;
}) {
  const page = filters?.page || 1;
  const limitCount = filters?.limit || 20;
  
  let allOrders: any[] = [];
  let totalCount = 0;
  
  try {
    const db = getAdminDb();
    const snap = await db.collection('orders').get();
    allOrders = snap.docs.map((doc: any) => firestoreToAdminOrder(doc.id, doc.data()));
  } catch (error: any) {
    console.warn('Firestore orders query failed, falling back to SQLite:', error.message || error);
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const dbOrders = await prisma.order.findMany({
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      allOrders = dbOrders.map(o => {
        let parsedAddress = null;
        if (o.addressSnapshot) {
          try { parsedAddress = JSON.parse(o.addressSnapshot); } catch {}
        }
        const hasLegacyOtherAddress = 
          !parsedAddress || 
          (!parsedAddress.districtId && !parsedAddress.district_id) ||
          /Бусад| бусад |other/i.test(String(o.shippingAddress || parsedAddress?.district || parsedAddress?.district_name || ''));
        return {
          id: o.id,
          orderNumber: `#${o.createdAt.getFullYear()}-${o.id.slice(0, 4).toUpperCase()}`,
          userId: o.userId || null,
          customerName: o.customerName || '',
          customerPhone: o.customerPhone || '',
          customerEmail: '',
          shippingAddress: o.shippingAddress || parsedAddress?.full_address || parsedAddress?.full || '',
          addressSnapshot: parsedAddress,
          addressWarning: hasLegacyOtherAddress ? 'Хаяг тодорхойгүй' : '',
          total: Number(o.total || 0),
          subtotal: Number(o.total || 0),
          shippingCost: 0,
          status: o.status.toLowerCase(),
          items: o.items.map((item, index) => ({
            id: `${o.id}-item-${index}`,
            productId: item.productId,
            productSlug: '',
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
            product: {
              name: item.product.name,
              images: item.product.images || '[]',
              price: Number(item.product.price || 0)
            }
          })),
          archived: o.archived || false,
          archivedAt: o.archivedAt || null,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt
        };
      });
    } catch (dbErr: any) {
      console.error('SQLite fallback query failed too:', dbErr);
    }
  }

  // Filter by archived status BEFORE any other filters/counts
  const showArchived = filters?.archived ?? false;
  allOrders = allOrders.filter((o: any) => Boolean(o.archived) === showArchived);

  // Sort by date descending
  allOrders.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

  if (filters?.search) {
    const term = filters.search.toLowerCase().trim();
    allOrders = allOrders.filter((o: any) => 
      String(o.orderNumber || '').toLowerCase().includes(term) ||
      String(o.id || '').toLowerCase().includes(term) ||
      String(o.customerName || '').toLowerCase().includes(term) ||
      String(o.customerPhone || '').toLowerCase().includes(term)
    );
  }

  if (filters?.dateFrom) {
    const fromTime = new Date(filters.dateFrom).getTime();
    allOrders = allOrders.filter((o: any) => o.createdAt.getTime() >= fromTime);
  }

  if (filters?.dateTo) {
    const toDateObj = new Date(filters.dateTo);
    toDateObj.setHours(23, 59, 59, 999);
    const toTime = toDateObj.getTime();
    allOrders = allOrders.filter((o: any) => o.createdAt.getTime() <= toTime);
  }

  if (filters?.priceMin !== undefined) {
    allOrders = allOrders.filter((o: any) => o.total >= filters.priceMin!);
  }

  if (filters?.priceMax !== undefined) {
    allOrders = allOrders.filter((o: any) => o.total <= filters.priceMax!);
  }

  if (filters?.city) {
    const cityTerm = filters.city.toLowerCase().trim();
    allOrders = allOrders.filter((o: any) => String(o.shippingAddress || '').toLowerCase().includes(cityTerm));
  }

  if (filters?.regionId) {
    allOrders = allOrders.filter((o: any) => o.addressSnapshot?.region_id === filters.regionId || o.addressSnapshot?.regionId === filters.regionId);
  }
  if (filters?.districtId) {
    allOrders = allOrders.filter((o: any) => o.addressSnapshot?.district_id === filters.districtId || o.addressSnapshot?.districtId === filters.districtId);
  }
  if (filters?.khorooId) {
    allOrders = allOrders.filter((o: any) => o.addressSnapshot?.khoroo_id === filters.khorooId || o.addressSnapshot?.khorooId === filters.khorooId);
  }

  // Calculate live counts BEFORE applying active status filter
  const statusCounts = allOrders.reduce((acc: Record<string, number>, order: any) => {
    acc.all = (acc.all || 0) + 1;
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, { all: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 });

  // Now apply status filter to get active orders
  const statusFilter = filters?.status && filters.status !== 'all' ? normalizeOrderStatus(filters.status) : null;
  let activeOrders = allOrders;
  if (statusFilter) {
    activeOrders = allOrders.filter((o: any) => o.status === statusFilter);
  }

  totalCount = activeOrders.length;
  const start = (page - 1) * limitCount;
  const orders = activeOrders.slice(start, start + limitCount);

  return {
    orders,
    totalCount,
    totalPages: Math.ceil(totalCount / limitCount) || 1,
    currentPage: page,
    statusCounts,
    summary: {
      totalOrders: statusCounts.all,
      todayOrders: 0,
      pendingOrders: statusCounts.pending,
      filteredAmount: activeOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
      confirmedRevenue: activeOrders.filter((order: any) => order.status !== 'cancelled').reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
    },
  };
}

export async function getAdminOrder(id: string) {
  const db = getAdminDb();
  const doc = await db.collection('orders').doc(id).get();
  if (!doc.exists) return null;
  return firestoreToAdminOrder(doc.id, doc.data()!);
}

export async function updateAdminOrderStatus(id: string, status: string) {
  const normalized = normalizeOrderStatus(status);
  const db = getAdminDb();
  await db.collection('orders').doc(id).set(
    { status: normalized, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return getAdminOrder(id);
}

export async function getAdminStats() {
  const db = getAdminDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const [productsCount, usersCount, pendingCount, lowStockCount, recentOrdersSnap] = await Promise.all([
    db.collection('products').count().get(),
    db.collection('users').count().get(),
    db.collection('orders').where('status', '==', PENDING_STATUS).count().get(),
    db.collection('products').where('stock', '>', 0).where('stock', '<=', LOW_STOCK_THRESHOLD).count().get(),
    db.collection('orders').where('createdAt', '>=', firstDayLastMonth).get(),
  ]);

  const orders = recentOrdersSnap.docs.map((doc: any) => firestoreToAdminOrder(doc.id, doc.data()));
  const activeOrders = orders.filter((order) => order.status !== CANCELLED_STATUS);
  const todayOrders = activeOrders.filter((order) => order.createdAt >= today);
  const thisMonthOrders = activeOrders.filter((order) => order.createdAt >= firstDayThisMonth);
  const lastMonthOrders = activeOrders.filter(
    (order) => order.createdAt >= firstDayLastMonth && order.createdAt < firstDayThisMonth,
  );

  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + order.total, 0);
  const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);

  let revenueChange = 0;
  if (lastMonthRevenue > 0) {
    revenueChange = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
  } else if (thisMonthRevenue > 0) {
    revenueChange = 100;
  }

  return {
    todayRevenue,
    todayOrderCount: todayOrders.length,
    pendingCount: pendingCount.data().count,
    lowStockCount: lowStockCount.data().count,
    totalProducts: productsCount.data().count,
    totalCustomers: usersCount.data().count,
    monthlyRevenue: thisMonthRevenue,
    revenueChange,
  };
}

export async function listAdminUsers(search?: string) {
  const db = getAdminDb();
  const snap = await db.collection('users').get();
  const ordersSnap = await db.collection('orders').get();
  const orders = ordersSnap.docs.map((doc) => firestoreToAdminOrder(doc.id, doc.data()));

  let users = snap.docs.map((doc) => {
    const data = doc.data();
    const userOrders = orders.filter((order) => order.userId === doc.id && order.status !== CANCELLED_STATUS);
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      id: doc.id,
      name: data.displayName || data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      role: data.role === 'admin' ? 'admin' : 'customer',
      createdAt: toDate(data.createdAt),
      orderCount: userOrders.length,
      totalSpent,
      orders: userOrders.slice(0, 5),
    };
  });

  if (search) {
    const term = search.toLowerCase();
    users = users.filter((user) =>
      [user.name, user.email, user.phone].filter(Boolean).some((value) => String(value).toLowerCase().includes(term)),
    );
  }

  users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return { users };
}

export async function updateAdminUserRole(userId: string, role: 'admin' | 'customer') {
  const db = getAdminDb();
  const firestoreRole = role === 'admin' ? 'admin' : 'user';
  await db.collection('users').doc(userId).set({ role: firestoreRole, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  const doc = await db.collection('users').doc(userId).get();
  const data = doc.data() || {};
  return {
    id: doc.id,
    name: data.displayName || data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    role,
  };
}

export async function getAdminAnalytics() {
  const db = getAdminDb();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);

  const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
    db.collection('orders').get(),
    db.collection('products').get(),
    db.collection('users').get(),
  ]);

  const orders = ordersSnap.docs.map((doc) => firestoreToAdminOrder(doc.id, doc.data()));
  const products = productsSnap.docs.map((doc) => firestoreToAdminProduct(doc.id, doc.data()));

  const monthOrders = orders.filter((order) => order.createdAt >= monthStart);
  const paidMonthOrders = monthOrders.filter((order) => PAID_STATUSES.includes(order.status as OrderStatus));
  const pendingPayments = monthOrders.filter((order) => order.status === PENDING_STATUS);
  const weekOrders = orders.filter((order) => order.createdAt >= weekStart);
  const paidWeekOrders = weekOrders.filter((order) => PAID_STATUSES.includes(order.status as OrderStatus));

  const monthRevenue = paidMonthOrders.reduce((sum, order) => sum + order.total, 0);
  const weekRevenue = paidWeekOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrder = paidWeekOrders.length ? Math.round(weekRevenue / paidWeekOrders.length) : 0;

  const customers = usersSnap.docs.map((doc) => ({
    id: doc.id,
    orders: orders.filter((order) => order.userId === doc.id && order.status !== CANCELLED_STATUS),
  }));
  const repeatCustomers = customers.filter((customer) => customer.orders.length > 1).length;
  const customerValue = customers.length
    ? Math.round(
        customers.reduce((sum, customer) => sum + customer.orders.reduce((acc, order) => acc + order.total, 0), 0) /
          customers.length,
      )
    : 0;

  const dayLabel = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
  const revenueByDay = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const next = new Date(date);
    next.setDate(date.getDate() + 1);
    const dayOrders = paidWeekOrders.filter((order) => order.createdAt >= date && order.createdAt < next);
    return {
      date: dayLabel(date),
      revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
      orders: dayOrders.length,
    };
  });

  const statusValues: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const statusBreakdown = statusValues.map((status) => ({
    status,
    count: monthOrders.filter((order) => order.status === status).length,
  }));

  const productPerformance = products
    .map((product) => {
      const productOrders = orders.reduce((count, order) => {
        const items = order.items || [];
        return (
          count +
          items
            .filter((item) => item.productId === product.id)
            .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        );
      }, 0);
      const views = product.views || 0;
      const conversion = views > 0 ? Number(((productOrders / views) * 100).toFixed(1)) : productOrders > 0 ? 100 : 0;
      return {
        id: product.id,
        name: product.name,
        views,
        orders: productOrders,
        conversion,
        stock: product.stock,
      };
    })
    .sort((a, b) => b.orders - a.orders || b.views - a.views);

  const topProducts = [...productPerformance]
    .filter((item) => item.orders > 0)
    .slice(0, 8)
    .map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      return {
        id: item.id,
        name: item.name,
        category: product?.category?.name || 'Ангилалгүй',
        quantity: item.orders,
        revenue: item.orders * (product?.salePrice ?? product?.price ?? 0),
      };
    });

  const inventoryRisk = products
    .filter((product) => product.stock <= LOW_STOCK_THRESHOLD)
    .slice(0, 8)
    .map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category?.name || 'Ангилалгүй',
      stock: product.stock,
      price: product.salePrice ?? product.price,
      visible: product.isVisible,
      soldCount: product.orderCount || 0,
    }));

  const expensesSnap = await db.collection('expenses').where('date', '>=', monthStart).get();
  const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const totalExpenses = expenses.reduce((sum, exp: any) => sum + (exp.amount || 0), 0);
  const netProfit = monthRevenue - totalExpenses;

  return {
    summary: {
      monthRevenue,
      weekRevenue,
      averageOrder,
      paidOrderCount: paidWeekOrders.length,
      lowStockCount: products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).length,
      repeatCustomers,
      customerValue,
      totalCustomers: usersSnap.size,
      productCount: products.length,
      pendingPaymentCount: pendingPayments.length,
      pendingPaymentAmount: pendingPayments.reduce((sum, order) => sum + order.total, 0),
      expenseTracked: true,
      totalExpenses,
      netProfit,
    },
    expenses: expenses.map((e: any) => ({
      ...e,
      date: e.date?.toDate ? e.date.toDate() : new Date(e.date)
    })).sort((a: any, b: any) => b.date.getTime() - a.date.getTime()),
    revenueByDay,
    statusBreakdown,
    topProducts,
    inventoryRisk,
    productPerformance,
  };
}

export async function addAdminExpense(data: { title: string; amount: number; category: string; date: string }) {
  const db = getAdminDb();
  const ref = await db.collection('expenses').add({
    ...data,
    date: new Date(data.date),
    createdAt: FieldValue.serverTimestamp(),
  });
  const doc = await ref.get();
  return { id: doc.id, ...doc.data(), date: (doc.data()?.date as any)?.toDate() };
}

export async function deleteAdminExpense(id: string) {
  const db = getAdminDb();
  await db.collection('expenses').doc(id).delete();
  return { success: true };
}

export async function getAdminSettings() {
  const db = getAdminDb();
  const doc = await db.collection('settings').doc('main').get();
  if (!doc.exists) return {};
  return doc.data();
}

export async function saveAdminSettings(body: Record<string, unknown>) {
  const db = getAdminDb();
  await db.collection('settings').doc('main').set(body, { merge: true });
  const doc = await db.collection('settings').doc('main').get();
  return doc.data() || {};
}

export async function listAdminCategories() {
  const db = getAdminDb();
  const [categoriesSnap, productsSnap] = await Promise.all([
    db.collection('categories').get(),
    db.collection('products').get()
  ]);
  
  const counts = new Map<string, number>();

  productsSnap.docs.forEach((doc) => {
    const category = String(doc.data().category || 'other');
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  const categories = categoriesSnap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name_mn || doc.data().name || doc.id,
    slug: doc.id,
    image: doc.data().image || '/placeholder-product.svg',
    icon: doc.data().icon || 'Tags',
    color: doc.data().color || '#E91E8C',
    showOnHome: doc.data().showOnHome === true,
    productCount: counts.get(doc.id) || 0,
  }));
  
  return categories.sort((a, b) => b.productCount - a.productCount);
}

export async function createAdminCategory(name: string, icon?: string, color?: string, showOnHome: boolean = true) {
  const db = getAdminDb();
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, '-')
    .replace(/^-+|-+$/g, '') || `category-${Date.now()}`;
    
  await db.collection('categories').doc(slug).set({
    name_mn: name,
    name: name,
    slug: slug,
    icon: icon || 'Tags',
    color: color || '#E91E8C',
    showOnHome,
    createdAt: FieldValue.serverTimestamp(),
  });
  
  return { id: slug, slug, name, icon, color, showOnHome };
}

export async function updateAdminCategory(id: string, name: string, icon?: string, color?: string, showOnHome: boolean = true) {
  const db = getAdminDb();
  await db.collection('categories').doc(id).update({
    name_mn: name,
    name: name,
    icon: icon || 'Tags',
    color: color || '#E91E8C',
    showOnHome,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { id, name, icon, color, showOnHome };
}

export async function deleteAdminCategory(id: string) {
  const db = getAdminDb();
  
  // Reassign products to "other" category safely
  const productsSnap = await db.collection('products').where('category', '==', id).get();
  if (!productsSnap.empty) {
    const batch = db.batch();
    productsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { category: 'other' });
    });
    await batch.commit();
  }
  
  await db.collection('categories').doc(id).delete();
  return { success: true };
}

async function hydrateUserStats(users: any[]) {
  if (users.length === 0) return [];
  
  const db = getAdminDb();
  const userIds = users.map(u => u.id);
  
  // Query orders for ONLY the sliced page users to avoid loading all orders
  const ordersSnap = await db.collection('orders')
    .where('userId', 'in', userIds)
    .get();
    
  const orders = ordersSnap.docs.map(doc => firestoreToAdminOrder(doc.id, doc.data()));
  
  return users.map(u => {
    const userOrders = orders.filter(order => order.userId === u.id && order.status !== CANCELLED_STATUS);
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    
    return {
      id: u.id,
      name: u.displayName || u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role === 'admin' ? 'admin' : 'customer',
      createdAt: toDate(u.createdAt),
      orderCount: userOrders.length,
      totalSpent,
      orders: userOrders.slice(0, 5)
    };
  });
}

export async function listAdminCustomers(search?: string, page = 1, limit = 20) {
  const db = getAdminDb();
  
  // 1. Fetch all users from Firestore (index-free since there's no native composite filter)
  const snap = await db.collection('users').get();
  let allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 2. Filter in memory
  if (search) {
    const term = search.toLowerCase();
    allUsers = allUsers.filter((u: any) => 
      [u.displayName, u.name, u.email, u.phone].filter(Boolean).some(val => String(val).toLowerCase().includes(term))
    );
  }
  
  // Filter out admins in memory
  allUsers = allUsers.filter((u: any) => u.role !== 'admin');

  // Sort by createdAt descending in memory
  allUsers.sort((a: any, b: any) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
  
  const totalCount = allUsers.length;
  const start = (page - 1) * limit;
  const paginatedUsers = allUsers.slice(start, start + limit);
  
  // 3. Hydrate orders for paginated users only!
  const customers = await hydrateUserStats(paginatedUsers);
  
  return {
    customers,
    totalCount,
    totalPages: Math.ceil(totalCount / limit) || 1,
    currentPage: page
  };
}

export async function getMonthlyReport(year: number, month: number) {
  const db = getAdminDb();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const snap = await db.collection('orders').where('createdAt', '>=', Timestamp.fromDate(start)).get();

  const orders = snap.docs
    .map((doc) => firestoreToAdminOrder(doc.id, doc.data()))
    .filter((order) => order.createdAt < end && order.status !== CANCELLED_STATUS);

  return orders;
}

export async function archiveAdminOrder(id: string, archive: boolean) {
  const db = getAdminDb();
  const archivedAt = archive ? new Date() : null;
  
  await db.collection('orders').doc(id).set(
    { 
      archived: archive, 
      archivedAt: archivedAt ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp() 
    },
    { merge: true },
  );

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.order.update({
      where: { id },
      data: { archived: archive, archivedAt }
    });
  } catch (err) {
    console.error('Failed to sync manual archive status to SQLite:', err);
  }

  return getAdminOrder(id);
}
