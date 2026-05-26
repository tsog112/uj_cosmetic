'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { CheckCircle2, Eye, EyeOff, MessageSquareReply, Search, Star, Trash2, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminSheet from '@/components/admin/AdminSheet';
import Pagination from '@/components/admin/Pagination';
import { useToast } from '@/components/admin/Toast';
import AdminConfirmSheet from '@/components/admin/AdminConfirmSheet';
import { REVIEW_FILTERS } from '@/lib/constants/admin';
import { useAdminReviews } from '@/lib/hooks/useAdmin';
import { formatDateMN } from '@/lib/utils/format';

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [pendingDeleteReview, setPendingDeleteReview] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { showToast } = useToast();
  const { data, isLoading, mutate } = useAdminReviews({
    status: activeTab,
    page,
    search: debouncedSearch
  });

  useEffect(() => setMounted(true), []);
  useEffect(() => setPage(1), [activeTab, debouncedSearch]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const setReviewStatus = async (id: string, status: 'pending' | 'approved' | 'hidden', adminReply?: string) => {
    mutate(
      (prev: any) =>
        prev
          ? { ...prev, reviews: prev.reviews.map((r: any) => (r.id === id ? { ...r, status, approved: status === 'approved', adminReply: adminReply ?? r.adminReply } : r)) }
          : prev,
      false
    );
    setSelectedReview((prev: any) => (prev?.id === id ? { ...prev, status, approved: status === 'approved', adminReply: adminReply ?? prev.adminReply } : prev));
    try {
      const res = await fetch(`/api/admin/reviews/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminReply }),
      });
      if (!res.ok) throw new Error();
      mutate();
      showToast(status === 'approved' ? 'Сэтгэгдэл нийтлэгдлээ' : status === 'hidden' ? 'Сэтгэгдэл нуугдлаа' : 'Сэтгэгдэл хүлээгдэж байна');
    } catch {
      mutate();
      showToast('Алдаа гарлаа', 'error');
    }
  };

  const deleteReview = async (id: string) => {
    mutate(
      (prev: any) => prev ? { ...prev, reviews: prev.reviews.filter((r: any) => r.id !== id) } : prev,
      false
    );
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      mutate();
      showToast('Сэтгэгдэл устгагдлаа');
    } catch {
      mutate();
      showToast('Устгахад алдаа гарлаа', 'error');
    }
  };

  return (
    <div className="space-y-4 p-4 pb-[104px]">
      <AdminPageHeader eyebrow="Сэтгэгдлийн удирдлага" title="Сэтгэгдлүүд" />

      <section className="rounded-[24px] bg-white p-3 shadow-[var(--shadow-mobile-card)]">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" />
            <input
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Сэтгэгдэл, бараа, нэрээр хайх..."
              className="h-11 w-full rounded-full border border-[#f8dbe8] bg-[var(--color-brand-bg)] pl-10 pr-4 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[#f3b8cf] transition-all"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 transition-all"
            style={{
              background: isFilterOpen ? 'var(--color-brand-accent)' : 'var(--color-brand-bg)',
              border: isFilterOpen ? '1px solid var(--color-brand-accent)' : '1px solid #f8dbe8',
              color: isFilterOpen ? '#FFFFFF' : 'var(--color-brand-text)',
            }}
          >
            <SlidersHorizontal size={16} strokeWidth={2.5} />
          </button>
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-[20px] p-4 bg-[var(--color-brand-bg)] border border-[#f8dbe8]">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">
                  Төлөвөөр шүүх
                </p>
                <div className="mobile-chip-grid">
                  {REVIEW_FILTERS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setActiveTab(tab.value)}
                      className={`mobile-chip gap-1 border transition-colors ${
                        activeTab === tab.value
                          ? 'border-[var(--color-brand-accent)] bg-[var(--color-brand-secondary)] text-[var(--color-brand-text)]'
                          : 'border-[#f8dbe8] bg-white text-[var(--color-brand-muted)] hover:bg-[#f8dbe8]/30'
                      }`}
                    >
                      {tab.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === tab.value ? 'bg-white text-[var(--color-brand-accent)]' : 'bg-[#f8dbe8]/50 text-[var(--color-brand-muted)]'}`}>
                        {tab.value === 'all' ? data?.statusCounts?.total || 0 : data?.statusCounts?.[tab.value] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 rounded-[24px] animate-shimmer" />)
        ) : data?.reviews?.length > 0 ? (
          data.reviews.map((review: any) => (
            <article key={review.id} onClick={() => { setSelectedReview(review); setReplyText(review.adminReply || ''); }} className={`flex flex-col gap-3 rounded-[24px] p-4 shadow-[var(--shadow-mobile-card)] transition-opacity ${review.status === 'approved' ? 'bg-white' : 'bg-white/70'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-extrabold text-[var(--color-brand-text)]">{review.userName || 'Зочин'}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${review.status === 'approved' ? 'bg-[var(--status-success-bg)] text-[var(--status-success)]' : review.status === 'hidden' ? 'bg-[#f8dbe8] text-[var(--color-brand-muted)]' : 'bg-[var(--status-warning-bg)] text-[var(--status-warning)]'}`}>
                      {review.status === 'approved' ? 'Approved' : review.status === 'hidden' ? 'Hidden' : 'Pending'}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--color-brand-accent)]">{review.productName}</p>
                  <p className="mt-1 text-[10px] text-[var(--color-brand-muted)]">{mounted ? formatDateMN(review.createdAt) : ''}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < (review.rating || 5) ? 'fill-[#FFD700] text-[#FFD700]' : 'fill-transparent text-[#e8d2dc]'} />
                  ))}
                </div>
              </div>

              <div>
                <p className={`text-[13px] leading-relaxed text-[var(--color-brand-text)] ${expandedReviews.has(review.id) ? '' : 'line-clamp-3'}`}>{review.content}</p>
                {String(review.content || '').length > 120 && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setExpandedReviews((prev) => {
                        const next = new Set(prev);
                        if (next.has(review.id)) next.delete(review.id);
                        else next.add(review.id);
                        return next;
                      });
                    }}
                    className="mt-1 h-8 text-[12px] font-extrabold text-[var(--color-brand-accent)]"
                  >
                    {expandedReviews.has(review.id) ? 'Хураах' : 'Дэлгэх'}
                  </button>
                )}
              </div>

              {review.imageUrls?.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {review.imageUrls.map((url: string, index: number) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-[12px] border border-[#f8dbe8]">
                      <Image src={url} alt="Review photo" fill sizes="80px" className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 flex flex-row gap-2 border-t border-[#f8dbe8] pt-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setReviewStatus(review.id, review.status === 'approved' ? 'hidden' : 'approved');
                  }}
                  className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-[12px] font-extrabold transition-colors ${
                    review.status === 'approved'
                      ? 'bg-[var(--color-brand-secondary)] text-[var(--color-brand-text)]'
                      : 'bg-[var(--color-brand-accent)] text-white'
                  }`}
                >
                  {review.status === 'approved' ? <><EyeOff size={14} /> Нуух</> : <><Eye size={14} /> Нийтлэх</>}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDeleteReview(review.id);
                  }}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#FFF0F3] text-[12px] font-extrabold text-[var(--color-brand-danger)] transition-colors"
                  aria-label="Устгах"
                >
                  <Trash2 size={14} /> Устгах
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full rounded-[24px] bg-white p-10 text-center shadow-[var(--shadow-mobile-card)]">
            <p className="text-sm font-bold text-[var(--color-brand-muted)]">Сэтгэгдэл олдсонгүй</p>
          </div>
        )}
      </section>

      <Pagination page={page} totalItems={data?.totalCount || 0} pageSize={20} onPageChange={setPage} />

      <AdminSheet open={Boolean(selectedReview)} onClose={() => setSelectedReview(null)}>
        {selectedReview && (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-accent)]">Review detail</p>
              <h2 className="mt-1 text-[21px] font-extrabold text-[var(--color-brand-text)]">{selectedReview.productName || 'Бүтээгдэхүүн'}</h2>
              <p className="mt-1 text-[13px] text-[var(--color-brand-muted)]">{selectedReview.userName || 'Зочин'} · {mounted ? formatDateMN(selectedReview.createdAt) : ''}</p>
            </div>

            <div className="flex items-center gap-1 text-[var(--color-brand-accent)]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={20} fill={index < Number(selectedReview.rating || 0) ? 'currentColor' : 'none'} />
              ))}
            </div>

            <p className="rounded-[20px] bg-[var(--color-brand-bg)] p-4 text-[15px] leading-7 text-[var(--color-brand-text)]">{selectedReview.content}</p>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]"><MessageSquareReply size={14} /> Админы хариу</span>
              <textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} rows={4} className="w-full rounded-[18px] bg-[var(--color-brand-bg)] p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#f3b8cf]" placeholder="Хэрэглэгчид харагдах хариу бичих..." />
            </label>

            <button onClick={() => setReviewStatus(selectedReview.id, selectedReview.status || 'pending', replyText)} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white">
              <CheckCircle2 size={17} /> Reply хадгалах
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setReviewStatus(selectedReview.id, 'approved', replyText)} className="h-11 rounded-full bg-[var(--status-success-bg)] text-[12px] font-extrabold text-[var(--status-success)]">Approve</button>
              <button onClick={() => setReviewStatus(selectedReview.id, 'hidden', replyText)} className="h-11 rounded-full bg-[var(--color-brand-secondary)] text-[12px] font-extrabold text-[var(--color-brand-text)]">Hide</button>
              <button onClick={() => setPendingDeleteReview(selectedReview.id)} className="h-11 rounded-full bg-[var(--status-error-bg)] text-[12px] font-extrabold text-[var(--status-error)]">Delete</button>
            </div>
          </div>
        )}
      </AdminSheet>

      <AdminConfirmSheet
        open={Boolean(pendingDeleteReview)}
        title="Сэтгэгдэл устгах уу?"
        body="Энэ үйлдлийг буцаах боломжгүй. Устгахдаа итгэлтэй байна уу?"
        confirmLabel="Устгах"
        destructive
        onClose={() => setPendingDeleteReview(null)}
        onConfirm={() => {
          if (pendingDeleteReview) void deleteReview(pendingDeleteReview).then(() => setPendingDeleteReview(null));
        }}
      />
    </div>
  );
}
