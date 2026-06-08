'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid, Home, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';

export default function BottomTabBar() {
  const pathname = usePathname();
  const { cartItemCount } = useCart();
  const { t } = useLocale();

  const tabs = [
    { label: t('nav.home'), href: '/', icon: Home },
    { label: t('nav.shop'), href: '/shop', icon: Grid },
    { label: t('nav.cart'), href: '/cart', icon: ShoppingBag, cart: true },
    { label: t('nav.profile'), href: '/profile', icon: User },
  ];

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[var(--z-drawer)] w-full pb-[env(safe-area-inset-bottom)]"
      style={{
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: 'var(--border-thin)',
        boxShadow: '0 -10px 30px rgba(34, 18, 28, 0.12)',
      }}
    >
      <nav className="grid h-[64px] grid-cols-4 px-2" aria-label="Мобайл үндсэн навигаци">
        {tabs.map((tab) => {
          const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const badge = tab.cart ? cartItemCount : 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex h-full min-w-0 flex-col items-center justify-center gap-[3px] uj-pressable"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              style={{ minHeight: 'auto', textDecoration: 'none' }}
            >
              <span className="relative flex h-8 w-14 items-center justify-center">
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'var(--color-brand-light)', boxShadow: 'var(--shadow-xs)' }}
                    aria-hidden="true"
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.15 : 1.65}
                  className="relative z-10 transition-all duration-200"
                  style={{ color: isActive ? 'var(--color-brand)' : 'var(--color-text-muted)' }}
                  aria-hidden="true"
                />
                {badge > 0 && (
                  <span
                    key={badge}
                    className="absolute right-1 -top-1 z-20 flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none text-white uj-cart-badge-pop"
                    style={{ background: 'var(--color-brand)', minHeight: 'auto' }}
                    aria-label={`${badge} бараа`}
                  >
                    {Math.min(badge, 99)}
                  </span>
                )}
              </span>
              <span
                className="relative z-10 max-w-full truncate transition-all duration-200"
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-brand)' : 'var(--color-text-muted)',
                  letterSpacing: isActive ? '0.04em' : 0,
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
