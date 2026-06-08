import {
  collection, getDocs, getDoc,
  doc, query, where, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, Order, Review, SiteSettings, WishlistItem } from '@/types';
import { maskDisplayName } from '@/lib/publicDto';

// ??? Error Handler ???????????????????????????????????????????????
async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  if (typeof window !== 'undefined') {
    const { authFetch } = await import('@/lib/auth/clientFetch');
    return authFetch(input, init);
  }
  return fetch(input, init);
}

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
    const response = await fetch('/api/categories', { cache: 'no-store' });
    const data = await response.json().catch(() => []);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('[getCategories]:', e);
    return [];
  }
}

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
  if (typeof window !== 'undefined') {
    const { sessionOnce } = await import('@/lib/client/sessionOnce');
    if (!sessionOnce(`product-view:${productId}`)) return;
  }
  try {
    await fetch(`/api/products/${encodeURIComponent(productId)}/view`, { method: 'POST' });
  } catch (e) { handleError(e, 'incrementProductViews'); }
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
    content: data.content ?? data.body ?? '',
    body: data.body ?? data.content ?? '',
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
    orderId: data.orderId ?? '',
    status: data.status === 'visible' || data.status === 'hidden' || data.status === 'pending'
      ? data.status
      : data.approved === true ? 'visible' : 'pending',
    featured: Boolean(data.featured),
    editCount: Number(data.editCount || 0),
    approved: data.status ? data.status === 'visible' : data.approved === true,
    createdAt,
    updatedAt,
  };
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  const merged = new Map<string, Review>();

  try {
    const response = await apiFetch('/api/reviews/mine', { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (response.ok && Array.isArray(data.reviews)) {
      data.reviews.forEach((review: Review) => merged.set(review.id, reviveReview(review)));
    }
  } catch (e) {
    console.warn('[getUserReviews] API failed:', e);
  }

  try {
    const q = query(collection(db, REVIEWS), where('userId', '==', userId));
    const snap = await getDocs(q);
    snap.docs.forEach((docSnap) => {
      if (!merged.has(docSnap.id)) {
        merged.set(docSnap.id, normalizeReview(docSnap.id, docSnap.data()));
      }
    });
  } catch (e) {
    if (!merged.size) handleError(e, `getUserReviews(${userId})`);
  }

  return Array.from(merged.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getLatestReviews(count = 6): Promise<Review[]> {
  try {
    return fetchPublicReviews({ limit: String(count), featured: 'true' });
  } catch (e) { handleError(e, 'getLatestReviews'); }
}

export async function createProductReview(
  data: Omit<Review, 'id' | 'approved' | 'createdAt' | 'updatedAt' | 'status' | 'featured' | 'editCount' | 'body'>
): Promise<string> {
  try {
    const response = await apiFetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.id) throw new Error(result.error || 'Failed to create review');
    return result.id;
  } catch (e) { handleError(e, 'createProductReview'); }
}

export async function updateUserReview(
  reviewId: string,
  data: Pick<Review, 'rating' | 'content' | 'imageUrls'>
): Promise<void> {
  try {
    const response = await apiFetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Failed to update review');
  } catch (e) { handleError(e, 'updateUserReview'); }
}

// Wishlist

export async function getWishlistStatus(_userId: string, productId: string): Promise<boolean> {
  try {
    const response = await apiFetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, { cache: 'no-store' });
    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data?.inWishlist);
  } catch {
    return false;
  }
}

export async function getUserWishlist(_userId: string): Promise<WishlistItem[]> {
  try {
    const response = await apiFetch('/api/wishlist', { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    const items: any[] = Array.isArray(data?.items) ? data.items : [];
    return items.map((item) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    })) as WishlistItem[];
  } catch {
    return [];
  }
}

export async function addToWishlist(userId: string, product: Product): Promise<void> {
  try {
    const response = await apiFetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id }),
    });
    if (!response.ok) throw new Error('addToWishlist failed');
  } catch (e) { handleError(e, 'addToWishlist'); }
}

export async function removeFromWishlist(_userId: string, productId: string): Promise<void> {
  try {
    const response = await apiFetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('removeFromWishlist failed');
  } catch (e) { handleError(e, 'removeFromWishlist'); }
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const response = await apiFetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.id) throw new Error(data?.error || 'Failed to create order');
    return data.id;
  } catch (e) {
    handleError(e, 'createOrder');
  }
}

// Settings (singleton: settings/main)
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
