'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { Check, ChevronRight, Download, Inbox, PackageCheck, Phone, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminSheet from '@/components/admin/AdminSheet';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import { useToast } from '@/components/admin/Toast';
import { ADMIN_ALL_FILTER_VALUE, ORDER_STATUSES, ORDER_STATUS_TRANSITIONS, type OrderStatus } from '@/lib/constants/admin';
import { useAdminOrders } from '@/lib/hooks/useAdmin';
import { formatDateTimeMN, formatMNT } from '@/lib/utils/format';

type OrderTab = typeof ADMIN_ALL_FILTER_VALUE | OrderStatus;

function parseImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get('id');
  const initialStatus = (searchParams.get('status')?.toLowerCase() as OrderTab) || ADMIN_ALL_FILTER_VALUE;
  
  const [activeTab, setActiveTab] = useState<OrderTab>(initialStatus);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const { showToast } = useToast();
  
  const { data, isLoading, mutate } = useAdminOrders({
    status: activeTab,
    page,
    limit: 10,
    search: debouncedSearch
  });

  useEffect(() => setMounted(true), []);
  useEffect(() => setPage(1), [activeTab, debouncedSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (!deepLinkId || !data?.orders) return;
    const matched = data.orders.find((order: any) => order.id === deepLinkId);
    if (matched) setSelectedOrder(matched);
  }, [deepLinkId, data]);

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    mutate(
      (prev: any) =>
        prev
          ? { ...prev, orders: prev.orders.map((order: any) => (order.id === orderId ? { ...order, status } : order)) }
          : prev,
      false,
    );
    setSelectedOrder((prev: any) => (prev ? { ...prev, status } : prev));
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      mutate();
      showToast('Төлөв амжилттай солигдлоо');
    } catch {
      mutate();
      showToast('Төлөв солиход алдаа гарлаа', 'error');
    }
  };

  const tabs = [
    { value: ADMIN_ALL_FILTER_VALUE, label: 'Бүгд' },
    ...ORDER_STATUSES.map((status) => ({ value: status.value, label: status.label })),
  ];
  
  const handleExport = () => {
    const url = new URL('/api/admin/orders/export', window.location.origin);
    if (activeTab !== ADMIN_ALL_FILTER_VALUE) {
      url.searchParams.set('status', activeTab);
    }
    window.open(url.toString(), '_blank');
  };

  return (
    <div className="space-y-4 p-4 md:p-0 pb-[104px] md:pb-8">
      <AdminPageHeader
        eyebrow="Захиалгын удирдлага"
        title="Захиалгууд"
        action={
          <button
            onClick={handleExport}
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-[#f8dbe8] bg-white px-4 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-brand-text)] shadow-[var(--shadow-mobile-card)] transition-colors hover:bg-[var(--color-brand-secondary)] hover:border-transparent"
          >
            <Download size={14} /> Excel татах
          </button>
        }
      />

      <section className="rounded-[24px] bg-white p-3 shadow-[var(--shadow-mobile-card)]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Захиалга, нэр эсвэл утсаар хайх..."
              className="h-12 w-full rounded-full border border-[#f8dbe8] bg-[var(--color-brand-bg)] pl-11 pr-4 text-[14px] font-semibold outline-none transition-all focus:ring-2 focus:ring-[#f3b8cf]"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-4 transition-all"
            style={{
              background: isFilterOpen ? 'var(--color-brand-accent)' : 'var(--color-brand-bg)',
              border: isFilterOpen ? '1px solid var(--color-brand-accent)' : '1px solid #f8dbe8',
              color: isFilterOpen ? '#FFFFFF' : 'var(--color-brand-text)',
            }}
          >
            <SlidersHorizontal size={16} strokeWidth={2.5} />
          </button>
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-[20px] p-4 bg-[var(--color-brand-bg)] border border-[#f8dbe8]">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">
                  Төлөвөөр шүүх
                </p>
                <div className="mobile-chip-grid">
                  {tabs.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setActiveTab(tab.value as OrderTab)}
                      className={`mobile-chip gap-1 border transition-colors ${
                        activeTab === tab.value
                          ? 'border-[var(--color-brand-accent)] bg-[var(--color-brand-secondary)] text-[var(--color-brand-text)]'
                          : 'border-[#f8dbe8] bg-white text-[var(--color-brand-muted)] hover:bg-[#f8dbe8]/30'
                      }`}
                    >
                      {tab.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === tab.value ? 'bg-white text-[var(--color-brand-accent)]' : 'bg-[#f8dbe8]/50 text-[var(--color-brand-muted)]'}`}>
                        {tab.value === ADMIN_ALL_FILTER_VALUE ? data?.summary?.totalOrders || 0 : data?.statusCounts?.[tab.value] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-[116px] rounded-[22px] animate-shimmer" />)
        ) : data?.orders?.length ? (
          data.orders.map((order: any) => (
            <button
              key={order.id}
              type="button"
              onClick={() => {
                navigator.vibrate?.(8);
                setSelectedOrder(order);
              }}
              className="flex min-h-[116px] w-full items-center gap-3 rounded-[22px] bg-white p-4 text-left shadow-[var(--shadow-mobile-card)] active:scale-[0.99]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[15px] font-extrabold text-[var(--color-brand-accent)]">
                {(order.customerName || order.user?.name || 'З').trim().slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-extrabold text-[var(--color-brand-text)]">{order.customerName || order.user?.name || 'Зочин'}</span>
                    <span className="mt-1 block truncate text-[12px] text-[var(--color-brand-muted)]">{order.customerPhone || order.user?.phone || `#${order.id.slice(-8)}`}</span>
                  </span>
                  <StatusBadge status={order.status} />
                </span>
                <span className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[12px] leading-tight text-[var(--color-brand-muted)]">{mounted ? formatDateTimeMN(order.createdAt) : ''}</span>
                  <span className="shrink-0 text-[15px] font-extrabold text-[var(--color-brand-text)]">{formatMNT(order.total)}</span>
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-[var(--color-brand-muted)]" />
            </button>
          ))
        ) : (
          <AdminEmptyState icon={Inbox} title="Захиалга алга" body="Сонгосон төлөв эсвэл хайлтаар захиалга олдсонгүй." />
        )}
      </section>

      <div className="hidden md:block">
        <AdminDataTable
          minWidth="820px"
          loading={isLoading}
          rows={data?.orders || []}
          rowKey={(order: any) => order.id}
          emptyMessage="Захиалга олдсонгүй"
          columns={[
          {
            key: 'id',
            header: 'Дугаар',
            minWidth: '88px',
            render: (order: any) => (
              <span className="font-bold text-[var(--color-brand-muted)]">#{order.id.slice(-8)}</span>
            ),
          },
          {
            key: 'customer',
            header: 'Харилцагч',
            minWidth: '180px',
            render: (order: any) => (
              <span>
                <span className="block font-extrabold text-[var(--color-brand-text)]">
                  {order.customerName || order.user?.name || 'Зочин'}
                </span>
                <span className="mt-1 block text-[11px] text-[var(--color-brand-muted)]">
                  {mounted ? formatDateTimeMN(order.createdAt) : ''}
                </span>
              </span>
            ),
          },
          {
            key: 'phone',
            header: 'Утас',
            minWidth: '110px',
            render: (order: any) => (
              <span className="font-semibold">{order.customerPhone || order.user?.phone || '—'}</span>
            ),
          },
          {
            key: 'total',
            header: 'Дүн',
            minWidth: '100px',
            render: (order: any) => <span className="font-extrabold">{formatMNT(order.total)}</span>,
          },
          {
            key: 'status',
            header: 'Төлөв',
            minWidth: '130px',
            render: (order: any) => <StatusBadge status={order.status} />
          },
          {
            key: 'action',
            header: 'Үйлдэл',
            minWidth: '110px',
            render: (order: any) => (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedOrder(order);
                }}
                className="rounded-full border border-[#f8dbe8] bg-white px-3 py-1.5 text-[11px] font-extrabold transition-colors hover:bg-[var(--color-brand-secondary)] hover:text-[var(--color-brand-text)]"
              >
                Дэлгэрэнгүй
              </button>
            ),
          },
          ]}
        />
      </div>

      <Pagination page={page} totalItems={data?.totalCount || 0} pageSize={10} onPageChange={setPage} />

      <AdminSheet open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <>
            <div className="mb-5">
              <p className="text-[12px] font-bold text-[var(--color-brand-muted)]">
                Захиалга #{selectedOrder.id.slice(-8).toUpperCase()}
              </p>
              <h3 className="mt-1 text-xl font-extrabold">{formatMNT(selectedOrder.total)}</h3>
            </div>

            <div className="mb-5 rounded-[22px] bg-[var(--color-brand-bg)] p-4">
              <p className="text-[15px] font-extrabold">{selectedOrder.customerName || selectedOrder.user?.name || 'Зочин'}</p>
              <p className="mt-1 text-[12px] text-[var(--color-brand-muted)]">{selectedOrder.shippingAddress || 'Хаяг бүртгээгүй'}</p>
              {(selectedOrder.customerPhone || selectedOrder.user?.phone) && (
                <a
                  href={`tel:${selectedOrder.customerPhone || selectedOrder.user?.phone}`}
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[12px] font-extrabold text-[var(--color-brand-accent)] shadow-sm hover:shadow-md transition-shadow"
                >
                  <Phone size={15} /> Шууд залгах
                </a>
              )}
            </div>

            <h4 className="mb-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Бараанууд</h4>
            <div className="mb-5 space-y-3">
              {selectedOrder.items?.map((item: any) => {
                const image = parseImages(item.product?.images)[0];
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[16px] bg-[var(--color-brand-secondary)]">
                      {image && <Image src={image} alt="" fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">{item.product?.name || 'Бүтээгдэхүүн'}</p>
                      <p className="mt-1 text-[12px] text-[var(--color-brand-muted)]">
                        {formatMNT(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <span className="text-[13px] font-extrabold">{formatMNT(item.price * item.quantity)}</span>
                  </div>
                );
              })}
            </div>

            <div className="mb-5 rounded-[22px] bg-[var(--color-brand-bg)] p-4">
              <p className="mb-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Төлөв солих</p>
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => changeStatus(selectedOrder.id, status.value)}
                    className={`rounded-full px-3 py-2 text-[11px] font-extrabold transition-all ${selectedOrder.status === status.value ? 'ring-2 ring-[var(--color-brand-accent)] scale-105' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: status.bg, color: status.color }}
                  >
                    {selectedOrder.status === status.value && <Check size={12} className="mr-1 inline" />}
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {(ORDER_STATUS_TRANSITIONS[selectedOrder.status as OrderStatus] || []).map((action) => (
                <button
                  key={action.status}
                  type="button"
                  onClick={() => changeStatus(selectedOrder.id, action.status)}
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-extrabold transition-transform hover:-translate-y-0.5 active:scale-[0.98] ${
                    action.danger ? 'bg-[var(--color-brand-danger)] text-white shadow-sm' : 'bg-[var(--color-brand-accent)] text-white shadow-sm'
                  }`}
                >
                  <PackageCheck size={17} /> {action.label}
                </button>
              ))}
            </div>
          </>
        )}
      </AdminSheet>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-4"><div className="h-40 rounded-[24px] animate-shimmer" /></div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
