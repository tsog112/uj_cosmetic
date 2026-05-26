'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, ShoppingBag, Star } from 'lucide-react';
import { getAllReviews } from '@/lib/services/firestoreService';
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

  useEffect(() => {
    getAllReviews()
      .then((items) => setReviews(items.filter((item) => item.approved)))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  return (
    <main className="space-y-5 px-4 pb-[104px]">
      <section className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-mobile-card)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">Reviews</p>
        <h1 className="mt-1 text-[25px] font-extrabold text-[var(--color-brand-text)]">Хэрэглэгчдийн сэтгэгдэл</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-brand-muted)]">Бүтээгдэхүүн хэрэглэсэн бодит үнэлгээ, зурагтай сэтгэгдлүүд.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[20px] bg-[var(--color-brand-bg)] p-4 text-center">
            <p className="text-[10px] font-bold text-[var(--color-brand-muted)]">Сэтгэгдэл</p>
            <p className="mt-1 text-2xl font-extrabold">{reviews.length}</p>
          </div>
          <div className="rounded-[20px] bg-[var(--color-brand-bg)] p-4 text-center">
            <p className="text-[10px] font-bold text-[var(--color-brand-muted)]">Дундаж үнэлгээ</p>
            <p className="mt-1 text-2xl font-extrabold">{averageRating ? averageRating.toFixed(1) : '-'}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-72 rounded-[24px] animate-shimmer" />)}
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
        <section className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="overflow-hidden rounded-[24px] bg-white shadow-[var(--shadow-mobile-card)]">
              {review.imageUrls[0] && (
                <Link href={`/shop/${review.productSlug}`} className="relative block aspect-[4/3] bg-[var(--color-brand-secondary)]">
                  <Image src={review.imageUrls[0]} alt={review.productName} fill className="object-cover" sizes="100vw" />
                </Link>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/shop/${review.productSlug}`} className="block truncate text-[15px] font-extrabold text-[var(--color-brand-text)]">
                      {review.productName}
                    </Link>
                    <p className="mt-1 text-[12px] text-[var(--color-brand-muted)]">{review.userName || 'UJ хэрэглэгч'}</p>
                  </div>
                  <Stars rating={review.rating} />
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-brand-text)]">{review.content}</p>
                {review.imageUrls.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto hide-scrollbar">
                    {review.imageUrls.slice(1, 5).map((imageUrl) => (
                      <a key={imageUrl} href={imageUrl} target="_blank" rel="noopener noreferrer" className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[14px] bg-[var(--color-brand-secondary)]">
                        <Image src={imageUrl} alt={review.productName} fill className="object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
