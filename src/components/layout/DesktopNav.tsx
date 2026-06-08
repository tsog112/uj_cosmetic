'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, Heart, Search, ShoppingBag, User } from 'lucide-react';
import SearchOverlay from '@/components/ui/SearchOverlay';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useNotifications } from '@/context/NotificationContext';
import { useWishlist } from '@/context/WishlistContext';

const NAV_LINKS = [
  { href: '/', label: '\u041d\u04ae\u04ae\u0420' },
  { href: '/shop', label: '\u0414\u042d\u041b\u0413\u04ae\u04ae\u0420' },
  { href: '/shop?onSale=true', label: '\u0425\u042f\u041c\u0414\u0420\u0410\u041b' },
];

export default function DesktopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cartItemCount } = useCart();
  const { user } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const { notifications, hasUnread, markRead } = useNotifications();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hasAnnouncement, setHasAnnouncement] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleAnnouncementVisibility = (event: Event) => {
      setHasAnnouncement(Boolean((event as CustomEvent<boolean>).detail));
    };
    window.addEventListener('announcement-visibility-change', handleAnnouncementVisibility);
    return () => window.removeEventListener('announcement-visibility-change', handleAnnouncementVisibility);
  }, []);

  useEffect(() => {
    if (!isNotifOpen) return;
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifWrapRef.current && !notifWrapRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
    };
    window.addEventListener('mousedown', onOutsideClick);
    return () => window.removeEventListener('mousedown', onOutsideClick);
  }, [isNotifOpen]);

  const visibleWishlistCount = user ? wishlistItems.length : 0;
  const toggleNotifications = () => {
    const next = !isNotifOpen;
    setIsNotifOpen(next);
    if (next) void markRead();
  };

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-[var(--z-sticky)] hidden transition-all duration-300 md:block ${hasAnnouncement ? 'top-9' : 'top-0'}`}
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: 'var(--border-thin)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div className="mx-auto flex h-[62px] max-w-[1280px] items-center justify-between px-6">
          <Link href="/" className="flex flex-col" aria-label="UJ Beauty & Wellness home" style={{ minHeight: 'auto', textDecoration: 'none' }}>
            <span className="text-[20px] font-extrabold leading-none text-[var(--color-brand)]">UJ</span>
            <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-primary)]">Beauty &amp; Wellness</span>
          </Link>

          <nav className="flex items-center gap-6" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => {
              const isSaleLink = link.href.includes('onSale=true');
              const saleActive = pathname === '/shop' && searchParams.get('onSale') === 'true';
              const isActive = link.href === '/'
                ? pathname === '/'
                : isSaleLink
                  ? saleActive
                  : pathname === '/shop' && !saleActive;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[12px] font-bold uppercase tracking-[0.08em] transition-colors"
                  style={{
                    color: isActive ? 'var(--color-brand)' : 'var(--color-text-primary)',
                    textDecoration: 'none',
                    minHeight: 'auto',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)]"
              style={{ color: 'var(--color-text-primary)', border: 'none', background: 'none' }}
              aria-label={'\u0425\u0430\u0439\u0445'}
            >
              <Search size={18} strokeWidth={1.8} />
            </button>

            <div className="relative" ref={notifWrapRef}>
              <button
                onClick={toggleNotifications}
                className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)]"
                style={{ color: 'var(--color-text-primary)', border: 'none', background: 'none' }}
                aria-label={'\u041c\u044d\u0434\u044d\u0433\u0434\u044d\u043b'}
              >
                <Bell size={18} strokeWidth={1.8} />
                {hasUnread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-brand)]" aria-hidden="true" />}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 top-12 z-[120] w-[340px] overflow-hidden rounded-[18px] border border-[#f0e8ed] bg-white shadow-[0_18px_44px_rgba(34,18,28,0.16)]">
                  <div className="flex items-center justify-between border-b border-[#f5eef1] px-4 py-3">
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">Мэдэгдэл</p>
                    <button
                      type="button"
                      onClick={() => router.push('/profile/notifications')}
                      className="text-[11px] font-semibold text-[var(--color-brand)]"
                    >
                      Бүгдийг харах
                    </button>
                  </div>
                  <div className="max-h-[340px] overflow-y-auto">
                    {notifications.length ? (
                      notifications.slice(0, 8).map((row) => (
                        <Link
                          key={row.id}
                          href={row.href || '/profile/orders'}
                          className="block border-b border-[#f7f1f4] px-4 py-3 last:border-b-0"
                          style={{ textDecoration: 'none' }}
                          onClick={() => setIsNotifOpen(false)}
                        >
                          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{row.title}</p>
                          <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{row.body}</p>
                        </Link>
                      ))
                    ) : (
                      <p className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">Шинэ мэдэгдэл алга.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link href="/wishlist" className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)]" style={{ color: 'var(--color-text-primary)', minHeight: 'auto' }} aria-label={'\u0425\u0430\u0434\u0433\u0430\u043b\u0441\u0430\u043d'}>
              <Heart size={18} strokeWidth={1.8} />
              {visibleWishlistCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[9px] font-bold text-white">{visibleWishlistCount}</span>}
            </Link>

            <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)]" style={{ color: 'var(--color-text-primary)', minHeight: 'auto' }} aria-label={'\u0421\u0430\u0433\u0441'}>
              <ShoppingBag size={18} strokeWidth={1.8} />
              {cartItemCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[9px] font-bold text-white">{cartItemCount}</span>}
            </Link>

            <Link href="/account" className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)]" style={{ color: 'var(--color-text-primary)', minHeight: 'auto' }} aria-label={'\u041f\u0440\u043e\u0444\u0430\u0439\u043b'}>
              <User size={18} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </header>

      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
