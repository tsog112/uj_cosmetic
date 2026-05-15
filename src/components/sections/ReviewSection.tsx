'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getLatestReviews } from '@/lib/services/firestoreService';
import type { Review } from '@/types';

function StarRating({ rating, total = 5 }: { rating: number; total?: number }) {
  return (
    <p className="whitespace-nowrap text-xs">
      <span className="text-rose-gold">{'★'.repeat(rating)}</span>
      <span className="text-border-light">{'★'.repeat(total - rating)}</span>
    </p>
  );
}

export default function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestReviews(6)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  // Fixed grid with reasonable max-width to prevent cards from becoming massive
  const reviewGridClass = 'mx-auto flex flex-wrap justify-center gap-4 md:gap-6';

  return (
    <section className="bg-sand py-14 md:py-20">
      <div className="max-content">
        {/* Section header */}
        <div className="mb-8 text-center md:mb-10">
          <p className="section-label">Сэтгэгдэл</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-serif text-4xl leading-tight text-charcoal md:text-5xl">
            Хэрэглэгчдийн бодит мэдрэмж
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-text-muted">
            Арьс арчилгаа, гоо сайхан, өдөр тутмын routine-д орсон бүтээгдэхүүний туршлага.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[1, 2, 3].map(item => (
              <div key={item} className="h-64 animate-pulse rounded-[22px] bg-blush" />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className={reviewGridClass}>
            {reviews.map(review => {
              const cover = review.imageUrls[0];
              return (
                <Link
                  key={review.id}
                  href={`/shop/${review.productSlug}`}
                  className="group overflow-hidden rounded-[22px] border border-border-light bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-brand-md w-full max-w-[280px] md:max-w-[300px]"
                >
                  <div className="relative aspect-square bg-blush">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={review.productName}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold uppercase tracking-[0.2em] text-dusty-rose">
                        UJ
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex flex-col gap-2">
                      <p className="line-clamp-1 text-sm font-semibold text-charcoal">{review.productName}</p>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-text-muted">{review.content}</p>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-text-faint">
                      <span>{review.userName || 'UJ хэрэглэгч'}</span>
                      <span>Дэлгэрэнгүй</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl border border-dashed border-dusty-rose/70 bg-white px-6 py-12 text-center">
            <p className="font-serif text-2xl text-charcoal">Анхны сэтгэгдлүүд удахгүй нэмэгдэнэ</p>
            <p className="mt-3 text-sm leading-7 text-text-muted">
              Бүтээгдэхүүн сонгоод хэрэглэсний дараа өөрийн туршлагаа хуваалцаарай.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex min-h-11 items-center justify-center border border-dusty-rose px-6 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal transition-colors hover:bg-dusty-rose hover:text-white"
            >
              Бүтээгдэхүүн үзэх
            </Link>
          </div>
        )}

        {!loading && reviews.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/reviews"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-dusty-rose px-7 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal transition-colors hover:bg-dusty-rose hover:text-white"
            >
              Бусад сэтгэгдэл үзэх
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
