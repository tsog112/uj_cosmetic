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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out ${
          isScrolled
            ? 'bg-sand/90 backdrop-blur-md py-4 border-b border-border'
            : 'bg-transparent py-8'
        }`}
      >
        <div className="max-content flex items-center justify-between">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-text-primary"
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
            <span className="font-serif text-3xl font-light tracking-[0.2em] text-text-primary">
              UJ
            </span>
            <span className="editorial-label text-[8px] tracking-[0.4em] -mt-1 opacity-60">
              Cosmetic
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-6 md:gap-8">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-text-primary hover:opacity-50 transition-opacity"
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
              className="relative text-text-primary hover:opacity-50 transition-opacity"
              aria-label="Сагс"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <path d="M3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
              {isHydrated && cartItemCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[9px] font-medium">
                  ({cartItemCount})
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
            <div className="relative h-full flex flex-col p-8">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="self-end text-text-primary p-2"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>

              <nav className="mt-20 flex flex-col gap-12 items-center">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="editorial-heading text-4xl">Нүүр</Link>
                <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="editorial-heading text-4xl">Дэлгүүр</Link>
                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="editorial-heading text-4xl">Бидний тухай</Link>
                {user ? (
                  <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="editorial-heading text-4xl">Бүртгэл</Link>
                ) : (
                  <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="editorial-heading text-4xl">Нэвтрэх</Link>
                )}
              </nav>

              <div className="mt-auto text-center">
                <p className="editorial-label opacity-40">UJ Cosmetic © {new Date().getFullYear()}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
