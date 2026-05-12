'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatMongolianDateTime } from '@/lib/format';
import { formatPrice } from '@/types';

function formatDate(date: any) {
  return formatMongolianDateTime(date);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [ordersMap, setOrdersMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    fetchUsersAndOrders();
  }, []);

  async function fetchUsersAndOrders() {
    setLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
        setUsers(usersSnap.docs.map(userDoc => ({ id: userDoc.id, ...userDoc.data() })));

        const ordersSnap = await getDocs(query(collection(db, 'orders')));
        const nextOrdersMap: Record<string, any[]> = {};
        ordersSnap.forEach(orderDoc => {
          const data = orderDoc.data();
          if (!data.userId) return;
          if (!nextOrdersMap[data.userId]) nextOrdersMap[data.userId] = [];
          nextOrdersMap[data.userId].push({ id: orderDoc.id, ...data });
        });
        setOrdersMap(nextOrdersMap);
      } else {
        setUsers([
          { id: '1', displayName: 'Mock User', email: 'user@test.com', role: 'user', createdAt: new Date() },
          { id: '2', displayName: 'Mock Admin', email: 'admin@test.com', role: 'admin', createdAt: new Date() },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();
    return users.filter(user =>
      !term ||
      (user.displayName?.toLowerCase() || '').includes(term) ||
      (user.email?.toLowerCase() || '').includes(term)
    );
  }, [users, search]);

  async function toggleAdmin(userId: string, currentRole: string, event: React.MouseEvent) {
    event.stopPropagation();
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Энэ хэрэглэгчийн эрхийг "${newRole.toUpperCase()}" болгох уу?`)) return;

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    }
    setUsers(prev => prev.map(user => user.id === userId ? { ...user, role: newRole } : user));
  }

  const userSummary = useMemo(() => {
    const admins = users.filter(user => user.role === 'admin').length;
    const customersWithOrders = users.filter(user => (ordersMap[user.id]?.length || 0) > 0).length;
    return { total: users.length, admins, customersWithOrders };
  }, [users, ordersMap]);

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Харилцагчийн удирдлага</p>
        <h2 className="text-[22px] md:text-3xl font-semibold mt-1 text-[#1A1A1A]">Хэрэглэгчид</h2>
      </div>

      <div className="md:hidden grid grid-cols-3 gap-2">
        <div className="rounded-[14px] border border-[#F2A8C8]/35 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#8B6B78]">Нийт</p>
          <p className="mt-1 text-xl font-semibold">{userSummary.total}</p>
        </div>
        <div className="rounded-[14px] border border-[#F2A8C8]/35 bg-[#FFF0F6] px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#8B6B78]">Захиалгатай</p>
          <p className="mt-1 text-xl font-semibold">{userSummary.customersWithOrders}</p>
        </div>
        <div className="rounded-[14px] border border-[#B9D7F2]/70 bg-[#EEF6FF] px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#315F8C]">Админ</p>
          <p className="mt-1 text-xl font-semibold">{userSummary.admins}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[16px] bg-white border border-[#F2A8C8]/40 shadow-[0_10px_30px_rgba(26,26,26,0.03)]">
        <div className="p-4 md:p-5 border-b border-[#F2A8C8]/40">
          <div className="relative">
            <input
              type="text"
              placeholder="Нэр эсвэл имэйлээр хайх..."
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="w-full min-h-11 rounded-[10px] border border-[#F2A8C8]/60 bg-[#FFF8FB] pl-10 pr-4 text-sm outline-none focus:border-[#FFB7D5] focus:bg-white"
            />
            <svg className="absolute left-4 top-3.5 text-[#8B6B78]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>

        <div className="md:hidden space-y-3 bg-[#FFF8FB] p-3">
          {loading ? (
            <div className="p-8 flex justify-center"><div className="w-7 h-7 border border-[#1A1A1A] border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredUsers.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#8B6B78]">Хэрэглэгч олдсонгүй</p>
          ) : filteredUsers.map(user => (
            <div key={user.id} className="rounded-[14px] border border-[#F2A8C8]/35 bg-white p-4 shadow-[0_8px_24px_rgba(26,26,26,0.045)]" onClick={() => setSelectedUser(user)}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-[12px] bg-[#FFF0F6] border border-[#F2A8C8]/50 flex items-center justify-center text-sm font-semibold">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{user.displayName || 'Нэргүй хэрэглэгч'}</p>
                  <p className="text-xs text-[#8B6B78] truncate">{user.email}</p>
                </div>
                <span className={`rounded-[7px] border px-2 py-1 text-[10px] tracking-[0.04em] ${user.role === 'admin' ? 'border-[#FFB7D5] bg-[#FFF0F6]' : 'border-[#F2A8C8]/50 text-[#8B6B78]'}`}>
                  {user.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-[#8B6B78]">Захиалга</p><p>{ordersMap[user.id]?.length || 0}</p></div>
                <div><p className="text-xs text-[#8B6B78]">Бүртгэл</p><p>{formatDate(user.createdAt)}</p></div>
              </div>
              <button onClick={(event) => toggleAdmin(user.id, user.role, event)} className="mt-4 w-full min-h-11 rounded-[10px] border border-[#FFB7D5] bg-[#FFF8FB] text-xs tracking-[0.08em]">
                {user.role === 'admin' ? 'Админ эрх хасах' : 'Админ болгох'}
              </button>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FFF8FB] text-[11px] tracking-[0.14em] uppercase text-[#8B6B78]">
              <tr>
                <th className="px-5 py-4 font-medium">Харилцагч</th>
                <th className="px-5 py-4 font-medium">Имэйл</th>
                <th className="px-5 py-4 font-medium">Бүртгэл</th>
                <th className="px-5 py-4 font-medium text-center">Захиалга</th>
                <th className="px-5 py-4 font-medium text-center">Эрх</th>
                <th className="px-5 py-4 font-medium text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2A8C8]/30">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center">Уншиж байна...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-[#8B6B78]">Хэрэглэгч олдсонгүй</td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-[#FFF8FB] cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-[10px] bg-[#FFF0F6] border border-[#F2A8C8]/50 flex items-center justify-center text-sm font-semibold">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{user.displayName || 'Нэргүй'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#8B6B78]">{user.email}</td>
                  <td className="px-5 py-4 text-[#8B6B78]">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4 text-center">{ordersMap[user.id]?.length || 0}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`rounded-[7px] border px-2 py-1 text-[10px] tracking-[0.04em] ${user.role === 'admin' ? 'border-[#FFB7D5] bg-[#FFF0F6]' : 'border-[#F2A8C8]/50 text-[#8B6B78]'}`}>
                      {user.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={(event) => toggleAdmin(user.id, user.role, event)} className="text-xs tracking-[0.14em] uppercase border-b border-[#FFB7D5] pb-1">
                      {user.role === 'admin' ? 'Эрх хасах' : 'Админ болгох'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[100]">
          <button className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setSelectedUser(null)} aria-label="Хаах" />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col">
            <div className="p-5 md:p-6 border-b border-[#F2A8C8]/40 bg-[#FFF8FB] flex items-center justify-between">
              <div>
                <p className="text-[11px] tracking-[0.18em] uppercase text-[#8B6B78]">Хэрэглэгч</p>
                <h3 className="text-xl font-semibold">{selectedUser.displayName || selectedUser.email}</h3>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-11 h-11 text-[#8B6B78]" aria-label="Хаах">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
              <h4 className="text-[11px] tracking-[0.18em] uppercase text-[#8B6B78] border-b border-[#F2A8C8]/40 pb-3">Захиалгын түүх</h4>
              {(!ordersMap[selectedUser.id] || ordersMap[selectedUser.id].length === 0) ? (
                <p className="text-sm text-[#8B6B78]">Захиалгын түүх алга байна.</p>
              ) : ordersMap[selectedUser.id].map(order => (
                <div key={order.id} className="rounded-[14px] border border-[#F2A8C8]/40 p-4 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
                  <div className="flex justify-between gap-4 border-b border-[#F2A8C8]/30 pb-3 mb-3">
                    <div>
                      <p className="text-xs text-[#8B6B78]">{formatDate(order.createdAt)}</p>
                      <p className="text-xs tracking-[0.12em] uppercase text-[#8B6B78] mt-1">#{order.id.slice(-6)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#8B6B78]">{order.status}</p>
                      <p className="font-medium mt-1">{formatPrice(order.total || 0)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {order.items?.map((item: any, index: number) => (
                      <div key={`${item.productId || item.id}-${index}`} className="flex justify-between text-xs">
                        <span>{item.name_mn || item.name} <span className="text-[#8B6B78]">× {item.quantity}</span></span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
