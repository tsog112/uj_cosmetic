'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  ChevronRight,
  LogOut,
  MessageCircle,
  Package,
  Settings,
  Shield,
  Star,
} from 'lucide-react';
import OrderDeliveryTracker from '@/components/ui/OrderDeliveryTracker';
import AuthGuard from '@/components/ui/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useToast } from '@/components/ui/Toast';
import { db } from '@/lib/firebase';
import ReviewForm from '@/components/ui/ReviewForm';
import { authFetch } from '@/lib/auth/clientFetch';
import { getUserReviews } from '@/lib/services/firestoreService';
import { formatPrice, type Product, type Review } from '@/types';

type ViewMode = 'profile' | 'orders' | 'reviews';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Төлбөр хүлээж байна',
  confirmed: 'Төлбөр баталгаажсан',
  processing: 'Захиалга бэлдэж байна',
  shipped: 'Хүргэлт хийгдэж байна',
  delivered: 'Захиалга хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
};

function toDate(value: any) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeStatus(status: any) {
  return String(status || 'pending').toLowerCase();
}

function orderNumber(order: any, index: number) {
  if (order.orderNumber && /^#\d{4}-\d{4}$/.test(order.orderNumber)) return order.orderNumber;
  const created = toDate(order.createdAt) || new Date();
  return `#${created.getFullYear()}-${String(index + 1).padStart(4, '0')}`;
}

function orderItemName(item: any) {
  return item?.name_mn || item?.name || item?.productName || item?.product?.name || 'Бүтээгдэхүүн';
}

function orderItemImage(item: any) {
  if (item?.imageUrl) return item.imageUrl;
  if (item?.image) return item.image;
  if (item?.productImage) return item.productImage;
  const productImages = item?.product?.images;
  if (typeof productImages === 'string') {
    try {
      const parsed = JSON.parse(productImages);
      if (Array.isArray(parsed) && parsed[0]) return String(parsed[0]);
    } catch {
      /* ignore invalid json */
    }
  }
  if (Array.isArray(productImages) && productImages[0]) return String(productImages[0]);
  return '/placeholder-product.svg';
}

function orderItemProductHref(item: any) {
  const slug = String(item?.productSlug || item?.slug || item?.product?.slug || '').trim();
  if (!slug) return null;
  return `/shop/${encodeURIComponent(slug)}`;
}

async function enrichOrdersWithProductSlugs(orders: any[]) {
  const productIds = [
    ...new Set(
      orders.flatMap((order) => (order.items || []).map((item: any) => String(item?.productId || '').trim()).filter(Boolean)),
    ),
  ];
  if (!productIds.length) return orders;

  let slugMap: Record<string, string> = {};
  try {
    const response = await fetch('/api/products/resolve-slugs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data?.slugs) slugMap = data.slugs;
  } catch {
    /* keep orders without slugs */
  }

  return orders.map((order) => ({
    ...order,
    items: (order.items || []).map((item: any) => {
      const productId = String(item?.productId || '').trim();
      const productSlug = String(item?.productSlug || item?.slug || slugMap[productId] || '').trim();
      return { ...item, productSlug };
    }),
  }));
}

function mergeOrderRecords(firestoreOrder: any | undefined, postgresOrder: any) {
  if (!firestoreOrder) return postgresOrder;
  const items = postgresOrder.items?.length ? postgresOrder.items : firestoreOrder.items;
  return {
    ...firestoreOrder,
    ...postgresOrder,
    items: (items || []).map((item: any, index: number) => {
      const fsItem = (firestoreOrder.items || [])[index] || (firestoreOrder.items || []).find((entry: any) => entry?.productId === item?.productId);
      return {
        ...fsItem,
        ...item,
        productId: item?.productId || fsItem?.productId,
        productSlug: String(item?.productSlug || fsItem?.productSlug || fsItem?.slug || '').trim(),
      };
    }),
  };
}

function OrderItemRow({ item, idx }: { item: any; idx: number }) {
  const href = orderItemProductHref(item);
  const className =
    'flex items-center gap-3 rounded-[14px] bg-[#F7F3F5] p-2.5 transition-colors duration-200 hover:bg-white';

  const body = (
    <>
      <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-[12px] border bg-white" style={{ borderColor: 'var(--color-border)' }}>
        <Image src={orderItemImage(item)} alt={orderItemName(item)} fill sizes="48px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[12px] font-bold leading-snug text-[var(--color-text-primary)]">{orderItemName(item)}</p>
        <p className="mt-1 text-[11px] font-semibold text-[var(--color-text-muted)]">
          {Number(item.quantity || 1)}ш · {formatPrice(Number(item.price || item.salePrice || 0) * Number(item.quantity || 1))}
        </p>
      </div>
      {href ? <ChevronRight size={16} className="shrink-0 text-[var(--color-brand)]" aria-hidden="true" /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${className} uj-pressable`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

function formatOrderDate(value: any) {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleString('mn-MN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function reviewToProduct(review: Review): Product {
  return {
    id: review.productId,
    slug: review.productSlug || review.productId,
    name_mn: review.productName || 'Бүтээгдэхүүн',
    name_en: review.productName || '',
    price: 0,
    salePrice: null,
    saleEndDate: null,
    category: 'other',
    images: review.imageUrls?.length ? review.imageUrls : ['/placeholder-product.svg'],
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

function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeStatus(status);
  const isDone = normalized === 'delivered';
  const isBad = normalized === 'cancelled';
  return (
    <span
      className="uj-status-badge rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
      style={{
        background: isBad ? 'var(--color-status-cancel-bg)' : isDone ? 'var(--color-status-done-bg)' : 'var(--color-brand-light)',
        color: isBad ? 'var(--color-status-cancel-text)' : isDone ? 'var(--color-status-done-text)' : 'var(--color-brand)',
      }}
    >
      {STATUS_LABELS[normalized] || status}
    </span>
  );
}

function MenuRow({
  href,
  icon: Icon,
  title,
  subtitle,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[58px] items-center justify-between gap-3 border-b py-3 uj-pressable"
      style={{ borderColor: 'var(--color-border)', textDecoration: 'none' }}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-brand-light)] text-[var(--color-brand)]">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block text-[14px] font-bold text-[var(--color-text-primary)]">{title}</span>
          {subtitle && <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-muted)]">{subtitle}</span>}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {badge !== undefined && badge > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand)] px-1.5 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
        <ChevronRight size={17} className="text-[var(--color-text-muted)]" />
      </span>
    </Link>
  );
}

function AccountContent() {
  const pathname = usePathname();
  const { user, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const { locale } = useLocale();
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderTab, setOrderTab] = useState<'active' | 'history'>('active');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const view: ViewMode = pathname.includes('/orders')
    ? 'orders'
    : pathname.includes('/reviews')
      ? 'reviews'
      : 'profile';

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setLoading(true);
    Promise.allSettled([
      getDocs(query(collection(db, 'orders'), where('userId', '==', user.uid))),
      authFetch('/api/orders/mine').then((res) => (res.ok ? res.json() : [])),
      getUserReviews(user.uid),
    ]).then(async ([orderResult, pgOrderResult, reviewResult]) => {
      if (!mounted) return;
      const merged = new Map<string, any>();
      if (orderResult.status === 'fulfilled') {
        orderResult.value.docs.forEach((doc) => {
          merged.set(doc.id, { id: doc.id, ...doc.data() });
        });
      }
      if (pgOrderResult.status === 'fulfilled' && Array.isArray(pgOrderResult.value)) {
        pgOrderResult.value.forEach((order: any) => {
          const existing = merged.get(order.id);
          merged.set(order.id, mergeOrderRecords(existing, order));
        });
      }
      const rows = Array.from(merged.values()).sort(
        (a: any, b: any) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0),
      );
      const enriched = await enrichOrdersWithProductSlugs(rows);
      if (!mounted) return;
      setOrders(enriched);
      if (reviewResult.status === 'fulfilled') setReviews(reviewResult.value);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [user]);

  const activeOrders = useMemo(() => orders.filter((order) => !['delivered', 'cancelled'].includes(normalizeStatus(order.status))), [orders]);
  const historyOrders = useMemo(() => orders.filter((order) => ['delivered', 'cancelled'].includes(normalizeStatus(order.status))), [orders]);
  const visibleOrders = orderTab === 'active' ? activeOrders : historyOrders;
  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrderIds((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const cancelOrder = async (order: any) => {
    if (!user) return;
    const confirmed = window.confirm('Энэ захиалгыг цуцлах уу? Цуцалсны дараа буцаах боломжгүй.');
    if (!confirmed) return;
    setCancellingId(order.id);
    try {
      const res = await authFetch(`/api/orders/${order.id}/cancel`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Захиалга цуцлахад алдаа гарлаа.');
      setOrders((prev) => prev.map((item) => (item.id === order.id ? { ...item, status: 'cancelled' } : item)));
      toast('Захиалга цуцлагдлаа.', 'success');
    } catch (error: any) {
      toast(error?.message || 'Захиалга цуцлахад алдаа гарлаа.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const isCancellable = (order: any) =>
    ['pending', 'confirmed'].includes(normalizeStatus(order.status)) && order.paymentStatus !== 'paid';

  const refreshReviews = async () => {
    if (!user) return;
    const next = await getUserReviews(user.uid).catch(() => []);
    setReviews(next);
  };

  const startEditReview = (review: Review) => {
    setEditingReviewId(review.id);
  };

  const deleteReview = async (review: Review) => {
    const confirmed = window.confirm('Энэ сэтгэгдлийг устгах уу?');
    if (!confirmed || !user) return;
    try {
      const res = await authFetch(`/api/reviews/${review.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Сэтгэгдэл устгахад алдаа гарлаа.');
      setReviews((prev) => prev.filter((item) => item.id !== review.id));
      toast('Сэтгэгдэл устгагдлаа.', 'success');
    } catch (error: any) {
      toast(error?.message || 'Сэтгэгдэл устгахад алдаа гарлаа.', 'error');
    }
  };

  if (!user) return null;

  const initial = (user.displayName || user.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <main className="luxury-shell uj-page mx-auto w-full max-w-xl px-4 pb-[104px] pt-2">
      {view === 'profile' && (
        <div className="space-y-4">
          <section className="rounded-[24px] border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-brand-light)] text-[20px] font-bold text-[var(--color-brand)]">
                {user.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-[20px] font-bold text-[var(--color-text-primary)]">{user.displayName || 'UJ хэрэглэгч'}</h1>
                  {isAdmin && <span className="rounded-full bg-[var(--color-brand-light)] px-2 py-1 text-[10px] font-bold text-[var(--color-brand)]">Админ</span>}
                </div>
                <p className="mt-1 truncate text-[12px] text-[var(--color-text-muted)]">{user.email}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[16px] border bg-[#F7F3F5] p-4 text-center" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[22px] font-bold">{orders.length}</p>
                <p className="mt-1 text-[11px] font-semibold text-[var(--color-text-muted)]">Нийт захиалга</p>
              </div>
              <div className="rounded-[16px] border bg-[#F7F3F5] p-4 text-center" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[22px] font-bold">{reviews.length}</p>
                <p className="mt-1 text-[11px] font-semibold text-[var(--color-text-muted)]">Сэтгэгдэл</p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border bg-white px-4" style={{ borderColor: 'var(--color-border)' }}>
            <MenuRow href="/profile/orders" icon={Package} title="Миний захиалгууд" subtitle={`${activeOrders.length} идэвхтэй захиалга`} badge={activeOrders.length} />
            <MenuRow href="/profile/reviews" icon={MessageCircle} title={locale === 'en' ? 'My reviews' : 'Миний сэтгэгдлүүд'} subtitle={`${reviews.length} ${locale === 'en' ? 'reviews' : 'сэтгэгдэл'}`} />
            <MenuRow href="/profile/settings" icon={Settings} title="Тохиргоо" subtitle="Нэр, и-мэйл, хаяг, Google холболт" />
            {isAdmin && <MenuRow href="/admin" icon={Shield} title="Admin самбар" subtitle="Захиалга, бүтээгдэхүүн, хэрэглэгч" />}
            <button
              type="button"
              onClick={() => signOut()}
              className="flex min-h-[58px] w-full items-center gap-3 py-3 text-left uj-pressable"
              style={{ color: 'var(--color-status-cancel-text)', background: 'transparent', border: 'none' }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--color-status-cancel-bg)]">
                <LogOut size={18} />
              </span>
              <span className="text-[14px] font-bold">Гарах</span>
            </button>
          </section>
        </div>
      )}

      {view === 'orders' && (
        <section className="space-y-5">
          <div className="flex items-start gap-3">
            <Link href="/profile" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white text-[var(--color-brand)]" style={{ borderColor: 'var(--color-border)', textDecoration: 'none' }}>
              <ChevronRight size={18} className="rotate-180" />
            </Link>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">Orders</p>
              <h1 className="mt-1 text-[26px] font-bold text-[var(--color-text-primary)]">Миний захиалгууд</h1>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-[18px] bg-[#F7F3F5] p-1">
            {(['active', 'history'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setOrderTab(tab)}
                className="h-11 rounded-[14px] text-[12px] font-bold transition-colors"
                style={{ background: orderTab === tab ? '#fff' : 'transparent', color: orderTab === tab ? 'var(--color-brand)' : 'var(--color-text-muted)', border: 'none', boxShadow: orderTab === tab ? 'var(--shadow-xs)' : 'none' }}
              >
                {tab === 'active' ? `Идэвхтэй · ${activeOrders.length}` : `Түүх · ${historyOrders.length}`}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-32 rounded-[22px] uj-shimmer" />)}</div>
          ) : visibleOrders.length ? (
            <div className="space-y-3">
              {visibleOrders.map((order, index) => (
                <article key={order.id} className="rounded-[22px] border bg-white p-4" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#F7F3F5] px-3 py-1 font-mono text-[12px] font-bold">{orderNumber(order, index)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-3 text-[13px] font-bold">{order.customerName || order.name || 'UJ хэрэглэгч'}</p>
                  {formatOrderDate(order.createdAt) && (
                    <p className="mt-1 text-[11px] font-semibold text-[var(--color-text-muted)]">{formatOrderDate(order.createdAt)}</p>
                  )}
                  <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{(order.items || []).length} бараа · {formatPrice(order.total || 0)}</p>
                  {(order.items || []).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {(expandedOrderIds[order.id] ? (order.items || []) : (order.items || []).slice(0, 3)).map((item: any, idx: number) => (
                        <OrderItemRow key={`${item.productId || orderItemName(item)}-${idx}`} item={item} idx={idx} />
                      ))}
                      {(order.items || []).length > 3 && (
                        <button
                          type="button"
                          onClick={() => toggleOrderExpanded(order.id)}
                          className="text-[11px] font-semibold text-[var(--color-brand)]"
                        >
                          {expandedOrderIds[order.id] ? 'Хураах' : `Бүгдийг харах (${(order.items || []).length})`}
                        </button>
                      )}
                    </div>
                  )}
                  {orderTab === 'active' && (
                    <OrderDeliveryTracker status={order.status} />
                  )}
                  {orderTab === 'history' && !['cancelled'].includes(normalizeStatus(order.status)) && (
                    <OrderDeliveryTracker status={order.status} />
                  )}
                  {orderTab === 'active' && isCancellable(order) && (
                    <button
                      type="button"
                      onClick={() => cancelOrder(order)}
                      disabled={cancellingId === order.id}
                      className="mt-3 h-10 w-full rounded-full bg-[var(--color-status-cancel-bg)] text-[12px] font-bold text-[var(--color-status-cancel-text)] disabled:opacity-50"
                    >
                      {cancellingId === order.id ? 'Цуцалж байна...' : 'Захиалга цуцлах'}
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border bg-white px-6 py-10 text-center" style={{ borderColor: 'var(--color-border)' }}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)]">
                <Package size={28} strokeWidth={1.6} />
              </div>
              <p className="mt-4 text-[15px] font-bold text-[var(--color-text-primary)]">
                {orderTab === 'active' ? 'Идэвхтэй захиалга алга' : 'Захиалгын түүх хоосон'}
              </p>
              <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">Одоогоор {orderTab === 'active' ? 'идэвхтэй' : 'дууссан'} захиалга бүртгэгдээгүй байна.</p>
              <Link href="/shop" className="mt-6 inline-flex h-11 items-center rounded-full bg-[var(--color-brand)] px-6 text-[13px] font-bold text-white" style={{ textDecoration: 'none' }}>Дэлгүүр үзэх</Link>
            </div>
          )}
        </section>
      )}

      {view === 'reviews' && (
        <section className="space-y-5">
          <div className="flex items-start gap-3">
            <Link href="/profile" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white text-[var(--color-brand)]" style={{ borderColor: 'var(--color-border)', textDecoration: 'none' }}>
              <ChevronRight size={18} className="rotate-180" />
            </Link>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">Reviews</p>
              <h1 className="mt-1 text-[26px] font-bold text-[var(--color-text-primary)]">Миний сэтгэгдлүүд</h1>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-40 rounded-[22px] uj-shimmer" />)}</div>
          ) : reviews.length ? reviews.map((review) => (
            <article key={review.id} className="rounded-[22px] border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
              {editingReviewId === review.id ? (
                <ReviewForm
                  product={reviewToProduct(review)}
                  review={review}
                  onSubmitted={async () => {
                    await refreshReviews();
                    setEditingReviewId(null);
                    toast('Сэтгэгдэл амжилттай шинэчлэгдлээ.', 'success');
                  }}
                  onCancel={() => setEditingReviewId(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-0.5 text-[var(--color-brand)]">
                      {Array.from({ length: review.rating || 5 }).map((_, index) => <Star key={index} size={14} fill="currentColor" />)}
                    </div>
                    <span className="rounded-full bg-[#F7F3F5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      {review.status === 'visible' ? 'Нийтлэгдсэн' : review.status === 'pending' ? 'Хүлээгдэж буй' : 'Нуугдсан'}
                    </span>
                  </div>
                  <p className="mt-3 text-[14px] leading-7 text-[var(--color-text-primary)]">{review.content || review.body}</p>
                  {(review.imageUrls || []).length > 0 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                      {(review.imageUrls || []).map((url, index) => (
                        <div key={`${url}-${index}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[#F7F3F5]">
                          <Image src={url} alt={review.productName || 'review'} fill sizes="80px" className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 text-[12px] font-semibold text-[var(--color-text-muted)]">{review.productName}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
                    <button type="button" onClick={() => startEditReview(review)} className="h-10 rounded-full border border-[var(--color-border)] px-5 text-[12px] font-bold text-[var(--color-brand)]">Засах</button>
                    <button type="button" onClick={() => deleteReview(review)} className="h-10 rounded-full bg-[var(--color-status-cancel-bg)] px-5 text-[12px] font-bold text-[var(--color-status-cancel-text)]">Устгах</button>
                  </div>
                </>
              )}
            </article>
          )) : (
            <div className="rounded-[22px] border bg-white px-6 py-10 text-center" style={{ borderColor: 'var(--color-border)' }}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)]">
                <MessageCircle size={28} strokeWidth={1.6} />
              </div>
              <p className="mt-4 text-[15px] font-bold">Сэтгэгдэл байхгүй</p>
              <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">Хүргэгдсэн захиалгаас сэтгэгдэл бичиж болно.</p>
            </div>
          )}
        </section>
      )}

    </main>
  );
}

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountContent />
    </AuthGuard>
  );
}
