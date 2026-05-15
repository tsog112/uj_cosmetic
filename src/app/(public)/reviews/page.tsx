'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAllReviews } from '@/lib/services/firestoreService';
import type { Review } from '@/types';

function StarRating({ rating }: { rating: number }) {
  return <p className="text-sm text-rose-gold">{'★'.repeat(rating)}<span className="text-border-light">{'★'.repeat(5 - rating)}</span></p>;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllReviews()
      .then(items => setReviews(items.filter(item => item.approved)))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const gridClass = useMemo(() => {
    if (reviews.length === 1) return 'mx-auto max-w-xl grid-cols-1';
    if (reviews.length === 2) return 'mx-auto max-w-4xl grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
  }, [reviews.length]);

  return (
    <main className="min-h-screen bg-sand pb-24 pt-32 md:pt-40">
      <section className="max-content">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label">Сэтгэгдэл</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-charcoal md:text-5xl">
            Хэрэглэгчдийн бодит мэдрэмж
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted">
            Бүтээгдэхүүн хэрэглэсэн хүмүүсийн үнэлгээ, зураг, бодит туршлагыг нэг дороос уншаарай.
          </p>
        </div>

        {loading ? (
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map(item => <div key={item} className="h-80 animate-pulse rounded-[24px] bg-white" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="mx-auto mt-12 max-w-2xl rounded-[24px] border border-border-light bg-white p-8 text-center">
            <h2 className="font-serif text-2xl text-charcoal">Одоогоор нийтлэгдсэн сэтгэгдэл алга</h2>
            <p className="mt-3 text-sm leading-7 text-text-muted">
              Бүтээгдэхүүний хуудсаас анхны сэтгэгдлээ үлдээгээрэй.
            </p>
            <Link href="/shop" className="btn-primary mt-6 inline-flex min-h-12 px-7 text-xs uppercase tracking-[0.16em]">
              Дэлгүүр үзэх
            </Link>
          </div>
        ) : (
          <div className={`mt-12 grid gap-5 ${gridClass}`}>
            {reviews.map(review => (
              <article key={review.id} className="overflow-hidden rounded-[24px] border border-border-light bg-white shadow-brand-sm">
                {review.imageUrls[0] && (
                  <Link href={`/shop/${review.productSlug}`} className="relative block aspect-[4/3] overflow-hidden bg-blush">
                    <Image
                      src={review.imageUrls[0]}
                      alt={review.productName}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </Link>
                )}
                <div className="p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/shop/${review.productSlug}`} className="font-semibold text-charcoal hover:text-dusty-rose">
                        {review.productName}
                      </Link>
                      <p className="mt-1 text-xs text-text-faint">{review.userName || 'UJ хэрэглэгч'}</p>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-text-muted">{review.content}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link href="/shop" className="btn-secondary min-h-12 px-7 text-xs uppercase tracking-[0.16em]">
            Сэтгэгдэл бичих бүтээгдэхүүн сонгох
          </Link>
        </div>
      </section>
    </main>
  );
}
