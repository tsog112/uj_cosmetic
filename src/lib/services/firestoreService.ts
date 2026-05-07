import {
  collection, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, limit, increment, serverTimestamp,
  runTransaction, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, Order, OrderStatus, SiteSettings } from '@/types';

// ─── Error Handler ───────────────────────────────────────────────
function handleError(error: any, context: string): never {
  console.error(`[Firestore Error — ${context}]:`, error);
  if (error.code === 'permission-denied') {
    console.error('🚨 PERMISSION: Check firestore.rules.');
  } else if (error.code === 'unavailable' || error.message?.includes('offline')) {
    console.error('🚨 CONNECTION: Database unreachable.');
  }
  throw error;
}

// ─── PRODUCTS ────────────────────────────────────────────────────
const PRODUCTS = 'products';

export async function getAllProducts(filters?: {
  category?: string;
  inStock?: boolean;
  published?: boolean;
}): Promise<Product[]> {
  try {
    const constraints: any[] = [];
    if (filters?.category) constraints.push(where('category', '==', filters.category));
    if (filters?.inStock !== undefined) constraints.push(where('inStock', '==', filters.inStock));
    if (filters?.published !== undefined) constraints.push(where('published', '==', filters.published));

    const q = query(collection(db, PRODUCTS), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  } catch (e) { handleError(e, 'getAllProducts'); }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const q = query(
      collection(db, PRODUCTS),
      where('featured', '==', true),
      where('published', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  } catch (e) { handleError(e, 'getFeaturedProducts'); }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const q = query(collection(db, PRODUCTS), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Product;
  } catch (e) { handleError(e, `getProductBySlug(${slug})`); }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const q = query(collection(db, PRODUCTS), where('category', '==', category), where('published', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  } catch (e) { handleError(e, `getProductsByCategory(${category})`); }
}

export async function searchProducts(searchQuery: string): Promise<Product[]> {
  // Firestore doesn't support full-text search natively.
  // Fetch all published products and filter client-side.
  try {
    const all = await getAllProducts({ published: true });
    const q = searchQuery.toLowerCase();
    return all.filter(
      p => p.name_mn.toLowerCase().includes(q) || p.name_en.toLowerCase().includes(q)
    );
  } catch (e) { handleError(e, 'searchProducts'); }
}

export async function incrementProductViews(productId: string): Promise<void> {
  try {
    await updateDoc(doc(db, PRODUCTS, productId), { views: increment(1) });
  } catch (e) { handleError(e, 'incrementProductViews'); }
}

// Admin CRUD
export async function createProduct(data: Omit<Product, 'id'>): Promise<string> {
  try {
    const ref = await addDoc(collection(db, PRODUCTS), {
      ...data,
      views: 0,
      orderCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (e) { handleError(e, 'createProduct'); }
}

export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
  try {
    await updateDoc(doc(db, PRODUCTS, productId), { ...data, updatedAt: serverTimestamp() });
  } catch (e) { handleError(e, 'updateProduct'); }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS, productId));
  } catch (e) { handleError(e, 'deleteProduct'); }
}

// ─── ORDERS ──────────────────────────────────────────────────────
const ORDERS = 'orders';
export const PAID_ORDER_STATUSES: OrderStatus[] = ['confirmed', 'shipped', 'delivered'];

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const orderId = doc(collection(db, ORDERS)).id;
    const orderRef = doc(db, ORDERS, orderId);

    await runTransaction(db, async (transaction) => {
      let calculatedSubtotal = 0;
      const verifiedItems: any[] = [];

      // Read phase — fetch live product prices and stock
      const productDocs = await Promise.all(
        orderData.items.map(async (item) => {
          const productRef = doc(db, PRODUCTS, item.productId);
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists()) {
            throw new Error(`Бүтээгдэхүүн олдсонгүй: ${item.productId}`);
          }
          return { ref: productRef, data: productSnap.data(), item };
        })
      );

      // Validate and calculate
      for (const pd of productDocs) {
        const stockQuantity = Number(pd.data.stockQuantity ?? pd.data.stock ?? (pd.data.inStock ? 999 : 0));
        if (stockQuantity < pd.item.quantity) {
          throw new Error(`"${pd.data.name_mn}" бүтээгдэхүүний нөөц хүрэлцэхгүй байна.`);
        }
        const actualPrice = pd.data.salePrice ?? pd.data.price;
        calculatedSubtotal += actualPrice * pd.item.quantity;

        verifiedItems.push({ ...pd.item, price: Math.round(actualPrice) });

        const nextStockQuantity = Math.max(0, stockQuantity - pd.item.quantity);
        transaction.update(pd.ref, {
          stockQuantity: nextStockQuantity,
          inStock: nextStockQuantity > 0,
          orderCount: increment(pd.item.quantity),
        });
      }

      const shippingCost = Math.round(orderData.shippingCost);
      const total = Math.round(calculatedSubtotal) + shippingCost;

      transaction.set(orderRef, {
        ...orderData,
        subtotal: Math.round(calculatedSubtotal),
        shippingCost,
        total,
        items: verifiedItems,
        status: 'pending' as OrderStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    return orderId;
  } catch (e) { handleError(e, 'createOrder'); }
}

function getPeriodStart(period: 'today' | '7days' | '30days' | 'month'): Date {
  const now = new Date();
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === '7days') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === '30days') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getRevenueStats(period: 'today' | '7days' | '30days' | 'month'): Promise<{ total: number; count: number }> {
  try {
    const ordersRef = collection(db, ORDERS);
    const q = query(
      ordersRef,
      where('status', 'in', PAID_ORDER_STATUSES),
      where('createdAt', '>=', Timestamp.fromDate(getPeriodStart(period)))
    );
    const snapshot = await getDocs(q);
    const total = snapshot.docs.reduce((sum, docSnap) => sum + Number(docSnap.data().total || 0), 0);
    return { total, count: snapshot.size };
  } catch (e) { handleError(e, `getRevenueStats(${period})`); }
}

export async function getDashboardStats(): Promise<{
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  todayOrders: number;
}> {
  try {
    const ordersRef = collection(db, ORDERS);
    const todayStart = Timestamp.fromDate(getPeriodStart('today'));
    const [allOrdersSnap, paidOrdersSnap, pendingOrdersSnap, todayOrdersSnap] = await Promise.all([
      getDocs(ordersRef),
      getDocs(query(ordersRef, where('status', 'in', PAID_ORDER_STATUSES))),
      getDocs(query(ordersRef, where('status', '==', 'pending'))),
      getDocs(query(ordersRef, where('createdAt', '>=', todayStart))),
    ]);

    return {
      totalRevenue: paidOrdersSnap.docs.reduce((sum, docSnap) => sum + Number(docSnap.data().total || 0), 0),
      totalOrders: allOrdersSnap.size,
      pendingOrders: pendingOrdersSnap.size,
      todayOrders: todayOrdersSnap.size,
    };
  } catch (e) { handleError(e, 'getDashboardStats'); }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const snap = await getDoc(doc(db, ORDERS, orderId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Order;
  } catch (e) { handleError(e, 'getOrderById'); }
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(collection(db, ORDERS), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  } catch (e) { handleError(e, 'getUserOrders'); }
}

export async function getAllOrders(filters?: { status?: OrderStatus }): Promise<Order[]> {
  try {
    const constraints: any[] = [orderBy('createdAt', 'desc')];
    if (filters?.status) constraints.unshift(where('status', '==', filters.status));
    const q = query(collection(db, ORDERS), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  } catch (e) { handleError(e, 'getAllOrders'); }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  try {
    await updateDoc(doc(db, ORDERS, orderId), { status, updatedAt: serverTimestamp() });
  } catch (e) { handleError(e, 'updateOrderStatus'); }
}

export async function getUserById(userId: string): Promise<{ email: string | null; displayName: string | null } | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { email: data.email ?? null, displayName: data.displayName ?? null };
  } catch (e) { handleError(e, `getUserById(${userId})`); }
}

// ─── SETTINGS (singleton: settings/main) ─────────────────────────
const SETTINGS_DOC = doc(db, 'settings', 'main');

export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const snap = await getDoc(SETTINGS_DOC);
    if (!snap.exists()) return null;
    return snap.data() as SiteSettings;
  } catch (e) {
    console.error('[Firestore Error — getSiteSettings]:', e);
    // Return safe fallback data during Next.js builds if the DB is unreachable
    return {
      announcementText: 'Монгол даяар хүргэлт хийдэг · 50,000₮-с дээш захиалгад үнэгүй хүргэлт',
      announcementActive: true,
      freeShippingThreshold: 50000,
      shippingCost: 5000,
      bankName: 'Хаан Банк',
      bankAccount: 'ТАНЫ_ДАНСНЫ_ДУГААР',
      bankAccountName: 'УЖ Косметик',
      instagramUrl: 'https://instagram.com/uj_cosmetic',
      phone: 'ТАНЫ_УТАСНЫ_ДУГААР',
      email: 'ТАНЫ_ИМЭЙЛ',
    };
  }
}

export async function updateSiteSettings(data: Partial<SiteSettings>): Promise<void> {
  try {
    await setDoc(SETTINGS_DOC, data, { merge: true });
  } catch (e) { handleError(e, 'updateSiteSettings'); }
}
