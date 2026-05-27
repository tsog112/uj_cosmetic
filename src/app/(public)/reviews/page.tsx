'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, ShoppingBag, Star, X } from 'lucide-react';
import type { Review } from '@/types';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-[#E6A0BE]">
      {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} fill={index < rating ? 'currentColor' : 'none'} />)}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const fetchReviews = async (pageNumber: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?page=${pageNumber}&limit=6`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
      setAverageRating(data.averageRating || 0);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviews(page);
  }, [page]);

  return (
    <main className="space-y-5 px-4 pb-[104px] md:max-w-xl lg:max-w-2xl mx-auto md:mt-6">
      <section className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-mobile-card)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">Reviews</p>
        <h1 className="mt-1 text-[25px] font-extrabold text-[var(--color-brand-text)]">Хэрэглэгчдийн сэтгэгдэл</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-brand-muted)]">Бүтээгдэхүүн хэрэглэсэн бодит үнэлгээ, зурагтай сэтгэгдлүүд.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[20px] bg-[var(--color-brand-bg)] p-4 text-center border border-[#fdf2f7]">
            <p className="text-[10px] font-bold text-[var(--color-brand-muted)]">Нийт сэтгэгдэл</p>
            <p className="mt-1 text-2xl font-extrabold text-[var(--color-brand-text)]">{totalCount}</p>
          </div>
          <div className="rounded-[20px] bg-[var(--color-brand-bg)] p-4 text-center border border-[#fdf2f7]">
            <p className="text-[10px] font-bold text-[var(--color-brand-muted)]">Дундаж үнэлгээ</p>
            <p className="mt-1 text-2xl font-extrabold text-[var(--color-brand-accent)]">{averageRating ? averageRating.toFixed(1) : '-'}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-48 rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)] flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-4 w-32 rounded-full animate-shimmer" />
                <div className="h-3 w-48 rounded-full animate-shimmer" />
              </div>
              <div className="h-10 w-full rounded-[14px] animate-shimmer" />
            </div>
          ))}
        </section>
      ) : reviews.length === 0 ? (
        <section className="rounded-[28px] bg-white px-6 py-14 text-center shadow-[var(--shadow-mobile-card)]">
          <MessageCircle className="mx-auto text-[var(--color-brand-accent)]" size={44} />
          <h2 className="mt-5 text-xl font-extrabold text-[var(--color-brand-text)]">Одоогоор нийтлэгдсэн сэтгэгдэл алга</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-brand-muted)]">Бүтээгдэхүүн хэрэглэсний дараа анхны сэтгэгдлээ үлдээгээрэй.</p>
          <Link href="/shop" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-brand-accent)] px-6 text-sm font-extrabold text-white">
            <ShoppingBag size={17} /> Бүтээгдэхүүн үзэх
          </Link>
        </section>
      ) : (
        <section className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="overflow-hidden rounded-[24px] bg-white p-5 shadow-[var(--shadow-mobile-card)] border border-[#fdf2f7] transition-all duration-300 hover:shadow-brand-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/shop/${review.productSlug}`} className="block hover:text-[var(--color-brand-accent)] truncate text-[15px] font-extrabold text-[var(--color-brand-text)] transition-colors">
                    {review.productName}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-[var(--color-brand-muted)]">{review.userName || 'UJ хэрэглэгч'}</p>
                </div>
                <Stars rating={review.rating} />
              </div>
              
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-brand-text)]">{review.content}</p>
              
              {/* Premium review thumbnails at bottom of review cards */}
              {review.imageUrls.length > 0 && (
                <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar py-0.5">
                  {review.imageUrls.map((imageUrl, idx) => (
                    <button 
                      key={`${imageUrl}-${idx}`} 
                      onClick={() => setActivePhoto(imageUrl)} 
                      className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[16px] bg-[var(--color-brand-secondary)] border border-[#fbe1ed] shadow-sm transition-all duration-200 hover:scale-[1.04] active:scale-[0.96] hover:border-[var(--color-brand-accent)]"
                    >
                      <Image src={imageUrl} alt={review.productName} fill className="object-cover" sizes="72px" />
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}

          {/* Premium Pill Pagination UI */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1.5 py-4">
              <button
                onClick={() => {
                  if (page > 1) {
                    setPage(prev => prev - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                disabled={page === 1}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f8dbe8] bg-white text-[13px] font-bold text-[var(--color-brand-text)] shadow-sm transition-all hover:bg-[var(--color-brand-secondary)] disabled:opacity-40 active:scale-95"
              >
                &lt;
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isActive = pageNum === page;
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setPage(pageNum);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold transition-all shadow-sm active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-r from-[var(--color-brand-accent)] to-[#d81b60] text-white shadow-[0_3px_10px_rgba(233,30,140,0.25)]'
                        : 'border border-[#f8dbe8] bg-white text-[var(--color-brand-text)] hover:bg-[var(--color-brand-secondary)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  if (page < totalPages) {
                    setPage(prev => prev + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                disabled={page === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f8dbe8] bg-white text-[13px] font-bold text-[var(--color-brand-text)] shadow-sm transition-all hover:bg-[var(--color-brand-secondary)] disabled:opacity-40 active:scale-95"
              >
                &gt;
              </button>
            </div>
          )}
        </section>
      )}

      {/* Glassmorphic Lightbox Overlay */}
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
