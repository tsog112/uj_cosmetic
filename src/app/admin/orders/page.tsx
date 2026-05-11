'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateOrderStatus } from '@/lib/services/firestoreService';
import { formatPrice, OrderStatus } from '@/types';

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Хүлээгдэж байна',
  confirmed: 'Баталгаажсан',
  shipped: 'Хүргэлтэнд',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
};

const tabs: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all', label: 'Бүгд' },
  { value: 'pending', label: 'Хүлээгдэж буй' },
  { value: 'confirmed', label: 'Баталгаажсан' },
  { value: 'shipped', label: 'Хүргэлтэнд' },
  { value: 'delivered', label: 'Хүргэгдсэн' },
  { value: 'cancelled', label: 'Цуцлагдсан' },
];

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-[#FFF7E6] text-[#9A6A14] border-[#F1D28A]';
    case 'confirmed':
      return 'bg-[#EEF6FF] text-[#315F8C] border-[#B9D7F2]';
    case 'shipped':
      return 'bg-[#F4EEFF] text-[#6A4C93] border-[#D9C8F2]';
    case 'delivered':
      return 'bg-[#EFF8F1] text-[#3F774D] border-[#B8DEC1]';
    case 'cancelled':
      return 'bg-[#FFF0F0] text-[#A14E4E] border-[#F1B8B8]';
    default:
      return 'bg-[#FFF8FB] text-[#8B6B78] border-[#F2A8C8]/50';
  }
}

function getStatusAccent(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-[#D99119]';
    case 'confirmed':
      return 'bg-[#7AAEDB]';
    case 'shipped':
      return 'bg-[#A58AD6]';
    case 'delivered':
      return 'bg-[#73B582]';
    case 'cancelled':
      return 'bg-[#D38181]';
    default:
      return 'bg-[#FFB7D5]';
  }
}

