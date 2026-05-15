'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { db } from '@/lib/firebase';
import { formatPrice } from '@/types';

type Period = 'today' | '7days' | '30days' | 'month';

const PAID_STATUSES = ['confirmed', 'shipped', 'delivered'] as const;

const PERIOD_LABELS: Record<Period, string> = {
  today:   'Өнөөдөр',
  '7days': '7 хоног',
  '30days':'30 хоног',
  month:   'Энэ сар',
};

const STATUS_LABELS: Record<string, string> = {
  pending:   'Хүлээгдэж байна',
  confirmed: 'Баталгаажсан',
  shipped:   'Хүргэлтэнд',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
};

/** Tailwind class sets for each status badge */
const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-status-pending-bg   text-status-pending-text   border-status-pending-border',
  confirmed: 'bg-status-confirmed-bg text-status-confirmed-text border-status-confirmed-border',
  shipped:   'bg-status-shipped-bg   text-status-shipped-text   border-status-shipped-border',
  delivered: 'bg-status-delivered-bg text-status-delivered-text border-status-delivered-border',
  cancelled: 'bg-status-cancelled-bg text-status-cancelled-text border-status-cancelled-border',
};

function getStatusBadgeClass(status: string) {
  return STATUS_BADGE[status] ?? 'bg-sand text-text-subtle border-border-faint';
}

function getOrderTime(order: Record<string, unknown>): number {
  if (order.createdAt && typeof (order.createdAt as { toMillis?: () => number }).toMillis === 'function') {
    return (order.createdAt as { toMillis: () => number }).toMillis();
  }
  if (order.createdAt) return new Date(order.createdAt as string).getTime();
  return 0;
}

