'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, ShoppingBag, Star, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import type { Review } from '@/types';
import ReviewLikeButton from '@/components/ui/ReviewLikeButton';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-[#D4537E]" aria-label={`${rating} од`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={14} fill={index < rating ? 'currentColor' : 'none'} strokeWidth={1.8} />
      ))}
    </div>
  );
}

function getVisiblePages(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages: (number | string)[] = [1];
  let start = Math.max(2, currentPage - 1);
  let end = Math.min(totalPages - 1, currentPage + 1);

  if (currentPage <= 3) end = 4;
  if (currentPage >= totalPages - 2) start = totalPages - 3;
  if (start > 2) pages.push('...');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('...');
  pages.push(totalPages);

  return pages;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const { authFetch } = await import('@/lib/auth/clientFetch');
        const response = await authFetch(`/api/reviews?page=${page}&limit=8`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        const data = await response.json();
        setReviews(data.reviews || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setAverageRating(data.averageRating || 0);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchReviews();
  }, [page, user?.uid]);

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredReviews = reviews.filter((review) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [
      review.productName,
      review.userName,
      review.content,
      review.body,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  return (
    <main className="luxury-shell space-y-5 pb-[104px]">
      <section className="luxury-card p-5">
        <p className="luxury-eyebrow">Real reviews</p>
        <h1 className="luxury-title mt-2">Хэрэглэгчдийн бодит сэтгэгдэл</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          Баталгаат худалдан авалтаас ирсэн үнэлгээ, туршлага, бүтээгдэхүүний бодит мэдрэмжүүд.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat label="Нийт сэтгэгдэл" value={String(totalCount)} />
          <Stat label="Дундаж үнэлгээ" value={averageRating ? averageRating.toFixed(1) : '-'} accent />
        </div>
        <label className="luxury-input mt-4 flex h-12 px-4" style={{ boxShadow: 'var(--shadow-xs)' }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Сэтгэгдэл, хэрэглэгч, бүтээгдэхүүнээр хайх..."
            className="min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none"
          />
        </label>
      </section>

      {loading ? (
        <section className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="luxury-card h-48 p-5">
              <div className="h-4 w-32 rounded-full animate-shimmer" />
              <div className="mt-4 h-3 w-full rounded-full animate-shimmer" />
              <div className="mt-2 h-3 w-4/5 rounded-full animate-shimmer" />
              <div className="mt-8 h-16 rounded-[18px] animate-shimmer" />
            </div>
          ))}
        </section>
      ) : filteredReviews.length === 0 ? (
        <section className="luxury-card px-6 py-14 text-center">
          <MessageCircle className="mx-auto text-[var(--color-brand)]" size={42} strokeWidth={1.8} />
          <h2 className="mt-5 font-serif text-2xl font-semibold text-[var(--color-text-primary)]">Одоогоор нийтлэгдсэн сэтгэгдэл алга</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Бүтээгдэхүүн хүлээн авсны дараа анхны сэтгэгдлээ үлдээгээрэй.
          </p>
          <Link href="/shop" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-brand)] px-7 text-sm font-semibold text-white">
            <ShoppingBag size={16} />
            Дэлгүүр үзэх
          </Link>
        </section>
      ) : (
        <section className="space-y-4">
          {filteredReviews.map((review) => (
            <article key={review.id} className="luxury-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/shop/${review.productSlug}`} className="block truncate text-[15px] font-semibold text-[var(--color-text-primary)] transition hover:text-[var(--color-brand)]">
                    {review.productName}
                  </Link>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{review.userName || 'UJ хэрэглэгч'}</p>
                </div>
                <Stars rating={review.rating} />
              </div>

              <p className="mt-4 text-sm leading-6 text-[var(--color-text-primary)]">{review.content || review.body}</p>

              {review.adminReply ? (
                <div className="mt-4 rounded-[16px] border border-[#F0E8ED] bg-[#FBF7F9] px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand)]">{t('reviews.adminReply')}</p>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-primary)]">{review.adminReply}</p>
                </div>
              ) : null}

              {(review.imageUrls || []).length > 0 && (
                <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto py-0.5">
                  {(review.imageUrls || []).map((imageUrl, index) => (
                    <button
                      type="button"
                      key={`${imageUrl}-${index}`}
                      onClick={() => setActivePhoto(imageUrl)}
                      className="relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-[18px] border border-[#F0E8ED] bg-[#F7F3F5] transition active:scale-[0.96]"
                    >
                      <Image src={imageUrl} alt={review.productName} fill className="object-cover" sizes="74px" />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <ReviewLikeButton
                  reviewId={review.id}
                  initialCount={(review as Review & { likeCount?: number }).likeCount || 0}
                  initialLiked={(review as Review & { likedByUser?: boolean }).likedByUser || false}
                />
              </div>
            </article>
          ))}

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 py-3">
              <PageButton disabled={page === 1} onClick={() => goToPage(page - 1)} label="<" />
              {getVisiblePages(page, totalPages).map((pageNumber, index) =>
                pageNumber === '...' ? (
                  <span key={`ellipsis-${index}`} className="flex h-10 w-8 items-center justify-center text-sm font-semibold text-[var(--color-text-muted)]">...</span>
                ) : (
                  <PageButton key={pageNumber} active={pageNumber === page} onClick={() => goToPage(pageNumber as number)} label={String(pageNumber)} />
                )
              )}
              <PageButton disabled={page === totalPages} onClick={() => goToPage(page + 1)} label=">" />
              <span className="ml-2 text-xs text-[var(--color-text-muted)]">{page} / {totalPages}</span>
            </div>
          )}
        </section>
      )}

      {activePhoto && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onClick={() => setActivePhoto(null)}>
          <div className="relative w-full max-w-[420px] overflow-hidden rounded-[24px] bg-white p-2" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setActivePhoto(null)} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[var(--color-text-primary)]">
              <X size={18} />
            </button>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] bg-[#F7F3F5]">
              <Image src={activePhoto} alt="Сэтгэгдлийн зураг" fill className="object-cover" sizes="(max-width: 768px) 90vw, 420px" priority />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-[20px] border border-[#F0E8ED] bg-[#F7F3F5] p-4 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-primary)]'}`}>{value}</p>
    </div>
  );
}

function PageButton({ label, active = false, disabled = false, onClick }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition active:scale-[0.95] disabled:opacity-35 ${
        active ? 'bg-[var(--color-brand)] text-white' : 'border border-[#F0E8ED] bg-white text-[var(--color-text-primary)]'
      }`}
    >
      {label}
    </button>
  );
}
