import { FieldValue, Timestamp, type Query } from 'firebase-admin/firestore';
import { assertFirestoreCircuitClosed, recordFirestoreError } from '@/lib/firestoreCircuitBreaker';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { type OrderStatus } from '@/types';
import { LOW_STOCK_THRESHOLD } from '@/lib/constants/admin';

const PAID_STATUSES: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered'];
const CANCELLED_STATUS: OrderStatus = 'cancelled';
const PENDING_STATUS: OrderStatus = 'pending';
const ORDER_STATUS_VALUES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function withTimeout<T>(promise: Promise<T>, label: string, ms = 1500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

function isTimeoutError(error: any) {
  return String(error?.message || error).includes('timed out');
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
  showcaseFeatured?: boolean;
  showcaseNewest?: boolean;
  showcaseSale?: boolean;
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
    showcaseFeatured: Boolean(data.showcaseFeatured ?? data.showcase_featured ?? false),
    showcaseNewest: Boolean(data.showcaseNewest ?? data.showcase_newest ?? false),
    showcaseSale: Boolean(data.showcaseSale ?? data.showcase_sale ?? false),
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
    showcaseFeatured: Boolean(body.showcaseFeatured ?? body.isFeatured ?? false),
    showcaseNewest: Boolean(body.showcaseNewest ?? false),
    showcaseSale: Boolean(body.showcaseSale ?? false),
    showcase_featured: Boolean(body.showcaseFeatured ?? body.isFeatured ?? false),
    showcase_newest: Boolean(body.showcaseNewest ?? false),
    showcase_sale: Boolean(body.showcaseSale ?? false),
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
  if ('showcaseFeatured' in body) {
    patch.showcaseFeatured = Boolean(body.showcaseFeatured);
    patch.showcase_featured = Boolean(body.showcaseFeatured);
  }
  if ('showcaseNewest' in body) {
    patch.showcaseNewest = Boolean(body.showcaseNewest);
    patch.showcase_newest = Boolean(body.showcaseNewest);
  }
  if ('showcaseSale' in body) {
    patch.showcaseSale = Boolean(body.showcaseSale);
    patch.showcase_sale = Boolean(body.showcaseSale);
  }
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
  assertFirestoreCircuitClosed();
  const db = getAdminDb();
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  
  // Fetch categories map for product details
  const categoriesMap: Record<string, string> = {};
  try {
    const categoriesSnap = await withTimeout(db.collection('categories').get(), 'admin product categories', 800);
    categoriesSnap.docs.forEach(doc => {
      categoriesMap[doc.id] = doc.data().name_mn || doc.data().name || doc.id;
    });
  } catch (error: any) {
    console.warn('Admin product categories query failed:', error.message || error);
  }

  if (!filters?.search) {
    try {
      let query: Query = db.collection('products');
      if (filters?.category && filters.category !== 'all') {
        query = query.where('category', '==', filters.category);
      }
      if (filters?.inStock === 'true' || filters?.inStock === 'inStock') {
        query = query.where('stock', '>', 0);
      } else if (filters?.inStock === 'false' || filters?.inStock === 'outOfStock' || filters?.inStock === 'empty') {
        query = query.where('stock', '==', 0);
      } else if (filters?.inStock === 'low' || filters?.inStock === 'lowStock') {
        query = query.where('stock', '>', 0).where('stock', '<=', LOW_STOCK_THRESHOLD);
      }

      const start = (page - 1) * limit;
      const orderedQuery = query.orderBy(filters?.inStock === 'true' || filters?.inStock === 'inStock' ? 'stock' : 'updatedAt', 'desc');
      const [snap, totalSnap] = await withTimeout(Promise.all([
        orderedQuery.offset(start).limit(limit).get(),
        query.count().get(),
      ]), 'bounded admin products');
      const products = snap.docs.map((doc) => firestoreToAdminProduct(doc.id, doc.data(), categoriesMap));

      return {
        products,
        totalCount: totalSnap.data().count,
        totalPages: Math.ceil(totalSnap.data().count / limit) || 1,
        currentPage: page,
      };
    } catch (error: any) {
      recordFirestoreError(error);
      console.warn('Bounded Firestore products query failed, using compatibility path:', error.message || error);
      if (isTimeoutError(error)) throw error;
    }
  }

  const snap = await withTimeout(db.collection('products').limit(500).get(), 'admin products compatibility');
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
  assertFirestoreCircuitClosed();
  const page = filters?.page || 1;
  const limitCount = filters?.limit || 20;
  const showArchived = filters?.archived ?? false;
  const statusFilter = filters?.status && filters.status !== 'all' ? normalizeOrderStatus(filters.status) : null;
  const needsInMemoryFiltering = Boolean(
    filters?.search ||
    filters?.priceMin !== undefined ||
    filters?.priceMax !== undefined ||
    filters?.city ||
    filters?.regionId ||
    filters?.districtId ||
    filters?.khorooId,
  );
  let skipFirestoreCompatibility = false;

  if (!needsInMemoryFiltering) {
    try {
      const db = getAdminDb();
      const applyDateFilters = (query: Query) => {
        let nextQuery = query;
        if (filters?.dateFrom) {
          nextQuery = nextQuery.where('createdAt', '>=', Timestamp.fromDate(new Date(filters.dateFrom)));
        }
        if (filters?.dateTo) {
          const toDateObj = new Date(filters.dateTo);
          toDateObj.setHours(23, 59, 59, 999);
          nextQuery = nextQuery.where('createdAt', '<=', Timestamp.fromDate(toDateObj));
        }
        return nextQuery;
      };

      const baseCollection = db.collection('orders');
      const baseForCounts = showArchived
        ? applyDateFilters(baseCollection.where('archived', '==', true))
        : applyDateFilters(baseCollection);
      let activeQuery = baseForCounts;
      if (statusFilter) activeQuery = activeQuery.where('status', '==', statusFilter);

      const start = (page - 1) * limitCount;
      const [pageSnap, activeCountSnap, ...statusCountSnaps] = await withTimeout(Promise.all([
        activeQuery.orderBy('createdAt', 'desc').offset(start).limit(limitCount).get(),
        activeQuery.count().get(),
        ...ORDER_STATUS_VALUES.map((status) => baseForCounts.where('status', '==', status).count().get()),
      ]), 'bounded admin orders');

      const statusCounts = statusCountSnaps.reduce((acc: Record<string, number>, snap, index) => {
        acc[ORDER_STATUS_VALUES[index]] = snap.data().count;
        acc.all += snap.data().count;
        return acc;
      }, { all: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 });

      const orders = pageSnap.docs
        .map((doc: any) => firestoreToAdminOrder(doc.id, doc.data()))
        .filter((order) => showArchived || !order.archived);
      const totalCount = activeCountSnap.data().count;

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
          filteredAmount: orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
          confirmedRevenue: orders.filter((order: any) => order.status !== 'cancelled').reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
        },
      };
    } catch (error: any) {
      recordFirestoreError(error);
      console.warn('Bounded Firestore orders query failed, using compatibility path:', error.message || error);
      skipFirestoreCompatibility = isTimeoutError(error);
    }
  }
  
  let allOrders: any[] = [];
  let totalCount = 0;
  
  try {
    if (skipFirestoreCompatibility) {
      throw new Error('Skipping Firestore compatibility query after timeout.');
    }
    const db = getAdminDb();
    const snap = await withTimeout(
      db.collection('orders').orderBy('createdAt', 'desc').limit(500).get(),
      'admin orders compatibility',
    );
    allOrders = snap.docs.map((doc: any) => firestoreToAdminOrder(doc.id, doc.data()));
  } catch (error: any) {
    recordFirestoreError(error);
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
          parsedAddress = typeof o.addressSnapshot === 'string'
            ? (() => { try { return JSON.parse(o.addressSnapshot); } catch { return null; } })()
            : o.addressSnapshot;
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
  assertFirestoreCircuitClosed();
  const db = getAdminDb();
  const doc = await db.collection('orders').doc(id).get();
  if (!doc.exists) return null;
  return firestoreToAdminOrder(doc.id, doc.data()!);
}

export async function listAdminUsers(search?: string) {
  assertFirestoreCircuitClosed();
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

export async function countFirestoreAdmins(): Promise<{ count: number; ids: string[] }> {
  const db = getAdminDb();
  const snap = await db.collection('users').where('role', '==', 'admin').get();
  return { count: snap.size, ids: snap.docs.map((doc) => doc.id) };
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

export async function listAdminCustomers(search?: string, page = 1, limit = 20, role: string = 'all') {
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

  if (role === 'admin') {
    allUsers = allUsers.filter((u: any) => u.role === 'admin');
  } else if (role === 'customer') {
    allUsers = allUsers.filter((u: any) => u.role !== 'admin');
  }

  // Sort by createdAt descending in memory (admins first when showing all)
  allUsers.sort((a: any, b: any) => {
    if (role === 'all') {
      const aAdmin = a.role === 'admin';
      const bAdmin = b.role === 'admin';
      if (aAdmin !== bAdmin) return aAdmin ? -1 : 1;
    }
    return toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime();
  });
  
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
