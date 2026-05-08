'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { formatPrice } from '@/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [ordersMap, setOrdersMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Drawer state for user order history
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchUsersAndOrders();
  }, []);

  const fetchUsersAndOrders = async () => {
    setLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        // Fetch users
        const uQ = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const uSnap = await getDocs(uQ);
        const fetchedUsers: any[] = [];
        uSnap.forEach(doc => {
          fetchedUsers.push({ id: doc.id, ...doc.data() });
        });
        setUsers(fetchedUsers);

        const oQ = query(collection(db, "orders"));
        const oSnap = await getDocs(oQ);
        const oMap: Record<string, any[]> = {};
        oSnap.forEach(doc => {
          const data = doc.data();
          if (data.userId) {
            if (!oMap[data.userId]) oMap[data.userId] = [];
            oMap[data.userId].push({ id: doc.id, ...data });
          }
        });
        setOrdersMap(oMap);
      } else {
        // Mock
        setUsers([
          { id: '1', displayName: 'Mock User', email: 'user@test.com', role: 'user', createdAt: new Date() },
          { id: '2', displayName: 'Mock Admin', email: 'admin@test.com', role: 'admin', createdAt: new Date() }
        ]);
        const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
        const oMap: Record<string, any[]> = {};
        mockOrders.forEach((o: any) => {
          if (o.userId) {
            if (!oMap[o.userId]) oMap[o.userId] = [];
            oMap[o.userId].push(o);
          }
        });
        setOrdersMap(oMap);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.displayName?.toLowerCase() || '').includes(search.toLowerCase()) || 
      (u.email?.toLowerCase() || '').includes(search.toLowerCase())
    );
  }, [users, search]);

  const makeAdmin = async (userId: string, currentRole: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Хэрэглэгчийн эрхийг "${newRole.toUpperCase()}" болгох уу?`)) return;

    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        await updateDoc(doc(db, "users", userId), { role: newRole });
      }
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error(error);
      alert('Эрх шинэчилж чадсангүй');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    if (date.toDate) return date.toDate().toLocaleString('mn-MN');
    if (typeof date === 'string') return new Date(date).toLocaleString('mn-MN');
    return '-';
  };

  const openUserHistory = (user: any) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h2 className="font-serif text-3xl text-charcoal tracking-wide">Хэрэглэгчид</h2>
      </div>

      <div className="bg-sand border border-border overflow-hidden">
        <div className="p-8 border-b border-border flex justify-between items-center gap-8">
          <div className="relative w-full xl:w-96">
            <input 
              type="text" 
              placeholder="Нэр эсвэл и-мэйлээр хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-sand border border-border text-sm focus:outline-none focus:border-charcoal font-sans text-charcoal tracking-wide rounded-none placeholder:text-neutral-400"
            />
            <svg className="absolute left-4 top-3.5 text-neutral-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-sand-dark border-b border-border">
              <tr>
                <th className="px-8 py-4 editorial-label text-charcoal">Харилцагч</th>
                <th className="px-8 py-4 editorial-label text-charcoal">И-мэйл</th>
                <th className="px-8 py-4 editorial-label text-charcoal">Бүртгүүлсэн огноо</th>
                <th className="px-8 py-4 editorial-label text-charcoal text-center">Захиалга</th>
                <th className="px-8 py-4 editorial-label text-charcoal text-center">Эрх</th>
                <th className="px-8 py-4 editorial-label text-charcoal text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-charcoal">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-16 text-center"><div className="w-8 h-8 mx-auto border border-charcoal border-t-transparent rounded-full animate-spin"/></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-16 text-center editorial-label text-neutral-400">Хэрэглэгч олдсонгүй.</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr 
                    key={u.id} 
                    onClick={() => openUserHistory(u)}
                    className="hover:bg-sand-dark transition-colors cursor-pointer"
                  >
                    <td className="px-8 py-5 flex items-center gap-4">
                      <div className="w-10 h-10 border border-border bg-sand text-charcoal flex items-center justify-center font-serif text-lg overflow-hidden flex-shrink-0">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="User" className="w-full h-full object-cover grayscale opacity-80" />
                        ) : (
                          (u.displayName || u.email || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="font-serif text-base text-charcoal tracking-wide">{u.displayName || 'Нэргүй'}</span>
                    </td>
                    <td className="px-8 py-5 font-sans text-sm text-neutral-600 tracking-wide">{u.email}</td>
                    <td className="px-8 py-5 font-sans text-sm text-neutral-500 tracking-wide">{formatDate(u.createdAt)}</td>
                    <td className="px-8 py-5 text-center font-sans text-sm text-neutral-600">{ordersMap[u.id]?.length || 0}</td>
                    <td className="px-8 py-5 text-center">
                      <span className={`editorial-label px-3 py-1 ${
                        u.role === 'admin' ? 'border-b border-charcoal text-charcoal' : 'text-neutral-400'
                      }`}>
                        {u.role === 'admin' ? 'админ' : 'хэрэглэгч'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={(e) => makeAdmin(u.id, u.role, e)}
                        className={`editorial-label border-b pb-0.5 transition-all ${
                          u.role === 'admin' ? 'border-transparent hover:border-red-500 text-red-500' : 'border-transparent hover:border-charcoal text-charcoal'
                        }`}
                      >
                        {u.role === 'admin' ? 'Админ эрх цуцлах' : 'Админ болгох'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User History Drawer */}
      {isDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative h-full w-full max-w-lg bg-sand border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-8 border-b border-border flex justify-between items-center bg-sand-dark">
              <h3 className="font-serif text-2xl text-charcoal tracking-wide">{selectedUser.displayName || selectedUser.email}</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-neutral-400 hover:text-charcoal transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <h4 className="editorial-label border-b border-border pb-4 mb-8">Захиалгын түүх</h4>
              
              <div className="space-y-6">
                {(!ordersMap[selectedUser.id] || ordersMap[selectedUser.id].length === 0) ? (
                  <p className="font-serif italic text-neutral-500 text-sm">Захиалгын түүх алга байна.</p>
                ) : (
                  ordersMap[selectedUser.id].map((o: any) => (
                    <div key={o.id} className="border border-border bg-sand p-6">
                      <div className="flex justify-between items-start mb-4 pb-4 border-b border-border">
                        <div>
                          <p className="font-sans text-xs text-neutral-500 mb-1 tracking-wide">{formatDate(o.createdAt)}</p>
                          <p className="font-sans text-xs text-neutral-500 tracking-wider uppercase">#{o.id.slice(-6)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`editorial-label block mb-2`}>
                            {o.status}
                          </span>
                          <p className="font-sans text-sm font-medium text-charcoal tracking-wide">{formatPrice(o.total)}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {o.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs font-sans tracking-wide">
                            <span className="text-charcoal">{item.name} <span className="text-neutral-400 ml-1">x {item.quantity}</span></span>
                            <span className="text-charcoal font-medium">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
