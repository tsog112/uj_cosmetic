'use client';

import { authFetch } from '@/lib/auth/clientFetch';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { CheckCircle2, Eye, EyeOff, MessageSquareReply, Search, Star, Trash2, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminFilterToggleButton from '@/components/admin/AdminFilterToggleButton';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminSearchField from '@/components/admin/AdminSearchField';
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
  const [isSavingReply, setIsSavingReply] = useState(false);
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

  const setReviewStatus = async (id: string, status: 'pending' | 'visible' | 'hidden', adminReply?: string, featured?: boolean) => {
    mutate(
      (prev: any) =>
        prev
          ? { ...prev, reviews: prev.reviews.map((r: any) => (r.id === id ? { ...r, status, approved: status === 'visible', featured: featured ?? r.featured, adminReply: adminReply ?? r.adminReply } : r)) }
          : prev,
      false
    );
    setSelectedReview((prev: any) => (prev?.id === id ? { ...prev, status, approved: status === 'visible', featured: featured ?? prev.featured, adminReply: adminReply ?? prev.adminReply } : prev));
    try {
      const res = await authFetch(`/api/admin/reviews/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminReply, featured }),
      });
      if (!res.ok) throw new Error();
      mutate();
      showToast(status === 'visible' ? 'Сэтгэгдэл нийтлэгдлээ' : status === 'hidden' ? 'Сэтгэгдэл нуугдлаа' : 'Сэтгэгдэл хүлээгдэж байна');
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
      const res = await authFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      mutate();
      showToast('Сэтгэгдэл устгагдлаа');
    } catch {
      mutate();
      showToast('Устгахад алдаа гарлаа', 'error');
    }
  };

  const toggleFeatured = async (review: any) => {
    if (review.status !== 'visible') {
      showToast('Нүүр хуудсанд харуулахын өмнө нийтэлнэ үү.', 'error');
      return;
    }
    await setReviewStatus(review.id, 'visible', review.adminReply, !review.featured);
  };

  const saveAdminReply = async (id: string, reply: string) => {
    const trimmed = reply.trim();
    if (!trimmed) {
      showToast('Хариу бичнэ үү', 'error');
      return;
    }

    setIsSavingReply(true);
    mutate(
      (prev: any) =>
        prev
          ? { ...prev, reviews: prev.reviews.map((r: any) => (r.id === id ? { ...r, adminReply: trimmed } : r)) }
          : prev,
      false,
    );
    setSelectedReview((prev: any) => (prev?.id === id ? { ...prev, adminReply: trimmed } : prev));

    try {
      const res = await authFetch(`/api/admin/reviews/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: trimmed }),
      });
      if (!res.ok) throw new Error();
      mutate();
      showToast('Хариу хадгалагдлаа');
    } catch {
      mutate();
      showToast('Хариу хадгалахад алдаа гарлаа', 'error');
    } finally {
      setIsSavingReply(false);
    }
  };

  const featuredCount = data?.statusCounts?.featured || 0;

  return (
    <AdminPageShell>
      <section className="admin-toolbar space-y-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <AdminSearchField
              value={search}
              onChange={handleSearch}
              placeholder="Сэтгэгдэл, бараа, нэрээр хайх..."
            />
          </div>
          <AdminFilterToggleButton
            open={isFilterOpen}
            onToggle={() => setIsFilterOpen((prev) => !prev)}
            activeCount={activeTab !== 'all' ? 1 : 0}
          />
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              id="admin-filter-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                <p className="mb-3 admin-eyebrow">Төлөвөөр шүүх</p>
                <div className="flex flex-wrap gap-2">
                  {REVIEW_FILTERS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setActiveTab(tab.value)}
                      className={`admin-chip gap-1 ${activeTab === tab.value ? 'admin-chip-active' : 'admin-chip-idle'}`}
                    >
                      {tab.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.value ? 'bg-white/25' : 'bg-black/5'}`}>
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

      <section className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 rounded-[24px] animate-shimmer" />)
        ) : data?.reviews?.length > 0 ? (
          data.reviews.map((review: any) => (
            <article
              key={review.id}
              onClick={() => { setSelectedReview(review); setReplyText(review.adminReply || ''); }}
              className={`admin-card-soft admin-card-tap flex h-full min-h-[260px] cursor-pointer flex-col p-4 ${review.status === 'hidden' ? 'opacity-80' : ''}`}
            >
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14px] font-extrabold text-[var(--color-text-primary)]">{review.userName || 'Зочин'}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${review.status === 'visible' ? 'bg-[var(--color-status-done-bg)] text-[var(--color-status-done-text)]' : review.status === 'hidden' ? 'bg-[var(--color-bg)] text-[var(--color-text-muted)]' : 'bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending-text)]'}`}>
                        {review.status === 'visible' ? 'Нийтлэгдсэн' : review.status === 'hidden' ? 'Нуугдсан' : 'Хүлээгдэж буй'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--color-brand)]">{review.productName}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-[var(--color-bg)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--color-text-muted)]">#{String(review.orderId || 'no-order').slice(-6).toUpperCase()}</span>
                      {review.verifiedPurchase && <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-status-done-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-status-done-text)]"><BadgeCheck size={11} /> Баталгаажсан</span>}
                      {review.featured && <span className="rounded-full bg-[var(--color-brand-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-brand)]">Нүүр</span>}
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{mounted ? formatDateMN(review.createdAt) : ''}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < (review.rating || 5) ? 'fill-[#FFD700] text-[#FFD700]' : 'fill-transparent text-[var(--color-border)]'} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className={`text-[13px] leading-relaxed text-[var(--color-text-primary)] ${expandedReviews.has(review.id) ? '' : 'line-clamp-3'}`}>{review.content}</p>
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
                      className="mt-1 h-8 text-[12px] font-extrabold text-[var(--color-brand)]"
                    >
                      {expandedReviews.has(review.id) ? 'Хураах' : 'Дэлгэх'}
                    </button>
                  )}
                </div>

                {review.imageUrls?.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {review.imageUrls.map((url: string, index: number) => (
                      <div key={index} className="relative aspect-square overflow-hidden rounded-[12px] border border-[var(--color-border)]">
                        <Image src={url} alt="Review photo" fill sizes="80px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-divider mt-auto grid grid-cols-3 gap-2 pt-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void toggleFeatured(review);
                  }}
                  className={`flex h-10 items-center justify-center gap-1.5 rounded-full text-[11px] font-extrabold transition-colors ${review.featured ? 'bg-[var(--color-brand)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-text-primary)]'}`}
                >
                  <Star size={14} /> {review.featured ? 'Нүүрт' : 'Нүүр'}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setReviewStatus(review.id, review.status === 'visible' ? 'hidden' : 'visible');
                  }}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--color-bg)] text-[11px] font-extrabold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)]"
                >
                  {review.status === 'visible' ? <><EyeOff size={14} /> Нуух</> : <><Eye size={14} /> Нийтлэх</>}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDeleteReview(review.id);
                  }}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--color-status-cancel-bg)] text-[11px] font-extrabold text-[var(--color-status-cancel-text)] transition-colors"
                  aria-label="Устгах"
                >
                  <Trash2 size={14} /> Устгах
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="admin-empty col-span-full">
            <p className="text-sm font-bold text-[var(--color-brand-muted)]">Сэтгэгдэл олдсонгүй</p>
          </div>
        )}
      </section>

      <Pagination page={page} totalItems={data?.totalCount || 0} pageSize={20} onPageChange={setPage} />
      <div className="admin-toast text-[var(--color-text-muted)]">
        Нүүр хуудсанд сонгосон: {featuredCount} / 6
      </div>

      <AdminSheet open={Boolean(selectedReview)} onClose={() => setSelectedReview(null)}>
        {selectedReview && (
          <div className="space-y-5">
            <div>
              <p className="admin-eyebrow">Сэтгэгдлийн дэлгэрэнгүй</p>
              <h2 className="mt-1 text-[21px] font-extrabold text-[var(--color-text-primary)]">{selectedReview.productName || 'Бүтээгдэхүүн'}</h2>
              <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">{selectedReview.userName || 'Зочин'} · {mounted ? formatDateMN(selectedReview.createdAt) : ''}</p>
            </div>

            <div className="flex items-center gap-1 text-[var(--color-brand-accent)]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={20} fill={index < Number(selectedReview.rating || 0) ? 'currentColor' : 'none'} />
              ))}
            </div>

            <p className="rounded-[20px] bg-[var(--color-brand-bg)] p-4 text-[15px] leading-7 text-[var(--color-brand-text)]">{selectedReview.content}</p>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-text-muted)]"><MessageSquareReply size={14} /> Админы хариу</span>
              <textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} rows={4} className="admin-input min-h-[120px] resize-none py-3" placeholder="Хэрэглэгчид харагдах хариу бичнэ үү..." />
            </label>

            <button
              type="button"
              disabled={isSavingReply}
              onClick={() => saveAdminReply(selectedReview.id, replyText)}
              className="admin-btn-primary w-full disabled:opacity-60"
            >
              <CheckCircle2 size={17} /> {isSavingReply ? 'Хадгалж байна...' : 'Хариу хадгалах'}
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setReviewStatus(selectedReview.id, 'visible', replyText)} className="admin-btn-secondary h-11 text-[12px]">Нийтлэх</button>
              <button type="button" onClick={() => setReviewStatus(selectedReview.id, 'hidden', replyText)} className="admin-btn-secondary h-11 text-[12px]">Нуух</button>
              <button type="button" onClick={() => setPendingDeleteReview(selectedReview.id)} className="flex h-11 items-center justify-center rounded-full bg-[var(--color-status-cancel-bg)] text-[12px] font-extrabold text-[var(--color-status-cancel-text)]">Устгах</button>
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
    </AdminPageShell>
  );
}
