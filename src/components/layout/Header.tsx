'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import SearchOverlay from '@/components/ui/SearchOverlay';

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
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Нүүр' },
    { href: '/shop', label: 'Дэлгүүр' },
    { href: '/about', label: 'Бидний тухай' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-cream/95 backdrop-blur-md shadow-[0_1px_0_0_var(--color-border)]'
            : 'bg-cream shadow-[0_1px_0_0_var(--color-border)]'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="font-serif text-2xl tracking-[0.05em] text-text-primary">
                UJ
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[13px] tracking-[0.08em] uppercase transition-colors duration-200 ${
                    pathname === link.href
                      ? 'text-text-primary font-medium'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-5">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-text-primary hover:text-accent transition-colors"
                aria-label="Хайх"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative text-text-primary hover:text-accent transition-colors"
                aria-label="Сагс"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                {isHydrated && cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-accent text-text-primary text-[10px] font-medium rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* Auth */}
              <div className="hidden md:block relative" ref={dropdownRef}>
                {loading ? (
                  <div className="w-8 h-8 rounded-full bg-border animate-pulse" />
                ) : user ? (
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-8 h-8 rounded-full bg-accent text-text-primary flex items-center justify-center font-medium text-xs border border-accent overflow-hidden"
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      (user.displayName || user.email || 'U').charAt(0).toUpperCase()
                    )}
                  </button>
                ) : (
                  <Link href="/auth" className="text-[13px] tracking-wider uppercase text-text-muted hover:text-text-primary font-medium">
                    Нэвтрэх
                  </Link>
                )}

                {/* Dropdown */}
                {isDropdownOpen && user && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-border shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-border mb-2">
                      <p className="text-sm font-medium text-text-primary truncate">{user.displayName || 'Хэрэглэгч'}</p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                    <Link href="/account" className="block px-4 py-2 text-sm text-text-primary hover:bg-cream transition-colors">
                      Миний захиалгууд
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-accent font-medium hover:bg-cream transition-colors flex justify-between items-center">
                        Admin 
                        <span className="bg-accent/10 px-1.5 py-0.5 rounded text-[10px]">PRO</span>
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        signOut();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-cream transition-colors mt-2 border-t border-border"
                    >
                      Гарах
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-text-primary ml-1"
                aria-label="Цэс"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {isMobileMenuOpen ? (
                    <path d="M6 6L18 18M18 6L6 18" />
                  ) : (
                    <>
                      <path d="M4 7h16" />
                      <path d="M4 12h16" />
                      <path d="M4 17h16" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[300px] bg-cream animate-slide-in-right overflow-y-auto">
            <div className="p-6">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-6 right-6 text-text-primary"
                aria-label="Хаах"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 6L18 18M18 6L6 18" />
                </svg>
              </button>

              <div className="mt-16 flex flex-col gap-1">
                {user ? (
                  <div className="py-4 border-b border-border mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent text-text-primary flex items-center justify-center font-medium overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        (user.displayName || user.email || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{user.displayName || 'Хэрэглэгч'}</p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    className="block py-4 text-[15px] tracking-wider uppercase text-accent font-medium border-thin-b transition-colors"
                  >
                    Нэвтрэх / Бүртгүүлэх
                  </Link>
                )}

                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block py-3 text-[15px] tracking-wider uppercase border-thin-b transition-colors ${
                      pathname === link.href
                        ? 'text-text-primary font-medium'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                
                {user && (
                  <Link
                    href="/account"
                    className="block py-3 text-[15px] tracking-wider uppercase border-thin-b text-text-muted hover:text-text-primary transition-colors"
                  >
                    Миний захиалгууд
                  </Link>
                )}
                
                {user && isAdmin && (
                  <Link
                    href="/admin"
                    className="block py-3 text-[15px] tracking-wider uppercase border-thin-b text-accent font-medium transition-colors"
                  >
                    Admin
                  </Link>
                )}

                {user && (
                  <button
                    onClick={() => signOut()}
                    className="text-left block py-3 text-[15px] tracking-wider uppercase text-text-muted hover:text-text-primary transition-colors"
                  >
                    Гарах
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
