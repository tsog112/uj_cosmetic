export interface Product {
  id: string;
  slug: string;
  name_mn: string;
  name_en: string;
  price: number;
  salePrice: number | null;
  saleEndDate: Date | null;
  category: 'serum' | 'toner' | 'oil' | 'cream' | 'sunscreen' | 'cleanser' | 'mask' | 'other';
  images: string[];
  videoUrl: string | null;
  description_mn: string;
  ingredients: string;
  howToUse: string;
  featured: boolean;
  published: boolean;
  inStock: boolean;
  stockQuantity: number;
  views: number;
  orderCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name_mn: string;
  slug: string;
  image?: string;
  imageUrl?: string;
  order?: number;
  productCount?: number;
  createdAt?: Date;
}

export interface OrderItem {
  productId: string;
  name_mn: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  customerName: string;
  customerEmail?: string;
  email?: string;
  phone: string;
  address: string;
  note: string;
  status: OrderStatus;
  paymentMethod: 'bank_transfer';
  bankTransferRef: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  content: string;
  imageUrls: string[];
  orderId?: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  productSlug: string;
  productName: string;
  productImage: string;
  price: number;
  salePrice: number | null;
  inStock: boolean;
  createdAt: Date;
}

export interface SiteSettings {
  announcementText: string;
  announcementActive: boolean;
  freeShippingThreshold: number;
  shippingCost: number;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  instagramUrl: string;
  phone: string;
  email: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'user' | 'admin';
  phone: string;
  createdAt: Date;
  orderCount: number;
}

// Utility
export function formatPrice(price: number): string {
  return price.toLocaleString('mn-MN') + '₮';
}

export const CATEGORIES: Category[] = [
  { id: 'serum', name_mn: 'Серум', slug: 'serum', image: '/images/categories/serum.png' },
  { id: 'toner', name_mn: 'Тоник', slug: 'toner', image: '/images/categories/toner.png' },
  { id: 'oil', name_mn: 'Нүүрний тос', slug: 'oil', image: '/images/categories/oil.png' },
  { id: 'cream', name_mn: 'Нүүрний тосолгоо', slug: 'cream', image: '/images/categories/cream.png' },
  { id: 'sunscreen', name_mn: 'Наран хамгаалагч', slug: 'sunscreen', image: '/images/categories/sunscreen.png' },
  { id: 'cleanser', name_mn: 'Нүүр угаалга', slug: 'cleanser', image: '/images/categories/cleanser.png' },
  { id: 'mask', name_mn: 'Нүүрний маск', slug: 'mask', image: '/images/categories/mask.png' },
  { id: 'other', name_mn: 'Бусад', slug: 'other', image: '/images/categories/other.png' },
];

export function getCategoryName(slug: string): string {
  const cat = CATEGORIES.find(c => c.slug === slug);
  return cat ? cat.name_mn : slug;
}

// Default site settings fallback
export const DEFAULT_SETTINGS: SiteSettings = {
  announcementText: 'Монгол даяар хүргэлт хийдэг · 50,000₮-с дээш захиалгад үнэгүй хүргэлт',
  announcementActive: true,
  freeShippingThreshold: 50000,
  shippingCost: 5000,
  bankName: 'ХААН БАНК',
  bankAccount: '5000123456',
  bankAccountName: 'УЖ Косметик ХХК',
  instagramUrl: 'https://instagram.com/uj_cosmetic',
  phone: '+976 9900-1234',
  email: 'info@ujcosmetic.mn',
};
