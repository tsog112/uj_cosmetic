'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminNavIcon } from '@/components/admin/admin-nav-icons';
import type { AdminNavIconName } from '@/components/admin/admin-nav-icons';
import { useAdminStats } from '@/lib/hooks/useAdmin';
import { ADMIN_MOBILE_TAB_ITEMS } from '@/lib/constants/admin';

export default function AdminBottomTabBar() {
  const pathname = usePathname();
  const { data: stats } = useAdminStats();

  return (
    <div className="admin-bottom-bar fixed inset-x-0 bottom-0 z-[var(--z-drawer)] w-full">
      <nav
        className="mx-auto grid max-w-lg px-1.5"
        style={{ gridTemplateColumns: `repeat(${ADMIN_MOBILE_TAB_ITEMS.length}, minmax(0, 1fr))`, height: 64 }}
        aria-label="Админ үндсэн навигаци"
      >
        {ADMIN_MOBILE_TAB_ITEMS.map((tab) => {
          const isActive = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
          const badge =
            'badgeKey' in tab && tab.badgeKey === 'pendingCount' ? stats?.pendingCount : undefined;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="uj-pressable relative flex h-full min-w-0 flex-col items-center justify-center gap-[3px]"
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
                <AdminNavIcon
                  name={tab.icon as AdminNavIconName}
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  className={`relative z-10 transition-all duration-200 ${
                    isActive ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)]'
                  }`}
                />
                {badge !== undefined && badge > 0 && (
                  <span
                    className="absolute right-0.5 -top-1 z-20 flex h-[16px] min-w-[16px] items-center justify-center rounded-full border border-white px-1 text-[9px] font-bold leading-none text-white"
                    style={{ background: 'var(--color-brand-danger)', minHeight: 'auto' }}
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
                  letterSpacing: isActive ? '0.03em' : 0,
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
