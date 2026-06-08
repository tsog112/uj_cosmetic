'use client';

import './admin.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Store } from 'lucide-react';
import AdminAccessGate from '@/components/admin/AdminAccessGate';
import AdminBottomTabBar from '@/components/admin/AdminBottomTabBar';
import { AdminNavIcon } from '@/components/admin/admin-nav-icons';
import NotificationBell from '@/components/admin/NotificationBell';
import { ToastProvider } from '@/components/admin/Toast';
import { adminShellClass } from '@/lib/layout/shell';
import { ADMIN_NAV_ITEMS, getAdminNavTitle } from '@/lib/constants/admin';
import type { AdminNavIconName } from '@/components/admin/admin-nav-icons';
import { useAdminStats } from '@/lib/hooks/useAdmin';

function isAdminNavActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: stats } = useAdminStats();
  const pageTitle = getAdminNavTitle(pathname);

  return (
    <ToastProvider>
      <div
        className={`${adminShellClass} md:flex-row md:bg-[var(--color-surface)]`}
        style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans', 'Roboto', 'Arial Unicode MS', sans-serif" }}
      >
        <header
          className="admin-glass fixed top-0 z-[var(--z-sticky)] w-full border-b border-[var(--color-border)] shadow-[var(--shadow-xs)] md:hidden"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex h-[56px] items-center justify-between px-4">
            <Link href="/admin" className="flex min-w-0 items-center gap-2.5" aria-label="Админ самбар">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)]">
                <Store size={18} strokeWidth={2.4} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-extrabold leading-none text-[var(--color-text-primary)]">
                  {pageTitle}
                </span>
                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  UJ Admin
                </span>
              </span>
            </Link>
            <NotificationBell />
          </div>
        </header>

        <aside className="hidden w-[248px] shrink-0 flex-col border-r-0 bg-[var(--color-surface)] md:flex">
          <div className="flex h-[72px] items-center px-5">
            <Link href="/admin" className="flex items-center gap-3" aria-label="Админ самбар">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)] text-[var(--color-text-inverse)]">
                <Store size={20} strokeWidth={2.4} />
              </span>
              <span>
                <span className="block text-[15px] font-extrabold leading-none text-[var(--color-text-primary)]">
                  UJ Cosmetic
                </span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Удирдлага
                </span>
              </span>
            </Link>
          </div>

          <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4 pb-8 hide-scrollbar">
            <nav className="flex flex-col gap-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                const isActive = isAdminNavActive(pathname, item.href);
                const badge =
                  'badgeKey' in item && item.badgeKey === 'pendingCount' ? stats?.pendingCount : undefined;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between gap-2 rounded-[14px] px-3.5 py-3 transition-all ${
                      isActive
                        ? 'bg-[var(--color-brand)] text-[var(--color-text-inverse)] shadow-[var(--shadow-glow)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)]'
                    }`}
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <AdminNavIcon
                        name={item.icon as AdminNavIconName}
                        size={18}
                        strokeWidth={isActive ? 2.4 : 2}
                        className={isActive ? 'text-[var(--color-text-inverse)]' : 'text-[var(--color-brand)]'}
                      />
                      <span className="truncate text-[13px] font-extrabold">{item.label}</span>
                    </span>
                    {badge !== undefined && badge > 0 && (
                      <span
                        className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                          isActive
                            ? 'bg-[var(--color-text-inverse)] text-[var(--color-brand)]'
                            : 'bg-[var(--color-status-cancel-text)] text-[var(--color-text-inverse)]'
                        }`}
                      >
                        {Math.min(badge, 99)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/"
              className="mt-6 flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-[13px] font-extrabold text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)]"
              style={{ textDecoration: 'none' }}
            >
              <LogOut size={18} />
              Дэлгүүр рүү буцах
            </Link>
          </div>
        </aside>

        <main className="admin-canvas flex-1 overflow-x-hidden md:h-[100dvh] md:overflow-y-auto">
          <div className="admin-glass sticky top-0 z-[var(--z-sticky)] hidden h-[72px] items-center justify-between border-b border-[var(--color-border)] px-8 md:flex">
            <h1 className="font-serif text-[22px] text-[var(--color-text-primary)]">{pageTitle}</h1>
            <NotificationBell />
          </div>

          <div className="mx-auto w-full max-w-5xl px-4 pt-[56px] pb-[calc(72px+env(safe-area-inset-bottom))] md:px-8 md:pt-6 md:pb-10">
            <AdminAccessGate>{children}</AdminAccessGate>
          </div>
        </main>

        <div className="md:hidden">
          <AdminBottomTabBar />
        </div>
      </div>
    </ToastProvider>
  );
}
