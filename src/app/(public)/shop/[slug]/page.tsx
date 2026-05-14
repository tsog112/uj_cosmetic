'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  addToWishlist, getProductBySlug, getProductReviews,
  getProductsByCategory, getWishlistStatus, incrementProductViews,
  removeFromWishlist,
} from '@/lib/services/firestoreService';
import { formatMongolianDate } from '@/lib/format';
import { formatPrice, getCategoryName, Product, Review } from '@/types';
import { useCart }    from '@/context/CartContext';
import { useAuth }    from '@/context/AuthContext';
import Accordion      from '@/components/ui/Accordion';
import ProductCard    from '@/components/ui/ProductCard';
import ReviewForm     from '@/components/ui/ReviewForm';

const RELATED_LIMIT      = 4;
const AUTO_SLIDE_MS      = 4200;
const ADDED_FEEDBACK_MS  = 2000;

function StarRating({ rating, total = 5 }: { rating: number; total?: number }) {
  return (
    <p className="whitespace-nowrap text-sm">
      <span className="text-rose-gold">{'★'.repeat(rating)}</span>
      <span className="text-border-light">{'★'.repeat(total - rating)}</span>
    </p>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug   = params.slug as string;
  const { addToCart, buyNow } = useCart();
  const { user }              = useAuth();

  const [product,        setProduct]        = useState<Product | null>(null);
  const [related,        setRelated]        = useState<Product[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(false);
  const [selectedImage,  setSelectedImage]  = useState(0);
  const [isAdded,        setIsAdded]        = useState(false);
  const [reviews,        setReviews]        = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isWishlisted,   setIsWishlisted]   = useState(false);
  const [wishlistLoading,setWishlistLoading]= useState(false);

  /* ── Load product ────────────────────────────────────────────────────── */
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
      .then(async p => {
        setProduct(p);
        setSelectedImage(0);
        if (p) {
          incrementProductViews(p.id).catch(() => {});
          const related = await getProductsByCategory(p.category);
          setRelated(related.filter(r => r.id !== p.id).slice(0, RELATED_LIMIT));
          await loadReviews(p.id);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!user || !product) { setIsWishlisted(false); return; }
    getWishlistStatus(user.uid, product.id).then(setIsWishlisted).catch(() => {});
  }, [user, product]);

  /* ── Auto-slideshow ──────────────────────────────────────────────────── */
  useEffect(() => {
    const count = product?.images?.length ?? 0;
    if (count < 2) return;
    const timer = window.setInterval(
      () => setSelectedImage(prev => (prev + 1) % count),
      AUTO_SLIDE_MS,
    );
    return () => window.clearInterval(timer);
  }, [product?.id, product?.images?.length]);

  /* ── Loading skeleton ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10 md:py-20">
        <div className="grid animate-pulse grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="aspect-[4/5] bg-blush" />
          <div>
            <div className="mb-5 h-4 w-24 bg-blush" />
            <div className="mb-4 h-8 w-full bg-blush" />
            <div className="mb-8 h-6 w-32 bg-blush" />
            <div className="mb-8 h-20 w-full bg-blush" />
            <div className="h-12 w-full bg-blush" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-20 text-center lg:px-10">
        <h1 className="font-serif text-3xl text-charcoal mb-4">Бүтээгдэхүүн олдсонгүй</h1>
        <p className="text-text-muted text-sm mb-8">Уучлаарай, энэ бүтээгдэхүүн олдсонгүй.</p>
        <Link
          href="/shop"
          className="inline-flex min-h-11 items-center justify-center border border-border-light bg-white px-5 text-sm font-semibold text-charcoal transition-colors hover:bg-blush"
        >
          Дэлгүүр рүү буцах
        </Link>
      </div>
    );
  }

  /* ── Derived values ──────────────────────────────────────────────────── */
  const name            = product.name_mn ?? 'Нэргүй бараа';
  const price           = product.price ?? 0;
  const salePrice       = product.salePrice;
  const displayPrice    = salePrice ?? price;
  const rawImages       = product.images ?? [];
  const images          = rawImages.length > 0 ? rawImages : ['/placeholder-product.svg'];
  const stockQuantity   = Number(product.stockQuantity ?? (product.inStock === false ? 0 : 999));
  const inStock         = product.inStock !== false && stockQuantity > 0;
  const averageRating   = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  /* ── Handlers ────────────────────────────────────────────────────────── */
  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), ADDED_FEEDBACK_MS);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    buyNow({ product, quantity: 1 });
  };

  const handleWishlist = async () => {
    if (!user) { router.push('/auth'); return; }
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
    <div>
      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1400px] px-6 pb-4 pt-8 lg:px-10">
        <nav className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/"     className="transition-colors hover:text-charcoal">Нүүр</Link>
          <span>/</span>
          <Link href="/shop" className="transition-colors hover:text-charcoal">Дэлгүүр</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category}`} className="transition-colors hover:text-charcoal">
            {getCategoryName(product.category)}
          </Link>
          <span>/</span>
          <span className="text-charcoal">{name}</span>
        </nav>
      </div>

      {/* ── Product Detail ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1400px] px-6 py-8 md:py-12 lg:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">

          {/* Left: gallery */}
          <div>
            <div className="relative mb-4 aspect-[4/5] overflow-hidden bg-blush">
              {images[selectedImage] && (
                <Image
                  src={images[selectedImage]}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              )}
              {!inStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-charcoal/40">
                  <span className="bg-charcoal text-white text-sm font-bold px-4 py-2 uppercase tracking-wider">
                    Дуусжээ
                  </span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative aspect-square overflow-hidden bg-blush transition-all ${
                      selectedImage === i
                        ? 'ring-1 ring-dusty-rose ring-offset-2 ring-offset-sand'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`${name} ${i + 1}`} fill className="object-cover" sizes="120px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: info */}
          <div className="lg:pt-4">
            <p className="mb-5 inline-block border border-border px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-text-muted">
              UJ Cosmetic
            </p>
            <h1 className="mb-4 font-serif text-3xl leading-tight text-charcoal md:text-4xl">{name}</h1>

            {/* Price */}
            <div className="mb-8 flex items-center gap-3">
              {salePrice ? (
                <>
                  <span className="text-2xl font-medium text-dusty-rose">{formatPrice(displayPrice)}</span>
                  <span className="text-lg text-text-muted line-through">{formatPrice(price)}</span>
                </>
              ) : (
                <span className="text-2xl font-medium text-charcoal">{formatPrice(price)}</span>
              )}
            </div>

            <p className="mb-8 max-w-[500px] text-sm leading-relaxed text-text-muted">
              {product.description_mn}
            </p>

            {inStock && stockQuantity <= 5 && (
              <p className="mb-6 text-sm font-medium text-dusty-rose">
                Нөөц: {stockQuantity} ширхэг үлдлээ
              </p>
            )}

            {/* Key ingredients */}
            <div className="mb-8 border-thin-b pb-8">
              <p className="mb-2 text-xs uppercase tracking-[0.1em] text-text-muted">Гол найрлага</p>
              <p className="text-sm text-charcoal">
                {product.ingredients?.split(',').slice(0, 3).join(', ')}
              </p>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                id="add-to-cart-button"
                className={`w-full py-4 text-sm font-semibold transition-all duration-300 ${
                  !inStock
                    ? 'cursor-not-allowed bg-blush text-text-muted'
                    : isAdded
                      ? 'bg-charcoal text-white'
                      : 'bg-dusty-rose text-white hover:bg-charcoal'
                }`}
              >
                {!inStock ? 'Дууссан' : isAdded ? 'Сагсанд нэмэгдлээ ✓' : 'Сагсанд хийх'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!inStock}
                className="w-full border border-charcoal bg-charcoal py-4 text-sm font-semibold text-white transition-colors duration-200 hover:border-dusty-rose hover:bg-dusty-rose disabled:cursor-not-allowed disabled:border-blush disabled:bg-blush disabled:text-text-muted"
              >
                Шууд авах
              </button>

              <button
                onClick={handleWishlist}
                disabled={wishlistLoading}
                className={`w-full border border-border-light py-4 text-sm font-semibold transition-colors duration-200 ${
                  isWishlisted
                    ? 'bg-blush text-dusty-rose'
                    : 'bg-white text-charcoal hover:bg-blush'
                }`}
              >
                {isWishlisted ? '♥ Дуртайд хадгалсан' : '♡ Дуртайд хадгалах'}
              </button>
            </div>

            <div className="mt-10 border-thin-t">
              <Accordion title="Хэрхэн хэрэглэх">
                <p>{product.howToUse}</p>
              </Accordion>
              <Accordion title="Найрлага">
                <p>{product.ingredients}</p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reviews ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] border-thin-t px-6 py-16 md:py-24 lg:px-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-label">Review</p>
            <h2 className="mt-1 font-serif text-3xl text-charcoal md:text-4xl">Хэрэглэгчийн сэтгэгдэл</h2>
          </div>
          <div className="text-left md:text-right">
            <StarRating rating={Math.round(averageRating)} />
            <p className="mt-1 text-sm text-text-subtle">
              {reviews.length > 0
                ? `${averageRating.toFixed(1)} / 5 · ${reviews.length} сэтгэгдэл`
                : 'Одоогоор сэтгэгдэл байхгүй'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]">
          <ReviewForm product={product} onSubmitted={() => loadReviews(product.id)} />

          <div>
            {reviewsLoading ? (
              <div className="grid gap-4">
                {[1, 2].map(i => <div key={i} className="h-40 animate-pulse bg-blush" />)}
              </div>
            ) : reviews.length > 0 ? (
              <div className="grid gap-4">
                {reviews.map(review => (
                  <article key={review.id} className="border border-border bg-white p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-charcoal">{review.userName || 'UJ хэрэглэгч'}</p>
                        <p className="mt-1 text-xs text-text-subtle">{formatMongolianDate(review.createdAt)}</p>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-text-muted">{review.content}</p>

                    {review.imageUrls.length > 0 && (
                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {review.imageUrls.slice(0, 4).map((url, i) => (
                          <a
                            key={`${review.id}-${url}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square overflow-hidden bg-blush"
                          >
                            <Image
                              src={url}
                              alt={`${review.productName} review ${i + 1}`}
                              fill
                              className="object-cover transition-transform duration-500 hover:scale-105"
                              sizes="(max-width: 640px) 50vw, 140px"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center border border-dashed border-dusty-rose/50 bg-sand p-8 text-center">
                <div>
                  <p className="font-serif text-2xl text-charcoal">Анхны сэтгэгдлийг үлдээгээрэй</p>
                  <p className="mt-2 text-sm text-text-muted">
                    Бүтээгдэхүүн хэрэглэсэн зураг, мэдрэмжээ бусадтай хуваалцаарай.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Related Products ──────────────────────────────────────────────── */}
      {related.length > 0 && (
        <div className="mx-auto max-w-[1400px] border-thin-t px-6 py-16 md:py-24 lg:px-10">
          <div className="mb-12 text-center">
            <p className="section-label">Төстэй бүтээгдэхүүн</p>
            <h2 className="mt-3 font-serif text-3xl text-charcoal md:text-4xl">Танд таалагдаж магадгүй</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
