'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateOrderStatus } from '@/lib/services/firestoreService';
import { formatMongolianDateTime } from '@/lib/format';
import { formatPrice, OrderStatus } from '@/types';
import Pagination, { paginate } from '@/components/admin/Pagination';

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

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-status-pending-bg text-status-pending-text border-status-pending-border',
  confirmed: 'bg-status-confirmed-bg text-status-confirmed-text border-status-confirmed-border',
  shipped:   'bg-status-shipped-bg text-status-shipped-text border-status-shipped-border',
  delivered: 'bg-status-delivered-bg text-status-delivered-text border-status-delivered-border',
  cancelled: 'bg-status-cancelled-bg text-status-cancelled-text border-status-cancelled-border',
};

function getStatusColor(status: string) {
  return STATUS_COLOR[status] ?? 'bg-sand text-text-subtle border-border-light';
}

const STATUS_ACCENT: Record<string, string> = {
  pending:   'bg-orange-500',
  confirmed: 'bg-blue-500',
  shipped:   'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

function getStatusAccent(status: string) {
  return STATUS_ACCENT[status] ?? 'bg-dusty-rose';
}

function formatDate(date: any) {
  return formatMongolianDateTime(date);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [page, setPage] = useState(1);

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

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedOrders = useMemo(() => paginate(filteredOrders, currentPage, pageSize), [filteredOrders, currentPage]);

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

  async function exportExcel() {
    const headers = ['Order ID', 'Customer', 'Phone', 'Items Count', 'Total', 'Status', 'Date'];
    const rows = filteredOrders.map(order => [
      order.id,
      order.customerName || '',
      order.phone || '',
      order.items?.length || 0,
      order.total,
      order.status,
      formatDate(order.createdAt),
    ]);

    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!cols'] = [
      { wch: 16 },
      { wch: 28 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 22 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, `orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-4 md:space-y-8">
      {toast && (
        <div className={`fixed top-20 left-4 right-4 md:left-auto md:right-8 md:w-auto z-[120] rounded-xl px-5 py-3.5 border text-sm shadow-brand-lg backdrop-blur-sm ${
          toast.type === 'error'
            ? 'bg-status-cancelled-bg/95 text-status-cancelled-text border-status-cancelled-border'
            : 'bg-white/95 text-charcoal border-border-light'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.12em] uppercase text-text-subtle">Захиалгын удирдлага</p>
          <h2 className="truncate text-[22px] md:text-3xl font-semibold mt-1 text-charcoal">Захиалгууд</h2>
        </div>
        <button
          onClick={exportExcel}
          className="btn-secondary h-11 shrink-0 px-6 text-xs uppercase tracking-[0.14em]"
          aria-label="Excel татах"
        >
          <span className="hidden md:inline">Excel татах</span>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
        </button>
      </div>

      <div className="md:hidden grid grid-cols-3 gap-2">
        <div className="card-brand px-3 py-3">
          <p className="text-[10px] text-text-subtle">Нийт</p>
          <p className="mt-1 text-xl font-semibold text-charcoal">{orderSummary.total}</p>
        </div>
        <div className="rounded-card border border-status-pending-border bg-status-pending-bg px-3 py-3 shadow-brand-sm">
          <p className="text-[10px] text-status-pending-text">Хүлээгдэж буй</p>
          <p className="mt-1 text-xl font-semibold text-charcoal">{orderSummary.pending}</p>
        </div>
        <div className="rounded-card border border-border-faint bg-blush px-3 py-3 shadow-brand-sm">
          <p className="text-[10px] text-text-subtle">Өнөөдөр</p>
          <p className="mt-1 text-xl font-semibold text-charcoal">{orderSummary.today}</p>
        </div>
      </div>

      <div className="surface-panel shadow-brand-md">
        <div className="z-20 space-y-4 border-b border-border-faint bg-gradient-to-b from-white to-sand/55 p-4 backdrop-blur-md md:p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => {
                  setFilter(tab.value);
                  setPage(1);
                }}
                className={`flex min-h-11 items-center justify-between gap-2 rounded-full border px-3.5 text-left transition-all ${
                  filter === tab.value
                    ? 'border-dusty-rose bg-blush text-charcoal shadow-brand-sm'
                    : 'border-border-light bg-white text-text-subtle hover:bg-sand hover:text-charcoal'
                }`}
              >
                <span className="truncate text-[11px] font-semibold">{tab.label}</span>
                <span className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                  filter === tab.value ? 'bg-dusty-rose text-white' : 'bg-sand text-text-subtle'
                }`}>
                  {statusCounts[tab.value]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Захиалга, нэр эсвэл утсаар хайх..."
              className="h-11 w-full rounded-full border border-border bg-sand pl-10 pr-4 text-sm outline-none transition focus:border-dusty-rose focus:bg-white placeholder:text-text-subtle/60"
            />
            <svg className="absolute left-4 top-3.5 text-text-subtle" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>

        <div className="md:hidden space-y-3 bg-sand/45 p-3">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <p className="p-8 text-center text-sm text-text-subtle">Захиалга олдсонгүй</p>
          ) : paginatedOrders.map(order => (
            <button
              key={order.id}
              onClick={() => openDrawer(order)}
              className="relative block w-full overflow-hidden rounded-[24px] border border-border-light bg-white p-4 text-left shadow-brand-sm transition-all active:scale-[0.98]"
            >
              <span className={`absolute bottom-0 left-0 top-0 w-[5px] ${getStatusAccent(order.status)}`} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate text-[14px]">{order.customerName || 'Харилцагч'}</p>
                  <p className="text-[11px] text-text-subtle mt-0.5">#{order.id.slice(0, 8)} · {order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0} ширхэг</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusColor(order.status)}`}>
                  {statusLabels[order.status as OrderStatus] || order.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5 text-[13px]">
                <div>
                  <p className="text-[10px] text-text-subtle">Утас</p>
                  <p className="mt-0.5">{order.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-subtle">Дүн</p>
                  <p className="mt-0.5 font-semibold">{formatPrice(order.total || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-subtle">Хаяг</p>
                  <p className="mt-0.5 truncate">{order.address || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-subtle">Огноо</p>
                  <p className="mt-0.5 truncate">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="hidden md:block overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[110px]" />
              <col className="w-[34%]" />
              <col className="w-[150px]" />
              <col className="w-[130px]" />
              <col className="w-[160px]" />
              <col className="w-[150px]" />
            </colgroup>
            <thead className="border-b border-border-faint bg-white text-[11px] font-semibold uppercase tracking-[0.08em] text-text-subtle">
              <tr>
                <th className="px-4 py-3 text-left">Дугаар</th>
                <th className="px-4 py-3 text-left">Харилцагч</th>
                <th className="px-4 py-3 text-left">Утас</th>
                <th className="px-4 py-3 text-right">Дүн</th>
                <th className="px-4 py-3 text-center">Төлөв</th>
                <th className="px-4 py-3 text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-faint">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-14 text-center">Уншиж байна...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-14 text-center text-text-subtle">Захиалга олдсонгүй</td></tr>
              ) : paginatedOrders.map(order => (
                <tr key={order.id} className="transition-colors hover:bg-blush/45">
                  <td className="px-5 py-5 text-xs text-text-subtle">#{order.id.slice(0, 8)}</td>
                  <td className="min-w-0 px-5 py-5 font-medium">
                    <p className="truncate">{order.customerName || '-'}</p>
                    <p className="text-xs text-text-subtle truncate">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-5 py-5 text-sm text-text-subtle">{order.phone || '-'}</td>
                  <td className="px-5 py-5 text-right font-semibold tabular-nums whitespace-nowrap">{formatPrice(order.total || 0)}</td>
                  <td className="px-5 py-5 text-center">
                    <span className={`status-badge px-3 py-1.5 uppercase ${getStatusColor(order.status)}`}>
                      {statusLabels[order.status as OrderStatus] || order.status}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-right">
                    <button
                      onClick={() => openDrawer(order)}
                      className="btn-secondary min-h-9 whitespace-nowrap px-4 text-xs shadow-brand-sm"
                    >
                      Дэлгэрэнгүй
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={currentPage} totalItems={filteredOrders.length} onPageChange={setPage} />
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100]">
          <button className="absolute inset-0 bg-charcoal/35 rounded-none cursor-default" onClick={() => setSelectedOrder(null)} aria-label="Хаах" />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col overflow-hidden border-l border-border-light bg-sand shadow-[0_24px_80px_rgba(44,27,36,0.28)]">
            <div className="flex items-center justify-between border-b border-border-faint bg-white px-5 py-5 md:px-7">
              <div>
                <p className="text-[11px] tracking-[0.18em] uppercase text-text-subtle">Захиалга</p>
                <h3 className="text-xl font-semibold">#{selectedOrder.id.slice(-6)}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-11 h-11 text-text-subtle" aria-label="Хаах">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4 pb-28 md:p-6">
              <section className="rounded-[22px] border border-border-light bg-white p-5 shadow-brand-sm">
                <h4 className="text-[11px] tracking-[0.18em] uppercase text-text-subtle border-b border-border-faint pb-3 mb-4">Харилцагч</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><span className="text-text-subtle">Нэр</span><span className="text-right">{selectedOrder.customerName}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-text-subtle">Утас</span><span>{selectedOrder.phone}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-text-subtle">Хаяг</span><span className="text-right max-w-[260px]">{selectedOrder.address}</span></div>
                  {selectedOrder.note && <div className="flex justify-between gap-4"><span className="text-text-subtle">Тэмдэглэл</span><span className="text-right max-w-[260px]">{selectedOrder.note}</span></div>}
                </div>
              </section>

              <section className="rounded-[22px] border border-border-light bg-white p-5 shadow-brand-sm">
                <h4 className="text-[11px] tracking-[0.18em] uppercase text-text-subtle border-b border-border-faint pb-3 mb-4">Бүтээгдэхүүн</h4>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={`${item.productId || item.id}-${index}`} className="flex justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium">{item.name_mn || item.name}</p>
                        <p className="text-xs text-text-subtle mt-1">{formatPrice(item.price)} × {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-border-faint flex justify-between">
                  <span className="text-text-subtle">Нийт дүн</span>
                  <span className="font-medium">{formatPrice(selectedOrder.total || 0)}</span>
                </div>
              </section>

              <section className="rounded-[22px] border border-border-light bg-white p-5 shadow-brand-sm">
                <h4 className="text-[11px] tracking-[0.18em] uppercase text-text-subtle border-b border-border-faint pb-3 mb-4">Төлөв</h4>
                <select
                  value={newStatus}
                  onChange={event => setNewStatus(event.target.value as OrderStatus)}
                  className="w-full min-h-12 border border-border bg-sand px-4 text-sm outline-none focus:border-dusty-rose"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </section>
            </div>

            <div className="fixed bottom-0 right-0 flex w-full max-w-[560px] gap-3 border-t border-border-faint bg-white p-4 md:static md:p-5">
              <button onClick={() => setSelectedOrder(null)} className="btn-secondary min-h-12 flex-1 text-sm">
                Болих
              </button>
              <button
                onClick={handleStatusChange}
                disabled={newStatus === selectedOrder.status}
                className="btn-primary min-h-12 flex-1 text-sm disabled:opacity-40"
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
