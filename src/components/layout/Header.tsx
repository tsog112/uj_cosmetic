'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import SearchOverlay from '@/components/ui/SearchOverlay';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const pathname = usePathname();
  const { cartItemCount, isHydrated } = useCart();
  const { user, isAdmin, signOut, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/shop', label: 'Дэлгүүр' },
    { href: '/about', label: 'Бидний тухай' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          isScrolled
            ? 'bg-[#FFF8FB]/95 backdrop-blur-md border-b border-[#F2A8C8]/40 shadow-[0_8px_24px_rgba(26,26,26,0.035)]'
            : 'bg-[#FFF8FB]/85 md:bg-transparent backdrop-blur-sm md:backdrop-blur-0'
        }`}
      >
        <div className="max-content h-[60px] md:h-20 flex items-center justify-between">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-text-primary"
            aria-label="Цэс"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M4 8h16M4 16h16" />
            </svg>
          </button>

          {/* Left Nav (Desktop) */}
          <nav className="hidden md:flex items-center gap-12">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="editorial-label hover:text-text-primary transition-colors duration-500"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="font-serif text-2xl md:text-3xl font-light tracking-[0.2em] text-text-primary">
              UJ
            </span>
            <span className="editorial-label text-[7px] md:text-[8px] tracking-[0.35em] md:tracking-[0.4em] -mt-1 opacity-60">
              Cosmetic
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-8">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-text-primary hover:opacity-50 transition-opacity"
              aria-label="Хайх"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            {/* User */}
            <div className="hidden md:block relative" ref={dropdownRef}>
              {user ? (
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="editorial-label hover:text-text-primary transition-colors"
                >
                  Бүртгэл
                </button>
              ) : (
                <Link href="/auth" className="editorial-label hover:text-text-primary transition-colors">
                  Нэвтрэх
                </Link>
              )}

              <AnimatePresence>
                {isDropdownOpen && user && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-6 w-48 bg-sand border border-border py-4 shadow-sm"
                  >
                    <div className="px-6 py-2 border-b border-border mb-2">
                      <p className="editorial-label text-[10px] text-text-primary truncate">{user.displayName || 'Хэрэглэгч'}</p>
                    </div>
                    <Link href="/account" className="block px-6 py-2 text-[11px] uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors">
                      Захиалгууд
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="block px-6 py-2 text-[11px] uppercase tracking-widest text-dusty-rose font-medium transition-colors">
                        Хянах самбар
                      </Link>
                    )}
                    <button 
                      onClick={() => signOut()}
                      className="w-full text-left px-6 py-2 text-[11px] uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors mt-2 border-t border-border"
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
              className="relative w-10 h-10 flex items-center justify-center text-text-primary hover:opacity-50 transition-opacity"
              aria-label="Сагс"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <path d="M3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
              {isHydrated && cartItemCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[9px] font-medium">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] md:hidden"
          >
            <div className="absolute inset-0 bg-sand" />
            <div className="relative h-full flex flex-col px-6 py-5">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="self-end text-text-primary p-2"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>

              <div className="mt-8">
                <p className="text-[10px] tracking-[0.18em] uppercase text-text-muted">UJ Cosmetic</p>
                <h2 className="mt-2 text-2xl font-semibold text-charcoal">Цэс</h2>
              </div>

              <nav className="mt-8 flex flex-col gap-3">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="min-h-14 rounded-[14px] border border-border bg-white/60 px-4 flex items-center justify-between text-lg font-medium">Нүүр <span className="text-text-muted">→</span></Link>
                <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="min-h-14 rounded-[14px] border border-border bg-white/60 px-4 flex items-center justify-between text-lg font-medium">Дэлгүүр <span className="text-text-muted">→</span></Link>
                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="min-h-14 rounded-[14px] border border-border bg-white/60 px-4 flex items-center justify-between text-lg font-medium">Бидний тухай <span className="text-text-muted">→</span></Link>
                {user ? (
                  <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="min-h-14 rounded-[14px] border border-border bg-white/60 px-4 flex items-center justify-between text-lg font-medium">Бүртгэл <span className="text-text-muted">→</span></Link>
                ) : (
                  <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="min-h-14 rounded-[14px] border border-border bg-white/60 px-4 flex items-center justify-between text-lg font-medium">Нэвтрэх <span className="text-text-muted">→</span></Link>
                )}
              </nav>

              <div className="mt-auto text-center">
                <p className="editorial-label opacity-40">UJ Cosmetic © {new Date().getFullYear()}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-sand/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(26,26,26,0.04)]">
        <div className="grid grid-cols-4">
          {[
            { href: '/', label: 'Нүүр', icon: 'M4 13h7V4H4v9Zm9 7h7V4h-7v16ZM4 20h7v-5H4v5Z' },
            { href: '/shop', label: 'Дэлгүүр', icon: 'M6 3h12l2 5H4l2-5ZM5 8v13h14V8M9 12h6' },
            { href: '/cart', label: 'Сагс', icon: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0' },
            { href: user ? '/account' : '/auth', label: user ? 'Бүртгэл' : 'Нэвтрэх', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
          ].map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`relative min-h-[62px] flex flex-col items-center justify-center gap-1 text-[10px] ${active ? 'text-charcoal' : 'text-text-muted'}`}>
                {active && <span className="absolute top-0 h-0.5 w-8 bg-[#FFB7D5]" />}
                <span className={`h-8 w-8 rounded-[8px] flex items-center justify-center ${active ? 'bg-blush' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={item.icon} />
                  </svg>
                </span>
                <span className={active ? 'font-medium' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Search Overlay */}
      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
