'use client';

import { authDownload } from '@/lib/auth/clientFetch';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Download,
  MessageSquare,
  Package,
  PackagePlus,
  ReceiptText,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminKpiCard from '@/components/admin/dashboard/AdminKpiCard';
import AdminSectionHeader from '@/components/admin/dashboard/AdminSectionHeader';
import AdminRankedList from '@/components/admin/dashboard/AdminRankedList';
import AdminStatusOverview from '@/components/admin/dashboard/AdminStatusOverview';
import AdminRevenueBarChart from '@/components/admin/dashboard/AdminRevenueBarChart';
import StatusBadge from '@/components/admin/StatusBadge';
import SkeletonCard from '@/components/admin/SkeletonCard';
import { DASHBOARD_ACTION_CONFIG } from '@/lib/constants/admin';
import { useAdminAnalytics, useAdminOrders, useAdminProducts, useAdminReviews, useAdminRevenueChart, useAdminStats } from '@/lib/hooks/useAdmin';
import { formatMNT, formatRelativeMN } from '@/lib/utils/format';

function getInitials(name?: string) {
  if (!name) return 'UJ';
  return name
    .trim()
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const actionIcons = {
  newProduct: PackagePlus,
  orders: ClipboardList,
  customers: Users,
  reviews: Star,
} as const;

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics();
  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders({ limit: 8 });
  const { data: lowStockData } = useAdminProducts({ inStock: 'low', limit: 6 });
  const { data: reviewsData } = useAdminReviews({ status: 'pending', page: 1 });
  const [chartRange, setChartRange] = useState<'7d' | '1m' | '3m'>('7d');
  const { data: chartData, isLoading: chartLoading } = useAdminRevenueChart(chartRange);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const summary = analytics?.summary || {};
  const todayStr = mounted
    ? new Date().toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
    : '';
  const reportUrl = `/api/admin/reports/monthly?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`;
  const pendingReviews = reviewsData?.statusCounts?.pending ?? 0;

  const kpis = [
    { label: 'Өнөөдрийн орлого', value: formatMNT(stats?.todayRevenue || 0), hint: 'Цуцлагдаагүй захиалга', icon: ReceiptText, href: '/admin/analytics', tone: 'brand' as const },
    { label: 'Өнөөдрийн захиалга', value: stats?.todayOrderCount || 0, hint: 'Шинэ захиалга', icon: ShoppingBag, href: '/admin/orders', tone: 'neutral' as const },
    { label: 'Хүлээгдэж буй', value: stats?.pendingCount || 0, hint: formatMNT(summary.pendingPaymentAmount || 0), icon: ClipboardList, href: '/admin/orders?status=pending', tone: (stats?.pendingCount || 0) > 0 ? 'warning' as const : 'neutral' as const },
    { label: 'Нөөц бага', value: stats?.lowStockCount || 0, hint: 'Шуурхай нөхөнө', icon: AlertTriangle, href: '/admin/products?inStock=low', tone: (stats?.lowStockCount || 0) > 0 ? 'danger' as const : 'success' as const },
    { label: 'Сарын орлого', value: formatMNT(stats?.monthlyRevenue || summary.monthRevenue || 0), hint: 'Баталгаажсан', icon: TrendingUp, href: '/admin/analytics', tone: 'brand' as const },
    { label: '7 хоногийн орлого', value: formatMNT(summary.weekRevenue || 0), hint: `${summary.paidOrderCount || 0} төлсөн захиалга`, icon: BarChart3, href: '/admin/analytics', tone: 'neutral' as const },
    { label: 'Хэрэглэгчид', value: stats?.totalCustomers || summary.totalCustomers || 0, hint: `Давтан ${summary.repeatCustomers || 0}`, icon: Users, href: '/admin/customers', tone: 'neutral' as const },
    { label: 'Бүтээгдэхүүн', value: stats?.totalProducts || summary.productCount || 0, hint: `Дундаж захиалга ${formatMNT(summary.averageOrder || 0)}`, icon: Package, href: '/admin/products', tone: 'neutral' as const },
  ];

  const topProductItems = useMemo(
    () =>
      (analytics?.topProducts || []).slice(0, 5).map((product: any) => ({
        id: product.id,
        title: product.name,
        subtitle: `${product.quantity} ширхэг · ${product.category}`,
        value: formatMNT(product.revenue),
        href: `/admin/products`,
      })),
    [analytics?.topProducts],
  );

  const inventoryItems = useMemo(
    () =>
      (analytics?.inventoryRisk || lowStockData?.products || [])
        .slice(0, 5)
        .map((product: any) => ({
          id: product.id,
          title: product.name,
          subtitle: product.category || 'Ангилалгүй',
          badge: `Нөөц ${product.stock ?? 0}`,
          badgeTone: (product.stock ?? 0) === 0 ? 'danger' as const : 'warning' as const,
          href: product.id ? `/admin/products/${product.id}/edit` : '/admin/products',
        })),
    [analytics?.inventoryRisk, lowStockData?.products],
  );

  return (
    <AdminPageShell className="gap-5">
      <section className="admin-dashboard-hero">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="admin-eyebrow">UJ Cosmetic · Самбар</p>
            <h1 className="mt-2 font-serif text-[32px] leading-[1.02] text-[var(--color-text-primary)] md:text-[40px]">Дэлгүүрийн тойм</h1>
            <p className="mt-2 text-[14px] capitalize text-[var(--color-text-muted)]">{todayStr}</p>
            {!statsLoading && summary.netProfit != null ? (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-status-done-bg)] px-3 py-1.5 text-[12px] font-extrabold text-[var(--color-status-done-text)]">
                <Wallet size={14} />
                Сарын цэвэр ашиг: {formatMNT(summary.netProfit)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/analytics" className="admin-btn-primary" style={{ textDecoration: 'none' }}>
              <BarChart3 size={16} /> Тайлан нээх
            </Link>
            <button type="button" className="admin-btn-secondary" onClick={() => authDownload(reportUrl).catch(() => {})}>
              <Download size={16} /> CSV татах
            </button>
          </div>
        </div>
      </section>

      <section className="admin-dashboard-grid admin-dashboard-grid--kpis">
        {kpis.map((kpi) => (
          <AdminKpiCard key={kpi.label} {...kpi} loading={statsLoading && analyticsLoading} />
        ))}
      </section>

      <section className="admin-card admin-card-pad">
        <AdminSectionHeader
          eyebrow="Орлого"
          title="Орлогын график"
          description="Захиалга, төлбөрийн хөдөлгөөнийг хугацаагаар харна."
          action={
            <div className="grid grid-cols-3 gap-1 rounded-full bg-[var(--color-bg)] p-1">
              {[
                { value: '7d', label: '7 хоног' },
                { value: '1m', label: '1 сар' },
                { value: '3m', label: '3 сар' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setChartRange(item.value as '7d' | '1m' | '3m')}
                  className={`h-9 rounded-full px-4 text-[12px] font-extrabold transition-colors ${chartRange === item.value ? 'bg-[var(--color-brand)] text-white' : 'text-[var(--color-text-muted)] hover:bg-white hover:text-[var(--color-brand)]'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          }
        />
        <div className="mt-5">
          <AdminRevenueBarChart
            labels={chartData?.labels || []}
            revenue={chartData?.revenue || []}
            loading={chartLoading}
            barSize={chartRange === '3m' ? 40 : 22}
          />
        </div>
      </section>

      <section className="admin-card admin-card-pad">
        <AdminSectionHeader eyebrow="Захиалга" title="Төлөвийн тойм" description="Энэ сарын захиалгын төлөв бүрийн тоо." />
        <div className="mt-4">
          {analyticsLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <AdminStatusOverview rows={analytics?.statusBreakdown || []} />
          )}
        </div>
      </section>

      <div className="admin-dashboard-split">
        <section className="admin-card admin-card-pad">
          <AdminSectionHeader
            title="Сүүлийн захиалга"
            action={
              <Link href="/admin/orders" className="text-[12px] font-extrabold text-[var(--color-brand)]" style={{ textDecoration: 'none' }}>
                Бүгдийг харах
              </Link>
            }
          />
          <div className="mt-4 space-y-2">
            {ordersLoading ? (
              Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} className="h-[72px]" />)
            ) : ordersData?.orders?.length ? (
              ordersData.orders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/admin/orders?id=${order.id}`}
                  className="admin-dashboard-order-row"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-xs font-extrabold text-white">
                      {getInitials(order.customerName || order.user?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-[var(--color-text-primary)]">{order.customerName || order.user?.name || 'Зочин'}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">
                        {order.items?.length || 0} бараа · {formatMNT(order.total)}
                      </p>
                    </div>
                  </div>
                  <div className="admin-dashboard-order-row__meta">
                    <StatusBadge status={order.status} size="sm" />
                    <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">{mounted ? formatRelativeMN(order.createdAt) : ''}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="py-6 text-center text-sm font-semibold text-[var(--color-text-muted)]">Одоогоор захиалга алга.</p>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="admin-card admin-card-pad">
            <AdminSectionHeader title="Топ борлуулалт" description="Энэ сарын хамгийн их зарагдсан бараа." />
            <div className="mt-4">
              <AdminRankedList items={topProductItems} emptyTitle="Борлуулалтын дата алга" />
            </div>
          </section>

          <section className={`admin-card admin-card-pad ${(stats?.lowStockCount || 0) > 0 ? 'border-[var(--color-status-cancel-text)]/30' : ''}`}>
            <AdminSectionHeader
              title="Нөөцийн анхааруулга"
              description={(stats?.lowStockCount || 0) > 0 ? `${stats?.lowStockCount} бараанд нөөц бага байна.` : 'Нөөц хэвийн байна.'}
              action={
                pendingReviews > 0 ? (
                  <Link href="/admin/reviews?status=pending" className="admin-btn-secondary h-9 max-w-full px-3 text-[11px]" style={{ textDecoration: 'none' }}>
                    <MessageSquare size={14} className="shrink-0" />
                    <span className="truncate">{pendingReviews} сэтгэгдэл</span>
                  </Link>
                ) : null
              }
            />
            <div className="mt-4">
              <AdminRankedList items={inventoryItems} emptyTitle="Нөөц бага бараа алга" emptyBody="Бүх бүтээгдэхүүний нөөц хангалттай." />
            </div>
          </section>
        </div>
      </div>

      <section className="admin-card admin-card-pad">
        <AdminSectionHeader eyebrow="Түргэн үйлдэл" title="Түгээмэл цэс" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DASHBOARD_ACTION_CONFIG.map((action) => {
            const Icon = actionIcons[action.key as keyof typeof actionIcons] || PackagePlus;
            return (
              <Link key={action.href} href={action.href} className="admin-quick-action">
                <span className="admin-stat-icon">
                  <Icon size={20} />
                </span>
                <span className="text-[12px] font-extrabold leading-tight text-[var(--color-text-primary)]">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </AdminPageShell>
  );
}
