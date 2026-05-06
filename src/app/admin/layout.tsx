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
        // If not logged in or not admin, clear cookie and redirect
        document.cookie = 'is_admin=false; path=/; max-age=0';
        router.replace('/');
      } else {
        // Set an explicit cookie for the middleware to read
        document.cookie = 'is_admin=true; path=/; max-age=86400';
        setIsAuthorized(true);
        setupNotifications(user.uid);
      }
    }
  }, [user, isAdmin, loading, router]);

  const setupNotifications = async (uid: string) => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;
    
    // 1. Setup Firestore Realtime Listener
    let isInitialLoad = true;
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(20));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitialLoad) {
        // Initial load - just populate the dropdown, don't trigger "new" notifications
        const notifs: any[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          // We'll mark new ones locally or rely on a 'read' array field. 
          // For simplicity, let's say all loaded initially are "read" in this session, unless we store it.
          notifs.push({ id: doc.id, ...data, isRead: true });
        });
        setNotifications(notifs);
        isInitialLoad = false;
        return;
      }

      // Subsequent updates
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newOrder: any = { id: change.doc.id, ...change.doc.data(), isRead: false };
          
          setNotifications(prev => [newOrder, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Shake animation
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 1000);

          // Browser Notification Fallback (if FCM not backgrounded)
          if (Notification.permission === 'granted') {
            new Notification('UJ Cosmetic Шинэ захиалга!', {
              body: `Харилцагч: ${newOrder.customerName} · Дүн: ${formatPrice(newOrder.total)}`,
              icon: '/favicon.ico'
            });
          }
        }
      });
    });

    // 2. Setup FCM
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const messaging = getMessaging();
          const currentToken = await getToken(messaging, { 
            vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' // This would be configured in reality
          });
          
          if (currentToken) {
            await updateDoc(doc(db, "users", uid), { fcmToken: currentToken });
          }

          onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            // Notifications are handled by onSnapshot primarily for UI, but this catches FCM push
          });
        }
      }
    } catch (error) {
      console.log('FCM setup skipped/failed (requires valid vapid key & SW):', error);
    }

    return () => unsubscribe();
  };

  const handleNotificationClick = (notif: any) => {
    // Mark as read
    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsBellOpen(false);
    router.push('/admin/orders');
  };

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { name: 'Хянах самбар', href: '/admin' },
    { name: 'Захиалгууд', href: '/admin/orders' },
    { name: 'Хэрэглэгчид', href: '/admin/users' },
    { name: 'Бүтээгдэхүүн', href: '/admin/products' },
    { name: 'Аналитик', href: '/admin/analytics' },
    { name: 'Тохиргоо', href: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F7F7] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A1A1A] text-white flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <span className="font-serif text-xl text-accent tracking-wider">UJ ADMIN</span>
        </div>
        <nav className="flex-1 py-6 flex flex-col gap-2 px-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 rounded-md text-sm font-bold transition-colors ${
                  isActive 
                    ? 'bg-[#FFB7D5] text-[#1A1A1A]' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 relative z-50">
          <h1 className="text-lg font-bold text-gray-800">UJ Cosmetic Admin</h1>
          
          <div className="flex items-center gap-6">
            
            {/* Bell Notification */}
            <div className="relative">
              <button 
                onClick={() => setIsBellOpen(!isBellOpen)}
                className={`relative p-2 text-gray-500 hover:text-gray-800 transition-colors ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isBellOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-2 animate-fade-in">
                  <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Мэдэгдэл</h3>
                    {unreadCount > 0 && (
                      <button onClick={() => {
                        setNotifications(prev => prev.map(n => ({...n, isRead: true})));
                        setUnreadCount(0);
                      }} className="text-xs text-accent hover:underline">Бүгдийг уншсан</button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-sm text-gray-500 py-6">Мэдэгдэл алга байна</p>
                    ) : (
                      notifications.slice(0, 10).map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => handleNotificationClick(notif)}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0 ${!notif.isRead ? 'bg-[#FFF0F6]/30' : ''}`}
                        >
                          <p className="text-sm text-gray-800">
                            <span className="font-bold text-accent">Шинэ захиалга:</span> {notif.customerName} - {formatPrice(notif.total)}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1 uppercase">Саяхан</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold overflow-hidden border border-gray-200">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  (user?.displayName || user?.email || 'A').charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-sm">
                <p className="font-bold text-gray-900 leading-none mb-1">{user?.displayName || 'Админ'}</p>
                <p className="text-xs text-gray-500 leading-none">{user?.email}</p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                document.cookie = 'is_admin=false; path=/; max-age=0';
                signOut();
              }}
              className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors bg-gray-50 px-3 py-1.5 rounded"
            >
              Гарах
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px) rotate(-5deg); }
          50% { transform: translateX(4px) rotate(5deg); }
          75% { transform: translateX(-4px) rotate(-5deg); }
        }
      `}</style>
    </div>
  );
}
