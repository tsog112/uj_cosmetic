'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Bell, Package, ReceiptText, UserRound, X, CheckCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import useSWR from 'swr';
import { authFetch } from '@/lib/auth/clientFetch';
import { formatRelativeMN } from '@/lib/utils/format';

type NotificationItem = {
  id: string;
  type: 'order' | 'user' | 'stock';
  title: string;
  body: string;
  date: string;
  href: string;
  isCritical?: boolean;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const { data } = useSWR('/api/admin/notifications', async (url) => {
    const res = await authFetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }, { refreshInterval: 60000 }); // refresh every minute

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('uj_admin_read_notifications');
      if (stored) setReadIds(JSON.parse(stored));
    } catch {}
  }, []);

  const notifications: NotificationItem[] = data?.notifications || [];
  
  const unreadCount = useMemo(() => {
    if (!mounted) return 0;
    return notifications.filter(n => !readIds.includes(n.id)).length;
  }, [notifications, readIds, mounted]);

  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const newReadIds = [...readIds, id];
    setReadIds(newReadIds);
    try {
      localStorage.setItem('uj_admin_read_notifications', JSON.stringify(newReadIds));
    } catch {}
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const newReadIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(newReadIds);
    try {
      localStorage.setItem('uj_admin_read_notifications', JSON.stringify(newReadIds));
    } catch {}
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-full bg-[var(--color-brand-secondary)] p-2.5 text-[var(--color-brand-text)] transition-transform hover:scale-105 active:scale-95"
        aria-label="Админ мэдэгдэл"
      >
        <Bell size={20} strokeWidth={1.9} />
        {mounted && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-[var(--color-brand-danger)] px-1 text-[10px] font-bold text-white shadow-sm">
            {Math.min(unreadCount, 99)}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[80] h-[100dvh] bg-black/35 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 flex max-h-[85dvh] flex-col rounded-t-[24px] bg-[var(--color-brand-bg)] shadow-[0_-16px_40px_rgba(0,0,0,0.18)]"
            >
              {/* Header fixed at top of sheet */}
              <div className="shrink-0 p-4 pb-2">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#ecd0dc]" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">
                      Admin alerts
                    </p>
                    <h2 className="mt-1 text-[20px] font-extrabold leading-tight text-[var(--color-brand-text)]">Мэдэгдэл</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="flex h-9 items-center justify-center rounded-full bg-white px-3 text-[11px] font-extrabold text-[var(--color-brand-muted)] shadow-[var(--shadow-mobile-card)] hover:text-[var(--color-brand-text)]"
                      >
                        <CheckCheck size={14} className="mr-1" /> Уншсан
                      </button>
                    )}
                    <button
                      onClick={() => setOpen(false)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[var(--shadow-mobile-card)] text-[var(--color-brand-text)]"
                      aria-label="Хаах"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+32px)]">
                <div className="space-y-3 pt-2">
                  {notifications.length === 0 && (
                    <div className="rounded-[20px] bg-white p-8 text-center shadow-[var(--shadow-mobile-card)]">
                      <p className="text-sm font-extrabold text-[var(--color-brand-muted)]">Шинэ мэдэгдэл алга байна.</p>
                    </div>
                  )}
                  {notifications.map((item) => {
                    const isRead = readIds.includes(item.id);
                    const Icon = item.type === 'order' ? ReceiptText : item.type === 'user' ? UserRound : Package;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => {
                          markAsRead(item.id);
                          setOpen(false);
                        }}
                        className={`relative flex min-h-[86px] gap-3 rounded-[20px] p-4 shadow-[var(--shadow-mobile-card)] transition-colors ${
                          isRead ? 'bg-white/60 opacity-75' : 'bg-white'
                        }`}
                      >
                        {!isRead && (
                          <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[var(--color-brand-accent)]" />
                        )}
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          item.isCritical ? 'bg-[#FFF0F3] text-[var(--color-brand-danger)]' : 'bg-[var(--color-brand-secondary)] text-[var(--color-brand-accent)]'
                        }`}>
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block pr-4 text-[14px] font-extrabold leading-snug text-[var(--color-brand-text)]">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-[13px] leading-relaxed text-[var(--color-brand-muted)]">
                            {item.body}
                          </span>
                          <span className="mt-2 block text-[10px] font-bold text-[var(--color-brand-muted)]">
                            {mounted ? formatRelativeMN(item.date) : ''}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

