'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, LogOut, ChevronRight } from 'lucide-react';
import AdminBottomTabBar from '@/components/admin/AdminBottomTabBar';
import NotificationBell from '@/components/admin/NotificationBell';
import { ToastProvider } from '@/components/admin/Toast';
import { adminShellClass } from '@/lib/layout/shell';
import { ADMIN_SIDEBAR_ITEMS } from '@/lib/constants/admin';
import { useAdminStats } from '@/lib/hooks/useAdmin';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: stats } = useAdminStats();

  return (
    <ToastProvider>
      <div className={`${adminShellClass} md:max-w-none md:flex-row md:bg-[#f1dbe5]`}>
        {/* Mobile Header */}
        <header className="fixed top-0 z-[60] w-full border-b bg-white/92 backdrop-blur-xl md:hidden" style={{ borderColor: 'rgba(233,30,140,0.10)' }}>
          <div className="flex h-[60px] items-center justify-between px-4">
            <Link href="/admin" className="flex items-center gap-2" aria-label="Админ самбар">
              <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'var(--color-soft-pink)', color: 'var(--color-primary)' }}>
                <Store size={18} strokeWidth={2.4} />
              </span>
              <span>
                <span className="block text-[15px] font-extrabold leading-none text-[var(--color-brand-text)]">UJ Admin</span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">дэлгүүрийн удирдлага</span>
              </span>
            </Link>
            <NotificationBell />
          </div>
        </header>

        {/* Desktop Sidebar (hidden on mobile) */}
        <aside className="hidden w-[280px] shrink-0 flex-col md:flex" style={{ background: 'var(--color-brand-bg)', boxShadow: '10px 0 30px rgba(233,30,140,0.06)' }}>
          <div className="flex h-[72px] items-center justify-between px-6">
            <Link href="/admin" className="flex items-center gap-3" aria-label="Админ самбар">
              <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: 'linear-gradient(135deg, #E91E8C, #C2185B)', boxShadow: '0 4px 12px rgba(233,30,140,0.28)' }}>
                <Store size={20} strokeWidth={2.4} />
              </span>
              <span>
                <span className="block text-[16px] font-extrabold leading-none text-[var(--color-brand-text)]">UJ Cosmetic</span>
                <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Удирдлагын систем</span>
              </span>
            </Link>
          </div>

          <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6 pb-8 hide-scrollbar">
            <nav className="flex flex-col gap-2">
              {ADMIN_SIDEBAR_ITEMS.map((item) => {
                const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                const badge = 'badgeKey' in item && item.badgeKey === 'pendingCount' ? stats?.pendingCount : undefined;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between rounded-[16px] px-4 py-3.5 transition-all`}
                    style={isActive ? { background: 'linear-gradient(135deg, #E91E8C, #C2185B)', color: 'white', boxShadow: '0 4px 16px rgba(233,30,140,0.25)' } : { color: 'var(--color-text-medium)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[14px] font-extrabold ${isActive ? 'text-white' : ''}`}>
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {badge !== undefined && badge > 0 && (
                        <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${isActive ? 'bg-white text-[var(--color-brand-accent)]' : 'bg-[var(--color-brand-danger)] text-white'}`}>
                          {badge}
                        </span>
                      )}
                      {isActive && <ChevronRight size={16} className="text-white/80" />}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8">
              <Link href="/" className="flex items-center gap-3 rounded-[16px] px-4 py-3 text-[14px] font-extrabold text-[var(--color-brand-muted)] transition-all hover:bg-[var(--color-brand-secondary)] hover:text-[var(--color-brand-text)]">
                <LogOut size={18} />
                Дэлгүүр рүү буцах
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden md:h-[100dvh] md:overflow-y-auto">
          {/* Desktop Header */}
          <div className="hidden h-[72px] items-center justify-between px-8 md:flex" style={{ background: 'var(--color-brand-bg)', borderBottom: '1px solid rgba(233,30,140,0.08)' }}>
            <div>
              {/* Breadcrumb or Page Title could go here */}
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </div>

          <div className="mx-auto w-full max-w-5xl pt-[60px] pb-[86px] md:pt-6 md:px-8 md:pb-12">
            {children}
          </div>
        </main>

        <div className="md:hidden">
          <AdminBottomTabBar />
        </div>
      </div>
    </ToastProvider>
  );
}
