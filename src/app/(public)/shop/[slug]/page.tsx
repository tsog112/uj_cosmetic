'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { BadgeCheck, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck } from 'lucide-react';
import {
  getProductBySlug,
  getProductsByCategory,
  incrementProductViews,
} from '@/lib/services/firestoreService';
import { formatPrice, getCategoryName, type Product, type Review } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/components/ui/Toast';
import { shopStickyFooterClass } from '@/lib/layout/shell';
import ProductCard from '@/components/ui/ProductCard';
import ReviewForm from '@/components/ui/ReviewForm';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-[var(--color-brand)]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={15} fill={index < rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
      ))}
    </div>
  );
}

function TrustRow() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: 'Жинхэнэ', Icon: BadgeCheck },
        { label: 'Нямбай', Icon: ShieldCheck },
        { label: 'Хүргэлт', Icon: Truck },
      ].map(({ label, Icon }) => (
        <div key={label} className="flex min-h-[70px] flex-col items-center justify-center rounded-[18px] border bg-white text-center" style={{ borderColor: 'var(--color-border)' }}>
          <Icon size={18} className="text-[var(--color-brand)]" strokeWidth={1.7} />
          <span className="mt-2 text-[11px] font-bold text-[var(--color-text-muted)]">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = String(params.slug || '');
  const { addToCart, buyNow } = useCart();
  const { user } = useAuth();
  const { isWishlisted: checkWishlisted, add: addWishlist, remove: removeWishlist } = useWishlist();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, total: 0 });
  const [eligibility, setEligibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    getProductBySlug(slug)
      .then(async (nextProduct) => {
        if (!active) return;
        if (!nextProduct) throw new Error('missing');
        setProduct(nextProduct);
        setSelectedImage(0);
        setQuantity(1);
        incrementProductViews(nextProduct.id).catch(() => {});
        getProductsByCategory(nextProduct.category)
          .then((items) => {
            if (!active) return;
            setRelated(items.filter((item) => item.id !== nextProduct.id).slice(0, 8));
          })
          .catch(() => {
            if (active) setRelated([]);
          });
        const { authFetch } = await import('@/lib/auth/clientFetch');
        const res = await authFetch(`/api/reviews?productId=${encodeURIComponent(nextProduct.id)}&limit=6&sort=newest`).catch(() => null);
        if (!active || !res?.ok) return;
        const data = await res.json();
        setReviews(data.reviews || []);
        setReviewStats({ averageRating: Number(data.averageRating || 0), total: Number(data.totalCount || 0) });
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!product?.id || !user?.uid) {
      setEligibility(null);
      return;
    }
    let active = true;
    const reviewOrderId = searchParams.get('reviewOrderId') || '';
    import('@/lib/auth/clientFetch')
      .then(({ authFetch }) =>
        authFetch(
          `/api/reviews/eligibility?productId=${encodeURIComponent(product.id)}${reviewOrderId ? `&reviewOrderId=${encodeURIComponent(reviewOrderId)}` : ''}`,
        ),
      )
      .then((res) => res.json())
      .then((data) => {
        if (active) setEligibility(data);
      })
      .catch(() => {
        if (active) setEligibility(null);
      });

    return () => {
      active = false;
    };
  }, [product?.id, user?.uid, searchParams]);

  const images = product?.images?.length ? product.images : ['/placeholder-product.svg'];
  const isWishlisted = product ? checkWishlisted(product.id) : false;
  const price = product?.price || 0;
  const salePrice = product?.salePrice;
  const displayPrice = salePrice ?? price;
  const inStock = product?.inStock !== false;
  const discountPct = salePrice && price ? Math.round((1 - salePrice / price) * 100) : 0;
  const averageRating = reviewStats.averageRating || 0;

  const reviewState = eligibility?.state;
  const canReview = reviewState === 'A';

  const moveImage = (direction: 1 | -1) => {
    setSelectedImage((current) => (current + direction + images.length) % images.length);
  };

  const handleWishlist = async () => {
    if (!product) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await removeWishlist(product.id);
      } else {
        await addWishlist(product);
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || !inStock) return;
    addToCart(product, quantity);
    toast('Сагсанд нэмэгдлээ', 'success');
  };

  const handleBuyNow = () => {
    if (!product || !inStock) return;
    buyNow({ product, quantity });
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-xl space-y-4 px-4 pb-[120px] pt-4">
        <div className="aspect-[4/5] rounded-[28px] uj-shimmer" />
        <div className="h-48 rounded-[24px] uj-shimmer" />
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="luxury-shell min-h-screen px-4 pb-[104px] pt-6">
        <section className="luxury-card mx-auto max-w-xl px-6 py-14 text-center">
          <h1 className="luxury-title text-[28px]">Бүтээгдэхүүн олдсонгүй</h1>
          <p className="mt-3 text-[13px] text-[var(--color-text-muted)]">Энэ бүтээгдэхүүн устсан эсвэл түр хаагдсан байна.</p>
          <Link href="/shop" className="mt-6 inline-flex h-12 items-center rounded-full bg-[var(--color-brand)] px-7 text-[13px] font-bold text-white" style={{ textDecoration: 'none' }}>
            Дэлгүүр рүү буцах
          </Link>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="luxury-shell min-h-screen pb-[142px]">
        <section className="mx-auto w-full max-w-xl px-4 pt-3">
        <div
          className="relative overflow-hidden rounded-[30px] bg-[#F7F3F5] uj-image-hover"
          onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => {
            if (touchStart === null) return;
            const delta = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
            if (Math.abs(delta) > 45) moveImage(delta < 0 ? 1 : -1);
            setTouchStart(null);
          }}
        >
          <div className="relative aspect-[4/5]">
            <Image src={images[selectedImage]} alt={product.name_mn} fill className="object-cover" sizes="100vw" priority />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/42 to-transparent" />
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-[var(--color-brand)] backdrop-blur">
              {getCategoryName(product.category)}
            </span>
            {discountPct > 0 && (
              <span className="absolute left-4 top-14 rounded-full bg-[var(--color-brand)] px-3 py-1.5 text-[11px] font-bold text-white">
                -{discountPct}%
              </span>
            )}
            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={`absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border bg-white/92 backdrop-blur ${isWishlisted ? 'uj-heart-on' : 'uj-heart-off'}`}
              style={{ borderColor: isWishlisted ? 'var(--color-brand-mid)' : 'transparent', color: isWishlisted ? 'var(--color-brand)' : 'var(--color-text-primary)' }}
              aria-label={isWishlisted ? 'Хадгалснаас хасах' : 'Хадгалах'}
            >
              <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {images.length > 1 && (
          <div className="uj-scroll-row mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                onClick={() => setSelectedImage(index)}
                className="relative h-17 w-17 shrink-0 overflow-hidden rounded-[18px] border bg-[#F7F3F5] uj-snap-start"
                style={{ borderColor: selectedImage === index ? 'var(--color-brand)' : 'var(--color-border)', opacity: selectedImage === index ? 1 : 0.62 }}
              >
                <Image src={image} alt={`${product.name_mn} ${index + 1}`} fill className="object-cover" sizes="68px" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto mt-4 w-full max-w-xl space-y-4 px-4">
        <article className="luxury-card p-5">
          <p className="luxury-eyebrow">UJ Cosmetic</p>
          <h1 className="luxury-title mt-2 text-[30px] text-[var(--color-text-primary)]">{product.name_mn}</h1>
          {product.name_en && <p className="mt-2 text-[12px] text-[var(--color-text-muted)]">{product.name_en}</p>}

          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              {salePrice && <p className="text-[13px] font-semibold text-[var(--color-text-muted)] line-through">{formatPrice(price)}</p>}
              <p className="text-[26px] font-bold text-[var(--color-brand)]">{formatPrice(displayPrice)}</p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${inStock ? 'bg-[var(--color-status-done-bg)] text-[var(--color-status-done-text)]' : 'bg-[var(--color-status-cancel-bg)] text-[var(--color-status-cancel-text)]'}`}>
              {inStock ? 'Бэлэн' : 'Дууссан'}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-[18px] bg-[#F7F3F5] px-4 py-3">
            <div className="flex items-center gap-2">
              <Stars rating={Math.round(averageRating)} />
              <span className="text-[12px] font-bold text-[var(--color-text-muted)]">{reviewStats.total ? `${averageRating.toFixed(1)} · ${reviewStats.total}` : 'Шинэ'}</span>
            </div>
            <span className="text-[11px] font-bold text-[var(--color-brand)]">K-beauty curated</span>
          </div>

          {product.description_mn && (
            <p className="mt-5 text-[13px] leading-7 text-[var(--color-text-secondary)]">{product.description_mn}</p>
          )}
        </article>

        <TrustRow />

        {(product.ingredients || product.howToUse) && (
          <article className="luxury-card divide-y p-5" style={{ borderColor: 'var(--color-border)' }}>
            {product.howToUse && (
              <div className="pb-4">
                <p className="luxury-eyebrow">How to use</p>
                <p className="mt-2 text-[13px] leading-7 text-[var(--color-text-secondary)]">{product.howToUse}</p>
              </div>
            )}
            {product.ingredients && (
              <div className="pt-4">
                <p className="luxury-eyebrow">Ingredients</p>
                <p className="mt-2 text-[13px] leading-7 text-[var(--color-text-secondary)]">{product.ingredients}</p>
              </div>
            )}
          </article>
        )}

        <section className="luxury-card p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="luxury-eyebrow">Reviews</p>
              <h2 className="luxury-title mt-1 text-[24px]">Бодит сэтгэгдэл</h2>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-bold text-[var(--color-brand)]">{averageRating ? averageRating.toFixed(1) : '0.0'}</p>
              <Stars rating={Math.round(averageRating)} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {reviews.length ? reviews.slice(0, 3).map((review) => (
              <article key={review.id} className="rounded-[18px] bg-[#F7F3F5] p-4">
                <Stars rating={review.rating} />
                <p className="mt-3 line-clamp-4 text-[13px] leading-6 text-[var(--color-text-primary)]">{review.content}</p>
                {review.adminReply ? (
                  <div className="mt-3 rounded-[14px] border border-[#F0E8ED] bg-white px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-brand)]">UJ хариулт</p>
                    <p className="mt-1 text-[12px] leading-5 text-[var(--color-text-primary)]">{review.adminReply}</p>
                  </div>
                ) : null}
                <p className="mt-3 text-[12px] font-bold text-[var(--color-text-muted)]">{review.userName || 'UJ хэрэглэгч'}</p>
              </article>
            )) : (
              <p className="rounded-[18px] bg-[#F7F3F5] p-5 text-center text-[13px] text-[var(--color-text-muted)]">Одоогоор сэтгэгдэл байхгүй байна.</p>
            )}
          </div>

          {canReview && (
            <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
              <ReviewForm product={product} onSubmitted={() => fetch(`/api/reviews?productId=${encodeURIComponent(product.id)}&limit=6`).then((res) => res.json()).then((data) => setReviews(data.reviews || [])).catch(() => {})} />
            </div>
          )}
        </section>

        {related.length > 0 && (
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="luxury-eyebrow">More care</p>
                <h2 className="luxury-title text-[24px]">Танд тохирох</h2>
              </div>
              <Link href="/shop" className="text-[12px] font-bold text-[var(--color-brand)]">Бүгдийг үзэх</Link>
            </div>
            <div className="uj-scroll-row flex gap-4 overflow-x-auto pb-2">
              {related.map((item) => <ProductCard key={item.id} product={item} compact />)}
            </div>
          </section>
        )}
      </section>
      </main>

      {mounted
        ? createPortal(
            <section className={`luxury-bottom-bar ${shopStickyFooterClass} px-4 pt-3`}>
              <div className="mx-auto grid max-w-xl grid-cols-[112px_1fr_1fr] gap-2 pb-3">
                <div className="flex h-13 min-h-13 items-center justify-between rounded-full border bg-white px-2" style={{ borderColor: 'var(--color-border)' }}>
                  <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F3F5]" aria-label="Тоо хасах"><Minus size={14} /></button>
                  <span className="text-[13px] font-bold">{quantity}</span>
                  <button onClick={() => setQuantity((value) => Math.min(99, value + 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F3F5]" aria-label="Тоо нэмэх"><Plus size={14} /></button>
                </div>
                <button onClick={handleAddToCart} disabled={!inStock} className="h-13 min-h-13 rounded-full border text-[13px] font-bold text-[var(--color-brand)] disabled:opacity-50 uj-pressable" style={{ borderColor: 'var(--color-brand-mid)' }}>
                  Сагсанд
                </button>
                <button onClick={handleBuyNow} disabled={!inStock} className="h-13 min-h-13 rounded-full bg-[var(--color-brand)] text-[13px] font-bold text-white disabled:opacity-50 uj-pressable">
                  Захиалах
                </button>
              </div>
            </section>,
            document.body,
          )
        : null}
    </>
  );
}
