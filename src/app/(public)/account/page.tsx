'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, CircleDollarSign, ClipboardCheck, Edit3, Heart, Home, LogOut, MessageCircle, Package, PackageCheck, PackageOpen, Settings, Shield, Star, Trash2, Truck } from 'lucide-react';
import AuthGuard from '@/components/ui/AuthGuard';
import ReviewForm from '@/components/ui/ReviewForm';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { deleteReview, getAllProducts, getUserReviews } from '@/lib/services/firestoreService';
import { formatPrice, type Product, type Review } from '@/types';

type AccountTab = 'orders' | 'reviews';

const statusLabels: Record<string, string> = {
  pending: 'Төлбөр хүлээж байна',
  confirmed: 'Төлбөр баталгаажуулах',
  processing: 'Захиалга бэлдэх',
  shipped: 'Хүргэлт хийгдэж байна',
  delivered: 'Захиалга хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
  PENDING: 'Төлбөр хүлээж байна',
  CONFIRMED: 'Төлбөр баталгаажуулах',
  PROCESSING: 'Захиалга бэлдэх',
  SHIPPED: 'Хүргэлт хийгдэж байна',
  DELIVERED: 'Захиалга хүргэгдсэн',
  CANCELLED: 'Цуцлагдсан',
};

const trackingSteps = [
  {
    status: 'pending',
    title: 'Төлбөр шалгаж байна',
    description: 'Админ төлбөр болон захиалгын мэдээллийг баталгаажуулна.',
    Icon: CircleDollarSign,
  },
  {
    status: 'confirmed',
    title: 'Төлбөр баталгаажсан',
    description: 'Захиалга баталгаажиж, бүтээгдэхүүн бэлтгэх дараалалд орлоо.',
    Icon: ClipboardCheck,
  },
  {
    status: 'processing',
    title: 'Бүтээгдэхүүн бэлдэж байна',
    description: 'Агуулах дээр бүтээгдэхүүнийг шалгаж, савлаж байна.',
    Icon: PackageOpen,
  },
  {
    status: 'shipped',
    title: 'Хүргэлтэд гарсан',
    description: 'Захиалга хүргэлтийн компанид шилжиж, замдаа явж байна.',
    Icon: Truck,
  },
  {
    status: 'delivered',
    title: 'Хүргэгдсэн',
    description: 'Захиалга амжилттай хүргэгдлээ. Баярлалаа.',
    Icon: Home,
  },
];

const statusOrder = trackingSteps.map((step) => step.status);

function normalizeStatus(status: string) {
  return String(status || 'pending').toLowerCase();
}

