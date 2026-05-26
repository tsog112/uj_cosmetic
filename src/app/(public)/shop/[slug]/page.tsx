'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Heart, Minus, Plus, ShoppingBag, Sparkles, Star, Truck, Zap } from 'lucide-react';
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

  const loadReviews = async (productId: string) => {
    setReviewsLoading(true);
    try {
      setReviews(await getProductReviews(productId));
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
          await loadReviews(nextProduct.id);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!user || !product) {
      setIsWishlisted(false);
      return;
    }
    getWishlistStatus(user.uid, product.id).then(setIsWishlisted).catch(() => {});
  }, [user, product]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

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
    <main className="pb-[122px]">
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
          <span className="text-[12px] font-bold text-[var(--color-brand-muted)]">{reviews.length} нийт</span>
        </div>
        <ReviewForm product={product} onSubmitted={() => loadReviews(product.id)} />
        {reviewsLoading ? (
          <div className="h-28 rounded-[24px] animate-shimmer" />
        ) : reviews.length ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
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
                    {review.imageUrls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative h-18 w-18 shrink-0 overflow-hidden rounded-[16px] bg-[var(--color-brand-secondary)]">
                        <Image src={url} alt={review.productName} fill className="object-cover" sizes="72px" />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
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
          <div className="grid grid-cols-2 gap-3">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}

      <div className="fixed bottom-[72px] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-white/90 px-4 py-3 backdrop-blur-xl">
        <div className="grid grid-cols-[104px_1fr_1fr] gap-2">
          <div className="flex items-center justify-between rounded-full bg-[var(--color-brand-bg)] p-1">
            <button onClick={() => setQuantity((prev) => Math.max(1, prev - 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-white" aria-label="Тоо хасах"><Minus size={15} /></button>
            <span className="text-sm font-extrabold">{quantity}</span>
            <button onClick={() => setQuantity((prev) => Math.min(purchaseLimit, prev + 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-white" aria-label="Тоо нэмэх"><Plus size={15} /></button>
          </div>
          <button onClick={handleAddToCart} disabled={!inStock} className="flex h-12 items-center justify-center gap-1 rounded-full bg-[var(--color-brand-secondary)] text-[12px] font-extrabold text-[var(--color-brand-text)] disabled:opacity-50">
            <ShoppingBag size={16} /> {isAdded ? 'Нэмэгдлээ' : 'Сагс'}
          </button>
          <button onClick={handleBuyNow} disabled={!inStock} className="h-12 rounded-full bg-[var(--color-brand-accent)] text-[12px] font-extrabold text-white disabled:opacity-50">
            Авах
          </button>
        </div>
      </div>
    </main>
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
