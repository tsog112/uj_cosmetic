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
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D994B5]">Сэтгэгдэл</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-serif text-4xl leading-tight text-[#241820] md:text-6xl">
            Хэрэглэгчдийн бодит мэдрэмж
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#7E6472]">
            Арьс арчилгаа, гоо сайхан, өдөр тутмын routine-д орсон бүтээгдэхүүний туршлага.
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
                  className="group overflow-hidden border border-[#F2C7D8] bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(91,46,67,0.12)]"
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
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold uppercase tracking-[0.2em] text-[#D994B5]">
                        UJ
                      </div>
                    )}
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <p className="line-clamp-1 text-sm font-semibold text-[#241820]">{review.productName}</p>
                      <p className="whitespace-nowrap text-xs text-[#D8A15D]">
                        {'★'.repeat(review.rating)}
                        <span className="text-[#F2C7D8]">{'★'.repeat(5 - review.rating)}</span>
                      </p>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#7E6472]">{review.content}</p>
                    <div className="mt-5 flex items-center justify-between text-xs text-[#9A7D88]">
                      <span>{review.userName || 'UJ хэрэглэгч'}</span>
                      <span>Дэлгэрэнгүй</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl border border-dashed border-[#D994B5]/70 bg-white px-6 py-12 text-center">
            <p className="font-serif text-2xl text-[#241820]">Анхны сэтгэгдлүүд удахгүй нэмэгдэнэ</p>
            <p className="mt-3 text-sm leading-7 text-[#7E6472]">
              Бүтээгдэхүүн сонгоод хэрэглэсний дараа өөрийн туршлагаа хуваалцаарай.
            </p>
            <Link href="/shop" className="mt-6 inline-flex min-h-11 items-center justify-center border border-[#D994B5] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#241820] transition-colors hover:bg-[#D994B5] hover:text-white">
              Бүтээгдэхүүн үзэх
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
