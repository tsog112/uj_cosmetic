'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getProductBySlug, getProductReviews, getProductsByCategory, incrementProductViews } from '@/lib/services/firestoreService';
import { formatPrice, getCategoryName, Product, Review } from '@/types';
import { useCart } from '@/context/CartContext';
import Accordion from '@/components/ui/Accordion';
import ProductCard from '@/components/ui/ProductCard';
import ReviewForm from '@/components/ui/ReviewForm';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addToCart, buyNow } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const loadReviews = async (productId: string) => {
    setReviewsLoading(true);
    try {
      const productReviews = await getProductReviews(productId);
      setReviews(productReviews);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(false);
    getProductBySlug(slug)
      .then(async (p) => {
        setProduct(p);
        if (p) {
          // Increment views
          incrementProductViews(p.id).catch(() => {});
          // Fetch related
          const catProducts = await getProductsByCategory(p.category);
          setRelated(catProducts.filter(r => r.id !== p.id).slice(0, 4));
          await loadReviews(p.id);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 animate-pulse">
            <div className="aspect-[4/5] bg-cream-dark" />
          <div>
            <div className="h-4 bg-cream-dark w-24 mb-5" />
            <div className="h-8 bg-cream-dark w-full mb-4" />
            <div className="h-6 bg-cream-dark w-32 mb-8" />
            <div className="h-20 bg-cream-dark w-full mb-8" />
            <div className="h-12 bg-cream-dark w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 text-center">
        <h1 className="section-heading mb-4">Бүтээгдэхүүн олдсонгүй</h1>
        <p className="text-text-muted text-sm mb-8">
          Уучлаарай, энэ бүтээгдэхүүн олдсонгүй.
        </p>
        <Link href="/shop" className="btn-outline">
          Дэлгүүр рүү буцах
        </Link>
      </div>
    );
  }

  const name = product.name_mn ?? 'Нэргүй бараа';
  const price = product.price ?? 0;
  const salePrice = product.salePrice;
  const displayPrice = salePrice ?? price;
  const rawImages = product.images ?? [];
  const images = rawImages.length > 0 ? rawImages : ['/placeholder-product.svg'];
  const stockQuantity = Number(product.stockQuantity ?? (product.inStock === false ? 0 : 999));
  const isProductInStock = product.inStock !== false && stockQuantity > 0;
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const handleAddToCart = () => {
    if (!isProductInStock) return;
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!isProductInStock) return;
    buyNow({ product, quantity: 1 });
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-8 pb-4">
        <nav className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/" className="hover:text-text-primary transition-colors">Нүүр</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-text-primary transition-colors">Дэлгүүр</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category}`} className="hover:text-text-primary transition-colors">
            {getCategoryName(product.category)}
          </Link>
          <span>/</span>
          <span className="text-text-primary">{name}</span>
        </nav>
      </div>

      {/* Product Detail */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left: Image Gallery */}
          <div>
            <div className="relative mb-4 aspect-[4/5] overflow-hidden bg-cream-dark">
              {images[selectedImageIndex] && (
                <Image
                  src={images[selectedImageIndex]}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              )}
              {!isProductInStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-red-600 text-white text-sm font-bold px-4 py-2 uppercase tracking-wider">Дуусжээ</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square relative overflow-hidden bg-cream-dark transition-all ${
                      selectedImageIndex === index
                        ? 'ring-1 ring-accent ring-offset-2 ring-offset-cream'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`${name} ${index + 1}`} fill className="object-cover" sizes="120px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="lg:pt-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-text-muted border border-border inline-block px-3 py-1 mb-5">
              UJ Cosmetic
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-4 leading-tight">
              {name}
            </h1>

            {/* Price */}
            <div className="mb-8 flex items-center gap-3">
              {salePrice ? (
                <>
                  <span className="text-2xl font-medium text-red-500">{formatPrice(displayPrice)}</span>
                  <span className="text-lg text-text-muted line-through">{formatPrice(price)}</span>
                </>
              ) : (
                <span className="text-2xl font-medium text-text-primary">{formatPrice(price)}</span>
              )}
            </div>

            <p className="text-sm text-text-muted leading-relaxed mb-8 max-w-[500px]">
              {product.description_mn}
            </p>

            {isProductInStock && stockQuantity <= 5 && (
              <p className="text-sm font-medium text-red-500 mb-6">
                Нөөц: {stockQuantity} ширхэг үлдлээ
              </p>
            )}

            <div className="mb-8 pb-8 border-thin-b">
              <p className="text-xs tracking-[0.1em] uppercase text-text-muted mb-2">Гол найрлага</p>
              <p className="text-sm text-text-primary">
                {product.ingredients?.split(',').slice(0, 3).join(', ')}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={!isProductInStock}
                className={`w-full py-4 text-sm tracking-[0.1em] uppercase font-medium transition-all duration-300 ${
                  !isProductInStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isAdded
                      ? 'bg-text-primary text-cream'
                      : 'bg-[#FFB7D5] text-brand-black hover:bg-[#f5a0c5]'
                }`}
                id="add-to-cart-button"
              >
                {!isProductInStock ? 'Дуусжээ' : isAdded ? '✓ Сагсанд нэмэгдлээ' : 'Сагсанд нэмэх'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!isProductInStock}
                className="w-full py-4 border-2 border-brand-black bg-sand text-brand-black text-sm font-medium tracking-[0.1em] uppercase hover:bg-brand-black hover:text-white transition-colors duration-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-sand"
              >
                Шууд худалдан авах
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

      {/* Reviews */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16 md:py-24 border-thin-t">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase text-[#8B6B78]">Review</p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A]">Хэрэглэгчийн сэтгэгдэл</h2>
          </div>
          <div className="text-left md:text-right">
            <p className="text-2xl text-[#D894AC]">
              {'★'.repeat(Math.round(averageRating || 0))}
              <span className="text-[#E9D7DF]">{'★'.repeat(5 - Math.round(averageRating || 0))}</span>
            </p>
            <p className="text-sm text-[#8B6B78]">
              {reviews.length > 0 ? `${averageRating.toFixed(1)} / 5 · ${reviews.length} сэтгэгдэл` : 'Одоогоор сэтгэгдэл байхгүй'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]">
          <ReviewForm product={product} onSubmitted={() => loadReviews(product.id)} />

          <div>
            {reviewsLoading ? (
              <div className="grid gap-4">
                {[1, 2].map(item => (
                  <div key={item} className="h-40 animate-pulse bg-[#FFF0F6]" />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="grid gap-4">
                {reviews.map(review => (
                  <article key={review.id} className="border border-[#F2A8C8]/45 bg-white p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{review.userName || 'UJ хэрэглэгч'}</p>
                        <p className="mt-1 text-xs text-[#8B6B78]">
                          {review.createdAt instanceof Date
                            ? review.createdAt.toLocaleDateString('mn-MN')
                            : ''}
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-sm text-[#D894AC]">
                        {'★'.repeat(review.rating)}
                        <span className="text-[#E9D7DF]">{'★'.repeat(5 - review.rating)}</span>
                      </p>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#4A3A40]">{review.content}</p>
                    {review.imageUrls.length > 0 && (
                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {review.imageUrls.slice(0, 4).map((imageUrl, index) => (
                          <a
                            key={`${review.id}-${imageUrl}`}
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square overflow-hidden bg-[#FFF0F6]"
                          >
                            <Image
                              src={imageUrl}
                              alt={`${review.productName} review ${index + 1}`}
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
              <div className="flex min-h-64 items-center justify-center border border-dashed border-[#F2A8C8]/70 bg-[#FFF8FB] p-8 text-center">
                <div>
                  <p className="font-serif text-2xl text-[#1A1A1A]">Анхны сэтгэгдлийг үлдээгээрэй</p>
                  <p className="mt-2 text-sm text-[#8B6B78]">Бүтээгдэхүүн хэрэглэсэн зураг, мэдрэмжээ бусадтай хуваалцаарай.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16 md:py-24 border-thin-t">
          <div className="text-center mb-12">
            <p className="section-label">Төстэй бүтээгдэхүүн</p>
            <h2 className="section-heading">Танд таалагдаж магадгүй</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {related.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
