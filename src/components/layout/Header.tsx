'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, ShoppingBag, UserRound, X, Home, Grid2X2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import SearchOverlay from '@/components/ui/SearchOverlay';
import { AnimatePresence, motion } from 'framer-motion';

const NAV_LINKS = [
  { href: '/shop',  label: 'Дэлгүүр' },
  { href: '/about', label: 'Бидний тухай' },
];

export default function Header() {
  const [isScrolled,       setIsScrolled]       = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen]  = useState(false);
  const [isSearchOpen,     setIsSearchOpen]      = useState(false);
  const [isDropdownOpen,   setIsDropdownOpen]    = useState(false);
  const [hasAnnouncement,  setHasAnnouncement]   = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const { cartItemCount, isHydrated } = useCart();
  const { user, isAdmin, signOut }    = useAuth();
  const useOverlayHeader = pathname === '/' && !isScrolled;

  useEffect(() => {
    const handle = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handle);
    handle();
    return () => window.removeEventListener('scroll', handle);
  }, []);

  useEffect(() => {
    const handleAnnouncementVisibility = (event: Event) => {
      setHasAnnouncement(Boolean((event as CustomEvent<boolean>).detail));
    };

    window.addEventListener('announcement-visibility-change', handleAnnouncementVisibility);
    return () => window.removeEventListener('announcement-visibility-change', handleAnnouncementVisibility);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  const mobileNavItems = [
    { href: '/',                           label: 'Нүүр' },
    { href: '/shop',                       label: 'Дэлгүүр' },
    { href: '/about',                      label: 'Бидний тухай' },
    { href: user ? '/account' : '/auth',   label: user ? 'Профайл' : 'Нэвтрэх' },
  ];

  const bottomNavItems = [
    { href: '/',                           label: 'Нүүр',    icon: Home },
    { href: '/shop',                       label: 'Дэлгүүр', icon: Grid2X2 },
    { href: '/cart',                       label: 'Сагс',    icon: ShoppingBag },
    { href: user ? '/account' : '/auth',   label: user ? 'Профайл' : 'Нэвтрэх', icon: UserRound },
  ];

  return (
    <>
      {/* ── Desktop / Main Header ──────────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 z-50 transition-all duration-500 ${
          hasAnnouncement ? 'top-7 md:top-8' : 'top-0'
        } ${
          !useOverlayHeader
            ? 'bg-white/90 shadow-[0_1px_0_rgba(0,0,0,0.04),0_4px_24px_rgba(91,46,67,0.06)] backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="max-content flex h-16 items-center justify-between md:h-[72px]">
          {/* Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal md:hidden"
            aria-label="Цэс нээх"
          >
            <Menu size={22} strokeWidth={1.6} />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-9 md:flex">
            {NAV_LINKS.map(link => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                    active ? 'text-charcoal' : !useOverlayHeader ? 'text-charcoal/70 hover:text-charcoal' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-dusty-rose"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center">
            <span className={`font-serif text-[26px] font-light tracking-[0.22em] transition-colors md:text-[30px] ${
              !useOverlayHeader ? 'text-charcoal' : 'text-white'
            }`}>UJ</span>
            <span className={`mt-[-2px] text-[7px] font-bold uppercase tracking-[0.35em] transition-colors ${
              !useOverlayHeader ? 'text-dusty-rose' : 'text-dusty-rose/80'
            }`}>
              Beauty &amp; Wellness
            </span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1 md:gap-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                !useOverlayHeader ? 'text-charcoal/70 hover:text-charcoal' : 'text-white/70 hover:text-white'
              }`}
              aria-label="Хайх"
            >
              <Search size={19} strokeWidth={1.5} />
            </button>

            {/* Profile (desktop) */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              {user ? (
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                    !useOverlayHeader ? 'text-charcoal/70 hover:text-charcoal' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Профайл
                </button>
              ) : (
                <Link
                  href="/auth"
                  className={`text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                    !useOverlayHeader ? 'text-charcoal/70 hover:text-charcoal' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Нэвтрэх
                </Link>
              )}

              <AnimatePresence>
                {isDropdownOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-5 w-56 overflow-hidden rounded-xl border border-border-light bg-white py-2 shadow-brand-lg"
                  >
                    <div className="mb-1 border-b border-border-light px-5 pb-3 pt-2">
                      <p className="truncate text-xs font-semibold text-charcoal">
                        {user.displayName || user.email || 'UJ хэрэглэгч'}
                      </p>
                    </div>
                    <Link href="/account" className="block px-5 py-2.5 text-sm text-text-muted hover:bg-blush hover:text-charcoal transition-colors">
                      Миний захиалга
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="block px-5 py-2.5 text-sm font-semibold text-dusty-rose hover:bg-blush transition-colors">
                        Админ самбар
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="mt-1 w-full border-t border-border-light px-5 pt-3 pb-1 text-left text-sm text-text-muted hover:text-charcoal transition-colors"
                    >
                      Гарах
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <Link
              href="/cart"
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                !useOverlayHeader ? 'text-charcoal/70 hover:text-charcoal' : 'text-white/70 hover:text-white'
              }`}
              aria-label="Сагс"
            >
              <ShoppingBag size={19} strokeWidth={1.5} />
              {isHydrated && cartItemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-dusty-rose px-1 text-[9px] font-bold text-white shadow-brand-sm">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile full-screen menu ──────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] md:hidden"
          >
            <div className="absolute inset-0 bg-white" />
            <div className="relative flex h-full flex-col px-6 py-6">
              <div className="flex items-center justify-between">
                <Link href="/" className="font-serif text-2xl tracking-[0.2em] text-charcoal">UJ</Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal"
                  aria-label="Цэс хаах"
                >
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>

              <div className="mt-12">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-dusty-rose">
                  UJ Beauty &amp; Wellness
                </p>
              </div>

              <nav className="mt-8 flex flex-col gap-1">
                {mobileNavItems.map(item => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex min-h-[56px] items-center justify-between rounded-2xl px-5 text-lg font-medium transition-colors ${
                        active
                          ? 'bg-blush text-charcoal'
                          : 'text-charcoal/70 hover:bg-sand'
                      }`}
                    >
                      {item.label}
                      <span className="text-sm text-dusty-rose">→</span>
                    </Link>
                  );
                })}
              </nav>

              <p className="mt-auto border-t border-border-light pt-6 text-sm leading-7 text-text-muted">
                Солонгосын арьс арчилгаа, гоо сайхан, wellness бүтээгдэхүүнийг нэг дороос.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom tab bar ────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4">
          {bottomNavItems.map(item => {
            const Icon   = item.icon;
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
                  active ? 'text-charcoal' : 'text-text-muted'
                }`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors ${
                  active ? 'bg-blush text-charcoal' : ''
                }`}>
                  <Icon size={18} strokeWidth={active ? 1.8 : 1.4} />
                </span>
                <span className={active ? 'font-semibold' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
