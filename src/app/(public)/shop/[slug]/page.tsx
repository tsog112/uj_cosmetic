'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, BadgeCheck, CheckCircle2, Clock, Heart, Lock, Minus, Plus, ShoppingBag, Sparkles, Star, Truck, Zap, X } from 'lucide-react';
import {
  addToWishlist,
  getProductBySlug,
  getProductReviews,
  getProductsByCategory,
  getWishlistStatus,
  incrementProductViews,
  removeFromWishlist,
} from '@/lib/services/firestoreService';
import { formatMongolianDate } from '@/lib/format';
import { formatPrice, getCategoryName, Product, Review } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import ReviewForm from '@/components/ui/ReviewForm';
import ProductCard from '@/components/ui/ProductCard';

const RELATED_LIMIT = 4;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-[#E6A0BE]">
      {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={15} fill={index < rating ? 'currentColor' : 'none'} />)}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addToCart, buyNow } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);
  const [reviewStats, setReviewStats] = useState<{ averageRating: number; starBreakdown: Record<string, number> }>({ averageRating: 0, starBreakdown: {} });
  const [reviewSort, setReviewSort] = useState('newest');
  const [eligibility, setEligibility] = useState<any>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const loadReviews = async (productId: string, pageNumber: number) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/reviews?productId=${productId}&page=${pageNumber}&limit=4&sort=${reviewSort}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReviews(data.reviews || []);
      setTotalReviewPages(data.totalPages || 1);
      setTotalReviewsCount(data.totalCount || 0);
      setReviewStats({ averageRating: Number(data.averageRating || 0), starBreakdown: data.starBreakdown || {} });
    } catch (err) {
      console.error('Failed to load product reviews:', err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(false);
    getProductBySlug(slug)
      .then(async (nextProduct) => {
        setProduct(nextProduct);
        setSelectedImage(0);
        setQuantity(1);
        if (nextProduct) {
          incrementProductViews(nextProduct.id).catch(() => {});
          const relatedProducts = await getProductsByCategory(nextProduct.category);
          setRelated(relatedProducts.filter((item) => item.id !== nextProduct.id).slice(0, RELATED_LIMIT));
          setReviewPage(1);
          await loadReviews(nextProduct.id, 1);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (product) {
      void loadReviews(product.id, reviewPage);
    }
  }, [reviewPage, reviewSort]);

  useEffect(() => {
    if (!product || !user) {
      setEligibility(null);
      return;
    }
    const reviewOrderId = searchParams.get('reviewOrderId') || '';
    setEligibilityLoading(true);
    fetch(`/api/reviews/eligibility?productId=${encodeURIComponent(product.id)}&userId=${encodeURIComponent(user.uid)}${reviewOrderId ? `&reviewOrderId=${encodeURIComponent(reviewOrderId)}` : ''}`)
      .then((res) => res.json())
      .then(setEligibility)
      .catch(() => setEligibility(null))
      .finally(() => setEligibilityLoading(false));
  }, [product, user, searchParams]);

  useEffect(() => {
    if (!user || !product) {
      setIsWishlisted(false);
      return;
    }
    getWishlistStatus(user.uid, product.id).then(setIsWishlisted).catch(() => {});
  }, [user, product]);

  const averageRating = reviewStats.averageRating || 0;

  if (loading) {
    return (
      <main className="space-y-4 px-4 pb-[104px]">
        <div className="aspect-[4/5] rounded-[28px] animate-shimmer" />
        <div className="h-44 rounded-[28px] animate-shimmer" />
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="px-4 pb-[104px]">
        <section className="rounded-[30px] bg-white px-6 py-14 text-center shadow-[var(--shadow-mobile-card)]">
          <h1 className="text-2xl font-extrabold text-[var(--color-brand-text)]">Бүтээгдэхүүн олдсонгүй</h1>
          <p className="mt-2 text-[13px] text-[var(--color-brand-muted)]">Энэ бүтээгдэхүүн устсан эсвэл түр хаагдсан байна.</p>
          <Link href="/shop" className="mt-6 inline-flex h-12 items-center rounded-full bg-[var(--color-brand-accent)] px-6 text-sm font-extrabold text-white">Дэлгүүр рүү буцах</Link>
        </section>
      </main>
    );
  }

  const images = product.images?.length ? product.images : ['/placeholder-product.svg'];
  const price = product.price ?? 0;
  const salePrice = product.salePrice;
  const displayPrice = salePrice ?? price;
  const inStock = product.inStock !== false;
  const purchaseLimit = inStock ? 99 : 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(product, quantity);
    setIsAdded(true);
    window.setTimeout(() => setIsAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    buyNow({ product, quantity });
  };

  const handleWishlist = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(user.uid, product.id);
        setIsWishlisted(false);
      } else {
        await addToWishlist(user.uid, product);
        setIsWishlisted(true);
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <main className="pb-[122px] md:max-w-xl lg:max-w-2xl mx-auto md:mt-6">
      <section className="px-4">
        <div className="relative overflow-hidden rounded-b-[30px] bg-[var(--color-brand-secondary)]">
          <div className="relative aspect-[4/5]">
            <Image src={images[selectedImage]} alt={product.name_mn} fill className="object-cover" sizes="100vw" priority />
            <div
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur"
              style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--color-primary)' }}
            >
              {getCategoryName(product.category)}
            </div>
            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              aria-label={isWishlisted ? 'Хадгалснаас хасах' : 'Хадгалах'}
              aria-pressed={isWishlisted}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur transition-all duration-200"
              style={{
                background: isWishlisted ? 'rgba(217,63,85,0.16)' : 'rgba(255,255,255,0.92)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                color: isWishlisted ? '#D93F55' : 'var(--color-text-dark)',
                border: isWishlisted ? '1.5px solid rgba(217,63,85,0.30)' : '1.5px solid transparent',
                animation: isWishlisted ? 'heartPulse 0.4s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
              }}
            >
              <Heart
                size={20}
                fill={isWishlisted ? 'currentColor' : 'none'}
                strokeWidth={isWishlisted ? 0 : 1.8}
                style={{ transition: 'all 0.2s ease', opacity: wishlistLoading ? 0.5 : 1 }}
              />
            </button>
            {!inStock && <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-sm font-extrabold text-white">Дууссан</div>}
          </div>
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto hide-scrollbar">
            {images.map((image, index) => (
              <button key={`${image}-${index}`} onClick={() => setSelectedImage(index)} className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[16px] bg-[var(--color-brand-secondary)] ${selectedImage === index ? 'ring-2 ring-[var(--color-brand-accent)] ring-offset-2 ring-offset-[var(--color-brand-bg)]' : 'opacity-70'}`}>
                <Image src={image} alt={`${product.name_mn} ${index + 1}`} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 px-4 pt-4">
        <div className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-mobile-card)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">UJ Cosmetic</p>
              <h1 className="mt-2 text-[24px] font-extrabold leading-tight text-[var(--color-brand-text)]">{product.name_mn}</h1>
            </div>
            <div className="shrink-0 text-right">
              {salePrice && <p className="text-[12px] font-bold text-[var(--color-brand-muted)] line-through">{formatPrice(price)}</p>}
              <p className="text-[20px] font-extrabold text-[var(--color-brand-accent)]">{formatPrice(displayPrice)}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-[18px] bg-[var(--color-brand-bg)] p-3">
            <div className="flex items-center gap-2">
              <Stars rating={Math.round(averageRating)} />
              <span className="text-[12px] font-bold text-[var(--color-brand-muted)]">{reviews.length ? `${averageRating.toFixed(1)} (${reviews.length})` : 'Шинэ'}</span>
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${inStock ? 'bg-[var(--status-success-bg)] text-[var(--status-success)]' : 'bg-[var(--status-error-bg)] text-[var(--status-error)]'}`}>
              {inStock ? 'Бэлэн' : 'Дууссан'}
            </span>
          </div>

          {product.description_mn && <p className="mt-4 text-[13px] leading-7 text-[var(--color-brand-muted)]">{product.description_mn}</p>}

          <div className="mt-5 grid grid-cols-3 gap-2">
            <InfoPill icon={<Truck size={16} />} label="Хүргэлт" value="Админ баталгаажуулна" />
            <InfoPill icon={<Sparkles size={16} />} label="Арчилгаа" value="Өдөр тутам" />
            <InfoPill icon={<Zap size={16} />} label="Захиалга" value="Шууд авах" />
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-[var(--shadow-mobile-card)]">
          <h2 className="text-[15px] font-extrabold text-[var(--color-brand-text)]">Дэлгэрэнгүй</h2>
          <DetailRow title="Хэрэглэх заавар" value={product.howToUse || 'Мэдээлэл оруулаагүй'} />
          <DetailRow title="Найрлага" value={product.ingredients || 'Мэдээлэл оруулаагүй'} />
        </div>
      </section>

      <section className="mt-5 space-y-4 px-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">Reviews</p>
            <h2 className="mt-1 text-xl font-extrabold text-[var(--color-brand-text)]">Сэтгэгдэл</h2>
          </div>
          <span className="text-[12px] font-bold text-[var(--color-brand-muted)]">{totalReviewsCount} нийт</span>
        </div>
        <ReviewGate
          product={product}
          eligibility={eligibility}
          loading={eligibilityLoading}
          onAddToCart={handleAddToCart}
          onSubmitted={() => {
            setReviewPage(1);
            void loadReviews(product.id, 1);
            if (user) {
              void fetch(`/api/reviews/eligibility?productId=${encodeURIComponent(product.id)}&userId=${encodeURIComponent(user.uid)}`)
                .then((res) => res.json())
                .then(setEligibility)
                .catch(() => {});
            }
          }}
        />
        <ReviewStats stats={reviewStats} total={totalReviewsCount} sort={reviewSort} onSortChange={(value) => { setReviewSort(value); setReviewPage(1); }} />
        {reviewsLoading ? (
          <div className="h-28 rounded-[24px] animate-shimmer" />
        ) : reviews.length ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)] border border-[#fdf2f7]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-extrabold text-[var(--color-brand-text)]">{review.userName || 'UJ хэрэглэгч'}</p>
                    <p className="mt-1 text-[11px] text-[var(--color-brand-muted)]">{formatMongolianDate(review.createdAt)}</p>
                  </div>
                  <Stars rating={review.rating} />
                </div>
                <p className="mt-3 text-[13px] leading-6 text-[var(--color-brand-muted)]">{review.content}</p>
                {review.imageUrls.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto hide-scrollbar">
                    {review.imageUrls.map((url, idx) => (
                      <button 
                        key={`${url}-${idx}`} 
                        onClick={() => setActivePhoto(url)} 
                        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-[var(--color-brand-secondary)] border border-[#fbe1ed] shadow-sm transition-all duration-200 hover:scale-[1.04] active:scale-[0.96] hover:border-[var(--color-brand-accent)]"
                      >
                        <Image src={url} alt={review.productName} fill className="object-cover" sizes="56px" />
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}

            {/* Premium circular review pagination */}
            {totalReviewPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1.5 py-2">
                <button
                  onClick={() => {
                    if (reviewPage > 1) setReviewPage(prev => prev - 1);
                  }}
                  disabled={reviewPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f8dbe8] bg-white text-[12px] font-bold text-[var(--color-brand-text)] shadow-sm transition-all disabled:opacity-40 active:scale-95"
                >
                  &lt;
                </button>
                
                {Array.from({ length: totalReviewPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === reviewPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setReviewPage(pageNum)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold transition-all shadow-sm active:scale-95 ${
                        isActive
                          ? 'bg-gradient-to-r from-[var(--color-brand-accent)] to-[#d81b60] text-white shadow-[0_3px_10px_rgba(233,30,140,0.25)]'
                          : 'border border-[#f8dbe8] bg-white text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    if (reviewPage < totalReviewPages) setReviewPage(prev => prev + 1);
                  }}
                  disabled={reviewPage === totalReviewPages}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f8dbe8] bg-white text-[12px] font-bold text-[var(--color-brand-text)] shadow-sm transition-all disabled:opacity-40 active:scale-95"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[24px] bg-white p-8 text-center shadow-[var(--shadow-mobile-card)]">
            <p className="text-sm font-bold text-[var(--color-brand-muted)]">Одоогоор сэтгэгдэл алга</p>
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-6 px-4">
          <h2 className="mb-3 text-xl font-extrabold text-[var(--color-brand-text)]">Танд таалагдаж магадгүй</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}

      <div className="fixed bottom-[76px] left-1/2 z-40 w-[calc(100%-24px)] max-w-[400px] -translate-x-1/2 rounded-[24px] border border-[#f8dbe8]/80 bg-white/85 p-2 shadow-[0_12px_40px_rgba(233,30,140,0.15)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_16px_48px_rgba(233,30,140,0.18)]">
        <div className="grid grid-cols-[100px_1fr_1fr] gap-2">
          <div className="flex items-center justify-between rounded-full bg-[var(--color-brand-bg)] p-0.5 border border-[#fdf2f7]">
            <button onClick={() => setQuantity((prev) => Math.max(1, prev - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_2px_6px_rgba(233,30,140,0.06)] transition-transform active:scale-90" aria-label="Тоо хасах"><Minus size={13} className="text-[var(--color-brand-accent)]" /></button>
            <span className="text-[13px] font-extrabold text-[var(--color-brand-text)]">{quantity}</span>
            <button onClick={() => setQuantity((prev) => Math.min(purchaseLimit, prev + 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_2px_6px_rgba(233,30,140,0.06)] transition-transform active:scale-90" aria-label="Тоо нэмэх"><Plus size={13} className="text-[var(--color-brand-accent)]" /></button>
          </div>
          <button onClick={handleAddToCart} disabled={!inStock} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#fdf2f7] text-[12px] font-extrabold text-[var(--color-brand-accent)] border border-[#fbd3e5] transition-all duration-200 hover:bg-[#fae3ee] active:scale-[0.97] disabled:opacity-50">
            <ShoppingBag size={14} /> {isAdded ? 'Нэмэгдлээ' : 'Сагслах'}
          </button>
          <button onClick={handleBuyNow} disabled={!inStock} className="flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-brand-accent)] to-[#d81b60] text-[12px] font-extrabold text-white shadow-[0_4px_14px_rgba(233,30,140,0.25)] transition-all duration-200 hover:shadow-[0_6px_18px_rgba(233,30,140,0.35)] hover:scale-[1.01] active:scale-[0.97] disabled:opacity-50">
            Захиалах
          </button>
        </div>
      </div>

      {/* Glassmorphic Lightbox Overlay for Product Reviews */}
      {activePhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-all duration-300 animate-fadeIn"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-[24px] bg-white/10 p-2 shadow-[0_24px_50px_rgba(0,0,0,0.5)] border border-white/20" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setActivePhoto(null)} 
              className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-charcoal shadow-md hover:bg-white active:scale-90 transition-all duration-200"
              aria-label="Хаах"
            >
              <X size={18} />
            </button>
            <div className="relative aspect-[4/5] w-[80vw] max-w-[400px]">
              <Image 
                src={activePhoto} 
                alt="Сэтгэгдлийн зураг" 
                fill 
                className="object-cover rounded-[18px]" 
                sizes="(max-width: 768px) 80vw, 400px"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ReviewGate({
  product,
  eligibility,
  loading,
  onAddToCart,
  onSubmitted,
}: {
  product: Product;
  eligibility: any;
  loading: boolean;
  onAddToCart: () => void;
  onSubmitted: () => void;
}) {
  if (loading) return <div className="h-32 rounded-[24px] animate-shimmer" />;

  if (!eligibility) {
    return (
      <div className="rounded-[26px] bg-white p-6 text-center shadow-[var(--shadow-mobile-card)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-bg)] text-[var(--color-brand-accent)]"><Lock size={20} /></div>
        <h3 className="mt-3 text-lg font-extrabold text-[var(--color-brand-text)]">Баталгаат худалдан авалт шаардлагатай</h3>
        <p className="mt-2 text-[13px] leading-6 text-[var(--color-brand-muted)]">Нэвтэрсэн хэрэглэгч хүргэгдсэн захиалга дээрээ сэтгэгдэл бичих боломжтой.</p>
      </div>
    );
  }

  if (eligibility.state === 'A') {
    return (
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--status-success-bg)] px-3 py-2 text-[12px] font-extrabold text-[var(--status-success)]">
          <BadgeCheck size={15} /> Баталгаат худалдан авалт
        </div>
        <ReviewForm product={product} orderId={eligibility.orderId} onSubmitted={onSubmitted} />
      </div>
    );
  }

  if (eligibility.state === 'F') {
    const resend = async () => {
      await fetch('/api/auth/request-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: eligibility.email }),
      });
    };
    return (
      <div className="rounded-[24px] bg-[var(--status-warning-bg)] p-5 text-[13px] font-bold leading-6 text-[var(--status-warning)]">
        <AlertCircle className="mb-3" size={18} />
        <p>{eligibility.message}</p>
        <button type="button" onClick={() => void resend()} className="mt-4 rounded-full bg-[var(--color-brand-accent)] px-4 py-2 text-[12px] font-extrabold text-white">
          Баталгаажуулах линк дахин илгээх
        </button>
      </div>
    );
  }

  if (eligibility.state === 'B') {
    const review = eligibility.existingReview;
    const canEdit = Number(review?.editCount || 0) < 1;
    return (
      <div className="rounded-[26px] bg-white p-5 shadow-[var(--shadow-mobile-card)]">
        <div className="flex items-center gap-2 text-[var(--status-success)]">
          <CheckCircle2 size={18} />
          <p className="text-[13px] font-extrabold">Сэтгэгдэл бичсэн</p>
        </div>
        <p className="mt-3 text-[13px] leading-6 text-[var(--color-brand-muted)]">{review?.content || review?.body || eligibility.message}</p>
        {canEdit ? (
          <div className="mt-4">
            <ReviewForm product={product} review={{ ...review, createdAt: new Date(review.createdAt || Date.now()), updatedAt: new Date(review.updatedAt || Date.now()) }} onSubmitted={onSubmitted} />
          </div>
        ) : (
          <p className="mt-3 rounded-[16px] bg-[var(--color-brand-bg)] p-3 text-[12px] font-bold text-[var(--color-brand-muted)]">Энэ сэтгэгдлийг нэг удаа зассан байна.</p>
        )}
      </div>
    );
  }

  if (eligibility.state === 'D') {
    return (
      <div className="rounded-[26px] bg-white p-5 shadow-[var(--shadow-mobile-card)]">
        <div className="flex items-center gap-2 text-[var(--status-info)]">
          <Clock size={18} />
          <p className="text-[13px] font-extrabold">Захиалга хүргэгдээгүй байна</p>
        </div>
        <p className="mt-2 text-[13px] leading-6 text-[var(--color-brand-muted)]">{eligibility.message}</p>
        <div className="mt-4 grid grid-cols-4 gap-1 text-center text-[9px] font-bold text-[var(--color-brand-muted)]">
          {['Төлбөр', 'Бэлтгэл', 'Хүргэлт', 'Хүрсэн'].map((step, index) => (
            <div key={step} className="rounded-full bg-[var(--color-brand-bg)] px-2 py-2">{index === 0 ? '● ' : ''}{step}</div>
          ))}
        </div>
      </div>
    );
  }

  if (eligibility.state === 'E') {
    return (
      <div className="rounded-[24px] bg-[var(--status-warning-bg)] p-5 text-[13px] font-bold leading-6 text-[var(--status-warning)]">
        <AlertCircle className="mb-2" size={18} /> {eligibility.message}
      </div>
    );
  }

  return (
    <div className="rounded-[26px] bg-white p-6 text-center shadow-[var(--shadow-mobile-card)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-bg)] text-[var(--color-brand-accent)]"><Lock size={20} /></div>
      <h3 className="mt-3 text-lg font-extrabold text-[var(--color-brand-text)]">Зөвхөн худалдан авсан хэрэглэгч</h3>
      <p className="mt-2 text-[13px] leading-6 text-[var(--color-brand-muted)]">{eligibility.message}</p>
      <button type="button" onClick={onAddToCart} className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-brand-accent)] px-5 text-[12px] font-extrabold text-white">
        Сагсанд нэмэх
      </button>
    </div>
  );
}

function ReviewStats({ stats, total, sort, onSortChange }: { stats: { averageRating: number; starBreakdown: Record<string, number> }; total: number; sort: string; onSortChange: (value: string) => void }) {
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-extrabold text-[var(--color-brand-text)]">{stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}</p>
          <p className="text-[11px] font-bold text-[var(--color-brand-muted)]">{total} баталгаат сэтгэгдэл</p>
        </div>
        <select value={sort} onChange={(event) => onSortChange(event.target.value)} className="h-10 rounded-full bg-[var(--color-brand-bg)] px-3 text-[12px] font-extrabold outline-none">
          <option value="newest">Шинэ → Хуучин</option>
          <option value="rating_desc">Өндөр үнэлгээ</option>
          <option value="rating_asc">Бага үнэлгээ</option>
        </select>
      </div>
      <div className="mt-4 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = Number(stats.starBreakdown?.[star] || 0);
          const width = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={star} className="grid grid-cols-[34px_1fr_28px] items-center gap-2 text-[11px] font-bold text-[var(--color-brand-muted)]">
              <span>{star}★</span>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-brand-bg)]">
                <div className="h-full rounded-full bg-[var(--color-brand-accent)]" style={{ width: `${width}%` }} />
              </div>
              <span className="text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[var(--color-brand-bg)] p-3">
      <div className="text-[var(--color-brand-accent)]">{icon}</div>
      <p className="mt-2 text-[10px] font-bold text-[var(--color-brand-muted)]">{label}</p>
      <p className="mt-1 text-[11px] font-extrabold leading-tight text-[var(--color-brand-text)]">{value}</p>
    </div>
  );
}

function DetailRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="mt-4 border-t border-[#f8dbe8] pt-4">
      <p className="text-[12px] font-extrabold text-[var(--color-brand-text)]">{title}</p>
      <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-[var(--color-brand-muted)]">{value}</p>
    </div>
  );
}