function formatDate(date: any) {
  if (!date) return '-';
  if (date.toDate) return date.toDate().toLocaleString('mn-MN');
  if (typeof date === 'string') return new Date(date).toLocaleString('mn-MN');
  return '-';
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        setOrders(snap.docs.map(orderDoc => ({ id: orderDoc.id, ...orderDoc.data() })));
      } else {
        setOrders(JSON.parse(localStorage.getItem('mock_orders') || '[]').reverse());
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    return orders.filter(order => {
      const matchesSearch =
        !normalizedSearch ||
        order.id?.toLowerCase().includes(normalizedSearch) ||
        order.customerName?.toLowerCase().includes(normalizedSearch) ||
        order.phone?.toLowerCase().includes(normalizedSearch);
      const matchesFilter = filter === 'all' || order.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter]);

  const orderSummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: orders.length,
      pending: orders.filter(order => order.status === 'pending').length,
      today: orders.filter(order => {
        const created = order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt ? new Date(order.createdAt) : null;
        return created && created >= today;
      }).length,
    };
  }, [orders]);

  const statusCounts = useMemo(() => {
    return tabs.reduce((acc, tab) => {
      acc[tab.value] = tab.value === 'all'
        ? orders.length
        : orders.filter(order => order.status === tab.value).length;
      return acc;
    }, {} as Record<'all' | OrderStatus, number>);
  }, [orders]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openDrawer = (order: any) => {
    setSelectedOrder(order);
    setNewStatus((order.status || 'pending') as OrderStatus);
  };

  async function getCustomerEmail(order: any) {
    if (order.customerEmail || order.email) return order.customerEmail || order.email;
    if (!order.userId) return '';

    const userSnap = await getDoc(doc(db, 'users', order.userId));
    if (!userSnap.exists()) return '';
    return userSnap.data().email || '';
  }

  async function sendStatusEmail(order: any, status: OrderStatus) {
    if (!['confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) return;

    const customerEmail = await getCustomerEmail(order);
    if (!customerEmail) {
      throw new Error('Харилцагчийн имэйл олдсонгүй');
    }

    const res = await fetch(`/api/orders/${order.id}/status-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        customerEmail,
        customerName: order.customerName,
        items: order.items || [],
        total: order.total,
        shippingCost: order.shippingCost,
        address: order.address,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Имэйл илгээхэд алдаа гарлаа');
    }
  }

  async function handleStatusChange() {
    if (!selectedOrder) return;

    let emailError = '';

    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        if (newStatus === 'pending') {
          await updateOrderStatus(selectedOrder.id, newStatus);
        } else {
          await updateOrderStatus(selectedOrder.id, newStatus);
          try {
            await sendStatusEmail(selectedOrder, newStatus);
          } catch (error: any) {
          emailError = error?.message || 'Имэйл илгээхэд алдаа гарлаа';
            console.error('Status email error:', error);
          }
        }
      } else {
        const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
        localStorage.setItem(
          'mock_orders',
          JSON.stringify(mockOrders.map((order: any) => order.id === selectedOrder.id ? { ...order, status: newStatus } : order))
        );
      }

      setOrders(prev => prev.map(order => order.id === selectedOrder.id ? { ...order, status: newStatus } : order));
      setSelectedOrder(null);
      if (emailError) {
        showToast('Төлөв шинэчлэгдлээ. Гэхдээ имэйл илгээхэд алдаа гарлаа: ' + emailError, 'error');
        return;
      }
      showToast(
        newStatus === 'confirmed'
          ? 'Захиалга баталгаажлаа. Харилцагчид имэйл явлаа.'
          : newStatus === 'shipped'
            ? 'Захиалга хүргэлтэнд гарлаа. Харилцагчид имэйл явлаа.'
            : 'Захиалгын төлөв шинэчлэгдлээ.'
      );
    } catch (error: any) {
      console.error('Status change error:', error);
      showToast('Алдаа гарлаа: ' + error.message, 'error');
    }
  }

  function exportCSV() {
    const headers = ['Order ID', 'Customer', 'Phone', 'Items Count', 'Total', 'Status', 'Date'];
    const rows = filteredOrders.map(order => [
      order.id,
      `"${order.customerName || ''}"`,
      `"${order.phone || ''}"`,
      order.items?.length || 0,
      order.total,
      order.status,
      `"${formatDate(order.createdAt)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + headers.join(',') + '\n' + rows.map(row => row.join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-4 md:space-y-8">
      {toast && (
        <div className={`fixed top-20 left-4 right-4 md:left-auto md:right-8 md:w-auto z-[120] px-4 py-3 border text-sm shadow-[0_18px_45px_rgba(26,26,26,0.08)] ${
          toast.type === 'error'
            ? 'bg-[#FFF0F0] text-[#A14E4E] border-[#F1B8B8]'
            : 'bg-white text-[#1A1A1A] border-[#FFB7D5]'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Захиалгын удирдлага</p>
          <h2 className="truncate text-[22px] md:text-3xl font-semibold mt-1 text-[#1A1A1A]">Захиалгууд</h2>
        </div>
        <button
          onClick={exportCSV}
          className="shrink-0 h-10 w-10 md:w-auto md:px-4 border border-[#FFB7D5] bg-white text-[#1A1A1A] text-xs tracking-[0.14em] uppercase hover:bg-[#FFF0F6] transition-colors flex items-center justify-center"
          aria-label="CSV татах"
        >
          <span className="hidden md:inline">CSV татах</span>
          <svg className="md:hidden" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
        </button>
      </div>

      <div className="md:hidden grid grid-cols-3 gap-2">
        <div className="rounded-[14px] border border-[#F2A8C8]/35 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#8B6B78]">Нийт</p>
          <p className="mt-1 text-xl font-semibold">{orderSummary.total}</p>
        </div>
        <div className="rounded-[14px] border border-[#F1D28A]/70 bg-[#FFF9EC] px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#9A6A14]">Хүлээгдэж буй</p>
          <p className="mt-1 text-xl font-semibold">{orderSummary.pending}</p>
        </div>
        <div className="rounded-[14px] border border-[#F2A8C8]/35 bg-[#FFF0F6] px-3 py-3 shadow-[0_8px_24px_rgba(26,26,26,0.035)]">
          <p className="text-[10px] text-[#8B6B78]">Өнөөдөр</p>
          <p className="mt-1 text-xl font-semibold">{orderSummary.today}</p>
        </div>
      </div>

      <div className="bg-white border border-[#F2A8C8]/40 shadow-[0_10px_30px_rgba(26,26,26,0.03)] md:rounded-none rounded-[16px] overflow-hidden">
        <div className="md:sticky md:top-[58px] z-20 bg-white/95 backdrop-blur-md p-3 md:p-5 border-b border-[#F2A8C8]/40 space-y-3">
          <div className="flex items-end gap-5 overflow-x-auto border-b border-[#F2A8C8]/35 px-1 [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`relative shrink-0 pb-3 pt-1 text-left transition-colors ${
                  filter === tab.value
                    ? 'text-[#1A1A1A]'
                    : 'text-[#8B6B78] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="block whitespace-nowrap text-[12px] font-medium tracking-[0.01em]">{tab.label}</span>
                <span className={`mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] ${
                  filter === tab.value ? 'bg-[#FFF0F6] text-[#1A1A1A]' : 'bg-[#FFF8FB] text-[#8B6B78]'
                }`}>
                  {statusCounts[tab.value]}
                </span>
                {filter === tab.value && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-full bg-[#FFB7D5]" />}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Захиалга, нэр эсвэл утсаар хайх..."
              className="w-full h-11 rounded-[10px] border border-[#F2A8C8]/60 bg-[#FFF8FB] pl-10 pr-4 text-[15px] outline-none focus:border-[#FFB7D5] focus:bg-white placeholder:text-[#8B6B78]/70"
            />
            <svg className="absolute left-4 top-3.5 text-[#8B6B78]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>

        <div className="md:hidden space-y-3 bg-[#FFF8FB] p-3">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-7 h-7 border border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#8B6B78]">Захиалга олдсонгүй</p>
          ) : filteredOrders.map(order => (
            <button
              key={order.id}
              onClick={() => openDrawer(order)}
              className="relative block w-full overflow-hidden rounded-[14px] border border-[#F2A8C8]/35 bg-white p-4 pl-5 text-left shadow-[0_8px_24px_rgba(26,26,26,0.045)] transition active:scale-[0.99] active:bg-[#FFF8FB]"
            >
              <span className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${getStatusAccent(order.status)}`} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate text-[15px]">{order.customerName || 'Харилцагч'}</p>
                  <p className="text-[11px] text-[#8B6B78] mt-1">#{order.id.slice(0, 8)} · {order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0} ширхэг</p>
                </div>
                <span className={`shrink-0 rounded-[7px] border px-2 py-1 text-[10px] tracking-[0.04em] ${getStatusColor(order.status)}`}>
                  {statusLabels[order.status as OrderStatus] || order.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-[15px]">
                <div>
                  <p className="text-[11px] text-[#8B6B78]">Утас</p>
                  <p>{order.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#8B6B78]">Дүн</p>
                  <p className="font-semibold">{formatPrice(order.total || 0)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#8B6B78]">Хаяг</p>
                  <p className="truncate">{order.address || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#8B6B78]">Огноо</p>
                  <p className="truncate">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FFF8FB] text-[11px] tracking-[0.14em] uppercase text-[#8B6B78]">
              <tr>
                <th className="px-5 py-4 font-medium">Дугаар</th>
                <th className="px-5 py-4 font-medium">Харилцагч</th>
                <th className="px-5 py-4 font-medium">Утас</th>
                <th className="px-5 py-4 font-medium text-center">Тоо</th>
                <th className="px-5 py-4 font-medium text-right">Дүн</th>
                <th className="px-5 py-4 font-medium">Огноо</th>
                <th className="px-5 py-4 font-medium text-center">Төлөв</th>
                <th className="px-5 py-4 font-medium text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2A8C8]/30">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-14 text-center">Уншиж байна...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-14 text-center text-[#8B6B78]">Захиалга олдсонгүй</td></tr>
              ) : filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-[#FFF8FB] transition-colors">
                  <td className="px-5 py-4 text-xs tracking-[0.08em] text-[#8B6B78]">#{order.id.slice(0, 8)}</td>
                  <td className="px-5 py-4 font-medium">{order.customerName || '-'}</td>
                  <td className="px-5 py-4 text-[#8B6B78]">{order.phone || '-'}</td>
                  <td className="px-5 py-4 text-center">{order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}</td>
                  <td className="px-5 py-4 text-right font-medium">{formatPrice(order.total || 0)}</td>
                  <td className="px-5 py-4 text-[#8B6B78]">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex border px-2 py-1 text-[10px] tracking-[0.12em] uppercase ${getStatusColor(order.status)}`}>
                      {statusLabels[order.status as OrderStatus] || order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => openDrawer(order)} className="text-xs tracking-[0.14em] uppercase border-b border-[#FFB7D5] pb-1">
                      Дэлгэрэнгүй
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100]">
          <button className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setSelectedOrder(null)} aria-label="Хаах" />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col">
            <div className="p-5 md:p-6 border-b border-[#F2A8C8]/40 bg-[#FFF8FB] flex items-center justify-between">
              <div>
                <p className="text-[11px] tracking-[0.18em] uppercase text-[#8B6B78]">Захиалга</p>
                <h3 className="text-xl font-semibold">#{selectedOrder.id.slice(-6)}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-11 h-11 text-[#8B6B78]" aria-label="Хаах">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-8 pb-28">
              <section>
                <h4 className="text-[11px] tracking-[0.18em] uppercase text-[#8B6B78] border-b border-[#F2A8C8]/40 pb-3 mb-4">Харилцагч</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><span className="text-[#8B6B78]">Нэр</span><span className="text-right">{selectedOrder.customerName}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-[#8B6B78]">Утас</span><span>{selectedOrder.phone}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-[#8B6B78]">Хаяг</span><span className="text-right max-w-[260px]">{selectedOrder.address}</span></div>
                  {selectedOrder.note && <div className="flex justify-between gap-4"><span className="text-[#8B6B78]">Тэмдэглэл</span><span className="text-right max-w-[260px]">{selectedOrder.note}</span></div>}
                </div>
              </section>

              <section>
                <h4 className="text-[11px] tracking-[0.18em] uppercase text-[#8B6B78] border-b border-[#F2A8C8]/40 pb-3 mb-4">Бүтээгдэхүүн</h4>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={`${item.productId || item.id}-${index}`} className="flex justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium">{item.name_mn || item.name}</p>
                        <p className="text-xs text-[#8B6B78] mt-1">{formatPrice(item.price)} × {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-[#F2A8C8]/40 flex justify-between">
                  <span className="text-[#8B6B78]">Нийт дүн</span>
                  <span className="font-medium">{formatPrice(selectedOrder.total || 0)}</span>
                </div>
              </section>

              <section>
                <h4 className="text-[11px] tracking-[0.18em] uppercase text-[#8B6B78] border-b border-[#F2A8C8]/40 pb-3 mb-4">Төлөв</h4>
                <select
                  value={newStatus}
                  onChange={event => setNewStatus(event.target.value as OrderStatus)}
                  className="w-full min-h-12 border border-[#F2A8C8]/60 bg-[#FFF8FB] px-4 text-sm outline-none focus:border-[#FFB7D5]"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </section>
            </div>

            <div className="fixed md:static bottom-0 right-0 w-full max-w-lg p-4 md:p-5 border-t border-[#F2A8C8]/40 bg-white flex gap-3">
              <button onClick={() => setSelectedOrder(null)} className="flex-1 min-h-12 border border-[#F2A8C8] text-sm">
                Болих
              </button>
              <button
                onClick={handleStatusChange}
                disabled={newStatus === selectedOrder.status}
                className="flex-1 min-h-12 bg-[#1A1A1A] text-white text-sm disabled:opacity-40"
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
