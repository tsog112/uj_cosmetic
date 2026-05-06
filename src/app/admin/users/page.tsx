'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, where } from 'firebase/firestore';
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

        // For small scale, we can fetch all orders to map counts. In prod, use aggregations.
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
    if (!confirm(`Энэ хэрэглэгчийн эрхийг "${newRole}" болгох уу?`)) return;

    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        await updateDoc(doc(db, "users", userId), { role: newRole });
      }
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error(error);
      alert('Эрх шинэчлэхэд алдаа гарлаа');
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Хэрэглэгчид</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full lg:w-96">
            <input 
              type="text" 
              placeholder="Нэр эсвэл и-мэйлээр хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-accent"
            />
            <svg className="absolute left-3 top-2.5 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Хэрэглэгч</th>
                <th className="px-6 py-4 font-medium">И-мэйл</th>
                <th className="px-6 py-4 font-medium">Огноо</th>
                <th className="px-6 py-4 font-medium text-center">Захиалгын тоо</th>
                <th className="px-6 py-4 font-medium text-center">Role</th>
                <th className="px-6 py-4 font-medium text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center"><div className="w-8 h-8 mx-auto border-2 border-gray-200 border-t-accent rounded-full animate-spin"/></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Хэрэглэгч олдсонгүй.</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr 
                    key={u.id} 
                    onClick={() => openUserHistory(u)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFF0F6] text-[#FFB7D5] flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          (u.displayName || u.email || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{u.displayName || 'Нэргүй'}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{u.email}</td>
                    <td className="px-6 py-3 text-gray-600">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-3 text-center font-medium">{ordersMap[u.id]?.length || 0}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={(e) => makeAdmin(u.id, u.role, e)}
                        className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${
                          u.role === 'admin' ? 'text-red-600 hover:bg-red-50' : 'text-accent hover:bg-[#FFF0F6]'
                        }`}
                      >
                        {u.role === 'admin' ? 'Эрх хасах' : 'Admin болгох'}
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
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">{selectedUser.displayName || selectedUser.email}</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Захиалгын түүх</h4>
              
              <div className="space-y-4">
                {(!ordersMap[selectedUser.id] || ordersMap[selectedUser.id].length === 0) ? (
                  <p className="text-gray-500 text-sm">Захиалга байхгүй байна.</p>
                ) : (
                  ordersMap[selectedUser.id].map((o: any) => (
                    <div key={o.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{formatDate(o.createdAt)}</p>
                          <p className="font-medium text-gray-900">#{o.id.slice(-6)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${
                            o.status === 'Хүлээгдэж байна' ? 'bg-yellow-200 text-yellow-800' :
                            o.status === 'Баталгаажсан' ? 'bg-blue-200 text-blue-800' :
                            o.status === 'Хүргэгдсэн' ? 'bg-green-200 text-green-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {o.status}
                          </span>
                          <p className="font-bold text-accent">{formatPrice(o.total)}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {o.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-gray-700">{item.name} <span className="text-gray-400">x {item.quantity}</span></span>
                            <span className="text-gray-900">{formatPrice(item.price * item.quantity)}</span>
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
