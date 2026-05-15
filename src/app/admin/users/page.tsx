'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatMongolianDateTime } from '@/lib/format';
import { formatPrice } from '@/types';
import Pagination, { paginate } from '@/components/admin/Pagination';

function formatDate(date: any) {
  return formatMongolianDateTime(date);
}

const statusLabels: Record<string, string> = {
  pending: 'Хүлээгдэж байна',
  confirmed: 'Баталгаажсан',
  shipped: 'Хүргэлтэнд',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [ordersMap, setOrdersMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [page, setPage] = useState(1);

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

  useEffect(() => {
    setPage(1);
  }, [search]);

  const paginatedUsers = useMemo(() => paginate(filteredUsers, page, 10), [filteredUsers, page]);

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
        <p className="text-[10px] tracking-[0.1em] uppercase text-text-subtle">Харилцагчийн удирдлага</p>
        <h2 className="text-[22px] md:text-3xl font-semibold mt-1 text-charcoal">Хэрэглэгчид</h2>
      </div>

      <div className="md:hidden grid grid-cols-3 gap-2">
        <div className="metric-card px-3 py-3">
          <p className="text-[10px] text-text-subtle">Нийт</p>
          <p className="mt-1 text-xl font-semibold">{userSummary.total}</p>
        </div>
        <div className="metric-card bg-blush px-3 py-3">
          <p className="text-[10px] text-text-subtle">Захиалгатай</p>
          <p className="mt-1 text-xl font-semibold">{userSummary.customersWithOrders}</p>
        </div>
        <div className="metric-card border-status-confirmed-border bg-status-confirmed-bg px-3 py-3">
          <p className="text-[10px] text-status-confirmed-text">Админ</p>
          <p className="mt-1 text-xl font-semibold">{userSummary.admins}</p>
        </div>
      </div>

      <div className="surface-panel">
        <div className="p-4 md:p-5 border-b border-border-light/40">
          <div className="relative">
            <input
              type="text"
              placeholder="Нэр эсвэл имэйлээр хайх..."
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="field-control min-h-11 pl-10 pr-4 text-sm"
            />
            <svg className="absolute left-4 top-3.5 text-text-subtle" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>

        <div className="md:hidden space-y-3 bg-sand p-3">
          {loading ? (
            <div className="p-8 flex justify-center"><div className="w-7 h-7 border border-[#1A1A1A] border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredUsers.length === 0 ? (
            <p className="p-8 text-center text-sm text-text-subtle">Хэрэглэгч олдсонгүй</p>
          ) : paginatedUsers.map(user => (
            <div key={user.id} className="rounded-2xl border border-border-light/35 bg-white p-4 shadow-[0_8px_24px_rgba(26,26,26,0.045)]" onClick={() => setSelectedUser(user)}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-blush border border-border-light/50 flex items-center justify-center text-sm font-semibold">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{user.displayName || 'Нэргүй хэрэглэгч'}</p>
                  <p className="text-xs text-text-subtle truncate">{user.email}</p>
                </div>
                <span className={`rounded-[7px] border px-2 py-1 text-[10px] tracking-[0.04em] ${user.role === 'admin' ? 'border-dusty-rose bg-blush' : 'border-border-light/50 text-text-subtle'}`}>
                  {user.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-text-subtle">Захиалга</p><p>{ordersMap[user.id]?.length || 0}</p></div>
                <div><p className="text-xs text-text-subtle">Бүртгэл</p><p>{formatDate(user.createdAt)}</p></div>
              </div>
              <button onClick={(event) => toggleAdmin(user.id, user.role, event)} className="btn-secondary mt-4 min-h-11 w-full px-4 text-xs shadow-brand-sm">
                {user.role === 'admin' ? 'Админ эрх хасах' : 'Админ болгох'}
              </button>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1040px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[260px]" />
              <col className="w-[300px]" />
              <col className="w-[220px]" />
              <col className="w-[110px]" />
              <col className="w-[130px]" />
              <col className="w-[150px]" />
            </colgroup>
            <thead className="border-b border-border-light/35 bg-sand text-[11px] font-semibold tracking-[0.08em] uppercase text-text-subtle">
              <tr>
                <th className="px-5 py-3 text-left">Харилцагч</th>
                <th className="px-5 py-3 text-left">Имэйл</th>
                <th className="px-5 py-3 text-left">Бүртгэл</th>
                <th className="px-5 py-3 text-center">Захиалга</th>
                <th className="px-5 py-3 text-center">Эрх</th>
                <th className="px-5 py-3 text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2A8C8]/30">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center">Уншиж байна...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-text-subtle">Хэрэглэгч олдсонгүй</td></tr>
              ) : paginatedUsers.map(user => (
                <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-sand cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-[10px] bg-blush border border-border-light/50 flex items-center justify-center text-sm font-semibold">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="min-w-0 truncate font-medium">{user.displayName || 'Нэргүй'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-text-subtle"><span className="block truncate">{user.email}</span></td>
                  <td className="px-5 py-4 text-text-subtle">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4 text-center">{ordersMap[user.id]?.length || 0}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`rounded-[7px] border px-2 py-1 text-[10px] tracking-[0.04em] ${user.role === 'admin' ? 'border-dusty-rose bg-blush' : 'border-border-light/50 text-text-subtle'}`}>
                      {user.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={(event) => toggleAdmin(user.id, user.role, event)} className="btn-secondary min-h-9 px-3 text-xs">
                      {user.role === 'admin' ? 'Эрх хасах' : 'Админ болгох'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalItems={filteredUsers.length} onPageChange={setPage} />
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[100]">
          <button className="absolute inset-0 bg-charcoal/35 rounded-none cursor-default" onClick={() => setSelectedUser(null)} aria-label="Хаах" />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col overflow-hidden border-l border-border-light bg-sand shadow-[0_24px_80px_rgba(44,27,36,0.28)]">
            <div className="flex items-center justify-between border-b border-border-light/40 bg-white px-5 py-5 md:px-7">
              <div>
                <p className="text-[11px] tracking-[0.18em] uppercase text-text-subtle">Хэрэглэгч</p>
                <h3 className="text-xl font-semibold">{selectedUser.displayName || selectedUser.email}</h3>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-11 h-11 text-text-subtle" aria-label="Хаах">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
              <section className="rounded-[22px] border border-border-light bg-white p-5 shadow-brand-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border-light bg-blush text-lg font-semibold">
                    {(selectedUser.displayName || selectedUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{selectedUser.displayName || 'Нэргүй хэрэглэгч'}</p>
                    <p className="truncate text-sm text-text-muted">{selectedUser.email || '-'}</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border-faint pt-4">
                  <div>
                    <p className="text-xs text-text-subtle">Захиалга</p>
                    <p className="mt-1 text-lg font-semibold">{ordersMap[selectedUser.id]?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-subtle">Эрх</p>
                    <p className="mt-1 text-sm font-semibold">{selectedUser.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}</p>
                  </div>
                </div>
              </section>
              <section className="rounded-[22px] border border-border-light bg-white p-5 shadow-brand-sm">
              <h4 className="border-b border-border-light/40 pb-3 text-[11px] uppercase tracking-[0.18em] text-text-subtle">Захиалгын түүх</h4>
              {(!ordersMap[selectedUser.id] || ordersMap[selectedUser.id].length === 0) ? (
                <p className="pt-4 text-sm text-text-subtle">Захиалгын түүх алга байна.</p>
              ) : ordersMap[selectedUser.id].map(order => (
                <div key={order.id} className="mt-4 rounded-2xl border border-border-light/40 p-4 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
                  <div className="flex justify-between gap-4 border-b border-border-light/30 pb-3 mb-3">
                    <div>
                      <p className="text-xs text-text-subtle">{formatDate(order.createdAt)}</p>
                      <p className="text-xs tracking-[0.12em] uppercase text-text-subtle mt-1">#{order.id.slice(-6)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-subtle">{statusLabels[order.status] || order.status}</p>
                      <p className="font-medium mt-1">{formatPrice(order.total || 0)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {order.items?.map((item: any, index: number) => (
                      <div key={`${item.productId || item.id}-${index}`} className="flex justify-between text-xs">
                        <span>{item.name_mn || item.name} <span className="text-text-subtle">× {item.quantity}</span></span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
