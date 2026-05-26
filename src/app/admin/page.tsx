'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, BarChart3, ChevronRight, ClipboardList, Download, Megaphone, Package, PackagePlus, ReceiptText, Users, Star } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { DASHBOARD_ACTION_CONFIG, DASHBOARD_METRIC_CONFIG } from '@/lib/constants/admin';
import { useAdminAnalytics, useAdminOrders, useAdminProducts, useAdminStats, useAdminRevenueChart } from '@/lib/hooks/useAdmin';
import { formatMNT, formatRelativeMN } from '@/lib/utils/format';
import SkeletonCard from '@/components/admin/SkeletonCard';
import StatusBadge from '@/components/admin/StatusBadge';

function getInitials(name?: string) {
  if (!name) return 'UJ';
  return name.trim().split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: analytics } = useAdminAnalytics();
  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders({ limit: 5 });
  const { data: lowStockData } = useAdminProducts({ inStock: 'low' });
  const [chartRange, setChartRange] = useState<'7d' | '1m' | '3m'>('7d');
  const { data: chartData, isLoading: chartLoading } = useAdminRevenueChart(chartRange);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const todayStr = mounted ? new Date().toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) : '';
  const reportUrl = `/api/admin/reports/monthly?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`;

  const metricCards = DASHBOARD_METRIC_CONFIG.map((card) => {
    const rawValue = stats?.[card.key] || 0;
    return {
      ...card,
      value: card.key === 'todayRevenue' ? formatMNT(rawValue) : rawValue,
      tone: card.key === 'pendingCount' && rawValue > 0 ? 'warning' : card.key === 'lowStockCount' && rawValue > 0 ? 'danger' : 'neutral',
    };
  });

  const businessPulse = useMemo(() => [
    { label: 'Энэ сарын орлого', value: formatMNT(stats?.monthlyRevenue || 0), icon: ReceiptText, href: '/admin/analytics' },
    { label: 'Төлбөр хүлээгдэж буй', value: formatMNT(analytics?.summary?.pendingPaymentAmount || 0), icon: ClipboardList, href: '/admin/orders?status=pending' },
    { label: 'Нийт хэрэглэгч', value: stats?.totalCustomers || 0, icon: Users, href: '/admin/customers' },
    { label: 'Бүтээгдэхүүн', value: stats?.totalProducts || 0, icon: Package, href: '/admin/products' },
  ], [analytics, stats]);

  // Format chart data for Recharts
  const formattedChartData = useMemo(() => {
    if (!chartData?.labels) return [];
    return chartData.labels.map((label: string, index: number) => ({
      name: label,
      revenue: chartData.revenue[index] || 0,
    }));
  }, [chartData]);

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-brand-bg)] p-4 md:p-0 pb-[104px] md:pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <section className="flex-1 rounded-[28px] bg-white p-5 shadow-[var(--shadow-mobile-card)] md:rounded-[24px]">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-accent)]">UJ Admin</p>
          <h1 className="mt-1 font-serif text-[25px] text-[var(--color-brand-text)]">Өдрийн самбар</h1>
          <p className="mt-1 text-[13px] capitalize text-[var(--color-brand-muted)]">{todayStr}</p>
          <div className="mt-5 grid grid-cols-2 gap-2 md:flex md:w-fit">
            <Link href="/admin/analytics" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] px-6 text-[12px] font-extrabold text-white">
              <BarChart3 size={16} /> Тайлан харах
            </Link>
            <a href={reportUrl} className="flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-secondary)] px-6 text-[12px] font-extrabold text-[var(--color-brand-text)]">
              <Download size={16} /> CSV татах
            </a>
          </div>
        </section>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} className="h-28 md:h-32" />)
          : metricCards.map((card) => (
              <Link key={card.title} href={card.href} className={`flex h-28 flex-col justify-between rounded-[22px] border bg-white p-4 shadow-[var(--shadow-mobile-card)] active:scale-[0.98] transition-transform hover:-translate-y-1 ${card.tone === 'warning' ? 'border-[var(--status-warning)]' : card.tone === 'danger' ? 'border-[var(--color-brand-danger)]' : 'border-transparent'}`}>
                <p className="text-[12px] font-bold leading-tight text-[var(--color-brand-muted)]">{card.title}</p>
                <p className="truncate text-[23px] font-extrabold leading-none text-[var(--color-brand-text)]">{card.value}</p>
              </Link>
            ))}
      </section>

      {/* Revenue Chart Section */}
      <section className="rounded-[24px] bg-white p-5 shadow-[var(--shadow-mobile-card)]">
        <div className="mb-4 flex flex-col gap-3">
          <h2 className="text-[17px] font-extrabold text-[var(--color-brand-text)]">Орлогын график</h2>
          <div className="grid grid-cols-3 gap-2 rounded-full bg-[var(--color-brand-bg)] p-1">
            {[
              { value: '7d', label: '7 хоног' },
              { value: '1m', label: '1 сар' },
              { value: '3m', label: '3 сар' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setChartRange(item.value as '7d' | '1m' | '3m')}
                className={`h-10 rounded-full text-[12px] font-extrabold ${chartRange === item.value ? 'bg-[var(--color-brand-accent)] text-white' : 'text-[var(--color-brand-muted)]'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[250px] w-full">
          {chartLoading ? (
            <SkeletonCard height="h-full" />
          ) : formattedChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedChartData} margin={{ top: 10, right: 0, left: -8, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: 'var(--color-brand-muted)', fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  formatter={(value) => [formatMNT(Number(value || 0)), 'Орлого']}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-mobile-card)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="revenue" fill="var(--color-brand-accent)" radius={[10, 10, 0, 0]} barSize={chartRange === '3m' ? 44 : 18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[20px] bg-[var(--color-brand-bg)]">
              <p className="text-sm font-bold text-[var(--color-brand-muted)]">Дата байхгүй байна</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3">
            {businessPulse.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="rounded-[22px] bg-white p-4 shadow-[var(--shadow-mobile-card)] transition-transform hover:-translate-y-1">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[var(--color-brand-accent)]"><Icon size={18} /></span>
                  <p className="mt-3 text-[11px] font-bold text-[var(--color-brand-muted)]">{item.label}</p>
                  <p className="mt-1 truncate text-[18px] font-extrabold text-[var(--color-brand-text)]">{item.value}</p>
                </Link>
              );
            })}
          </section>

          <section className="grid grid-cols-2 gap-3">
            {DASHBOARD_ACTION_CONFIG.map((action) => {
              const Icon = action.key === 'newProduct' ? PackagePlus : action.key === 'orders' ? ClipboardList : action.key === 'reviews' ? Star : Users;
              return (
                <Link key={action.href} href={action.href} className="flex min-h-[92px] flex-col items-center justify-center rounded-[20px] bg-[var(--color-brand-secondary)] p-3 text-center shadow-[var(--shadow-mobile-card)] active:scale-[0.97] transition-colors hover:bg-[var(--color-brand-accent)] hover:text-white group">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-brand-accent)] shadow-sm"><Icon size={20} strokeWidth={2.4} /></span>
                  <span className="mt-2 text-[12px] font-extrabold leading-tight text-[var(--color-brand-text)] group-hover:text-white">{action.label}</span>
                </Link>
              );
            })}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)] h-fit">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-extrabold text-[var(--color-brand-text)]">Promote хийх санал</h2>
                <p className="mt-1 text-[12px] text-[var(--color-brand-muted)]">Борлуулалтын дата дээр үндэслэнэ</p>
              </div>
              <Megaphone size={20} className="text-[var(--color-brand-accent)]" />
            </div>
            <div className="space-y-2">
              {(analytics?.topProducts || []).slice(0, 3).map((product: any, index: number) => (
                <Link key={product.id} href={`/admin/products/${product.id}/edit`} className="flex items-center gap-3 rounded-[18px] bg-[var(--color-brand-bg)] p-3 hover:bg-[var(--color-brand-secondary)] transition-colors">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-extrabold text-[var(--color-brand-accent)]">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-extrabold text-[var(--color-brand-text)]">{product.name}</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--color-brand-muted)]">{product.quantity} ширхэг зарагдсан · {formatMNT(product.revenue)}</span>
                  </span>
                  <ChevronRight size={16} className="text-[var(--color-brand-muted)]" />
                </Link>
              ))}
              {!analytics?.topProducts?.length && <p className="rounded-[18px] bg-[var(--color-brand-bg)] p-4 text-center text-[12px] font-bold text-[var(--color-brand-muted)]">Борлуулалтын дата хараахан алга</p>}
            </div>
          </section>

          <section className={`rounded-[24px] border p-4 ${stats?.lowStockCount > 0 ? 'border-[var(--color-brand-danger)]/20 bg-[#fff3f3]' : 'border-[var(--status-success-bg)] bg-[var(--status-success-bg)]/20'}`}>
            <div className={`flex items-center gap-2 ${stats?.lowStockCount > 0 ? 'text-[var(--color-brand-danger)]' : 'text-[var(--status-success)]'}`}>
              <AlertTriangle size={18} />
              <h2 className="text-sm font-extrabold">{stats?.lowStockCount > 0 ? 'Нөөц багатай бараа байна' : 'Нөөц хэвийн байна'}</h2>
            </div>
            {stats?.lowStockCount > 0 && lowStockData?.products?.length > 0 ? (
              <div className="mt-3 flex flex-col gap-2">
                {lowStockData.products.slice(0, 3).map((product: any) => (
                  <Link key={product.id} href={`/admin/products/${product.id}/edit`} className="flex items-center justify-between gap-3 rounded-[14px] bg-white/75 p-3 text-xs hover:bg-white transition-colors">
                    <span className="min-w-0 flex-1 truncate font-bold text-[var(--color-brand-text)]">{product.name}</span>
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 font-bold text-red-700">Нөөц: {product.stock ?? 0}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs font-semibold text-[var(--status-success)]">Бүх барааны нөөц хангалттай байна.</p>
            )}
          </section>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between md:mb-5">
          <h2 className="text-[18px] font-extrabold text-[var(--color-brand-text)]">Сүүлийн захиалга</h2>
          <Link href="/admin/orders" className="text-[12px] font-extrabold text-[var(--color-brand-accent)] hover:underline">Бүгдийг харах</Link>
        </div>
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3">
          {ordersLoading ? (
            Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} height="h-[76px]" />)
          ) : ordersData?.orders?.length > 0 ? (
            ordersData.orders.map((order: any) => (
              <Link key={order.id} href={`/admin/orders?id=${order.id}`} className="flex h-[76px] items-center justify-between rounded-[20px] bg-white px-3 shadow-[var(--shadow-mobile-card)] active:scale-[0.98] transition-transform hover:-translate-y-1">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white">{getInitials(order.customerName || order.user?.name)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-[var(--color-brand-text)]">{order.customerName || order.user?.name || 'Зочин'}</p>
                    <p className="mt-0.5 truncate text-[12px] text-[var(--color-brand-muted)]">{order.items?.length || 0} бараа · {formatMNT(order.total)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 pl-2">
                  <StatusBadge status={order.status} />
                  <span className="text-[11px] text-[var(--color-brand-muted)]">{mounted ? formatRelativeMN(order.createdAt) : ''}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-[22px] bg-white p-8 text-center shadow-[var(--shadow-mobile-card)]"><p className="text-sm font-semibold text-[var(--color-brand-muted)]">Одоогоор захиалга алга.</p></div>
          )}
        </div>
      </section>
    </div>
  );
}