function OrderTracking({ status }: { status: string }) {
  const normalized = normalizeStatus(status);
  const activeIndex = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(normalized);
  
  if (activeIndex === -1) return null;

  const trackingStepsMN = [
    { status: 'pending', label: 'Төлбөр хүлээж байна' },
    { status: 'confirmed', label: 'Төлбөр баталгаажуулах' },
    { status: 'processing', label: 'Захиалга бэлдэх' },
    { status: 'shipped', label: 'Хүргэлт хийгдэж байна' },
    { status: 'delivered', label: 'Захиалга хүргэгдсэн' },
  ];

  const isShipped = normalized === 'shipped';

  return (
    <div className="mt-4 overflow-hidden rounded-[14px] border border-black/[0.08] bg-white">
      <style jsx global>{`
        @keyframes scooter-ride {
          0%, 100% { transform: translateX(10px); }
          50% { transform: translateX(35px); }
        }
        @keyframes scooter-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes package-pulse {
          0%, 100% { transform: scale(1) translateY(0); opacity: 0.9; }
          50% { transform: scale(1.15) translateY(-3px); opacity: 1; }
        }
        @keyframes road-move {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -20; }
        }
        .scooter-animated {
          animation: scooter-ride 4s ease-in-out infinite;
        }
        .scooter-bounce-animated {
          animation: scooter-bounce 0.6s ease-in-out infinite;
        }
        .package-animated {
          animation: package-pulse 1.5s ease-in-out infinite;
        }
        .road-animated {
          animation: road-move 1s linear infinite;
        }
      `}</style>

      {/* Animation Area */}
      <div className="relative h-28 w-full bg-[#FFF0F6] overflow-hidden flex items-center justify-center">
        {/* Dashed Road Line */}
        <div className="absolute inset-x-0 bottom-6 h-0.5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <line
              x1="0"
              y1="1"
              x2="2000"
              y2="1"
              stroke="#D4537E"
              strokeWidth="2"
              strokeDasharray="8 8"
              className={isShipped ? "road-animated" : ""}
              opacity="0.3"
            />
          </svg>
        </div>

        {/* Scooter and Package Group */}
        <div className={`absolute left-1/4 -translate-x-1/2 flex flex-col items-center bottom-6 ${isShipped ? "scooter-animated" : ""}`}>
          
          {/* Floating Package */}
          <div className={`mb-1 relative z-10 ${isShipped ? "package-animated" : ""}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#D4537E" stroke="#FFF" strokeWidth="1" strokeLinejoin="round" />
              <path d="M2 7V17L12 22V12L2 7Z" fill="#D4537E" stroke="#FFF" strokeWidth="1" strokeLinejoin="round" opacity="0.9" />
              <path d="M12 12V22L22 17V7L12 12Z" fill="#D4537E" stroke="#FFF" strokeWidth="1" strokeLinejoin="round" opacity="0.8" />
            </svg>
          </div>

          {/* Scooter Silhouette */}
          <div className={isShipped ? "scooter-bounce-animated" : ""}>
            <svg width="64" height="42" viewBox="0 0 64 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 32 C12 26, 18 24, 26 25 L38 25 C42 25, 46 20, 48 16 L51 9 C51.5 7.5, 53 7, 55 7 H59"
                stroke="#D4537E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M22 32 H44" stroke="#D4537E" strokeWidth="3" strokeLinecap="round" />
              <circle cx="18" cy="32" r="6" stroke="#D4537E" strokeWidth="2.5" fill="#FFF0F6" />
              <circle cx="18" cy="32" r="2.5" fill="#D4537E" />
              <circle cx="44" cy="32" r="6" stroke="#D4537E" strokeWidth="2.5" fill="#FFF0F6" />
              <circle cx="44" cy="32" r="2.5" fill="#D4537E" />
              <path d="M51 9 L44 32" stroke="#D4537E" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M48 9 H56" stroke="#D4537E" strokeWidth="2.5" strokeLinecap="round" />
              <path
                d="M13 22 C13 20.5, 15 19, 18 19 H28 C30.5 19, 32 20.5, 32 22 C32 23.5, 30.5 25, 28 25 H18 C15 25, 13 23.5, 13 22 Z"
                fill="#D4537E"
              />
              <circle cx="53" cy="12" r="2.5" fill="#FFF0F6" stroke="#D4537E" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Status Indicator Badge on corner */}
        <div className="absolute right-3 top-3 rounded-full bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#993556] shadow-xs border border-[#D4537E]/10">
          {isShipped ? "Хүргэгдэж байна" : "Хянах"}
        </div>
      </div>

      {/* Progress tracker */}
      <div className="p-4 bg-white">
        <div className="relative flex items-center justify-between">
          <div className="absolute top-[15px] left-[6%] right-[6%] h-[2px] bg-gray-100 -z-0" />
          <div
            className="absolute top-[15px] left-[6%] h-[2px] bg-[#D4537E] -z-0 transition-all duration-500"
            style={{ width: `${(activeIndex / 4) * 88}%` }}
          />

          {trackingStepsMN.map((step, index) => {
            const completed = index < activeIndex;
            const current = index === activeIndex;

            return (
              <div key={step.status} className="relative z-10 flex flex-col items-center flex-1">
                {completed ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4537E] text-white shadow-xs transition-colors duration-300">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : current ? (
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#D4537E] bg-white text-[#D4537E] shadow-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#D4537E]" />
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full border-2 border-[#D4537E] opacity-75" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-300">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                  </div>
                )}

                <span
                  className={`mt-2 text-center text-[9px] leading-[1.3] max-w-[60px] whitespace-normal transition-all duration-300 ${
                    current ? 'text-[#D4537E] font-bold' : 'text-gray-400 font-medium'
                  }`}
                  style={{ display: 'block', margin: '0 auto' }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ClientStatusBadge({ status }: { status: string }) {
  const norm = normalizeStatus(status);
  let bg = 'bg-[#FBEAF0]';
  let text = 'text-[#993556]';
  let label = statusLabels[norm] || status;

  if (norm === 'pending') {
    bg = 'bg-[#FAEEDA]';
    text = 'text-[#854F0B]';
  } else if (norm === 'confirmed' || norm === 'processing' || norm === 'shipped') {
    bg = 'bg-[#FBEAF0]';
    text = 'text-[#993556]';
  } else if (norm === 'delivered') {
    bg = 'bg-[#EAF3DE]';
    text = 'text-[#3B6D11]';
  } else if (norm === 'cancelled' || norm === 'refunded') {
    bg = 'bg-[#FCEBEB]';
    text = 'text-[#A32D2D]';
  }

  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${bg} ${text}`}>
      {label}
    </span>
  );
}

