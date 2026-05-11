'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { formatPrice } from '@/types';

type NavItem = {
  name: string;
  shortName: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  { name: 'Хянах самбар', shortName: 'Самбар', href: '/admin', icon: 'D' },
  { name: 'Захиалгууд', shortName: 'Захиалга', href: '/admin/orders', icon: 'O' },
  { name: 'Хэрэглэгчид', shortName: 'Хэрэглэгч', href: '/admin/users', icon: 'U' },
  { name: 'Бүтээгдэхүүн', shortName: 'Бараа', href: '/admin/products', icon: 'P' },
  { name: 'Ангилал', shortName: 'Ангилал', href: '/admin/categories', icon: 'C' },
  { name: 'Instagram', shortName: 'Instagram', href: '/admin/instagram', icon: 'I' },
  { name: 'Аналитик', shortName: 'Аналитик', href: '/admin/analytics', icon: 'A' },
  { name: 'Тохиргоо', shortName: 'Тохиргоо', href: '/admin/settings', icon: 'S' },
];

const bottomNav = navItems.filter(item =>
  ['/admin', '/admin/orders', '/admin/products', '/admin/instagram'].includes(item.href)
);

function NavIcon({ href }: { href: string }) {
  const baseProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (href === '/admin') {
    return (
      <svg {...baseProps}>
        <path d="M4 13h6V4H4v9Z" />
        <path d="M14 20h6V4h-6v16Z" />
        <path d="M4 20h6v-3H4v3Z" />
      </svg>
    );
  }

  if (href === '/admin/orders') {
    return (
      <svg {...baseProps}>
        <path d="M7 4h10" />
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
      </svg>
    );
  }

  if (href === '/admin/users') {
    return (
      <svg {...baseProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M20 8v6" />
        <path d="M23 11h-6" />
      </svg>
    );
  }

  if (href === '/admin/products') {
    return (
      <svg {...baseProps}>
        <path d="M6 3h12l2 5H4l2-5Z" />
        <path d="M5 8v13h14V8" />
        <path d="M9 12h6" />
      </svg>
    );
  }

  if (href === '/admin/categories') {
    return (
      <svg {...baseProps}>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
        <path d="M8 6v12" />
      </svg>
    );
  }

  if (href === '/admin/instagram') {
    return (
      <svg {...baseProps}>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3" />
        <path d="M16.8 7.2h.01" />
      </svg>
    );
  }

  if (href === '/admin/analytics') {
    return (
      <svg {...baseProps}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15l3-4 3 2 4-7" />
      </svg>
    );
  }

  return (
    <svg {...baseProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6l-.08.08a2 2 0 0 1-3.84 0L10 20a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1l-.08-.08a2 2 0 0 1 0-3.84L4 10a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6l.08-.08a2 2 0 0 1 3.84 0L14 4a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.23.37.42.71.6 1l.08.08a2 2 0 0 1 0 3.84L20 14a1.7 1.7 0 0 0-.6 1Z" />
    </svg>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBellOpen, setIsBellOpen] = useState(false);

  const activeItem = useMemo(
    () => navItems.find(item => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))) || navItems[0],
    [pathname]
  );

  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin) {
        document.cookie = 'is_admin=false; path=/; max-age=0';
        router.replace('/');
      } else {
        document.cookie = 'is_admin=true; path=/; max-age=86400';
        setIsAuthorized(true);
      }
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    if (!isAuthorized || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    let isInitialLoad = true;
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      if (isInitialLoad) {
        setNotifications(snapshot.docs.map(orderDoc => ({ id: orderDoc.id, ...orderDoc.data(), isRead: true })));
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const newOrder = { id: change.doc.id, ...change.doc.data(), isRead: false };
          setNotifications(prev => [newOrder, ...prev].slice(0, 20));
          setUnreadCount(prev => prev + 1);
        }
      });
    });

    return () => unsubscribe();
  }, [isAuthorized]);

  useEffect(() => {
    setIsDrawerOpen(false);
    setIsBellOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    document.cookie = 'is_admin=false; path=/; max-age=0';
    signOut();
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      setNotifications(prev => prev.map(item => item.id === notif.id ? { ...item, isRead: true } : item));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsBellOpen(false);
    router.push('/admin/orders');
  };

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8FB]">
        <div className="w-8 h-8 border border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navLinkClass = (item: NavItem) => {
    const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
    return `flex items-center gap-3 min-h-11 px-3 py-3 text-sm transition-colors border-l-2 rounded-r-[8px] ${
      active
        ? 'bg-[#FFF0F6] border-[#FFB7D5] text-[#1A1A1A]'
        : 'border-transparent text-[#8B6B78] hover:bg-[#FFF0F6]/70 hover:text-[#1A1A1A]'
    }`;
  };

  const renderNav = () => (
    <nav className="flex flex-col gap-1">
      {navItems.map(item => (
        <Link key={item.href} href={item.href} className={navLinkClass(item)}>
          <span className="w-7 h-7 flex items-center justify-center text-current">
            <NavIcon href={item.href} />
          </span>
          <span>{item.name}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#FFF8FB] text-[#1A1A1A]">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[17rem] flex-col border-r border-[#F2A8C8]/40 bg-white/80 backdrop-blur-sm">
        <div className="h-24 px-7 flex items-center border-b border-[#F2A8C8]/40">
          <Link href="/admin" className="flex flex-col">
            <span className="font-serif text-3xl font-light tracking-[0.18em]">UJ</span>
            <span className="text-[9px] tracking-[0.28em] uppercase text-[#8B6B78]">Admin</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {renderNav()}
        </div>

        <div className="border-t border-[#F2A8C8]/40 p-5 space-y-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center border border-[#FFB7D5] text-[#1A1A1A] text-xs tracking-[0.12em] uppercase hover:bg-[#FFF0F6] transition-colors"
          >
            Дэлгүүр харах
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full text-left text-xs tracking-[0.12em] uppercase text-[#8B6B78] hover:text-[#1A1A1A] transition-colors"
          >
            Гарах
          </button>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-40 h-[58px] border-b border-[#F2A8C8]/40 bg-white/95 backdrop-blur-md shadow-[0_6px_20px_rgba(26,26,26,0.03)]">
        <div className="h-full px-3 flex items-center justify-between">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-[#1A1A1A]"
            aria-label="Админ цэс нээх"
          >
            <span className="space-y-1.5" aria-hidden="true">
              <span className="block w-5 h-[1.5px] bg-current" />
              <span className="block w-5 h-[1.5px] bg-current" />
              <span className="block w-5 h-[1.5px] bg-current" />
            </span>
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-[15px] font-medium leading-none text-[#1A1A1A]">{activeItem.name}</p>
            <p className="text-[9px] tracking-[0.2em] uppercase text-[#8B6B78] mt-1.5">UJ Admin</p>
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center border border-[#FFB7D5] text-[#1A1A1A] bg-[#FFF8FB]"
            aria-label="Дэлгүүр харах"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 10h16l-1-5H5l-1 5Z" />
              <path d="M6 10v9h12v-9" />
              <path d="M9 19v-5h6v5" />
            </svg>
          </Link>
        </div>
      </header>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/20" onClick={() => setIsDrawerOpen(false)} aria-label="Цэс хаах" />
          <div className="absolute left-0 top-0 h-full w-[min(320px,86vw)] bg-white shadow-2xl flex flex-col">
            <div className="h-20 px-5 border-b border-[#F2A8C8]/40 flex items-center justify-between">
              <Link href="/admin" className="font-serif text-3xl tracking-[0.18em]">UJ</Link>
              <button onClick={() => setIsDrawerOpen(false)} className="w-11 h-11 text-[#8B6B78]" aria-label="Цэс хаах">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              {renderNav()}
            </div>
            <div className="p-5 border-t border-[#F2A8C8]/40">
              <button onClick={handleSignOut} className="w-full min-h-11 text-left text-sm text-[#8B6B78]">
                Гарах
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-[17rem] min-h-screen flex flex-col">
        <header className="hidden lg:flex h-20 border-b border-[#F2A8C8]/40 bg-white/75 backdrop-blur-sm items-center justify-between px-8 xl:px-10 sticky top-0 z-20">
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#8B6B78]">Admin</p>
            <h1 className="font-serif text-2xl font-light">{activeItem.name}</h1>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 inline-flex items-center border border-[#FFB7D5] px-4 text-xs tracking-[0.14em] uppercase hover:bg-[#FFF0F6] transition-colors"
            >
              Дэлгүүр харах
            </Link>

            <div className="relative">
              <button
                onClick={() => setIsBellOpen(prev => !prev)}
                className="relative w-11 h-11 flex items-center justify-center text-[#8B6B78] hover:text-[#1A1A1A]"
                aria-label="Мэдэгдэл"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[#FFB7D5]" />}
              </button>

              {isBellOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-[#F2A8C8]/50 shadow-[0_18px_45px_rgba(26,26,26,0.08)] z-50">
                  <div className="px-5 py-4 border-b border-[#F2A8C8]/40 flex items-center justify-between">
                    <h3 className="text-xs tracking-[0.18em] uppercase">Мэдэгдэл</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => {
                          setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
                          setUnreadCount(0);
                        }}
                        className="text-[10px] text-[#8B6B78] hover:text-[#1A1A1A]"
                      >
                        Уншсан
                      </button>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-sm text-[#8B6B78] py-8">Шинэ мэдэгдэл алга</p>
                    ) : notifications.slice(0, 10).map(notif => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`block w-full text-left px-5 py-4 border-b border-[#F2A8C8]/25 hover:bg-[#FFF8FB] ${!notif.isRead ? 'bg-[#FFF0F6]' : ''}`}
                      >
                        <p className="text-sm text-[#1A1A1A]">Шинэ захиалга: {notif.customerName || 'Харилцагч'}</p>
                        <p className="text-xs text-[#8B6B78] mt-1">{formatPrice(notif.total || 0)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pl-5 border-l border-[#F2A8C8]/40">
              <p className="text-sm text-right">{user?.displayName || 'Админ'}</p>
              <p className="text-[10px] text-[#8B6B78]">{user?.email}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 sm:p-6 lg:p-8 xl:p-10 pb-24 lg:pb-10">
          <div className="max-w-[1240px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#F2A8C8]/40 bg-white/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(26,26,26,0.04)]">
        <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {bottomNav.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative min-h-[62px] flex flex-col items-center justify-center gap-1 text-[10px] transition-colors ${
                  active ? 'text-[#1A1A1A]' : 'text-[#8B6B78]'
                }`}
              >
                {active && <span className="absolute top-0 h-0.5 w-8 bg-[#FFB7D5]" />}
                <span className={`h-8 w-8 flex items-center justify-center rounded-[8px] transition-colors ${
                  active ? 'bg-[#FFF0F6] text-[#1A1A1A]' : 'text-[#8B6B78]'
                }`}>
                  <NavIcon href={item.href} />
                </span>
                <span className={`leading-none ${active ? 'font-medium' : ''}`}>{item.shortName}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
