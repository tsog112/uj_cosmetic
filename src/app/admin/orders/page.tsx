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
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-mono rounded-full bg-gray-100 border border-gray-200/50 px-2 py-0.5 text-[10px] text-gray-700 font-medium tracking-wide inline-block">
                        {order.orderNumber}
                      </span>
                      <span className="block truncate text-[14px] font-extrabold text-[var(--color-brand-text)]">{order.customerName || order.user?.name || 'Зочин'}</span>
                    </div>
                    <span className="mt-1 block truncate text-[12px] text-[var(--color-brand-muted)]">{order.customerPhone || order.user?.phone || '—'}</span>
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
            minWidth: '100px',
            render: (order: any) => (
              <span className="font-mono rounded-full bg-gray-100 border border-gray-200/50 px-2.5 py-0.5 text-xs text-gray-700 font-medium tracking-wide">
                {order.orderNumber}
              </span>
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
        {selectedOrder && (() => {
          const flowStatuses = [
            { value: 'pending', label: 'Төлбөр хүлээж байна' },
            { value: 'confirmed', label: 'Төлбөр баталгаажуулах' },
            { value: 'processing', label: 'Захиалга бэлдэх' },
            { value: 'shipped', label: 'Хүргэлт хийгдэж байна' },
            { value: 'delivered', label: 'Захиалга хүргэгдсэн' },
          ];

          const currentIdx = flowStatuses.findIndex(s => s.value === selectedOrder.status);

          const getNextStatusInfo = (status: string) => {
            switch (status) {
              case 'pending':
                return { nextStatus: 'confirmed', label: 'Баталгаажуулах' };
              case 'confirmed':
                return { nextStatus: 'processing', label: 'Бэлтгэж эхлэх' };
              case 'processing':
                return { nextStatus: 'shipped', label: 'Илгээгдсэн болгох' };
              case 'shipped':
                return { nextStatus: 'delivered', label: 'Хүргэгдсэн болгох' };
              default:
                return null;
            }
          };

          const nextInfo = getNextStatusInfo(selectedOrder.status);

          return (
            <>
              {/* Order info always visible in the panel header */}
              <div className="mb-5 border-b border-gray-100 pb-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono rounded-full bg-gray-100 border border-gray-200/50 px-2.5 py-0.5 text-xs text-gray-700 font-medium tracking-wide">
                    {selectedOrder.orderNumber}
                  </span>
                  <h3 className="text-lg font-extrabold text-[var(--color-brand-accent)]">{formatMNT(selectedOrder.total)}</h3>
                </div>

                {/* Customer info + Call Shortcut */}
                <div className="rounded-[18px] bg-gray-50 p-3.5 border border-black/[0.03] space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[var(--color-brand-text)]">{selectedOrder.customerName || selectedOrder.user?.name || 'Зочин'}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--color-brand-muted)] line-clamp-2">
                        {selectedOrder.shippingAddress || 'Хаяг бүртгээгүй'}
                      </p>
                    </div>
                    {(selectedOrder.customerPhone || selectedOrder.user?.phone) && (
                      <a
                        href={`tel:${selectedOrder.customerPhone || selectedOrder.user?.phone}`}
                        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[var(--color-brand-accent)] active:scale-95 transition-transform"
                        title="Шууд залгах"
                      >
                        <Phone size={13} strokeWidth={2.5} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Compact Product list (1 line per item) */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Бүтээгдэхүүнүүд</p>
                  <div className="max-h-24 overflow-y-auto divide-y divide-gray-100 pr-1">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-1.5 text-[11px] font-medium text-gray-600">
                        <span className="truncate pr-4">{item.product?.name || 'Бүтээгдэхүүн'}</span>
                        <span className="shrink-0 font-bold">{item.quantity}ш</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Redesigned Linear Progress Flow UI */}
              <div className="mb-6 rounded-[22px] bg-white p-4 border border-black/[0.04]">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Захиалгын явц</p>
                <div className="relative flex items-center justify-between">
                  {/* Connector Lines */}
                  <div className="absolute top-[14px] left-[8%] right-[8%] h-[2px] bg-gray-100 -z-0" />
                  {currentIdx !== -1 && (
                    <div
                      className="absolute top-[14px] left-[8%] h-[2px] bg-[#D4537E] -z-0 transition-all duration-300"
                      style={{ width: `${(Math.max(0, currentIdx) / 4) * 84}%` }}
                    />
                  )}

                  {flowStatuses.map((step, idx) => {
                    const isCompleted = currentIdx !== -1 && idx < currentIdx;
                    const isCurrent = step.value === selectedOrder.status;
                    const isUpcoming = currentIdx === -1 || idx > currentIdx;

                    let circleClass = "";
                    let textClass = "";

                    if (isCompleted) {
                      circleClass = "bg-[#EAF3DE] border border-[#3B6D11]/30 text-[#3B6D11]";
                      textClass = "text-[#3B6D11] font-bold";
                    } else if (isCurrent) {
                      circleClass = "border-2 border-[#D4537E] bg-[#FBEAF0] text-[#993556] ring-4 ring-[#D4537E]/10";
                      textClass = "text-[#993556] font-bold";
                    } else {
                      circleClass = "bg-gray-50 border border-gray-200 text-gray-400";
                      textClass = "text-gray-400 font-medium";
                    }

                    return (
                      <div key={step.value} className="relative z-10 flex flex-col items-center flex-1">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold ${circleClass}`}>
                          {isCompleted ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span 
                          className={`mt-2 text-center text-[9px] leading-[1.3] max-w-[60px] whitespace-normal ${textClass}`}
                          style={{ display: 'block', margin: '0 auto' }}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions: Strict Dynamic CTA & red Cancel button with confirmation */}
              <div className="space-y-2.5">
                {nextInfo && (
                  <button
                    type="button"
                    onClick={() => changeStatus(selectedOrder.id, nextInfo.nextStatus as OrderStatus)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    <PackageCheck size={16} /> {nextInfo.label}
                  </button>
                )}

                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Энэ захиалгыг цуцлахдаа итгэлтэй байна уу?")) {
                        changeStatus(selectedOrder.id, 'cancelled');
                      }
                    }}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#FCEBEB] text-[#A32D2D] border border-[#A32D2D]/10 text-sm font-extrabold transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    Цуцлах
                  </button>
                )}
              </div>
            </>
          );
        })()}
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
