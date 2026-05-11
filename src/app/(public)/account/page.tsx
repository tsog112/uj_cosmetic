'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import AuthGuard from '@/components/ui/AuthGuard';

function AccountContent() {
  const { user, isAdmin, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
          const q = query(
            collection(db, "orders"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
          
          const querySnapshot = await getDocs(q);
          const fetchedOrders: any[] = [];
          querySnapshot.forEach((doc) => {
            fetchedOrders.push({ id: doc.id, ...doc.data() });
          });
          setOrders(fetchedOrders);
        } else {
          // Mock fetch
          const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
          const userOrders = mockOrders.filter((o: any) => o.userId === user.uid).reverse();
          setOrders(userOrders);
        }
      } catch (error) {
        console.error("Error fetching user orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, [user]);

  const formatDate = (date: any) => {
    if (!date) return '-';
    if (date.toDate) return date.toDate().toLocaleString('mn-MN');
    if (typeof date === 'string') return new Date(date).toLocaleString('mn-MN');
    return '-';
  };

  if (!user) return null;

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-10 pt-24 pb-10 md:py-20">
      <p className="text-[10px] tracking-[0.14em] uppercase text-[#8B6B78]">Бүртгэл</p>
      <h1 className="mt-1 text-[28px] md:text-4xl font-semibold text-[#1A1A1A] mb-6 md:mb-10">Миний бүртгэл</h1>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-10">
        {/* Sidebar / Profile Info */}
        <div>
          <div className="bg-white border border-[#F2A8C8]/40 rounded-[18px] p-5 md:p-8 text-center md:sticky md:top-[120px] shadow-[0_10px_30px_rgba(26,26,26,0.035)]">
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-[#FFF0F6] border border-[#F2A8C8]/50 text-text-primary rounded-[18px] flex items-center justify-center text-3xl font-medium mb-4 overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                (user.displayName || user.email || 'U').charAt(0).toUpperCase()
              )}
            </div>
            
            <h2 className="text-lg font-medium text-text-primary mb-1">{user.displayName || 'Хэрэглэгч'}</h2>
            <p className="text-sm text-text-muted mb-5 break-all">{user.email}</p>

            {isAdmin && (
              <Link
                href="/admin"
                className="mb-3 flex min-h-12 w-full items-center justify-center rounded-[12px] bg-[#1A1A1A] px-4 text-sm font-medium text-white transition-colors hover:bg-[#FFB7D5] hover:text-[#1A1A1A]"
              >
                Админ самбар руу орох
              </Link>
            )}
            
            <button 
              onClick={() => signOut()}
              className="w-full min-h-12 rounded-[12px] border border-[#F2A8C8] bg-[#FFF8FB] text-sm font-medium text-[#1A1A1A]"
            >
              Гарах
            </button>
          </div>
        </div>

        {/* Order History */}
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4 md:mb-6">Захиалгын түүх</h2>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-cream-dark w-full" />
              <div className="h-32 bg-cream-dark w-full" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-[#F2A8C8]/40 rounded-[18px] p-8 md:p-10 text-center">
              <p className="text-text-muted mb-4">Та одоогоор захиалга хийгээгүй байна.</p>
              <Link href="/shop" className="text-[#D86FA0] hover:text-text-primary font-medium transition-colors">
                Дэлгүүр рүү буцах
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white border border-[#F2A8C8]/40 rounded-[18px] p-4 md:p-6 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-4 border-b border-border">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Захиалгын дугаар</p>
                      <p className="font-medium text-text-primary break-all">#{order.id.slice(0, 10)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Огноо</p>
                      <p className="text-sm text-text-primary">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Төлөв</p>
                      <span className={`inline-block px-3 py-1 text-xs font-medium ${
                        order.status === 'Хүлээгдэж байна' ? 'bg-cream text-text-muted' :
                        order.status === 'Баталгаажсан' ? 'bg-accent/20 text-accent' :
                        'bg-text-primary text-white'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Нийт дүн</p>
                      <p className="font-medium text-accent">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {order.items?.map((item: any, idx: number) => {
                      const name = item.name_mn ?? item.name ?? 'Нэргүй бараа';
                      const price = item.price ?? 0;
                      return (
                      <div key={idx} className="flex justify-between items-center text-sm">
                       <span className="text-text-primary min-w-0 pr-3">{name} <span className="text-text-muted">× {item.quantity}</span></span>
                        <span className="text-text-primary">{formatPrice(price * item.quantity)}</span>
                      </div>
                    )})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountContent />
    </AuthGuard>
  );
}