function OrderReviewCta({ order, reviews, productSlugById }: { order: any; reviews: Review[]; productSlugById: Record<string, string> }) {
  if (normalizeStatus(order.status) !== 'delivered') return null;
  const items = Array.isArray(order.items) ? order.items : [];
  const pendingItem = items.find((item: any) => !reviews.some((review) => review.orderId === order.id && review.productId === item.productId));
  if (!pendingItem) {
    return (
      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--status-success-bg)] px-3 py-2 text-[11px] font-extrabold text-[var(--status-success)]">
        <CheckCircle2 size={14} /> Сэтгэгдэл бичсэн
      </div>
    );
  }
  const slug = pendingItem.productSlug || productSlugById[pendingItem.productId];
  if (!slug) return null;
  return (
    <Link href={`/shop/${slug}?reviewOrderId=${order.id}`} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-brand-accent)] px-4 text-[11px] font-extrabold text-white">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
      </span>
      Сэтгэгдэл бичих
    </Link>
  );
}

function toDate(value: any) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function reviewToProduct(review: Review): Product {
  return {
    id: review.productId,
    slug: review.productSlug,
    name_mn: review.productName,
    name_en: review.productName,
    price: 0,
    salePrice: null,
    saleEndDate: null,
    category: 'other',
    images: review.imageUrls,
    videoUrl: null,
    description_mn: '',
    ingredients: '',
    howToUse: '',
    featured: false,
    published: true,
    inStock: true,
    stockQuantity: 0,
    views: 0,
    orderCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function AccountContent() {
  const { user, isAdmin, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AccountTab>('orders');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [productSlugById, setProductSlugById] = useState<Record<string, string>>({});
  const [ordersSubTab, setOrdersSubTab] = useState<'active' | 'history'>('active');
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'profile' | 'orders' | 'reviews'>('profile');

  const activeOrders = useMemo(() => {
    return orders.filter((order) =>
      ['pending', 'confirmed', 'processing', 'shipped'].includes(normalizeStatus(order.status))
    );
  }, [orders]);

  const historyOrders = useMemo(() => {
    return orders.filter((order) =>
      ['delivered', 'cancelled'].includes(normalizeStatus(order.status))
    );
  }, [orders]);

  const loadAccountData = async () => {
    if (!user) return;
    setLoading(true);
    const [orderResult, reviewResult, productResult] = await Promise.allSettled([
      getDocs(query(collection(db, 'orders'), where('userId', '==', user.uid))),
      getUserReviews(user.uid),
      getAllProducts({ published: true }),
    ]);

    if (orderResult.status === 'fulfilled') {
      setOrders(orderResult.value.docs.map((doc) => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)));
    }
    if (reviewResult.status === 'fulfilled') setReviews(reviewResult.value);
    if (productResult.status === 'fulfilled') {
      setProductSlugById(Object.fromEntries(productResult.value.map((product) => [product.id, product.slug])));
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadAccountData();
  }, [user]);

  const summary = useMemo(() => ({ orders: orders.length, reviews: reviews.length }), [orders.length, reviews.length]);

  if (!user) return null;

  const removeReview = async (reviewId: string) => {
    if (!confirm('Энэ сэтгэгдлийг устгах уу?')) return;
    await deleteReview(reviewId);
    setReviews((prev) => prev.filter((item) => item.id !== reviewId));
  };

  return (
    <div className="space-y-5 px-4 pb-[104px] md:max-w-xl lg:max-w-2xl mx-auto md:mt-6">
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-32 rounded-[24px] animate-shimmer" />)}</div>
      ) : (
        <>
          {/* PROFILE VIEW (default dashboard layout) */}
          {currentView === 'profile' && (
            <div className="space-y-5">
              {/* Profile card and menu (unified top card) */}
              <section className="rounded-[16px] bg-white p-5 border border-[#F4C0D1] shadow-[var(--shadow-mobile-card)] space-y-5">
                {/* Profile Info */}
                <div className="flex items-center gap-4">
                  <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full border border-[#F4C0D1] flex items-center justify-center bg-[var(--color-soft-pink)] text-[18px] font-extrabold text-[var(--color-primary)]">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'Profile'} className="h-full w-full object-cover" />
                    ) : (
                      (user.displayName || user.email || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="truncate text-[18px] font-extrabold text-[var(--color-text-dark)] leading-tight">
                        {user.displayName || 'Хэрэглэгч'}
                      </h2>
                      {isAdmin && (
                        <span className="inline-block shrink-0 rounded-full bg-[#FBEAF0] px-2.5 py-0.5 text-[10px] font-extrabold text-[#993556] border border-[#F4C0D1]/30">
                          Админ
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-[var(--color-text-medium)] leading-none">{user.email}</p>
                  </div>
                </div>

                {/* Stats Row: 2 equal tiles — with count-up animation */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[12px] bg-[var(--color-brand-bg)] p-3.5 text-center border border-pink-100/20">
                    <p
                      className="text-xl font-extrabold text-[var(--color-text-dark)]"
                      style={{ animation: 'countUp 0.5s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '0.1s' }}
                    >
                      {orders.length}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-[var(--color-text-medium)]">Нийт захиалга</p>
                  </div>
                  <div className="rounded-[12px] bg-[var(--color-brand-bg)] p-3.5 text-center border border-pink-100/20">
                    <p
                      className="text-xl font-extrabold text-[var(--color-text-dark)]"
                      style={{ animation: 'countUp 0.5s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '0.2s' }}
                    >
                      {reviews.length}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-[var(--color-text-medium)]">Сэтгэгдэл</p>
                  </div>
                </div>

                {/* Vertical Menu List */}
                <div className="divide-y divide-[#fde8f0] border-t border-[#fde8f0] pt-1">
                  {/* Menu item 1: Миний захиалгууд */}
                  <button
                    type="button"
                    onClick={() => {
                      setOrdersSubTab('active');
                      setCurrentView('orders');
                    }}
                    className="group w-full py-3.5 flex items-center justify-between gap-3 text-left active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#FFF0F6] text-[#D4537E]">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[var(--color-text-dark)]">Миний захиалгууд</p>
                        <p className="text-[11px] text-gray-400">
                          {activeOrders.length} идэвхтэй · {historyOrders.length} дууссан
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeOrders.length > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4537E] text-[10px] font-bold text-white">
                          {activeOrders.length}
                        </span>
                      )}
                      <span className="text-gray-400 text-lg font-bold transition-transform duration-200 group-hover:translate-x-1">›</span>
                    </div>
                  </button>

                  {/* Menu item 2: Миний сэтгэгдлүүд */}
                  <button
                    type="button"
                    onClick={() => setCurrentView('reviews')}
                    className="group w-full py-3.5 flex items-center justify-between gap-3 text-left active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#FFF0F6] text-[#D4537E]">
                        <MessageCircle size={16} />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[var(--color-text-dark)]">Миний сэтгэгдлүүд</p>
                        <p className="text-[11px] text-gray-400">{reviews.length} сэтгэгдэл бичсэн</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-lg font-bold transition-transform duration-200 group-hover:translate-x-1">›</span>
                  </button>

                  {/* Menu item 3: Хадгалсан бараа */}
                  <Link
                    href="/wishlist"
                    className="group w-full py-3.5 flex items-center justify-between gap-3 text-left active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#FFF0F6] text-[#D4537E]">
                        <Heart size={16} className="fill-[#D4537E]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[var(--color-text-dark)]">Хадгалсан бараа</p>
                        <p className="text-[11px] text-gray-400">Дуртай барааны жагсаалт</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-lg font-bold transition-transform duration-200 group-hover:translate-x-1">›</span>
                  </Link>

                  {/* Menu item 4: Тохиргоо */}
                  <Link
                    href="/settings"
                    className="group w-full py-3.5 flex items-center justify-between gap-3 text-left active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-gray-100 text-gray-500">
                        <Settings size={16} />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[var(--color-text-dark)]">Тохиргоо</p>
                        <p className="text-[11px] text-gray-400">Нууц үг, хаяг, холбоо барих</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-lg font-bold transition-transform duration-200 group-hover:translate-x-1">›</span>
                  </Link>

                  {/* Menu item 5: Админ самбар */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="group w-full py-3.5 flex items-center justify-between gap-3 text-left active:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-gray-100 text-gray-500">
                          <Shield size={16} />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[var(--color-text-dark)]">Админ самбар</p>
                          <p className="text-[11px] text-gray-400">Захиалга, хэрэглэгч удирдах</p>
                        </div>
                      </div>
                      <span className="text-gray-400 text-lg font-bold transition-transform duration-200 group-hover:translate-x-1">›</span>
                    </Link>
                  )}

                  {/* Menu item 6: Гарах */}
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="w-full py-3.5 flex items-center justify-between gap-3 text-left active:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#FCEBEB] text-[#A32D2D]">
                        <LogOut size={16} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#A32D2D]">Гарах</p>
                      </div>
                    </div>
                  </button>
                </div>
              </section>

              {/* Inline compact active orders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pt-2">
                  <h3 className="text-[12px] font-extrabold text-[var(--color-text-dark)] uppercase tracking-wider">
                    Идэвхтэй захиалга
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentView('orders')}
                    className="text-[11px] font-bold text-[var(--color-primary)] hover:underline"
                  >
                    Бүгдийг харах ›
                  </button>
                </div>

                <div className="space-y-3">
                  {activeOrders.length ? (
                    activeOrders.slice(0, 2).map((order) => (
                      <article key={order.id} className="rounded-[16px] bg-white p-4 shadow-[var(--shadow-mobile-card)] border border-[#F4C0D1] space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-mono rounded-full bg-gray-100 border border-gray-200/50 px-2 py-0.5 text-xs text-gray-700 tracking-wide font-medium">
                              {order.orderNumber || `#${order.id.slice(-6).toUpperCase()}`}
                            </span>
                            <p className="mt-1.5 text-[15px] font-extrabold text-[var(--color-text-dark)]">{formatPrice(order.total || 0)}</p>
                          </div>
                          <ClientStatusBadge status={order.status} />
                        </div>
                        <div className="mt-3 space-y-2">
                          {order.items?.map((item: any, index: number) => {
                            const slug = item.productSlug || productSlugById[item.productId];
                            const content = (
                              <>
                                <span className="min-w-0 flex-1 font-bold line-clamp-1">{item.name_mn || item.name || 'Бүтээгдэхүүн'} x {item.quantity || 1}</span>
                                <strong className="shrink-0">{formatPrice((item.price || 0) * (item.quantity || 1))}</strong>
                              </>
                            );
                            return slug ? (
                              <Link key={`${order.id}-${index}`} href={`/shop/${slug}`} className="flex items-center justify-between gap-3 rounded-[12px] bg-[var(--color-brand-bg)] p-2.5 text-[11px] active:scale-[0.99] border border-black/[0.01]">
                                {content}
                              </Link>
                            ) : (
                              <div key={`${order.id}-${index}`} className="flex items-center justify-between gap-3 rounded-[12px] bg-[var(--color-brand-bg)] p-2.5 text-[11px] border border-black/[0.01]">
                                {content}
                              </div>
                            );
                          })}
                        </div>
                  <OrderReviewCta order={order} reviews={reviews} productSlugById={productSlugById} />
                  <OrderTracking status={order.status} />
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[16px] bg-white px-5 py-8 text-center border border-[#F4C0D1] shadow-[var(--shadow-mobile-card)]">
                      <p className="text-[12px] font-bold text-gray-400">Идэвхтэй захиалга байхгүй байна.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FULL TABBED ORDERS VIEW */}
          {currentView === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-pink-100/30">
                <button
                  type="button"
                  onClick={() => setCurrentView('profile')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[#F4C0D1] text-gray-700 shadow-xs active:scale-95 transition-transform text-sm font-extrabold"
                >
                  ←
                </button>
                <h1 className="text-[14px] font-extrabold text-[var(--color-text-dark)] uppercase">Миний захиалгууд</h1>
              </div>

              {/* Active vs History sub-tabs */}
              <div className="flex rounded-full bg-gray-100 p-1 border border-black/[0.04]">
                <button
                  type="button"
                  onClick={() => setOrdersSubTab('active')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] font-extrabold transition-all ${
                    ordersSubTab === 'active' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>Идэвхтэй</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${ordersSubTab === 'active' ? 'bg-[var(--color-soft-pink)] text-[var(--color-primary)]' : 'bg-gray-200 text-gray-500'}`}>
                    {activeOrders.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrdersSubTab('history')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] font-extrabold transition-all ${
                    ordersSubTab === 'history' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>Түүх</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${ordersSubTab === 'history' ? 'bg-[var(--color-soft-pink)] text-[var(--color-primary)]' : 'bg-gray-200 text-gray-500'}`}>
                    {historyOrders.length}
                  </span>
                </button>
              </div>

              {/* Orders List rendering */}
              {ordersSubTab === 'active' ? (
                <section className="space-y-3">
                  {activeOrders.length ? activeOrders.map((order) => (
                    <article key={order.id} className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)] border border-black/[0.04]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-mono rounded-full bg-gray-100 border border-gray-200/50 px-2 py-0.5 text-xs text-gray-700 tracking-wide font-medium">
                            {order.orderNumber || `#${order.id.slice(-6).toUpperCase()}`}
                          </span>
                          <p className="mt-1.5 text-[16px] font-extrabold text-[var(--color-text-dark)]">{formatPrice(order.total || 0)}</p>
                        </div>
                        <ClientStatusBadge status={order.status} />
                      </div>
                      <div className="mt-3 space-y-2">
                        {order.items?.map((item: any, index: number) => {
                          const slug = item.productSlug || productSlugById[item.productId];
                          const content = (
                            <>
                              <span className="min-w-0 flex-1 font-bold line-clamp-1">{item.name_mn || item.name || 'Бүтээгдэхүүн'} x {item.quantity || 1}</span>
                              <strong className="shrink-0">{formatPrice((item.price || 0) * (item.quantity || 1))}</strong>
                            </>
                          );
                          return slug ? (
                            <Link key={`${order.id}-${index}`} href={`/shop/${slug}`} className="flex items-center justify-between gap-3 rounded-[16px] bg-[var(--color-brand-bg)] p-3 text-[12px] active:scale-[0.99] border border-black/[0.01]">
                              {content}
                            </Link>
                          ) : (
                            <div key={`${order.id}-${index}`} className="flex items-center justify-between gap-3 rounded-[16px] bg-[var(--color-brand-bg)] p-3 text-[12px] border border-black/[0.01]">
                              {content}
                            </div>
                          );
                        })}
                      </div>
                      <OrderTracking status={order.status} />
                    </article>
                  )) : <EmptyState title="Идэвхтэй захиалга алга байна" href="/shop" label="Дэлгүүр үзэх" />}
                </section>
              ) : (
                <section className="space-y-3">
                  {historyOrders.length ? historyOrders.map((order) => {
                    const primaryProduct = order.items?.[0];
                    const itemsCount = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
                    const productName = primaryProduct?.name_mn || primaryProduct?.name || 'Бүтээгдэхүүн';
                    const displayProductName = itemsCount > 1 ? `${productName} + ${itemsCount - 1} бараа` : productName;

                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => setSelectedHistoryOrder(order)}
                        className="flex w-full items-center justify-between gap-3 rounded-[20px] bg-white p-4 text-left border border-black/[0.04] shadow-[var(--shadow-mobile-card)] hover:bg-gray-50 active:scale-[0.99] transition-all"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono rounded-full bg-gray-100 border border-gray-200/50 px-2 py-0.5 text-xs text-gray-700 tracking-wide font-medium">
                              {order.orderNumber || `#${order.id.slice(-6).toUpperCase()}`}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {toDate(order.createdAt)?.toLocaleDateString('mn-MN')}
                            </span>
                          </div>
                          <p className="truncate text-[13px] font-extrabold text-[var(--color-text-dark)]">
                            {displayProductName}
                          </p>
                          <p className="text-[12px] font-bold text-[var(--color-text-medium)]">
                            {formatPrice(order.total || 0)}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <ClientStatusBadge status={order.status} />
                        </div>
                      </button>
                    );
                  }) : <EmptyState title="Захиалгын түүх алга байна" href="/shop" label="Бараа үзэх" />}
                </section>
              )}

              {/* History order bottom sheet */}
              <AnimatePresence>
                {selectedHistoryOrder && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs"
                      onClick={() => setSelectedHistoryOrder(null)}
                    />
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                      className="fixed bottom-0 left-1/2 z-[70] max-h-[85vh] w-full max-w-[430px] -translate-x-1/2 overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-[env(safe-area-inset-bottom)]"
                    >
                      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200" />
                      
                      <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">Захиалгын дэлгэрэнгүй</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono rounded-full bg-gray-100 border border-gray-200/50 px-2.5 py-0.5 text-xs text-gray-700 tracking-wide font-medium">
                              {selectedHistoryOrder.orderNumber || `#${selectedHistoryOrder.id.slice(-6).toUpperCase()}`}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11px] font-medium text-gray-400">
                            Огноо: {toDate(selectedHistoryOrder.createdAt)?.toLocaleString('mn-MN')}
                          </p>
                        </div>
                        <ClientStatusBadge status={selectedHistoryOrder.status} />
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Бараанууд</p>
                        {selectedHistoryOrder.items?.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between gap-3 rounded-[14px] bg-[var(--color-brand-bg)] p-3 text-[12px] border border-black/[0.02]">
                            <span className="min-w-0 flex-1 font-bold line-clamp-1">
                              {item.name_mn || item.name || 'Бүтээгдэхүүн'} x {item.quantity || 1}
                            </span>
                            <strong className="shrink-0">{formatPrice((item.price || 0) * (item.quantity || 1))}</strong>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 rounded-[18px] bg-gray-50 p-4 space-y-2 border border-black/[0.03]">
                        <div className="flex justify-between text-[12px] text-gray-500">
                          <span>Барааны дүн</span>
                          <span>{formatPrice(selectedHistoryOrder.subtotal || 0)}</span>
                        </div>
                        <div className="flex justify-between text-[12px] text-gray-500">
                          <span>Хүргэлтийн төлбөр</span>
                          <span>{selectedHistoryOrder.shippingCost === 0 ? 'Үнэгүй' : formatPrice(selectedHistoryOrder.shippingCost || 0)}</span>
                        </div>
                        <div className="border-t border-gray-200/80 my-2 pt-2 flex justify-between text-[14px] font-extrabold text-[var(--color-text-dark)]">
                          <span>Нийт дүн</span>
                          <span className="text-[var(--color-primary)]">{formatPrice(selectedHistoryOrder.total || 0)}</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Хүргэлтийн хаяг</p>
                        <div className="rounded-[18px] bg-gray-50 p-4 border border-black/[0.03] text-[13px] leading-relaxed">
                          <p className="font-extrabold text-[var(--color-text-dark)]">{selectedHistoryOrder.customerName || selectedHistoryOrder.displayName}</p>
                          <p className="mt-1 font-medium text-gray-500">{selectedHistoryOrder.address || selectedHistoryOrder.shippingAddress}</p>
                          {selectedHistoryOrder.phone && (
                            <p className="mt-1.5 font-bold text-[var(--color-text-medium)]">Утас: {selectedHistoryOrder.phone}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedHistoryOrder(null)}
                        className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-extrabold text-white shadow-md active:scale-[0.98] transition-all hover:bg-[var(--color-primary)]/90"
                      >
                        Хаах
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* FULL USER REVIEWS VIEW */}
          {currentView === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-pink-100/30">
                <button
                  type="button"
                  onClick={() => setCurrentView('profile')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[#F4C0D1] text-gray-700 shadow-xs active:scale-95 transition-transform text-sm font-extrabold"
                >
                  ←
                </button>
                <h1 className="text-[14px] font-extrabold text-[var(--color-text-dark)] uppercase">Миний сэтгэгдлүүд</h1>
              </div>

              <section className="space-y-3">
                {reviews.length ? reviews.map((review) => (
                  <article key={review.id} className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)] border border-black/[0.04]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/shop/${review.productSlug}`} className="block truncate text-[14px] font-extrabold">{review.productName}</Link>
                        <div className="mt-1 flex gap-0.5 text-[#E6A0BE]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={13} fill={index < review.rating ? 'currentColor' : 'none'} />)}</div>
                      </div>
                      <span className="rounded-full bg-[var(--color-brand-bg)] px-2 py-1 text-[10px] font-bold text-[var(--color-text-medium)]">{review.approved ? 'Нийтлэгдсэн' : 'Шалгаж байна'}</span>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed">{review.content}</p>
                    {review.imageUrls.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto hide-scrollbar">
                        {review.imageUrls.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[14px] bg-[var(--color-soft-pink)]">
                            <img src={url} alt="Review image" className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setEditingReview(review)} className="flex h-9 items-center gap-1 rounded-full bg-[var(--color-soft-pink)] px-4 text-[11px] font-extrabold text-[var(--color-text-dark)]"><Edit3 size={13} /> Засах</button>
                      <button onClick={() => removeReview(review.id)} className="flex h-9 items-center gap-1 rounded-full bg-[var(--status-error-bg)] px-4 text-[11px] font-extrabold text-[var(--status-error)]"><Trash2 size={13} /> Устгах</button>
                    </div>
                  </article>
                )) : <EmptyState title="Сэтгэгдэл алга байна" href="/shop" label="Бүтээгдэхүүн үзэх" />}
              </section>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {editingReview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-sm" onClick={() => setEditingReview(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 320 }} className="fixed bottom-0 left-1/2 z-[70] max-h-[88vh] w-full max-w-[430px] -translate-x-1/2 overflow-y-auto rounded-t-[30px] bg-white p-4 pb-[env(safe-area-inset-bottom)]">
              <ReviewForm product={reviewToProduct(editingReview)} review={editingReview} onCancel={() => setEditingReview(null)} onSubmitted={() => { setEditingReview(null); void loadAccountData(); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="rounded-[28px] bg-white px-6 py-12 text-center shadow-[var(--shadow-mobile-card)]">
      <p className="text-lg font-extrabold text-[var(--color-text-dark)]">{title}</p>
      <Link href={href} className="mt-5 inline-flex h-11 items-center rounded-full bg-[var(--color-primary)] px-5 text-[13px] font-extrabold text-white">{label}</Link>
    </div>
  );
}

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountContent />
    </AuthGuard>
  );
}
