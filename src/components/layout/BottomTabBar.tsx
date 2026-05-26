'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid, Heart, Home, ShoppingBag, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';

export default function BottomTabBar() {
  const pathname = usePathname();
  const { cartItemCount: totalItems } = useCart();

  const tabs = [
    { label: 'Home',     href: '/',         icon: Home },
    { label: 'Дэлгүүр', href: '/shop',      icon: Grid },
    { label: 'Сагс',     href: '/cart',      icon: ShoppingBag, badge: totalItems },
    { label: 'Хүсэл',    href: '/wishlist',  icon: Heart },
    { label: 'Profile',  href: '/account',   icon: User },
  ];

  return (
    <div
      className="fixed bottom-0 inset-x-0 mx-auto z-50 w-full max-w-[430px] pb-[env(safe-area-inset-bottom)]"
      style={{
        background: 'rgba(253, 232, 243, 0.92)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        borderTop: '1px solid rgba(233, 30, 140, 0.12)',
        boxShadow: '0 -4px 32px rgba(233, 30, 140, 0.10)',
      }}
    >
      <nav className="grid h-[64px] grid-cols-5 px-2">
        {tabs.map((tab) => {
          const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex h-full min-w-0 flex-col items-center justify-center gap-[3px]"
              aria-label={tab.label}
            >
              <div className="relative z-10 flex h-[32px] w-[54px] items-center justify-center">
                {/* Active pill background with spring slide */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="bottom-tab-pill"
                      className="absolute inset-0 rounded-[16px]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(233,30,140,0.14) 0%, rgba(194,24,91,0.10) 100%)',
                        boxShadow: '0 2px 12px rgba(233,30,140,0.12)',
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                </AnimatePresence>

                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  fill={isActive ? 'rgba(233,30,140,0.14)' : 'none'}
                  className="relative z-10 transition-all duration-200"
                  style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-medium)' }}
                />
                
                {tab.badge !== undefined && tab.badge > 0 && (
                  <motion.span
                    key={tab.badge}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute right-[4px] -top-1 z-20 flex h-[15px] min-w-[15px] items-center justify-center rounded-full border px-0.5 text-[9px] font-bold leading-none text-white"
                    style={{
                      background: 'var(--color-deep-rose)',
                      borderColor: 'var(--color-brand-bg)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {Math.min(tab.badge, 99)}
                  </motion.span>
                )}
              </div>

              {/* Label */}
              <span
                className="relative z-10 max-w-full truncate transition-all duration-200"
                style={{
                  fontFamily: isActive ? '"Montserrat", sans-serif' : 'inherit',
                  fontSize: 9.5,
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: isActive ? '0.04em' : 0,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-medium)',
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
