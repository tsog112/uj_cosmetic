import {
  collection, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, Order, OrderStatus, Review, SiteSettings, WishlistItem } from '@/types';
import { maskDisplayName } from '@/lib/publicDto';

// ??? Error Handler ???????????????????????????????????????????????
function handleError(error: any, context: string): never {
  console.error(`[Firestore Error ??${context}]:`, error);
  if (error.code === 'permission-denied') {
    console.error('?슚 PERMISSION: Check firestore.rules.');
  } else if (error.code === 'unavailable' || error.message?.includes('offline')) {
    console.error('?슚 CONNECTION: Database unreachable.');
  }
  throw error;
}

// ??? CATEGORIES ??????????????????????????????????????????????????
export async function getCategories(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    return snap.docs.map(d => ({ 
      id: d.id, 
      slug: d.id, 
      name_mn: d.data().name_mn || d.data().name || d.id,
      image: d.data().image || '/placeholder-product.svg',
      icon: d.data().icon || 'Tags',
      color: d.data().color || '#E91E8C',
      showOnHome: d.data().showOnHome === true,
    }));
  } catch (e) {
    handleError(e, 'getCategories');
    return [];
  }
}

// ??? PRODUCTS ????????????????????????????????????????????????????
const PRODUCTS = 'products';

function reviveProduct(product: any): Product {
  return {
    ...product,
    createdAt: product?.createdAt ? new Date(product.createdAt) : new Date(),
    updatedAt: product?.updatedAt ? new Date(product.updatedAt) : new Date(),
    saleEndDate: product?.saleEndDate ? new Date(product.saleEndDate) : null,
  } as Product;
}

function reviveReview(review: any): Review {
  return {
    ...review,
    createdAt: review?.createdAt ? new Date(review.createdAt) : new Date(),
    updatedAt: review?.updatedAt ? new Date(review.updatedAt) : new Date(),
  } as Review;
}

async function fetchPublicProducts(params: Record<string, string | undefined> = {}): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const response = await fetch(`/api/products${searchParams.size ? `?${searchParams}` : ''}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Failed to fetch products');
  return (data.products || []).map(reviveProduct);
}

async function fetchPublicReviews(params: Record<string, string | undefined> = {}): Promise<Review[]> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const response = await fetch(`/api/reviews${searchParams.size ? `?${searchParams}` : ''}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Failed to fetch reviews');
  return (data.reviews || []).map(reviveReview);
}

