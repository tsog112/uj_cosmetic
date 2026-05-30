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
  productSlug?: string;
  name_mn: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'qpay';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed';

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
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  bankTransferRef?: string;
  qpayInvoiceId?: string;
  promoCode?: string;
  discount?: number;
  qpayQrText?: string;
  qpayQrImage?: string;
  qpayShortUrl?: string;
  qpayPaidAmount?: number;
  qpayPaymentId?: string;
  paidAt?: Date;
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
  body?: string;
  imageUrls: string[];
  orderId: string;
  status: 'pending' | 'visible' | 'hidden';
  featured: boolean;
  editCount: number;
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
  facebookUrl?: string;
  phone: string;
  email: string;
}

export interface AppUser {
  uid: string;
  email: string;
  email_verified?: boolean;
  email_verified_at?: Date | null;
  email_verify_token?: string | null;
  displayName: string;
  photoURL: string;
  role: 'user' | 'admin';
  password_hash?: string | null;
  google_id?: string | null;
  google_email?: string | null;
  google_avatar_url?: string | null;
  phone?: string | { countryCode: string; localNumber: string; purpose?: 'delivery_only' } | null;
  password_reset_token?: string | null;
  password_reset_expires?: Date | null;
  createdAt: Date;
  orderCount: number;
}

export function formatPrice(price: number): string {
  return `${Math.round(price || 0).toLocaleString('mn-MN')}₮`;
}

export function getCategoryName(slug: string): string {
  return slug;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  announcementText: '',
  announcementActive: false,
  freeShippingThreshold: 50000,
  shippingCost: 5000,
  bankName: '',
  bankAccount: '',
  bankAccountName: '',
  instagramUrl: '',
  facebookUrl: '',
  phone: '',
  email: '',
};
