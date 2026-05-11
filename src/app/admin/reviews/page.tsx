'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { deleteReview, getAllReviews, updateReviewApproval } from '@/lib/services/firestoreService';
import type { Review } from '@/types';

function formatDate(date: Date) {
  if (!(date instanceof Date)) return '-';
  return date.toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'hidden'>('all');
  const [toast, setToast] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getAllReviews();
      setReviews(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const summary = useMemo(() => ({
    total: reviews.length,
    approved: reviews.filter(review => review.approved).length,
    hidden: reviews.filter(review => !review.approved).length,
    withImages: reviews.filter(review => review.imageUrls.length > 0).length,
  }), [reviews]);

  const filteredReviews = useMemo(() => {
    if (filter === 'approved') return reviews.filter(review => review.approved);
    if (filter === 'hidden') return reviews.filter(review => !review.approved);
    return reviews;
  }, [reviews, filter]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  const handleToggle = async (review: Review) => {
    await updateReviewApproval(review.id, !review.approved);
    setReviews(prev => prev.map(item => item.id === review.id ? { ...item, approved: !item.approved } : item));
    showToast(!review.approved ? 'Сэтгэгдэл нийтлэгдлээ' : 'Сэтгэгдэл нууж хадгаллаа');
  };

  const handleDelete = async (review: Review) => {
    if (!confirm('Энэ сэтгэгдлийг устгах уу?')) return;
    await deleteReview(review.id);
    setReviews(prev => prev.filter(item => item.id !== review.id));
    showToast('Сэтгэгдэл устлаа');
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed left-4 right-4 top-20 z-50 border border-[#F2A8C8]/60 bg-white px-4 py-3 text-sm text-[#1A1A1A] shadow-lg md:left-auto md:right-8 md:w-80">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#8B6B78]">Review management</p>
          <h1 className="mt-2 font-serif text-3xl text-[#1A1A1A] md:text-4xl">Сэтгэгдэл</h1>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex min-h-11 items-center justify-center border border-[#FFB7D5] px-5 text-xs tracking-[0.16em] uppercase text-[#1A1A1A] hover:bg-[#FFF0F6]"
        >
          Нүүр харах
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Нийт', summary.total],
          ['Нийтлэгдсэн', summary.approved],
          ['Нуусан', summary.hidden],
          ['Зурагтай', summary.withImages],
        ].map(([label, value]) => (
          <div key={label} className="border border-[#F2A8C8]/45 bg-white p-4">
            <p className="text-xs text-[#8B6B78]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#1A1A1A]">{value}</p>
          </div>
        ))}
      </div>

      <div className="border border-[#F2A8C8]/45 bg-white">
        <div className="border-b border-[#F2A8C8]/35 p-4">
          <div className="grid grid-cols-3 gap-2 rounded-[10px] bg-[#FFF8FB] p-1">
            {[
              { value: 'all', label: 'Бүгд' },
              { value: 'approved', label: 'Нийтлэгдсэн' },
              { value: 'hidden', label: 'Нуусан' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as typeof filter)}
                className={`min-h-10 rounded-[8px] text-xs font-medium transition-colors ${
                  filter === tab.value ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#8B6B78]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 p-4">
            {[1, 2, 3].map(item => <div key={item} className="h-36 animate-pulse bg-[#FFF8FB]" />)}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#8B6B78]">Сэтгэгдэл алга байна.</div>
        ) : (
          <div className="divide-y divide-[#F2A8C8]/30">
            {filteredReviews.map(review => (
              <article key={review.id} className="p-4 md:p-5">
                <div className="grid gap-4 md:grid-cols-[120px_1fr_auto] md:items-start">
                  <div className="grid grid-cols-4 gap-2 md:block">
                    <div className="relative col-span-1 aspect-square overflow-hidden rounded-[8px] bg-[#FFF0F6] md:w-[104px]">
                      {review.imageUrls[0] ? (
                        <Image src={review.imageUrls[0]} alt={review.productName} fill className="object-cover" sizes="120px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#F2A8C8]">★</div>
                      )}
                    </div>
                    {review.imageUrls.slice(1, 4).map(imageUrl => (
                      <div key={imageUrl} className="relative aspect-square overflow-hidden rounded-[8px] bg-[#FFF0F6] md:hidden">
                        <Image src={imageUrl} alt={review.productName} fill className="object-cover" sizes="80px" />
                      </div>
                    ))}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`border px-2 py-1 text-[10px] tracking-[0.12em] uppercase ${
                        review.approved
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-[#F2A8C8]/60 bg-[#FFF0F6] text-[#8B6B78]'
                      }`}>
                        {review.approved ? 'Нийтлэгдсэн' : 'Нуусан'}
                      </span>
                      <span className="text-xs text-[#D894AC]">
                        {'★'.repeat(review.rating)}
                        <span className="text-[#E9D7DF]">{'★'.repeat(5 - review.rating)}</span>
                      </span>
                      <span className="text-xs text-[#8B6B78]">{formatDate(review.createdAt)}</span>
                    </div>

                    <Link href={`/shop/${review.productSlug}`} target="_blank" className="mt-3 block font-medium text-[#1A1A1A] hover:underline">
                      {review.productName}
                    </Link>
                    <p className="mt-1 text-sm text-[#8B6B78]">{review.userName} · {review.userEmail}</p>
                    <p className="mt-3 text-sm leading-7 text-[#4A3A40]">{review.content}</p>
                  </div>

                  <div className="flex gap-2 md:flex-col">
                    <button
                      onClick={() => handleToggle(review)}
                      className="min-h-11 flex-1 border border-[#FFB7D5] px-4 text-xs text-[#1A1A1A] hover:bg-[#FFF0F6] md:flex-none"
                    >
                      {review.approved ? 'Нуух' : 'Нийтлэх'}
                    </button>
                    <button
                      onClick={() => handleDelete(review)}
                      className="min-h-11 flex-1 border border-red-200 bg-red-50 px-4 text-xs text-red-700 hover:bg-red-100 md:flex-none"
                    >
                      Устгах
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
