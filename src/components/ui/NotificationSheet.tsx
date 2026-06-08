'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Copy, Sparkles, Tag, Truck, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export type NotificationRow = {
  id: string;
  type?: string;
  title: string;
  body: string;
  href: string;
  status?: string;
};

function extractPromoCode(text: string) {
  const match = text.match(/\b[A-Z0-9]{4,12}\b/);
  return match?.[0] || null;
}

function notificationIcon(type?: string) {
  if (type === 'delivery' || type === 'order') {
    return { Icon: Truck, bg: '#e8f4fc', color: '#0ca5ee' };
  }
  if (type === 'promo') {
    return { Icon: Tag, bg: 'var(--color-brand-light)', color: 'var(--color-brand)' };
  }
  if (type === 'product') {
    return { Icon: Sparkles, bg: 'var(--color-brand-light)', color: 'var(--color-brand)' };
  }
  return { Icon: Bell, bg: 'var(--color-brand-light)', color: 'var(--color-brand)' };
}

type NotificationSheetProps = {
  open: boolean;
  onClose: () => void;
  notifications: NotificationRow[];
};

export default function NotificationSheet({ open, onClose, notifications }: NotificationSheetProps) {
  const { toast } = useToast();
  const rows = notifications;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast('Код хуулагдлаа', 'success');
    } catch {
      toast('Код хуулахад алдаа гарлаа', 'error');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Хаах"
            className="fixed inset-0 z-[220] bg-black/35 backdrop-blur-[2px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-sheet-title"
            className="fixed inset-x-0 bottom-0 z-[230] mx-auto flex max-h-[88dvh] w-full max-w-[430px] flex-col rounded-t-[28px] bg-[#fbf7f9] pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-16px_48px_rgba(166,66,112,0.2)] md:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            <div className="flex justify-center pt-3">
              <div className="h-1.5 w-12 rounded-full bg-[#e8d5df]" />
            </div>

            <div className="flex items-start justify-between gap-3 px-5 pt-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">Notifications</p>
                <h2 id="notification-sheet-title" className="mt-1 font-serif text-[30px] font-semibold leading-none text-[var(--color-text-primary)]">
                  Мэдэгдэл
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-text-primary)] shadow-sm"
                aria-label="Мэдэгдэл хаах"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto px-4 pb-2 hide-scrollbar">
              {!rows.length ? (
                <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Одоогоор мэдэгдэл алга.</p>
              ) : null}
              {rows.map((row) => {
                const { Icon, bg, color } = notificationIcon(row.type);
                const promoCode = extractPromoCode(row.body);
                return (
                  <article key={row.id} className="rounded-[22px] border border-[#f5e8ee] bg-white p-4 shadow-[var(--shadow-xs)]">
                    <div className="flex gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                        style={{ background: bg, color }}
                      >
                        <Icon size={18} strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-[var(--color-text-primary)]">{row.title}</p>
                        <p className="mt-1.5 text-[12px] leading-6 text-[var(--color-text-muted)]">{row.body}</p>
                      </div>
                    </div>

                    {promoCode && (
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-full bg-[#fde8f1] px-3 py-2">
                        <span className="font-mono text-[12px] font-bold text-[var(--color-brand)]">{promoCode}</span>
                        <button
                          type="button"
                          onClick={() => copyCode(promoCode)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[var(--color-brand)]"
                        >
                          <Copy size={13} /> Хуулах
                        </button>
                      </div>
                    )}

                    <Link
                      href={row.href || '/profile/orders'}
                      onClick={onClose}
                      className="mt-3 inline-flex text-[12px] font-bold text-[var(--color-brand)]"
                      style={{ textDecoration: 'none' }}
                    >
                      Дэлгэрэнгүй →
                    </Link>
                  </article>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
