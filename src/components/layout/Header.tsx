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
  const [isScrolled,      setIsScrolled]      = useState(false);
  const [isMobileMenuOpen,setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen,    setIsSearchOpen]     = useState(false);
  const [isDropdownOpen,  setIsDropdownOpen]   = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const { cartItemCount, isHydrated } = useCart();
  const { user, isAdmin, signOut }    = useAuth();

  /* ── scroll ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    const handle = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handle);
    handle();
    return () => window.removeEventListener('scroll', handle);
  }, []);

  /* ── click-outside dropdown ──────────────────────────────────────────── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── close on route change ───────────────────────────────────────────── */
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  /* ── mobile nav items (dynamic) ─────────────────────────────────────── */
  const mobileNavItems = [
    { href: '/',                           label: 'Нүүр' },
    { href: '/shop',                       label: 'Дэлгүүр' },
    { href: '/about',                      label: 'Бидний тухай' },
    { href: user ? '/account' : '/auth',   label: user ? 'Профайл' : 'Нэвтрэх' },
  ];

  const bottomNavItems = [
    { href: '/',                           label: 'Нүүр',   icon: Home },
    { href: '/shop',                       label: 'Дэлгүүр',icon: Grid2X2 },
    { href: '/cart',                       label: 'Сагс',   icon: ShoppingBag },
    { href: user ? '/account' : '/auth',   label: user ? 'Профайл' : 'Нэвтрэх', icon: UserRound },
  ];

  return (
    <>
      {/* ── Desktop / Main Header ──────────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'border-b border-border-light bg-sand/95 shadow-header backdrop-blur-md'
            : 'bg-sand/88 backdrop-blur-sm md:bg-transparent md:backdrop-blur-0'
        }`}
      >
        <div className="max-content flex h-[62px] items-center justify-between md:h-20">

          {/* Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center text-charcoal md:hidden"
            aria-label="Цэс нээх"
          >
            <Menu size={23} strokeWidth={1.7} />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal transition-opacity hover:opacity-60"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center">
            <span className="font-serif text-2xl font-light tracking-[0.18em] text-charcoal md:text-3xl">UJ</span>
            <span className="mt-[-3px] text-[7px] font-semibold uppercase tracking-[0.32em] text-dusty-rose md:text-[8px]">
              Beauty &amp; Wellness
            </span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1 md:gap-6">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center text-charcoal transition-opacity hover:opacity-55"
              aria-label="Хайх"
            >
              <Search size={20} strokeWidth={1.6} />
            </button>

            {/* Profile dropdown (desktop) */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              {user ? (
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal transition-opacity hover:opacity-60"
                >
                  Профайл
                </button>
              ) : (
                <Link
                  href="/auth"
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal transition-opacity hover:opacity-60"
                >
                  Нэвтрэх
                </Link>
              )}

              <AnimatePresence>
                {isDropdownOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-6 w-56 border border-border-light bg-sand py-4 shadow-dropdown"
                  >
                    <div className="mb-2 border-b border-border-light px-5 pb-3">
                      <p className="truncate text-xs font-semibold text-charcoal">
                        {user.displayName || user.email || 'UJ хэрэглэгч'}
                      </p>
                    </div>
                    <Link href="/account" className="block px-5 py-2 text-sm text-text-muted hover:text-charcoal">
                      Миний захиалга
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="block px-5 py-2 text-sm font-semibold text-dusty-rose">
                        Админ самбар
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="mt-2 w-full border-t border-border-light px-5 pt-3 text-left text-sm text-text-muted hover:text-charcoal"
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
              className="relative flex h-10 w-10 items-center justify-center text-charcoal transition-opacity hover:opacity-55"
              aria-label="Сагс"
            >
              <ShoppingBag size={20} strokeWidth={1.6} />
              {isHydrated && cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-dusty-rose px-1 text-[10px] font-semibold text-white">
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
            <div className="absolute inset-0 bg-sand" />
            <div className="relative flex h-full flex-col px-5 py-5">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="self-end p-2 text-charcoal"
                aria-label="Цэс хаах"
              >
                <X size={24} strokeWidth={1.6} />
              </button>

              <div className="mt-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-dusty-rose">
                  UJ Beauty &amp; Wellness
                </p>
                <h2 className="mt-3 font-serif text-4xl text-charcoal">Солонгос чанарыг таны гарт</h2>
              </div>

              <nav className="mt-10 flex flex-col gap-3">
                {mobileNavItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-14 items-center justify-between border border-border-light bg-white/55 px-4 text-lg font-medium text-charcoal transition-colors hover:bg-blush"
                  >
                    {item.label}
                    <span className="text-dusty-rose">→</span>
                  </Link>
                ))}
              </nav>

              <p className="mt-auto border-t border-border-light pt-5 text-sm leading-7 text-text-muted">
                Арьс арчилгаа, гоо сайхан, supplement сонголтыг нэг дороос.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom tab bar ────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border-light bg-sand/96 pb-[env(safe-area-inset-bottom)] shadow-nav backdrop-blur-md md:hidden">
        <div className="grid grid-cols-4">
          {bottomNavItems.map(item => {
            const Icon   = item.icon;
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-h-[62px] flex-col items-center justify-center gap-1 text-[10px] ${
                  active ? 'text-charcoal' : 'text-text-muted'
                }`}
              >
                {active && <span className="absolute top-0 h-0.5 w-8 bg-dusty-rose" />}
                <Icon size={19} strokeWidth={1.6} />
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
