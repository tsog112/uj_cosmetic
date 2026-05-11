'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { db } from '@/lib/firebase';
import { formatPrice } from '@/types';

type Period = 'today' | '7days' | '30days' | 'month';

const paidStatuses = ['confirmed', 'shipped', 'delivered'];

const periodLabels: Record<Period, string> = {
  today: 'Өнөөдөр',
  '7days': '7 хоног',
  '30days': '30 хоног',
  month: 'Энэ сар',
};

const statusLabels: Record<string, string> = {
  pending: 'Хүлээгдэж байна',
  confirmed: 'Баталгаажсан',
  shipped: 'Хүргэлтэнд',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
};

function getOrderTime(order: any) {
  if (order.createdAt?.toMillis) return order.createdAt.toMillis();
  if (order.createdAt) return new Date(order.createdAt).getTime();
  return 0;
}

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

function getPeriodStart(period: Period) {
  const now = new Date();
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (period === '7days') return now.getTime() - 7 * 24 * 60 * 60 * 1000;
  if (period === '30days') return now.getTime() - 30 * 24 * 60 * 60 * 1000;
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7days');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        let orderList: any[] = [];

        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
          const ordersSnap = await getDocs(collection(db, 'orders'));
          orderList = ordersSnap.docs.map(orderDoc => {
            const data = orderDoc.data();
            return { id: orderDoc.id, ...data, orderTime: getOrderTime(data) };
          });

          const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5)));
          setRecentUsers(usersSnap.docs.map(userDoc => ({ id: userDoc.id, ...userDoc.data() })));
        } else {
          const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
          orderList = mockOrders.map((order: any) => ({ ...order, orderTime: getOrderTime(order) }));
        }

        orderList.sort((a, b) => b.orderTime - a.orderTime);
        setOrders(orderList);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    const startOfToday = getPeriodStart('today');
    return orders.reduce(
      (acc, order) => {
        acc.totalOrders += 1;
        if (order.orderTime >= startOfToday) acc.todayOrders += 1;
        if (order.status === 'pending') acc.pendingOrders += 1;
        if (paidStatuses.includes(order.status)) acc.totalRevenue += Number(order.total || 0);
        return acc;
      },
      { totalOrders: 0, todayOrders: 0, pendingOrders: 0, totalRevenue: 0 }
    );
  }, [orders]);

  const chartData = useMemo(() => {
    const start = getPeriodStart(period);
    const byDate: Record<string, { date: string; total: number; count: number }> = {};

    orders
      .filter(order => paidStatuses.includes(order.status) && order.orderTime >= start)
      .forEach(order => {
        const date = new Date(order.orderTime).toISOString().slice(5, 10);
        if (!byDate[date]) byDate[date] = { date, total: 0, count: 0 };
        byDate[date].total += Number(order.total || 0);
        byDate[date].count += 1;
      });

    return Object.values(byDate);
  }, [orders, period]);

  const recentOrders = orders.slice(0, 6);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: 'Нийт захиалга', value: stats.totalOrders, note: 'Бүх төлөв багтсан', accent: 'border-l-[#F2A8C8]' },
    { label: 'Өнөөдрийн захиалга', value: stats.todayOrders, note: 'Өнөөдөр ирсэн', accent: 'border-l-[#B9D7F2]' },
    { label: 'Хүлээгдэж буй', value: stats.pendingOrders, note: 'Анхаарал шаардлагатай', accent: 'border-l-[#F1D28A]' },
    { label: 'Баталгаажсан орлого', value: formatPrice(stats.totalRevenue), note: 'Цуцлагдсан захиалга ороогүй', accent: 'border-l-[#FFB7D5]' },
  ];

  return (
    <div className="space-y-4 md:space-y-10">
      <section>
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Өнөөдрийн тойм</p>
          <h2 className="text-[22px] md:text-3xl font-semibold mt-1 text-[#1A1A1A]">Гол үзүүлэлтүүд</h2>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 md:gap-4">
          {cards.map(card => (
            <div key={card.label} className={`rounded-[14px] bg-white border border-[#F2A8C8]/40 border-l-4 ${card.accent} p-4 md:p-6 shadow-[0_8px_24px_rgba(26,26,26,0.04)]`}>
              <p className="text-[10px] md:text-[11px] text-[#8B6B78]">{card.label}</p>
              <p className="text-xl md:text-4xl font-semibold mt-3 md:mt-4 text-[#1A1A1A]">{card.value}</p>
              <p className="text-xs text-[#8B6B78] mt-3">{card.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[16px] bg-white border border-[#F2A8C8]/40 p-5 md:p-7 shadow-[0_10px_30px_rgba(26,26,26,0.03)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-7">
          <div>
            <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Орлогын хөдөлгөөн</p>
            <h3 className="text-lg md:text-2xl font-semibold mt-1">Баталгаажсан борлуулалт</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(periodLabels) as Period[]).map(item => (
              <button
                key={item}
                onClick={() => setPeriod(item)}
                className={`min-h-10 rounded-[10px] px-3 border text-xs transition-colors ${
                  period === item
                    ? 'border-[#FFB7D5] bg-[#FFF0F6] text-[#1A1A1A]'
                    : 'border-[#F2A8C8]/50 text-[#8B6B78] hover:bg-[#FFF8FB]'
                }`}
              >
                {periodLabels[item]}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[260px] md:h-[360px]">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-[#8B6B78]">Мэдээлэл алга</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#8B6B78', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8B6B78', fontSize: 11 }} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip
                  contentStyle={{ border: '1px solid rgba(242,168,200,.45)', background: '#fff', borderRadius: 0 }}
                  formatter={(value: any) => formatPrice(Number(value))}
                />
                <Line type="monotone" dataKey="total" stroke="#FFB7D5" strokeWidth={2} dot={{ r: 3, fill: '#FFB7D5' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-[16px] bg-white border border-[#F2A8C8]/40 shadow-[0_10px_30px_rgba(26,26,26,0.03)] overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#F2A8C8]/40 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Сүүлийн захиалгууд</p>
              <h3 className="text-lg font-semibold mt-1">Шинэ хөдөлгөөн</h3>
            </div>
            <Link href="/admin/orders" className="text-xs tracking-[0.12em] uppercase border-b border-[#FFB7D5] pb-1">
              Бүгдийг үзэх
            </Link>
          </div>

          <div className="divide-y divide-[#F2A8C8]/30">
            {recentOrders.length === 0 ? (
              <p className="p-8 text-center text-sm text-[#8B6B78]">Захиалга олдсонгүй</p>
            ) : recentOrders.map(order => (
              <Link key={order.id} href="/admin/orders" className="block p-4 md:p-6 hover:bg-[#FFF8FB] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate text-[15px] md:text-base">{order.customerName || 'Харилцагч'}</p>
                    <p className="text-xs text-[#8B6B78] mt-1 truncate">#{order.id.slice(0, 8)} · {order.phone || '-'}</p>
                  </div>
                  <span className={`shrink-0 rounded-[7px] border px-2 py-1 text-[10px] tracking-[0.04em] max-w-[150px] truncate ${getStatusColor(order.status)}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-[#8B6B78]">Огноо</p>
                    <p className="truncate">{order.orderTime ? new Date(order.orderTime).toLocaleDateString('mn-MN') : '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[#8B6B78]">Дүн</p>
                    <p className="font-semibold">{formatPrice(order.total || 0)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] bg-white border border-[#F2A8C8]/40 shadow-[0_10px_30px_rgba(26,26,26,0.03)] overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#F2A8C8]/40">
            <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Хэрэглэгчид</p>
            <h3 className="text-lg font-semibold mt-1">Сүүлд бүртгүүлсэн</h3>
          </div>
          <div className="divide-y divide-[#F2A8C8]/30">
            {recentUsers.length === 0 ? (
              <p className="p-8 text-center text-sm text-[#8B6B78]">Хэрэглэгч олдсонгүй</p>
            ) : recentUsers.map(user => (
              <div key={user.id} className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-[10px] bg-[#FFF0F6] border border-[#F2A8C8]/50 flex items-center justify-center text-sm font-semibold">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm truncate">{user.displayName || 'Нэргүй хэрэглэгч'}</p>
                  <p className="text-xs text-[#8B6B78] truncate">{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
