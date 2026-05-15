'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  deleteReview,
  getUserReviews,
  getUserWishlist,
  removeFromWishlist,
  updateUserReview,
} from '@/lib/services/firestoreService';
import { uploadProductImage } from '@/lib/uploadImage';
import { formatMongolianDateTime } from '@/lib/format';
import { formatPrice, Review, WishlistItem } from '@/types';
import AuthGuard from '@/components/ui/AuthGuard';

type AccountTab = 'orders' | 'wishlist' | 'reviews';

const statusLabels: Record<string, string> = {
  pending: 'Хүлээгдэж байна',
  confirmed: 'Баталгаажсан',
  shipped: 'Хүргэлтэнд гарсан',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
};

function formatDate(date: any) {
  return formatMongolianDateTime(date);
}

function AccountContent() {
  const { user, isAdmin, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AccountTab>('orders');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [editUploading, setEditUploading] = useState(false);

  useEffect(() => {
    const fetchAccountData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));

        // Fetch each data source independently to avoid one failure breaking everything
        const fetchOrders = async () => {
          try {
            const snap = await getDocs(ordersQuery);
            setOrders(
              snap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a: any, b: any) => {
                  const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt ? new Date(a.createdAt) : new Date(0);
                  const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt ? new Date(b.createdAt) : new Date(0);
                  return bDate.getTime() - aDate.getTime();
                })
            );
          } catch (err) {
            console.error('Error fetching orders:', err);
          }
        };

        const fetchReviews = async () => {
          try {
            const data = await getUserReviews(user.uid);
            setReviews(data);
          } catch (err) {
            console.error('Error fetching reviews:', err);
          }
        };

        const fetchWishlist = async () => {
          try {
            const data = await getUserWishlist(user.uid);
            setWishlist(data);
          } catch (err) {
            console.error('Error fetching wishlist:', err);
          }
        };

        await Promise.allSettled([
          fetchOrders(),
          fetchReviews(),
          fetchWishlist()
        ]);

      } catch (error) {
        console.error('Error in account data orchestration:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [user]);

  const summary = useMemo(() => ({
    orders: orders.length,
    wishlist: wishlist.length,
    reviews: reviews.length,
  }), [orders.length, wishlist.length, reviews.length]);

  if (!user) return null;

  const startEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditContent(review.content);
    setEditRating(review.rating);
    setEditImageUrls(review.imageUrls);
  };

  const saveReviewEdit = async (review: Review) => {
    await updateUserReview(review.id, {
      rating: editRating,
      content: editContent.trim(),
      imageUrls: editImageUrls,
    });
    setReviews(prev => prev.map(item => item.id === review.id ? { ...item, rating: editRating, content: editContent.trim(), imageUrls: editImageUrls } : item));
    setEditingReviewId(null);
  };

  const handleEditImageUpload = async (files: FileList | null) => {
    if (!files || !editingReviewId) return;
    const selected = Array.from(files).filter(file => file.type.startsWith('image/')).slice(0, 4 - editImageUrls.length);
    if (selected.length === 0) return;

    setEditUploading(true);
    try {
      const urls = await Promise.all(selected.map(file => uploadProductImage(file, `review-edit-${editingReviewId}`)));
      setEditImageUrls(prev => [...prev, ...urls].slice(0, 4));
    } finally {
      setEditUploading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Энэ сэтгэгдлийг устгах уу?')) return;
    await deleteReview(reviewId);
    setReviews(prev => prev.filter(item => item.id !== reviewId));
  };

  const handleRemoveWishlist = async (productId: string) => {
    await removeFromWishlist(user.uid, productId);
    setWishlist(prev => prev.filter(item => item.productId !== productId));
  };

  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-14 pt-24 sm:px-6 lg:px-10 md:py-20">
      <div className="mb-8 md:mb-12">
        <p className="text-[11px] tracking-[0.18em] uppercase text-text-subtle">My account</p>
        <h1 className="mt-2 font-serif text-4xl text-charcoal md:text-5xl">Миний бүртгэл</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:gap-10">
        <aside>
          <div className="rounded-2xl border border-border-light/45 bg-white p-5 shadow-[0_10px_30px_rgba(216,148,172,0.08)] lg:sticky lg:top-[120px]">
            <div className="flex items-center gap-4 lg:block lg:text-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-border-light/50 bg-blush text-3xl font-medium text-charcoal lg:mx-auto lg:mb-4">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Profile'} className="h-full w-full object-cover" />
                ) : (
                  (user.displayName || user.email || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-medium text-charcoal">{user.displayName || 'UJ хэрэглэгч'}</h2>
                <p className="mt-1 break-all text-sm text-text-subtle">{user.email}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                ['Захиалга', summary.orders],
                ['Дуртай', summary.wishlist],
                ['Сэтгэгдэл', summary.reviews],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[10px] bg-sand p-3 text-center">
                  <p className="text-xl font-semibold text-charcoal">{value}</p>
                  <p className="mt-1 text-[11px] text-text-subtle">{label}</p>
                </div>
              ))}
            </div>

            {isAdmin && (
              <Link
                href="/admin"
                className="btn-primary mt-5 min-h-12 w-full px-4 text-sm"
              >
                Админ самбар руу орох
              </Link>
            )}

            <button
              onClick={() => signOut()}
              className="btn-secondary mt-3 min-h-12 w-full bg-sand text-sm"
            >
              Гарах
            </button>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 grid grid-cols-3 gap-2 rounded-full bg-blush p-1">
            {[
              { value: 'orders', label: 'Захиалга' },
              { value: 'wishlist', label: 'Дуртай' },
              { value: 'reviews', label: 'Сэтгэгдэл' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as AccountTab)}
                className={`min-h-11 rounded-[10px] text-sm font-medium transition-colors ${
                  activeTab === tab.value ? 'bg-white text-charcoal shadow-sm' : 'text-text-subtle'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(item => <div key={item} className="h-40 animate-pulse bg-blush" />)}
            </div>
          ) : (
            <>
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <EmptyState title="Захиалга алга байна" href="/shop" label="Дэлгүүр үзэх" />
                  ) : orders.map(order => (
                    <article key={order.id} className="rounded-2xl border border-border-light/45 bg-white p-4 md:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-light/30 pb-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-text-subtle">Захиалгын дугаар</p>
                          <p className="mt-1 font-medium text-charcoal">#{order.id.slice(0, 10)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-text-subtle">Огноо</p>
                          <p className="mt-1 text-sm text-charcoal">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className="rounded-[999px] border border-border-light/60 bg-sand px-3 py-1.5 text-xs font-semibold text-text-subtle">
                          {statusLabels[order.status] || order.status}
                        </span>
                        <p className="font-medium text-[#D86FA0]">{formatPrice(order.total || 0)}</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {order.items?.map((item: any, idx: number) => {
                          const itemName = item.name_mn || item.name || 'Бүтээгдэхүүн';
                          const itemImage = item.imageUrl || item.productImage || item.image || '/placeholder-product.svg';

                          return (
                            <div key={`${order.id}-${idx}`} className="grid grid-cols-[54px_1fr_auto] items-center gap-3 rounded-full bg-sand p-2 text-sm">
                              <div className="relative aspect-square overflow-hidden rounded-[10px] bg-blush">
                                <Image src={itemImage} alt={itemName} fill className="object-cover" sizes="54px" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-charcoal">{itemName}</p>
                                <p className="mt-1 text-xs text-text-subtle">× {item.quantity || 1} ширхэг</p>
                              </div>
                              <span className="whitespace-nowrap font-medium text-charcoal">
                                {formatPrice((item.price || 0) * (item.quantity || 1))}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {wishlist.length === 0 ? (
                    <div className="md:col-span-2">
                      <EmptyState title="Дуртай бүтээгдэхүүн алга байна" href="/shop" label="Бүтээгдэхүүн үзэх" />
                    </div>
                  ) : wishlist.map(item => (
                    <article key={item.id} className="grid grid-cols-[96px_1fr] gap-4 border border-border-light/45 bg-white p-3">
                      <Link href={`/shop/${item.productSlug}`} className="relative aspect-square overflow-hidden bg-blush">
                        <Image src={item.productImage} alt={item.productName} fill className="object-cover" sizes="96px" />
                      </Link>
                      <div className="min-w-0">
                        <Link href={`/shop/${item.productSlug}`} className="line-clamp-2 font-medium text-charcoal hover:underline">
                          {item.productName}
                        </Link>
                        <p className="mt-2 text-sm font-medium text-[#D86FA0]">
                          {formatPrice(item.salePrice ?? item.price)}
                        </p>
                        <div className="mt-4 flex gap-2">
                          <Link href={`/shop/${item.productSlug}`} className="btn-primary min-h-10 flex-1 px-3 text-xs">
                            Шууд авах
                          </Link>
                          <button
                            onClick={() => handleRemoveWishlist(item.productId)}
                            className="btn-secondary min-h-10 px-3 text-xs text-text-muted"
                          >
                            Хасах
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <EmptyState title="Бичсэн сэтгэгдэл алга байна" href="/shop" label="Бүтээгдэхүүн үзэх" />
                  ) : reviews.map(review => (
                    <article key={review.id} className="rounded-2xl border border-border-light/45 bg-white p-4 md:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link href={`/shop/${review.productSlug}`} className="font-medium text-charcoal hover:underline">
                            {review.productName}
                          </Link>
                          <p className="mt-1 text-xs text-text-subtle">{formatDate(review.createdAt)}</p>
                        </div>
                        <span className="rounded-[999px] border border-border-light/50 bg-sand px-3 py-1.5 text-[11px] font-semibold text-text-subtle">
                          {review.approved ? 'Нийтлэгдсэн' : 'Нуусан'}
                        </span>
                      </div>

                      {editingReviewId === review.id ? (
                        <div className="mt-4">
                          <div className="mb-3 flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditRating(star)}
                                className={`text-2xl ${star <= editRating ? 'text-[#D894AC]' : 'text-[#E9D7DF]'}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={editContent}
                            onChange={(event) => setEditContent(event.target.value)}
                            rows={4}
                            className="w-full border border-border-light/60 bg-sand px-4 py-3 text-sm outline-none focus:border-dusty-rose"
                          />
                          {editImageUrls.length > 0 && (
                            <div className="mt-3 grid grid-cols-4 gap-2">
                              {editImageUrls.map(imageUrl => (
                                <div key={imageUrl} className="relative aspect-square overflow-hidden bg-blush">
                                  <Image src={imageUrl} alt={review.productName} fill className="object-cover" sizes="100px" />
                                  <button
                                    type="button"
                                    onClick={() => setEditImageUrls(prev => prev.filter(url => url !== imageUrl))}
                                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-white/90 text-sm"
                                    aria-label="Зураг хасах"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[9px] border border-border-light px-4 text-xs font-semibold text-text-muted hover:bg-blush">
                            {editUploading ? 'Зураг оруулж байна...' : 'Зураг нэмэх'}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={editUploading || editImageUrls.length >= 4}
                              onChange={(event) => handleEditImageUpload(event.target.files)}
                              className="sr-only"
                            />
                          </label>
                          <div className="mt-3 flex gap-2">
                            <button onClick={() => saveReviewEdit(review)} disabled={editUploading} className="min-h-10 rounded-[9px] bg-[#241820] px-4 text-xs font-semibold text-white disabled:opacity-50">
                              Хадгалах
                            </button>
                            <button onClick={() => setEditingReviewId(null)} className="min-h-10 rounded-[9px] border border-border-light px-4 text-xs font-semibold hover:bg-blush">
                              Болих
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mt-3 text-sm text-[#D894AC]">
                            {'★'.repeat(review.rating)}<span className="text-[#E9D7DF]">{'★'.repeat(5 - review.rating)}</span>
                          </p>
                          <p className="mt-3 text-sm leading-7 text-[#4A3A40]">{review.content}</p>
                          {review.imageUrls.length > 0 && (
                            <div className="mt-4 grid grid-cols-4 gap-2">
                              {review.imageUrls.slice(0, 4).map(imageUrl => (
                                <a key={imageUrl} href={imageUrl} target="_blank" rel="noopener noreferrer" className="relative aspect-square overflow-hidden bg-blush">
                                  <Image src={imageUrl} alt={review.productName} fill className="object-cover" sizes="100px" />
                                </a>
                              ))}
                            </div>
                          )}
                          <div className="mt-4 flex gap-2">
                            <button onClick={() => startEditReview(review)} className="min-h-10 rounded-[9px] border border-border-light px-4 text-xs font-semibold hover:bg-blush">
                              Засах
                            </button>
                            <button onClick={() => handleDeleteReview(review.id)} className="min-h-10 rounded-[9px] border border-red-200 bg-red-50 px-4 text-xs font-semibold text-red-700">
                              Устгах
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyState({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-light/70 bg-white p-8 text-center">
      <p className="font-serif text-2xl text-charcoal">{title}</p>
      <Link href={href} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[10px] border border-border-light px-5 text-sm font-semibold text-charcoal hover:bg-blush">
        {label}
      </Link>
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
