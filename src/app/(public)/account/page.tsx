'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, CircleDollarSign, ClipboardCheck, Edit3, Home, LogOut, MessageCircle, Package, PackageCheck, PackageOpen, Shield, Star, Trash2, Truck } from 'lucide-react';
import AuthGuard from '@/components/ui/AuthGuard';
import ReviewForm from '@/components/ui/ReviewForm';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { deleteReview, getAllProducts, getUserReviews } from '@/lib/services/firestoreService';
import { formatPrice, type Product, type Review } from '@/types';

type AccountTab = 'orders' | 'reviews';

const statusLabels: Record<string, string> = {
  pending: 'Хүлээгдэж байна',
  confirmed: 'Баталгаажсан',
  processing: 'Бэлтгэгдэж байна',
  shipped: 'Хүргэлтэд гарсан',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
  PENDING: 'Хүлээгдэж байна',
  CONFIRMED: 'Баталгаажсан',
  PROCESSING: 'Бэлтгэгдэж байна',
  SHIPPED: 'Хүргэлтэд гарсан',
  DELIVERED: 'Хүргэгдсэн',
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
  const isCancelled = normalized === 'cancelled';
  const activeIndex = isCancelled ? 0 : Math.max(0, statusOrder.indexOf(normalized));
  const progress = isCancelled ? 100 : (activeIndex / (trackingSteps.length - 1)) * 100;
  const currentStep = isCancelled
    ? {
        title: 'Захиалга цуцлагдсан',
        description: 'Энэ захиалгын үйл явц зогссон байна. Дэлгэрэнгүй мэдээллийг админаас лавлаарай.',
      }
    : trackingSteps[activeIndex];

  return (
    <div className="mt-4 overflow-hidden rounded-[20px] bg-[var(--color-brand-bg)]">
      <div className="relative h-28 overflow-hidden bg-[#fdf3f7]">
        <div className="absolute inset-x-4 bottom-4 h-1.5 rounded-full bg-white" />
        <motion.div
          className="absolute bottom-4 left-4 h-1.5 rounded-full bg-[var(--color-brand-accent)]"
          initial={false}
          animate={{ width: `calc((100% - 2rem) * ${progress / 100})` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
        <motion.div
          className="absolute left-5 top-7 flex items-end gap-2"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="relative h-12 w-8">
            <div className="absolute left-2 top-0 h-5 w-5 rounded-full bg-[#f2b7ca]" />
            <div className="absolute bottom-0 left-1 h-8 w-6 rounded-t-full bg-[var(--color-brand-accent)]" />
          </div>
          <div className="grid gap-1">
            <motion.div className="h-5 w-7 rounded-[6px] bg-white shadow-sm" animate={{ x: activeIndex >= 2 ? [0, 6, 0] : 0 }} transition={{ duration: 1.4, repeat: Infinity }} />
            <div className="h-4 w-9 rounded-[5px] bg-[#f5c8d8]" />
          </div>
        </motion.div>
        <motion.div
          className="absolute bottom-7 flex items-end"
          initial={false}
          animate={{ left: `calc(1.25rem + (100% - 7.5rem) * ${progress / 100})` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          <div className="relative h-11 w-20">
            <div className="absolute bottom-3 left-2 h-4 w-12 rounded-full bg-[var(--color-brand-text)]" />
            <div className="absolute bottom-5 left-9 h-5 w-7 rounded-t-full bg-[var(--color-brand-accent)]" />
            <div className="absolute bottom-0 left-3 h-4 w-4 rounded-full border-4 border-[var(--color-brand-text)] bg-white" />
            <div className="absolute bottom-0 left-14 h-4 w-4 rounded-full border-4 border-[var(--color-brand-text)] bg-white" />
            <motion.div className="absolute bottom-8 left-2 h-4 w-5 rounded-[5px] bg-white shadow-sm" animate={{ rotate: activeIndex >= 3 ? [0, -6, 0] : 0 }} transition={{ duration: 1, repeat: Infinity }} />
          </div>
        </motion.div>
        <div className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--color-brand-accent)] shadow-sm">
          {isCancelled ? <Trash2 size={22} /> : <PackageCheck size={23} />}
        </div>
      </div>
      <div className="p-4">
        <p className="text-[13px] font-extrabold text-[var(--color-text-dark)]">{currentStep.title}</p>
        <p className="mt-1 text-[11px] font-bold leading-5 text-[var(--color-text-medium)]">{currentStep.description}</p>
        {!isCancelled && (
          <div className="mt-4 grid grid-cols-5 gap-1">
            {trackingSteps.map((step, index) => {
              const Icon = step.Icon;
              const done = index <= activeIndex;
              const current = index === activeIndex;
              return (
                <div key={step.status} className="min-w-0 text-center">
                  <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${done ? 'bg-[var(--color-brand-accent)] text-white' : 'bg-white text-[var(--color-text-medium)]'}`}>
                    {done && !current ? <CheckCircle2 size={17} /> : <Icon size={17} />}
                  </div>
                  <p className={`mt-1 line-clamp-2 text-[9px] font-extrabold leading-3 ${done ? 'text-[var(--color-text-dark)]' : 'text-[var(--color-text-medium)]'}`}>{step.title}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
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
    <div className="space-y-5 px-4 pb-[104px]">
      <section className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-mobile-card)]">
        <div className="flex items-center gap-4">
          <div className="flex h-17 w-17 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-soft-pink)] text-2xl font-extrabold text-[var(--color-primary)]">
            {user.photoURL ? <img src={user.photoURL} alt={user.displayName || 'Profile'} className="h-full w-full object-cover" /> : (user.displayName || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">My account</p>
            <h1 className="mt-1 truncate text-[22px] font-extrabold text-[var(--color-text-dark)]">Миний бүртгэл</h1>
            <p className="mt-1 truncate text-[13px] text-[var(--color-text-medium)]">{user.email}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {[['Захиалга', summary.orders], ['Сэтгэгдэл', summary.reviews]].map(([label, value]) => (
            <div key={label} className="rounded-[18px] bg-[var(--color-brand-bg)] p-3 text-center">
              <p className="text-xl font-extrabold">{value}</p>
              <p className="mt-1 text-[10px] font-bold text-[var(--color-text-medium)]">{label}</p>
            </div>
          ))}
        </div>
        <div className={`mt-4 grid gap-2 ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {isAdmin && <Link href="/admin" className="flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] text-[12px] font-extrabold text-white"><Shield size={15} /> Админ</Link>}
          <button onClick={() => signOut()} className="flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-soft-pink)] text-[12px] font-extrabold text-[var(--color-text-dark)]"><LogOut size={15} /> Гарах</button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-1 rounded-full bg-white p-1 shadow-[var(--shadow-mobile-card)]">
        {[{ value: 'orders', label: 'Захиалга', icon: Package }, { value: 'reviews', label: 'Сэтгэгдэл', icon: MessageCircle }].map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.value} onClick={() => setActiveTab(tab.value as AccountTab)} className={`flex h-11 items-center justify-center gap-1.5 rounded-full text-[12px] font-extrabold ${activeTab === tab.value ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-medium)]'}`}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </section>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-32 rounded-[24px] animate-shimmer" />)}</div>
      ) : (
        <>
          {activeTab === 'orders' && (
            <section className="space-y-3">
              {orders.length ? orders.map((order) => (
                <article key={order.id} className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-bold text-[var(--color-text-medium)]">#{order.id.slice(-6).toUpperCase()}</p>
                      <p className="mt-1 text-[16px] font-extrabold text-[var(--color-text-dark)]">{formatPrice(order.total || 0)}</p>
                    </div>
                    <span className="rounded-full bg-[var(--color-soft-pink)] px-3 py-1 text-[10px] font-extrabold text-[var(--color-primary)]">{statusLabels[order.status] || order.status}</span>
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
                        <Link key={`${order.id}-${index}`} href={`/shop/${slug}`} className="flex items-center justify-between gap-3 rounded-[16px] bg-[var(--color-brand-bg)] p-3 text-[12px] active:scale-[0.99]">
                          {content}
                        </Link>
                      ) : (
                        <div key={`${order.id}-${index}`} className="flex items-center justify-between gap-3 rounded-[16px] bg-[var(--color-brand-bg)] p-3 text-[12px]">
                          {content}
                        </div>
                      );
                    })}
                  </div>
                  <OrderTracking status={order.status} />
                </article>
              )) : <EmptyState title="Захиалга алга байна" href="/shop" label="Дэлгүүр үзэх" />}
            </section>
          )}

          {activeTab === 'reviews' && (
            <section className="space-y-3">
              {reviews.length ? reviews.map((review) => (
                <article key={review.id} className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
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
