'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Search, X, Tag, Sparkles, Truck, Copy, CheckCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchOverlay from '@/components/ui/SearchOverlay';
import { useCart } from '@/context/CartContext';

const notifications = [
  {
    icon: Tag,
    title: 'Шинэ хэрэглэгчийн урамшуулал',
    body: 'WELCOME10 код ашиглаад эхний захиалгадаа хөнгөлөлт аваарай.',
    accent: '#E91E8C',
    bg: 'rgba(233,30,140,0.08)',
    code: 'WELCOME10',
  },
  {
    icon: Truck,
    title: 'Хүргэлтийн мэдээлэл',
    body: 'Тохирсон үнийн дүнгээс дээш захиалгад хүргэлт үнэгүй тооцогдоно.',
    accent: '#7C5CBF',
    bg: 'rgba(124,92,191,0.08)',
  },
  {
    icon: Sparkles,
    title: 'Шинэ бүтээгдэхүүнүүд',
    body: 'Сүүлийн нэмэгдсэн арьс арчилгааны бүтээгдэхүүнүүдийг дэлгүүр хэсгээс үзээрэй.',
    accent: '#E91E8C',
    bg: 'rgba(233,30,140,0.08)',
  },
];

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasAnnouncement, setHasAnnouncement] = useState(true);
  const [hasUnread, setHasUnread] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { cartItemCount } = useCart();
  const [prevCartCount, setPrevCartCount] = useState(cartItemCount);
  const [cartBounce, setCartBounce] = useState(false);

  useEffect(() => {
    if (cartItemCount > prevCartCount) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 500);
    }
    setPrevCartCount(cartItemCount);
  }, [cartItemCount, prevCartCount]);

  useEffect(() => {
    const handleAnnouncementVisibility = (event: Event) => {
      setHasAnnouncement(Boolean((event as CustomEvent<boolean>).detail));
    };
    window.addEventListener('announcement-visibility-change', handleAnnouncementVisibility);
    return () => window.removeEventListener('announcement-visibility-change', handleAnnouncementVisibility);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openNotifications = () => {
    setIsNotificationsOpen(true);
    setHasUnread(false);
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(''), 1800);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 mx-auto z-40 w-full max-w-[430px] md:hidden transition-all duration-300 ${hasAnnouncement ? 'top-9' : 'top-0'}`}
        style={{
          background: scrolled ? 'rgba(253, 232, 243, 0.92)' : 'rgba(253, 232, 243, 0.78)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          borderBottom: scrolled
            ? '1px solid rgba(233,30,140,0.16)'
            : '1px solid rgba(233,30,140,0.08)',
          boxShadow: scrolled ? '0 4px 24px rgba(233,30,140,0.10)' : 'none',
        }}
      >
        <div className="flex h-[58px] items-center justify-between px-5 w-full">
          {/* Brand wordmark */}
          <div className="flex flex-1 justify-start">
            <Link href="/" className="flex flex-col items-start" aria-label="UJ Beauty нүүр хуудас">
              <span
                style={{
                  fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
                  fontWeight: 600,
                  fontSize: 28,
                  lineHeight: 1,
                  letterSpacing: '0.10em',
                  color: 'var(--color-text-dark)',
                }}
              >
                UJ
              </span>
              <span
                style={{
                  fontFamily: '"Montserrat", sans-serif',
                  fontSize: 7.5,
                  fontWeight: 700,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--color-primary)',
                  marginTop: 2,
                  lineHeight: 1,
                }}
              >
                Beauty &amp; Wellness
              </span>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex flex-1 items-center justify-end gap-0.5">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all"
              style={{ color: 'var(--color-text-dark)' }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = 'rgba(233,30,140,0.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = 'transparent'; }}
              aria-label="Хайх"
            >
              <Search size={21} strokeWidth={1.7} />
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all"
              style={{ color: 'var(--color-text-dark)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(233,30,140,0.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
              aria-label="Хүсэл"
            >
              <Heart size={21} strokeWidth={1.7} />
            </Link>

            {/* Notifications with unread dot */}
            <button
              onClick={openNotifications}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all"
              style={{ color: 'var(--color-text-dark)' }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = 'rgba(233,30,140,0.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = 'transparent'; }}
              aria-label="Мэдэгдэл"
            >
              <Bell size={21} strokeWidth={1.7} />
              {hasUnread && (
                <span
                  className="absolute right-2.5 top-2 h-[7px] w-[7px] rounded-full border-[1.5px]"
                  style={{
                    background: 'var(--color-primary)',
                    borderColor: 'var(--color-brand-bg)',
                    animation: 'pulseSoft 1.5s ease-in-out infinite',
                  }}
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}

      {/* Notification drawer */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <motion.div
            className="fixed inset-0 left-1/2 z-[60] h-[100dvh] w-full max-w-[430px] -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ background: 'rgba(26,10,18,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          >
            <div className="absolute inset-0" onClick={() => setIsNotificationsOpen(false)} />
            <motion.div
              className="absolute bottom-0 left-0 right-0 max-h-[80dvh] overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+20px)]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                background: 'var(--color-brand-bg)',
                borderRadius: '28px 28px 0 0',
                boxShadow: '0 -20px 60px rgba(233,30,140,0.14)',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="h-1 w-10 rounded-full" style={{ background: 'rgba(233,30,140,0.20)' }} />
              </div>

              <div className="flex items-start justify-between px-5 pb-5">
                <div>
                  <p
                    className="text-label"
                    style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}
                  >
                    Notifications
                  </p>
                  <h3
                    className="mt-1"
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: 22,
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                      color: 'var(--color-text-dark)',
                    }}
                  >
                    Мэдэгдэл
                  </h3>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-all"
                  style={{ background: 'var(--color-soft-pink)', color: 'var(--color-text-dark)' }}
                  aria-label="Хаах"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              <div className="space-y-2.5 px-4 pb-4">
                {notifications.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.article
                      key={item.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="rounded-[20px] p-4"
                      style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(233,30,140,0.06)' }}
                    >
                      <div className="flex gap-3.5">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ background: item.bg, color: item.accent }}
                        >
                          <Icon size={17} strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[14px] font-bold leading-snug" style={{ color: 'var(--color-text-dark)' }}>
                            {item.title}
                          </h4>
                          <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--color-text-medium)' }}>
                            {item.body}
                          </p>
                        </div>
                      </div>

                      {item.code && (
                        <button
                          onClick={() => copyCode(item.code!)}
                          className="mt-3.5 flex h-10 w-full items-center justify-between rounded-full px-4 transition-all"
                          style={{ background: 'var(--color-soft-pink)', color: 'var(--color-text-dark)' }}
                        >
                          <span className="font-mono text-[12px] font-bold tracking-wider">{item.code}</span>
                          <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: 'var(--color-primary)' }}>
                            {copiedCode === item.code ? (
                              <><CheckCheck size={13} /> Хуулсан</>
                            ) : (
                              <><Copy size={13} /> Хуулах</>
                            )}
                          </span>
                        </button>
                      )}
                    </motion.article>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
