'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { formatPrice } from '@/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Бүгд');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const fetched: any[] = [];
        snap.forEach(doc => {
          fetched.push({ id: doc.id, ...doc.data() });
        });
        setOrders(fetched);
      } else {
        const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
        setOrders(mockOrders.reverse());
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || 
                          o.customerName?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'Бүгд' || o.status === filter;
      return matchSearch && matchFilter;
    });
  }, [orders, search, filter]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Хүлээгдэж байна': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Баталгаажсан': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Хүргэлтэнд гарсан': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Хүргэгдсэн': return 'bg-green-100 text-green-800 border-green-200';
      case 'Цуцлагдсан': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    if (date.toDate) return date.toDate().toLocaleString('mn-MN');
    if (typeof date === 'string') return new Date(date).toLocaleString('mn-MN');
    return '-';
  };

  const openDrawer = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsDrawerOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        await updateDoc(doc(db, "orders", selectedOrder.id), { status: newStatus });
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
      } else {
        const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
        const updated = mockOrders.map((o:any) => o.id === selectedOrder.id ? { ...o, status: newStatus } : o);
        localStorage.setItem('mock_orders', JSON.stringify(updated));
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
      }
      setIsDrawerOpen(false);
      setSelectedOrder(null);
    } catch (e) {
      console.error(e);
      alert('Төлөв шинэчлэхэд алдаа гарлаа');
    }
  };

  const exportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Phone', 'Items Count', 'Total', 'Status', 'Date'];
    const rows = filteredOrders.map(o => [
      o.id,
      `"${o.customerName || ''}"`,
      `"${o.phone || ''}"`,
      o.items?.length || 0,
      o.total,
      o.status,
      `"${formatDate(o.createdAt)}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = ['Бүгд', 'Хүлээгдэж байна', 'Баталгаажсан', 'Хүргэлтэнд гарсан', 'Хүргэгдсэн', 'Цуцлагдсан'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Захиалгууд</h2>
        <button 
          onClick={exportCSV}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          CSV Татах
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters & Search */}
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => { setFilter(t); setCurrentPage(1); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === t ? 'bg-[#FFF0F6] text-[#FFB7D5] border border-[#FFB7D5]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Дугаар эсвэл нэрээр хайх..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full lg:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-accent"
            />
            <svg className="absolute left-3 top-2.5 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Харилцагч</th>
                <th className="px-6 py-4 font-medium">Утас</th>
                <th className="px-6 py-4 font-medium text-center">Тоо</th>
                <th className="px-6 py-4 font-medium text-right">Дүн</th>
                <th className="px-6 py-4 font-medium">Огноо</th>
                <th className="px-6 py-4 font-medium text-center">Төлөв</th>
                <th className="px-6 py-4 font-medium text-center">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center"><div className="w-8 h-8 mx-auto border-2 border-gray-200 border-t-accent rounded-full animate-spin"/></td></tr>
              ) : paginatedOrders.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">Захиалга олдсонгүй.</td></tr>
              ) : (
                paginatedOrders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{o.id}</td>
                    <td className="px-6 py-3">{o.customerName}</td>
                    <td className="px-6 py-3">{o.phone}</td>
                    <td className="px-6 py-3 text-center">{o.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0}</td>
                    <td className="px-6 py-3 text-right font-medium">{formatPrice(o.total)}</td>
                    <td className="px-6 py-3">{formatDate(o.createdAt)}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button onClick={() => openDrawer(o)} className="text-accent hover:text-[#e89ebf] font-medium text-xs uppercase tracking-wider">
                        Дэлгэрэнгүй
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Нийт {filteredOrders.length} захиалга</span>
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Өмнөх</button>
              <span className="px-4 py-1 font-medium">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Дараах</button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {isDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Захиалга #{selectedOrder.id.slice(-6)}</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Customer Info */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Харилцагчийн мэдээлэл</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Нэр:</span><span className="font-medium text-gray-900">{selectedOrder.customerName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Утас:</span><span className="font-medium text-gray-900">{selectedOrder.phone}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Огноо:</span><span className="font-medium text-gray-900">{formatDate(selectedOrder.createdAt)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Хаяг:</span><span className="font-medium text-gray-900 text-right max-w-[200px]">{selectedOrder.address}</span></div>
                  {selectedOrder.note && (
                    <div className="flex justify-between"><span className="text-gray-500">Тэмдэглэл:</span><span className="font-medium text-gray-900 text-right max-w-[200px]">{selectedOrder.note}</span></div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Бүтээгдэхүүнүүд</h4>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatPrice(item.price)} x {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Нийт дүн:</span>
                  <span className="text-lg font-bold text-accent">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Төлөв өөрчлөх</h4>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  <option value="Хүлээгдэж байна">Хүлээгдэж байна</option>
                  <option value="Баталгаажсан">Баталгаажсан</option>
                  <option value="Хүргэлтэнд гарсан">Хүргэлтэнд гарсан</option>
                  <option value="Хүргэгдсэн">Хүргэгдсэн</option>
                  <option value="Цуцлагдсан">Цуцлагдсан</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
              <button onClick={() => setIsDrawerOpen(false)} className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-200 bg-gray-100 rounded-md transition-colors">
                Цуцлах
              </button>
              <button 
                onClick={handleUpdateStatus} 
                disabled={newStatus === selectedOrder.status}
                className="flex-1 py-3 bg-[#FFB7D5] text-white font-bold rounded-md hover:bg-[#e89ebf] transition-colors disabled:opacity-50"
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
