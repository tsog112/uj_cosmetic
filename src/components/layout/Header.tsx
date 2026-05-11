'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, ShoppingBag, UserRound, X, Home, Grid2X2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import SearchOverlay from '@/components/ui/SearchOverlay';
import { AnimatePresence, motion } from 'framer-motion';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const { cartItemCount, isHydrated } = useCart();
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const navLinks = [
    { href: '/shop', label: 'Дэлгүүр' },
    { href: '/about', label: 'Бидний тухай' },
  ];

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${isScrolled ? 'border-b border-[#F2C7D8] bg-[#FFF8FB]/94 shadow-[0_8px_28px_rgba(89,48,67,0.07)] backdrop-blur-md' : 'bg-[#FFF8FB]/88 backdrop-blur-sm md:bg-transparent md:backdrop-blur-0'}`}>
        <div className="max-content flex h-[62px] items-center justify-between md:h-20">
          <button onClick={() => setIsMobileMenuOpen(true)} className="flex h-10 w-10 items-center justify-center text-[#1F191C] md:hidden" aria-label="Цэс нээх">
            <Menu size={23} strokeWidth={1.7} />
          </button>

          <nav className="hidden items-center gap-10 md:flex">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1F191C] transition-opacity hover:opacity-60">
                {link.label}
              </Link>
            ))}
          </nav>

          <Link href="/" className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center">
            <span className="font-serif text-2xl font-light tracking-[0.18em] text-[#1F191C] md:text-3xl">UJ</span>
            <span className="mt-[-3px] text-[7px] font-semibold uppercase tracking-[0.32em] text-[#D99AB6] md:text-[8px]">Beauty & Wellness</span>
          </Link>

          <div className="flex items-center gap-1 md:gap-6">
            <button onClick={() => setIsSearchOpen(true)} className="flex h-10 w-10 items-center justify-center text-[#1F191C] transition-opacity hover:opacity-55" aria-label="Хайх">
              <Search size={20} strokeWidth={1.6} />
            </button>

            <div className="relative hidden md:block" ref={dropdownRef}>
              {user ? (
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1F191C] transition-opacity hover:opacity-60">Профайл</button>
              ) : (
                <Link href="/auth" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1F191C] transition-opacity hover:opacity-60">Нэвтрэх</Link>
              )}

              <AnimatePresence>
                {isDropdownOpen && user && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-6 w-56 border border-[#F2C7D8] bg-[#FFF8FB] py-4 shadow-[0_18px_45px_rgba(89,48,67,0.10)]">
                    <div className="mb-2 border-b border-[#F2C7D8] px-5 pb-3">
                      <p className="truncate text-xs font-semibold text-[#1F191C]">{user.displayName || user.email || 'UJ хэрэглэгч'}</p>
                    </div>
                    <Link href="/account" className="block px-5 py-2 text-sm text-[#7B6670] hover:text-[#1F191C]">Миний захиалга</Link>
                    {isAdmin && <Link href="/admin" className="block px-5 py-2 text-sm font-semibold text-[#D99AB6]">Админ самбар</Link>}
                    <button onClick={() => signOut()} className="mt-2 w-full border-t border-[#F2C7D8] px-5 pt-3 text-left text-sm text-[#7B6670] hover:text-[#1F191C]">Гарах</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center text-[#1F191C] transition-opacity hover:opacity-55" aria-label="Сагс">
              <ShoppingBag size={20} strokeWidth={1.6} />
              {isHydrated && cartItemCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D99AB6] px-1 text-[10px] font-semibold text-white">{cartItemCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-[#FFF8FB]" />
            <div className="relative flex h-full flex-col px-5 py-5">
              <button onClick={() => setIsMobileMenuOpen(false)} className="self-end p-2 text-[#1F191C]" aria-label="Цэс хаах"><X size={24} strokeWidth={1.6} /></button>
              <div className="mt-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#D99AB6]">UJ Beauty & Wellness</p>
                <h2 className="mt-3 font-serif text-4xl text-[#1F191C]">Солонгос чанарыг таны гарт</h2>
              </div>
              <nav className="mt-10 flex flex-col gap-3">
                {[
                  { href: '/', label: 'Нүүр' },
                  { href: '/shop', label: 'Дэлгүүр' },
                  { href: '/about', label: 'Бидний тухай' },
                  { href: user ? '/account' : '/auth', label: user ? 'Профайл' : 'Нэвтрэх' },
                ].map(item => (
                  <Link key={item.href} href={item.href} className="flex min-h-14 items-center justify-between border border-[#F2C7D8] bg-white/55 px-4 text-lg font-medium text-[#1F191C]">
                    {item.label}<span className="text-[#D99AB6]">→</span>
                  </Link>
                ))}
              </nav>
              <p className="mt-auto border-t border-[#F2C7D8] pt-5 text-sm leading-7 text-[#7B6670]">Арьс арчилгаа, гоо сайхан, supplement сонголтыг нэг дороос.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#F2C7D8] bg-[#FFF8FB]/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(89,48,67,0.06)] backdrop-blur-md md:hidden">
        <div className="grid grid-cols-4">
          {[
            { href: '/', label: 'Нүүр', icon: Home },
            { href: '/shop', label: 'Дэлгүүр', icon: Grid2X2 },
            { href: '/cart', label: 'Сагс', icon: ShoppingBag },
            { href: user ? '/account' : '/auth', label: user ? 'Профайл' : 'Нэвтрэх', icon: UserRound },
          ].map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`relative flex min-h-[62px] flex-col items-center justify-center gap-1 text-[10px] ${active ? 'text-[#1F191C]' : 'text-[#7B6670]'}`}>
                {active && <span className="absolute top-0 h-0.5 w-8 bg-[#D99AB6]" />}
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