export async function getAllProducts(filters?: {
  category?: string;
  inStock?: boolean;
  published?: boolean;
}): Promise<Product[]> {
  try {
    const products = await fetchPublicProducts({ category: filters?.category });
    return filters?.inStock === undefined
      ? products
      : products.filter((product) => product.inStock === filters.inStock);
  } catch (e) { handleError(e, 'getAllProducts'); }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    return fetchPublicProducts({ featured: 'true' });
  } catch (e) { handleError(e, 'getFeaturedProducts'); }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`/api/products?slug=${encodeURIComponent(slug)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || 'Failed to fetch product');
    return data.product ? reviveProduct(data.product) : null;
  } catch (e) { handleError(e, `getProductBySlug(${slug})`); }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    return fetchPublicProducts({ category });
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
    await fetch(`/api/products/${encodeURIComponent(productId)}/view`, { method: 'POST' });
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

// Reviews
const REVIEWS = 'reviews';

function normalizeReview(docId: string, data: any): Review {
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ?? new Date();
  const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt ?? createdAt;

  return {
    id: docId,
    productId: data.productId ?? '',
    productSlug: data.productSlug ?? '',
    productName: data.productName ?? '',
    userId: '',
    userName: maskDisplayName(data.userName),
    userEmail: '',
    rating: Number(data.rating ?? 5),
    content: data.content ?? '',
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
    orderId: data.orderId,
    approved: data.approved !== false,
    createdAt,
    updatedAt,
  };
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    return fetchPublicReviews({ productId });
  } catch (e) { handleError(e, `getProductReviews(${productId})`); }
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  try {
    const q = query(collection(db, REVIEWS), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => normalizeReview(d.id, d.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) { handleError(e, `getUserReviews(${userId})`); }
}

export async function getLatestReviews(count = 6): Promise<Review[]> {
  try {
    return fetchPublicReviews({ limit: String(count) });
  } catch (e) { handleError(e, 'getLatestReviews'); }
}

export async function getAllReviews(): Promise<Review[]> {
  try {
    return fetchPublicReviews();
  } catch (e) { handleError(e, 'getAllReviews'); }
}

export async function createProductReview(
  data: Omit<Review, 'id' | 'approved' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, REVIEWS), {
      ...data,
      userEmail: '',
      rating: Math.max(1, Math.min(5, Math.round(data.rating))),
      imageUrls: data.imageUrls ?? [],
      approved: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (e) { handleError(e, 'createProductReview'); }
}

export async function updateReviewApproval(reviewId: string, approved: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, REVIEWS, reviewId), { approved, updatedAt: serverTimestamp() });
  } catch (e) { handleError(e, 'updateReviewApproval'); }
}

export async function deleteReview(reviewId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, REVIEWS, reviewId));
  } catch (e) { handleError(e, 'deleteReview'); }
}

export async function updateUserReview(
  reviewId: string,
  data: Pick<Review, 'rating' | 'content' | 'imageUrls'>
): Promise<void> {
  try {
    await updateDoc(doc(db, REVIEWS, reviewId), {
      rating: Math.max(1, Math.min(5, Math.round(data.rating))),
      content: data.content,
      imageUrls: data.imageUrls ?? [],
      updatedAt: serverTimestamp(),
    });
  } catch (e) { handleError(e, 'updateUserReview'); }
}

// Wishlist
function normalizeWishlistItem(docId: string, data: any): WishlistItem {
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ?? new Date();
  return {
    id: docId,
    userId: data.userId ?? '',
    productId: data.productId ?? docId,
    productSlug: data.productSlug ?? '',
    productName: data.productName ?? '',
    productImage: data.productImage ?? '/placeholder-product.svg',
    price: Number(data.price ?? 0),
    salePrice: data.salePrice ?? null,
    inStock: data.inStock !== false,
    createdAt,
  };
}

export async function getWishlistStatus(userId: string, productId: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'wishlist', productId));
    return snap.exists();
  } catch (e) { handleError(e, 'getWishlistStatus'); }
}

export async function getUserWishlist(userId: string): Promise<WishlistItem[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'wishlist'));
    return snap.docs
      .map(d => normalizeWishlistItem(d.id, d.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) { handleError(e, 'getUserWishlist'); }
}

export async function addToWishlist(userId: string, product: Product): Promise<void> {
  try {
    await setDoc(doc(db, 'users', userId, 'wishlist', product.id), {
      userId,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name_mn,
      productImage: product.images?.[0] || '/placeholder-product.svg',
      price: product.price,
      salePrice: product.salePrice ?? null,
      inStock: product.inStock !== false && Number(product.stockQuantity ?? 1) > 0,
      createdAt: serverTimestamp(),
    });
  } catch (e) { handleError(e, 'addToWishlist'); }
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'wishlist', productId));
  } catch (e) { handleError(e, 'removeFromWishlist'); }
}

// ??? ORDERS ??????????????????????????????????????????????????????
const ORDERS = 'orders';
export const PAID_ORDER_STATUSES: OrderStatus[] = ['confirmed', 'shipped', 'delivered'];

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.id) throw new Error(data?.error || 'Failed to create order');
    return data.id;
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

// ??? SETTINGS (singleton: settings/main) ?????????????????????????
const SETTINGS_DOC = doc(db, 'settings', 'main');

export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const snap = await getDoc(SETTINGS_DOC);
    if (!snap.exists()) return null;
    return snap.data() as SiteSettings;
  } catch (e) {
    console.error('[Firestore Error ??getSiteSettings]:', e);
    // Return safe fallback data during Next.js builds if the DB is unreachable
    return {
      announcementText: '',
      announcementActive: false,
      freeShippingThreshold: 50000,
      shippingCost: 5000,
      bankName: '',
      bankAccount: '',
      bankAccountName: '',
      instagramUrl: '',
      phone: '',
      email: '',
    };
  }
}

export async function updateSiteSettings(data: Partial<SiteSettings>): Promise<void> {
  try {
    await setDoc(SETTINGS_DOC, data, { merge: true });
  } catch (e) { handleError(e, 'updateSiteSettings'); }
}
