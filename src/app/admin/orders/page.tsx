'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { formatPrice, OrderStatus } from '@/types';
import { updateOrderStatus } from '@/lib/services/firestoreService';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const mapStatusToEnglish = (status: string) => {
    switch (status) {
      case 'Хүлээгдэж байна': return 'pending';
      case 'Баталгаажсан': return 'confirmed';
      case 'Хүргэлтэнд гарсан': return 'shipped';
      case 'Хүргэгдсэн': return 'delivered';
      case 'Цуцлагдсан': return 'cancelled';
      default: return status;
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || 
                          o.customerName?.toLowerCase().includes(search.toLowerCase());
      const normalizedStatus = mapStatusToEnglish(o.status);
      const matchFilter = filter === 'All' || normalizedStatus === filter;
      return matchSearch && matchFilter;
    });
  }, [orders, search, filter]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Хүлээгдэж байна',
    confirmed: 'Баталгаажсан',
    shipped: 'Хүргэлтэнд гарсан',
    delivered: 'Хүргэгдсэн',
    cancelled: 'Цуцлагдсан',
  };

  const getStatusColor = (status: string) => {
    const normalized = mapStatusToEnglish(status);
    switch (normalized) {
      case 'pending': return 'bg-sand text-neutral-600 border-border';
      case 'confirmed': return 'bg-[#E8D5D0]/20 text-charcoal border-[#E8D5D0]';
      case 'shipped': return 'bg-charcoal/5 text-charcoal border-charcoal/20';
      case 'delivered': return 'bg-sand text-charcoal border-charcoal';
      case 'cancelled': return 'bg-red-50 text-red-800 border-red-200';
      default: return 'bg-sand text-neutral-600 border-border';
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
    setNewStatus(mapStatusToEnglish(order.status));
    setIsDrawerOpen(true);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    const status = newStatus as OrderStatus;
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        if (status === 'confirmed') {
          const res = await fetch(`/api/orders/${selectedOrder.id}/confirm`, { method: 'POST' });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Confirm API failed');
          }
        } else if (status === 'shipped') {
          const res = await fetch(`/api/orders/${selectedOrder.id}/ship`, { method: 'POST' });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Ship API failed');
          }
        } else {
          await updateOrderStatus(selectedOrder.id, status);
        }
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status } : o));
      } else {
        const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
        const updated = mockOrders.map((o:any) => o.id === selectedOrder.id ? { ...o, status } : o);
        localStorage.setItem('mock_orders', JSON.stringify(updated));
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status } : o));
      }
      showToast(
        status === 'confirmed' ? 'Захиалга баталгаажлаа. Имэйл илгээгдлээ ✓' :
        status === 'shipped' ? 'Захиалга хүргэлтэнд гарлаа. Имэйл илгээгдлээ ✓' :
        'Төлөв шинэчлэгдлээ ✓'
      );
      setIsDrawerOpen(false);
      setSelectedOrder(null);
    } catch (error: any) {
      console.error('Status change error:', error);
      showToast('Алдаа: ' + error.message, 'error');
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

  const tabs = [
    { value: 'All', label: 'Бүх захиалга' },
    { value: 'pending', label: 'Хүлээгдэж байна' },
    { value: 'confirmed', label: 'Баталгаажсан' },
    { value: 'shipped', label: 'Хүргэлтэнд гарсан' },
    { value: 'delivered', label: 'Хүргэгдсэн' },
    { value: 'cancelled', label: 'Цуцлагдсан' },
  ];

  return (
    <div className="space-y-12">
      {toast && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[120] px-8 py-4 editorial-label shadow-xl ${
          toast.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-charcoal text-sand'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h2 className="font-serif text-3xl text-charcoal tracking-wide">Захиалгууд</h2>
        <button 
          onClick={exportCSV}
          className="editorial-label border-b border-charcoal/20 pb-1 hover:border-charcoal transition-all text-charcoal flex items-center gap-2"
        >
          CSV татах
        </button>
      </div>

      <div className="bg-sand border border-border overflow-hidden">
        {/* Filters & Search */}
        <div className="p-8 border-b border-border flex flex-col xl:flex-row justify-between gap-8 items-start xl:items-center">
          <div className="flex flex-wrap gap-8">
            {tabs.map(t => (
              <button
                key={t.value}
                onClick={() => { setFilter(t.value); setCurrentPage(1); }}
                className={`editorial-label transition-colors pb-1 border-b ${
                  filter === t.value ? 'text-charcoal border-charcoal' : 'text-neutral-400 border-transparent hover:text-charcoal hover:border-charcoal/30'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative w-full xl:w-72">
            <input 
              type="text" 
              placeholder="Дугаар эсвэл нэрээр хайх..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-sand border border-border text-sm focus:outline-none focus:border-charcoal font-sans text-charcoal tracking-wide rounded-none placeholder:text-neutral-400"
            />
            <svg className="absolute left-4 top-3.5 text-neutral-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-sand-dark border-b border-border">
              <tr>
                <th className="px-8 py-4 editorial-label text-charcoal">Дугаар</th>
                <th className="px-8 py-4 editorial-label text-charcoal">Харилцагч</th>
                <th className="px-8 py-4 editorial-label text-charcoal">Утас</th>
                <th className="px-8 py-4 editorial-label text-charcoal text-center">Тоо</th>
                <th className="px-8 py-4 editorial-label text-charcoal text-right">Дүн</th>
                <th className="px-8 py-4 editorial-label text-charcoal">Огноо</th>
                <th className="px-8 py-4 editorial-label text-charcoal text-center">Төлөв</th>
                <th className="px-8 py-4 editorial-label text-charcoal text-center">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="px-8 py-16 text-center"><div className="w-8 h-8 mx-auto border border-charcoal border-t-transparent rounded-full animate-spin"/></td></tr>
              ) : paginatedOrders.length === 0 ? (
                <tr><td colSpan={8} className="px-8 py-16 text-center editorial-label text-neutral-400">Захиалга олдсонгүй.</td></tr>
              ) : (
                paginatedOrders.map(o => (
                  <tr key={o.id} className="hover:bg-sand-dark transition-colors">
                    <td className="px-8 py-5 font-sans text-xs text-neutral-500 tracking-wider uppercase">{o.id.slice(0, 8)}</td>
                    <td className="px-8 py-5 font-serif text-base text-charcoal">{o.customerName}</td>
                    <td className="px-8 py-5 font-sans text-sm text-neutral-600 tracking-wide">{o.phone}</td>
                    <td className="px-8 py-5 text-center font-sans text-sm text-neutral-600">{o.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0}</td>
                    <td className="px-8 py-5 text-right font-sans text-sm text-charcoal tracking-wide">{formatPrice(o.total)}</td>
                    <td className="px-8 py-5 font-sans text-sm text-neutral-500">{formatDate(o.createdAt)}</td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex px-3 py-1 text-[9px] uppercase tracking-[0.2em] border ${getStatusColor(o.status)}`}>
                        {STATUS_LABELS[mapStatusToEnglish(o.status)] || mapStatusToEnglish(o.status)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button onClick={() => openDrawer(o)} className="editorial-label text-charcoal border-b border-transparent hover:border-charcoal pb-0.5 transition-all">
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
          <div className="p-6 border-t border-border flex items-center justify-between text-sm bg-sand">
            <span className="editorial-label text-neutral-500">Нийт {filteredOrders.length} захиалга</span>
            <div className="flex gap-4 items-center">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="editorial-label text-charcoal hover:text-neutral-500 disabled:opacity-30 transition-colors">Өмнөх</button>
              <span className="font-serif italic text-charcoal">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="editorial-label text-charcoal hover:text-neutral-500 disabled:opacity-30 transition-colors">Дараах</button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {isDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative h-full w-full max-w-lg bg-sand border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-8 border-b border-border flex justify-between items-center bg-sand-dark">
              <h3 className="font-serif text-2xl text-charcoal">Захиалга #{selectedOrder.id.slice(-6)}</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-neutral-400 hover:text-charcoal transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-12">
              {/* Customer Info */}
              <div>
                <h4 className="editorial-label border-b border-border pb-4 mb-6">Харилцагчийн мэдээлэл</h4>
                <div className="space-y-4 font-sans text-sm text-charcoal tracking-wide">
                  <div className="flex justify-between"><span className="text-neutral-500">Нэр:</span><span>{selectedOrder.customerName}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Утас:</span><span>{selectedOrder.phone}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Огноо:</span><span>{formatDate(selectedOrder.createdAt)}</span></div>
                  <div className="flex justify-between items-start"><span className="text-neutral-500">Хаяг:</span><span className="text-right max-w-[250px] leading-relaxed">{selectedOrder.address}</span></div>
                  {selectedOrder.note && (
                    <div className="flex justify-between items-start"><span className="text-neutral-500">Тэмдэглэл:</span><span className="text-right max-w-[250px] italic">{selectedOrder.note}</span></div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="editorial-label border-b border-border pb-4 mb-6">Бүтээгдэхүүнүүд</h4>
                <div className="space-y-6">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <p className="font-serif text-lg text-charcoal tracking-wide mb-1">{item.name}</p>
                        <p className="font-sans text-xs text-neutral-500">{formatPrice(item.price)} x {item.quantity}</p>
                      </div>
                      <p className="font-sans text-sm text-charcoal tracking-wide">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
                  <span className="editorial-label">Нийт дүн</span>
                  <span className="font-sans text-lg font-medium text-charcoal tracking-wide">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h4 className="editorial-label border-b border-border pb-4 mb-6">Төлөв өөрчлөх</h4>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-4 border border-border bg-sand font-sans text-sm text-charcoal focus:outline-none focus:border-charcoal rounded-none"
                >
                  <option value="pending">Хүлээгдэж байна</option>
                  <option value="confirmed">Баталгаажсан</option>
                  <option value="shipped">Хүргэлтэнд гарсан</option>
                  <option value="delivered">Хүргэгдсэн</option>
                  <option value="cancelled">Цуцлагдсан</option>
                </select>
              </div>
            </div>

            <div className="p-8 border-t border-border bg-sand-dark flex gap-4">
              <button onClick={() => setIsDrawerOpen(false)} className="flex-1 py-4 border border-charcoal text-charcoal font-sans text-sm font-medium tracking-widest uppercase hover:bg-charcoal hover:text-sand transition-colors">
                Цуцлах
              </button>
              <button 
                onClick={handleUpdateStatus} 
                disabled={newStatus === mapStatusToEnglish(selectedOrder.status)}
                className="flex-1 py-4 bg-charcoal border border-charcoal text-sand font-sans text-sm font-medium tracking-widest uppercase hover:bg-transparent hover:text-charcoal transition-colors disabled:opacity-30 disabled:hover:bg-charcoal disabled:hover:text-sand"
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
