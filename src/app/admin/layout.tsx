'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { formatPrice } from '@/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin) {
        document.cookie = 'is_admin=false; path=/; max-age=0';
        router.replace('/');
      } else {
        document.cookie = 'is_admin=true; path=/; max-age=86400';
        setIsAuthorized(true);
        setupNotifications(user.uid);
      }
    }
  }, [user, isAdmin, loading, router]);

  const setupNotifications = async (uid: string) => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;
    
    let isInitialLoad = true;
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(20));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitialLoad) {
        const notifs: any[] = [];
        snapshot.forEach(doc => {
          notifs.push({ id: doc.id, ...doc.data(), isRead: true });
        });
        setNotifications(notifs);
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newOrder: any = { id: change.doc.id, ...change.doc.data(), isRead: false };
          setNotifications(prev => [newOrder, ...prev]);
          setUnreadCount(prev => prev + 1);
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 1000);
        }
      });
    });

    return () => unsubscribe();
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsBellOpen(false);
    router.push('/admin/orders');
  };

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <div className="w-8 h-8 border border-charcoal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { name: 'Хянах самбар', href: '/admin' },
    { name: 'Захиалгууд', href: '/admin/orders' },
    { name: 'Хэрэглэгчид', href: '/admin/users' },
    { name: 'Бүтээгдэхүүн', href: '/admin/products' },
    { name: 'Ангилал', href: '/admin/categories' },
    { name: 'Instagram', href: '/admin/instagram' },
    { name: 'Аналитик', href: '/admin/analytics' },
    { name: 'Тохиргоо', href: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-sand font-sans text-charcoal">
      {/* Sidebar */}
      <aside className="w-64 bg-sand border-r border-border flex flex-col flex-shrink-0 z-20">
        <div className="h-24 flex items-center px-8 border-b border-border">
          <Link href="/admin" className="flex flex-col">
            <span className="font-serif text-3xl font-light tracking-[0.2em] text-charcoal uppercase">
              UJ
            </span>
            <span className="editorial-label text-[8px] tracking-[0.4em] -mt-1 opacity-60">
              Admin
            </span>
          </Link>
        </div>
        <nav className="flex-1 py-8 flex flex-col gap-1 px-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 text-sm tracking-widest transition-colors duration-500 font-serif ${
                  isActive 
                    ? 'text-charcoal italic' 
                    : 'text-neutral-500 hover:text-charcoal hover:bg-black/5'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-6">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="editorial-label border-b border-charcoal/20 pb-1 hover:border-charcoal transition-colors flex items-center gap-2 w-fit"
          >
            <span>Дэлгүүр харах</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-sand/50">
        {/* Topbar */}
        <header className="h-24 border-b border-border flex items-center justify-between px-10 flex-shrink-0 relative z-10 bg-sand">
          <h1 className="font-serif text-2xl font-light tracking-wide text-charcoal">
            {navItems.find(item => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)))?.name || 'Хянах самбар'}
          </h1>
          
          <div className="flex items-center gap-8">
            
            {/* Bell Notification */}
            <div className="relative">
              <button 
                onClick={() => setIsBellOpen(!isBellOpen)}
                className={`relative p-2 text-neutral-500 hover:text-charcoal transition-colors ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-charcoal rounded-full" />
                )}
              </button>

              {/* Notification Dropdown */}
              {isBellOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-sand border border-border shadow-sm overflow-hidden py-2 z-50">
                  <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                    <h3 className="editorial-label text-charcoal">Мэдэгдэл</h3>
                    {unreadCount > 0 && (
                      <button onClick={() => {
                        setNotifications(prev => prev.map(n => ({...n, isRead: true})));
                        setUnreadCount(0);
                      }} className="text-[9px] uppercase tracking-widest text-neutral-500 hover:text-charcoal border-b border-transparent hover:border-charcoal transition-all">Бүгдийг уншсан болгох</button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-neutral-500 py-8 font-serif italic">Шинэ мэдэгдэл алга</p>
                    ) : (
                      notifications.slice(0, 10).map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => handleNotificationClick(notif)}
                          className={`px-6 py-4 cursor-pointer hover:bg-black/5 border-b border-border/50 last:border-0 transition-colors ${!notif.isRead ? 'bg-rose/10' : ''}`}
                        >
                          <p className="text-sm font-serif text-charcoal">
                            Шинэ захиалга: <span className="font-sans text-xs tracking-wide">{notif.customerName} - {formatPrice(notif.total)}</span>
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-2 uppercase tracking-widest">Саяхан</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pl-8 border-l border-border">
              <div className="text-right hidden md:block">
                <p className="font-serif italic text-sm text-charcoal leading-none mb-1">{user?.displayName || 'Админ'}</p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 leading-none">{user?.email}</p>
              </div>
              <button 
                onClick={() => {
                  document.cookie = 'is_admin=false; path=/; max-age=0';
                  signOut();
                }}
                className="editorial-label hover:text-charcoal transition-colors ml-4 border-b border-transparent hover:border-charcoal pb-0.5"
              >
                Гарах
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-10 lg:p-16 relative">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px) rotate(-2deg); }
          50% { transform: translateX(2px) rotate(2deg); }
          75% { transform: translateX(-2px) rotate(-2deg); }
        }
      `}</style>
    </div>
  );
}
