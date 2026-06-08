'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Heart, Menu, Search, X } from 'lucide-react';
import CurrencyToggle from '@/components/ui/CurrencyToggle';
import SearchOverlay from '@/components/ui/SearchOverlay';
import NotificationSheet from '@/components/ui/NotificationSheet';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useWishlist } from '@/context/WishlistContext';

const ROOT_TABS = new Set(['/', '/shop', '/cart', '/profile']);
const NAV_LINKS = [
  { href: '/', label: '\u041d\u04af\u04af\u0440' },
  { href: '/shop', label: '\u0414\u044d\u043b\u0433\u04af\u04af\u0440' },
  { href: '/cart', label: '\u0421\u0430\u0433\u0441' },
  { href: '/profile', label: '\u041f\u0440\u043e\u0444\u0430\u0439\u043b' },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const { notifications, hasUnread, markRead } = useNotifications();
  const notificationsSeenKey = 'uj_customer_notifications_seen';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hasAnnouncement, setHasAnnouncement] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const wishlistCount = wishlistItems.length;

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

  const isRootTab = useMemo(() => pathname === '/' || ROOT_TABS.has(pathname || ''), [pathname]);
  const showCurrency = useMemo(
    () => Boolean(pathname && ['/shop', '/cart', '/checkout', '/wishlist'].some((p) => pathname.startsWith(p))),
    [pathname],
  );
  const topOffset = hasAnnouncement ? '36px' : '0px';

  const openNotifications = () => {
    const next = !isNotifOpen;
    setIsNotifOpen(next);
    setIsMobileMenuOpen(false);
    if (!next) return;
    void markRead();
    localStorage.setItem(notificationsSeenKey, '1');
  };

  return (
    <>
      <header
        className="fixed inset-x-0 z-[var(--z-sticky)] w-full transition-all duration-300"
        style={{
          top: topOffset,
          paddingTop: 'env(safe-area-inset-top)',
          background: scrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: 'var(--border-thin)',
          boxShadow: scrolled ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
        }}
      >
        <div className="grid h-[58px] w-full grid-cols-[52px_minmax(0,1fr)_148px] items-center px-3">
          <div className="flex items-center justify-start">
            {isRootTab ? (
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)]"
                style={{ color: 'var(--color-text-primary)' }}
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                aria-label={'\u0426\u044d\u0441 \u043d\u044d\u044d\u0445'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={21} strokeWidth={1.8} /> : <Menu size={21} strokeWidth={1.8} />}
              </button>
            ) : (
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)]"
                style={{ color: 'var(--color-text-primary)' }}
                onClick={() => router.back()}
                aria-label={'\u0411\u0443\u0446\u0430\u0445'}
              >
                <ArrowLeft size={22} strokeWidth={1.8} />
              </button>
            )}
          </div>

          <Link href="/" className="flex min-w-0 flex-col items-center justify-center" aria-label="UJ Beauty & Wellness home" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 27, fontWeight: 600, lineHeight: 1, letterSpacing: 0, color: 'var(--color-text-primary)' }}>UJ</span>
            <span style={{ marginTop: 1, fontSize: 9, fontWeight: 700, letterSpacing: '0.17em', lineHeight: 1, color: 'var(--color-brand)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Beauty &amp; Wellness
            </span>
          </Link>

          <div className="flex items-center justify-end gap-0.5">
            {showCurrency && (
              <div className="mr-0.5 hidden min-w-[124px] sm:block">
                <CurrencyToggle compact />
              </div>
            )}
            <button onClick={() => setIsSearchOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)]" style={{ color: 'var(--color-text-primary)' }} aria-label={'\u0425\u0430\u0439\u0445'}>
              <Search size={20} strokeWidth={1.8} />
            </button>
            <Link
              href="/wishlist"
              className="relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)]"
              style={{ color: 'var(--color-text-primary)', textDecoration: 'none', minHeight: 'auto' }}
              aria-label={'\u0425\u0430\u0434\u0433\u0430\u043b\u0441\u0430\u043d \u0431\u0430\u0440\u0430\u0430'}
            >
              <Heart size={20} strokeWidth={1.8} />
              {user && wishlistCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[9px] font-bold text-white">
                  {Math.min(wishlistCount, 9)}
                </span>
              )}
            </Link>
            <button onClick={openNotifications} className="relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)]" style={{ color: 'var(--color-text-primary)' }} aria-label={'\u041c\u044d\u0434\u044d\u0433\u0434\u044d\u043b'} aria-expanded={isNotifOpen}>
              <Bell size={20} strokeWidth={1.8} />
              {hasUnread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-brand)]" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="border-t bg-white md:hidden" style={{ borderColor: 'var(--color-border)' }} aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-[52px] items-center border-b px-6 text-[13px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)', textDecoration: 'none' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <NotificationSheet open={isNotifOpen} onClose={() => setIsNotifOpen(false)} notifications={notifications} />
      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
