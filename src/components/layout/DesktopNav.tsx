'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, Heart, User, Bell, X, Tag, Sparkles, Truck, Copy, CheckCheck } from 'lucide-react';
import SearchOverlay from '@/components/ui/SearchOverlay';
import { useCart } from '@/context/CartContext';

const notifications = [
  {
    icon: Tag,
    title: 'Шинэ хэрэглэгчийн урамшуулал',
    body: 'WELCOME10 код ашиглаад эхний захиалгадаа хөнгөлөлт аваарай.',
    accent: '#E91E8C',
    bg: 'rgba(233,30,140,0.10)',
    code: 'WELCOME10',
  },
  {
    icon: Truck,
    title: 'Хүргэлтийн мэдээлэл',
    body: 'Тохирсон үнийн дүнгээс дээш захиалгад хүргэлт үнэгүй тооцогдоно.',
    accent: '#7C5CBF',
    bg: 'rgba(124,92,191,0.10)',
  },
  {
    icon: Sparkles,
    title: 'Шинэ бүтээгдэхүүнүүд',
    body: 'Сүүлийн нэмэгдсэн арьс арчилгааны бүтээгдэхүүнүүдийг дэлгүүр хэсгээс үзээрэй.',
    accent: '#E91E8C',
    bg: 'rgba(233,30,140,0.10)',
  },
];

const NAV_LINKS = [
  { href: '/',       label: 'Нүүр' },
  { href: '/shop',   label: 'Дэлгүүр' },
  { href: '/about',  label: 'Бидний тухай' },
  { href: '/reviews', label: 'Сэтгэгдэл' },
];

export default function DesktopNav() {
  const pathname = usePathname();
  const { cartItemCount } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(''), 1800);
  };

  return (
    <>
      {/* Desktop top nav bar — hidden on mobile */}
      <header
        className="fixed left-0 right-0 top-0 z-40 hidden md:block"
        style={{
          background: scrolled ? 'rgba(253,248,250,0.92)' : 'rgba(253,248,250,0.80)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: `1px solid rgba(233,30,140,${scrolled ? '0.16' : '0.08'})`,
          boxShadow: scrolled ? '0 4px 24px rgba(233,30,140,0.10)' : 'none',
          transition: 'all 0.25s ease',
        }}
      >
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-10">
          {/* Logo */}
          <Link href="/" className="flex flex-col" aria-label="UJ Cosmetic нүүр хуудас">
            <span
              style={{
                fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
                fontWeight: 500,
                fontSize: 30,
                lineHeight: 1,
                letterSpacing: '0.12em',
                color: 'var(--color-brand-text)',
              }}
            >
              UJ
            </span>
            <span
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontSize: 8,
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

          {/* Center nav links */}
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative rounded-full px-4 py-2 text-[13px] font-semibold transition-all"
                  style={{
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-dark)',
                    background: isActive ? 'rgba(233,30,140,0.08)' : 'transparent',
                  }}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute bottom-1 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full"
                      style={{ background: 'var(--color-primary)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all"
              style={{ color: 'var(--color-brand-text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(233,30,140,0.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              aria-label="Хайх"
            >
              <Search size={20} strokeWidth={1.8} />
            </button>

            {/* Notification */}
            <button
              onClick={() => { setIsNotifOpen(true); setHasUnread(false); }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all"
              style={{ color: 'var(--color-brand-text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(233,30,140,0.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              aria-label="Мэдэгдэл"
            >
              <Bell size={20} strokeWidth={1.8} />
              {hasUnread && (
                <span
                  className="absolute right-2.5 top-2 h-[7px] w-[7px] rounded-full border-[1.5px] border-[var(--color-brand-bg)]"
                  style={{ background: 'var(--color-brand-danger)' }}
                />
              )}
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all"
              style={{ color: 'var(--color-brand-text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,83,122,0.09)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              aria-label="Хүслийн жагсаалт"
            >
              <Heart size={20} strokeWidth={1.8} />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all"
              style={{ color: 'var(--color-brand-text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,83,122,0.09)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              aria-label="Сагс"
            >
              <ShoppingBag size={20} strokeWidth={1.8} />
              {cartItemCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                  style={{ background: 'var(--color-brand-danger)' }}
                >
                  {Math.min(cartItemCount, 99)}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link
              href="/account"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all"
              style={{ color: 'var(--color-brand-text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,83,122,0.09)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              aria-label="Профайл"
            >
              <User size={20} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </header>

      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}

      {/* Notification dropdown */}
      {isNotifOpen && (
        <div
          className="fixed inset-0 z-[70] hidden md:block"
          onClick={() => setIsNotifOpen(false)}
        >
          <div
            className="absolute right-4 top-[76px] w-[360px] overflow-hidden rounded-[20px]"
            style={{ background: 'white', boxShadow: '0 20px 60px rgba(26,15,20,0.16)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(200,83,122,0.10)' }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--color-brand-accent)' }}>Notifications</p>
                <h3 className="mt-0.5 text-[16px] font-bold" style={{ color: 'var(--color-brand-text)' }}>Мэдэгдэл</h3>
              </div>
              <button onClick={() => setIsNotifOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--color-brand-secondary)' }}>
                <X size={14} strokeWidth={2} />
              </button>
            </div>
            <div className="space-y-2 p-4">
              {notifications.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-[14px] p-3.5" style={{ background: 'var(--color-brand-surface)' }}>
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: item.bg, color: item.accent }}>
                        <Icon size={16} strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-bold" style={{ color: 'var(--color-brand-text)' }}>{item.title}</h4>
                        <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--color-brand-muted)' }}>{item.body}</p>
                      </div>
                    </div>
                    {item.code && (
                      <button onClick={() => copyCode(item.code!)} className="mt-3 flex h-9 w-full items-center justify-between rounded-full px-4" style={{ background: 'white', border: '1px solid rgba(200,83,122,0.15)' }}>
                        <span className="font-mono text-[12px] font-bold tracking-wider" style={{ color: 'var(--color-brand-text)' }}>{item.code}</span>
                        <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: 'var(--color-brand-accent)' }}>
                          {copiedCode === item.code ? <><CheckCheck size={12} /> Хуулсан</> : <><Copy size={12} /> Хуулах</>}
                        </span>
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