function getPeriodStart(period: Period): number {
  const now = new Date();
  if (period === 'today')   return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (period === '7days')   return now.getTime() - 7  * 24 * 60 * 60 * 1000;
  if (period === '30days')  return now.getTime() - 30 * 24 * 60 * 60 * 1000;
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

export default function AdminDashboardPage() {
  const [orders,      setOrders]      = useState<Record<string, unknown>[]>([]);
  const [recentUsers, setRecentUsers] = useState<Record<string, unknown>[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [period,      setPeriod]      = useState<Period>('7days');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        let orderList: Record<string, unknown>[] = [];

        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
          const ordersSnap = await getDocs(collection(db, 'orders'));
          orderList = ordersSnap.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, orderTime: getOrderTime(data) };
          });

          const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
          setRecentUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          const mock = JSON.parse(localStorage.getItem('mock_orders') || '[]') as Record<string, unknown>[];
          orderList  = mock.map(o => ({ ...o, orderTime: getOrderTime(o) }));
        }

        orderList.sort((a, b) => (b.orderTime as number) - (a.orderTime as number));
        setOrders(orderList);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  /* ── Stats ───────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const todayStart = getPeriodStart('today');
    type Stats = { totalOrders: number; todayOrders: number; pendingOrders: number; totalRevenue: number };
    return orders.reduce<Stats>(
      (acc, order) => {
        acc.totalOrders += 1;
        if ((order.orderTime as number) >= todayStart) acc.todayOrders   += 1;
        if (order.status === 'pending')                acc.pendingOrders += 1;
        if (PAID_STATUSES.includes(order.status as typeof PAID_STATUSES[number])) {
          acc.totalRevenue += Number(order.total || 0);
        }
        return acc;
      },
      { totalOrders: 0, todayOrders: 0, pendingOrders: 0, totalRevenue: 0 },
    );
  }, [orders]);

  /* ── Chart data ──────────────────────────────────────────────────────── */
  const chartData = useMemo(() => {
    const start = getPeriodStart(period);
    const byDate: Record<string, { date: string; total: number; count: number }> = {};

    orders
      .filter(o => PAID_STATUSES.includes(o.status as typeof PAID_STATUSES[number]) && (o.orderTime as number) >= start)
      .forEach(o => {
        const date = new Date(o.orderTime as number).toISOString().slice(5, 10);
        if (!byDate[date]) byDate[date] = { date, total: 0, count: 0 };
        byDate[date].total += Number(o.total || 0);
        byDate[date].count += 1;
      });

    return Object.values(byDate);
  }, [orders, period]);

  const recentOrders = orders.slice(0, 10);
  const latestUsers  = recentUsers.slice(0, 10);

  /* ── Stat cards ──────────────────────────────────────────────────────── */
  const cards = [
    { label: 'Нийт захиалга',       value: stats.totalOrders,             note: 'Бүх төлөв багтсан',             accent: 'border-l-dusty-rose' },
    { label: 'Өнөөдрийн захиалга',  value: stats.todayOrders,             note: 'Өнөөдөр ирсэн',                 accent: 'border-l-status-confirmed-border' },
    { label: 'Хүлээгдэж буй',       value: stats.pendingOrders,           note: 'Анхаарал шаардлагатай',         accent: 'border-l-status-pending-border' },
    { label: 'Баталгаажсан орлого', value: formatPrice(stats.totalRevenue),note: 'Цуцлагдсан захиалга ороогүй',  accent: 'border-l-rose-gold' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border border-charcoal border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-10">

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-[0.1em] text-text-subtle">Өнөөдрийн тойм</p>
          <h2 className="mt-1 text-[22px] font-semibold text-charcoal md:text-3xl">Гол үзүүлэлтүүд</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map(card => (
            <div
              key={card.label}
              className={`card-brand border-l-4 ${card.accent} p-6`}
            >
              <p className="text-[11px] uppercase tracking-wider text-text-subtle">{card.label}</p>
              <p className="mt-4 text-3xl font-semibold text-charcoal">{card.value}</p>
              <p className="mt-3 text-xs text-text-subtle">{card.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Revenue chart ─────────────────────────────────────────────────── */}
      <section className="card-brand p-5 md:p-7">
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.1em] text-text-subtle">Орлогын хөдөлгөөн</p>
            <h3 className="mt-1 text-lg font-semibold text-charcoal md:text-2xl">Баталгаажсан борлуулалт</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PERIOD_LABELS) as Period[]).map(key => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`min-h-10 rounded-btn border px-3 text-xs transition-colors ${
                  period === key
                    ? 'border-dusty-rose bg-blush text-charcoal'
                    : 'border-border-faint text-text-subtle hover:bg-sand'
                }`}
              >
                {PERIOD_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[260px] md:h-[360px]">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-text-subtle">Мэдээлэл алга</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#8B6B78', fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#8B6B78', fontSize: 11 }}
                  tickFormatter={(v: number) => `${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{ border: '1px solid rgba(242,199,216,1)', background: '#fff', borderRadius: 0 }}
                  formatter={(v) => formatPrice(Number(v ?? 0))}
                />
                <Line type="monotone" dataKey="total" stroke="#D994B5" strokeWidth={2} dot={{ r: 3, fill: '#D994B5' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ── Recent orders + Users ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Orders table */}
        <div className="surface-panel xl:col-span-2">
          <div className="flex items-center justify-between gap-4 border-b border-border-faint bg-gradient-to-r from-white to-blush/45 p-5 md:p-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-text-subtle">Сүүлийн захиалгууд</p>
              <h3 className="mt-1 text-lg font-semibold text-charcoal">Шинэ хөдөлгөөн</h3>
            </div>
            <Link
              href="/admin/orders"
              className="btn-secondary h-11 px-6 text-xs"
            >
              Бүгдийг үзэх
            </Link>
          </div>

          {/* Table header */}
          <div className="hidden grid-cols-[minmax(0,1fr)_130px_120px_150px] items-center gap-4 border-b border-border-faint bg-sand/75 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-subtle md:grid">
            <span>Харилцагч</span>
            <span className="text-right">Дүн</span>
            <span>Огноо</span>
            <span className="text-right">Төлөв</span>
          </div>

          <div className="divide-y divide-border-faint">
            {recentOrders.length === 0 ? (
              <p className="p-8 text-center text-sm text-text-subtle">Захиалга олдсонгүй</p>
            ) : recentOrders.map(order => (
              <Link
                key={order.id as string}
                href="/admin/orders"
                className="block px-5 py-4 transition-colors hover:bg-sand/80"
              >
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[minmax(0,1fr)_130px_120px_150px] md:gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-charcoal">
                      {String(order.customerName || 'Харилцагч')}
                    </p>
                    <p className="mt-1 truncate text-xs text-text-subtle">
                      #{String(order.id).slice(0, 8)} · {String(order.phone || '-')}
                    </p>
                  </div>
                  <p className="hidden whitespace-nowrap text-right text-sm font-semibold tabular-nums text-charcoal md:block">
                    {formatPrice(Number(order.total || 0))}
                  </p>
                  <p className="hidden text-xs text-text-subtle md:block">
                    {order.orderTime ? new Date(order.orderTime as number).toLocaleDateString('mn-MN') : '-'}
                  </p>
                  <span
                    className={`status-badge ml-auto max-w-[150px] shrink-0 px-3 py-1.5 ${getStatusBadgeClass(String(order.status))}`}
                  >
                    {STATUS_LABELS[String(order.status)] || String(order.status)}
                  </span>
                </div>

                {/* Mobile: date + total */}
                <div className="mt-3 flex items-center justify-between text-sm md:hidden">
                  <span className="text-text-subtle">
                    {order.orderTime ? new Date(order.orderTime as number).toLocaleDateString('mn-MN') : '-'}
                  </span>
                  <span className="font-semibold text-charcoal">{formatPrice(Number(order.total || 0))}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Users */}
        <div className="surface-panel">
          <div className="flex items-center justify-between gap-4 border-b border-border-faint bg-gradient-to-r from-white to-blush/45 p-5 md:p-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-text-subtle">Хэрэглэгчид</p>
              <h3 className="mt-1 text-lg font-semibold text-charcoal">Сүүлд бүртгүүлсэн</h3>
            </div>
            <Link
              href="/admin/users"
              className="btn-secondary h-11 px-6 text-xs"
            >
              Бүгдийг үзэх
            </Link>
          </div>

          <div className="divide-y divide-border-faint">
            {latestUsers.length === 0 ? (
              <p className="p-8 text-center text-sm text-text-subtle">Хэрэглэгч олдсонгүй</p>
            ) : latestUsers.map(u => (
              <div key={u.id as string} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-sand/80">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border-faint bg-blush text-sm font-semibold text-charcoal">
                  {(String(u.displayName || u.email || 'U')).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-charcoal">{String(u.displayName || 'Нэргүй хэрэглэгч')}</p>
                  <p className="truncate text-xs text-text-subtle">{String(u.email || '')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
