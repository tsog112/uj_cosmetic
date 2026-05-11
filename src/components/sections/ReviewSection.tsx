'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getLatestReviews } from '@/lib/services/firestoreService';
import type { Review } from '@/types';

export default function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestReviews(6)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-[#FFF8FB] py-16 md:py-28">
      <div className="max-content">
        <div className="mb-10 text-center md:mb-16">
          <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#8B6B78]">Review</p>
          <h2 className="mt-3 font-serif text-3xl text-[#1A1A1A] md:text-5xl">Хэрэглэгчдийн сэтгэгдэл</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#8B6B78]">
            UJ Cosmetic хэрэглэсэн бодит мэдрэмж, зурагтай сэтгэгдлүүд.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map(item => (
              <div key={item} className="h-80 animate-pulse bg-white" />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {reviews.map(review => {
              const cover = review.imageUrls[0];
              return (
                <Link
                  key={review.id}
                  href={`/shop/${review.productSlug}`}
                  className="group overflow-hidden border border-[#F2A8C8]/40 bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(216,148,172,0.16)]"
                >
                  <div className="relative aspect-[4/3] bg-[#FFF0F6]">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={review.productName}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl text-[#F2A8C8]">★</div>
                    )}
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-[#1A1A1A] line-clamp-1">{review.productName}</p>
                      <p className="whitespace-nowrap text-xs text-[#D894AC]">
                        {'★'.repeat(review.rating)}
                        <span className="text-[#E9D7DF]">{'★'.repeat(5 - review.rating)}</span>
                      </p>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6F5962]">{review.content}</p>
                    <div className="mt-5 flex items-center justify-between text-xs text-[#8B6B78]">
                      <span>{review.userName || 'UJ хэрэглэгч'}</span>
                      <span>Дэлгэрэнгүй →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl border border-dashed border-[#F2A8C8]/70 bg-white px-6 py-12 text-center">
            <p className="font-serif text-2xl text-[#1A1A1A]">Анхны сэтгэгдэл хүлээгдэж байна</p>
            <p className="mt-3 text-sm leading-7 text-[#8B6B78]">
              Бүтээгдэхүүний дэлгэрэнгүй хуудсаас хэрэглэгчид зурагтай сэтгэгдэл үлдээх боломжтой.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex min-h-11 items-center justify-center border border-[#FFB7D5] px-6 text-xs tracking-[0.16em] uppercase text-[#1A1A1A] transition-colors hover:bg-[#FFF0F6]"
            >
              Бүтээгдэхүүн үзэх
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
