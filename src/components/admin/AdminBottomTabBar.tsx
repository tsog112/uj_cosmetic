'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Settings, ShoppingBag, Users, Star, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminStats } from '@/lib/hooks/useAdmin';
import { ADMIN_NAV_ITEMS } from '@/lib/constants/admin';

export default function AdminBottomTabBar() {
  const pathname = usePathname();
  const { data: stats } = useAdminStats();

  const iconByKey = {
    dashboard: LayoutDashboard,
    orders: ShoppingBag,
    products: Package,
    customers: Users,
    reviews: Star,
    reports: BarChart3,
    settings: Settings,
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-brand-secondary)] bg-white/92 pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-bottom-nav)] backdrop-blur-xl">
      <nav className="mx-auto flex h-[68px] w-full max-w-[600px] items-center justify-between overflow-x-auto px-2 hide-scrollbar">
        {ADMIN_NAV_ITEMS.map((tab) => {
          const isActive = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
          const Icon = iconByKey[tab.key];
          const badge = tab.key === 'orders' ? stats?.pendingCount : undefined;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex h-full flex-1 min-w-[54px] max-w-[80px] flex-col items-center justify-center gap-1 rounded-xl px-1 transition-transform active:scale-95"
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon
                  size={23}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={isActive ? 'text-[var(--color-brand-accent)]' : 'text-[var(--color-brand-muted)]'}
                />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-[var(--color-brand-danger)] px-1 text-[10px] font-bold leading-none text-white">
                    {Math.min(badge, 99)}
                  </span>
                )}
              </div>
              <span className={`max-w-full truncate text-[10px] font-semibold leading-none ${isActive ? 'text-[var(--color-brand-accent)]' : 'text-[var(--color-brand-muted)]'}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="admin-tab-indicator"
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-[var(--color-brand-accent)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
