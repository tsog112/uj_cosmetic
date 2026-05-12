'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatPrice } from '@/types';
import Pagination, { paginate } from '@/components/admin/Pagination';

const paidStatuses = ['confirmed', 'shipped', 'delivered'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [productPage, setProductPage] = useState(1);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
          const [productSnap, userSnap, orderSnap] = await Promise.all([
            getDocs(query(collection(db, 'products'))),
            getDocs(query(collection(db, 'users'))),
            getDocs(query(collection(db, 'orders'))),
          ]);
          setProducts(productSnap.docs.map(item => ({ id: item.id, ...item.data() })));
          setUsers(userSnap.docs.map(item => ({ id: item.id, ...item.data() })));
          setOrders(orderSnap.docs.map(item => ({ id: item.id, ...item.data() })));
        } else {
          setProducts(JSON.parse(localStorage.getItem('mock_products') || '[]'));
          setUsers(JSON.parse(localStorage.getItem('mock_users') || '[]'));
          setOrders(JSON.parse(localStorage.getItem('mock_orders') || '[]'));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  const productTable = useMemo(() => {
    return products.map(product => {
      const views = product.views || 0;
      const ordered = product.orderCount || 0;
      const conversion = views > 0 ? ((ordered / views) * 100).toFixed(1) : '0.0';
      return {
        id: product.id || product._id,
        name: product.name_mn,
        views,
        ordered,
        conversion,
        stockQuantity: Number(product.stockQuantity ?? 0),
      };
    }).sort((a, b) => b.ordered - a.ordered);
  }, [products]);
  const paginatedProductTable = useMemo(() => paginate(productTable, productPage, 10), [productTable, productPage]);

  const metrics = useMemo(() => {
    const paidOrders = orders.filter(order => paidStatuses.includes(order.status));
    const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const avgOrder = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0;
    const lowStock = products.filter(product => Number(product.stockQuantity ?? 0) <= 5).length;
    const repeatCustomers = users.filter(user => Number(user.orderCount || 0) > 1).length;
    return { revenue, avgOrder, lowStock, repeatCustomers, paidCount: paidOrders.length };
  }, [orders, products, users]);

  const orderChartData = useMemo(() => {
    const counts = [
      { status: 'Хүлээгдэж', count: 0 },
      { status: 'Баталгаажсан', count: 0 },
      { status: 'Хүргэлт', count: 0 },
      { status: 'Хүргэгдсэн', count: 0 },
      { status: 'Цуцлагдсан', count: 0 },
    ];
    orders.forEach(order => {
      if (order.status === 'pending') counts[0].count += 1;
      if (order.status === 'confirmed') counts[1].count += 1;
      if (order.status === 'shipped') counts[2].count += 1;
      if (order.status === 'delivered') counts[3].count += 1;
      if (order.status === 'cancelled') counts[4].count += 1;
    });
    return counts;
  }, [orders]);

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-8 h-8 border border-[#1A1A1A] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const cards = [
    { label: 'Баталгаажсан орлого', value: formatPrice(metrics.revenue), note: `${metrics.paidCount} төлөгдсөн захиалга`, accent: 'border-l-[#FFB7D5]' },
    { label: 'Дундаж захиалга', value: formatPrice(metrics.avgOrder), note: 'Баталгаажсан захиалга', accent: 'border-l-[#B9D7F2]' },
    { label: 'Давтан хэрэглэгч', value: metrics.repeatCustomers, note: '2+ захиалгатай', accent: 'border-l-[#B8DEC1]' },
    { label: 'Бага нөөцтэй', value: metrics.lowStock, note: '5 буюу түүнээс бага', accent: 'border-l-[#F1B8B8]' },
  ];

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Борлуулалтын тойм</p>
        <h2 className="text-[22px] md:text-3xl font-semibold mt-1 text-[#1A1A1A]">Аналитик</h2>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 md:gap-4">
        {cards.map(card => (
          <div key={card.label} className={`rounded-[14px] bg-white border border-[#F2A8C8]/40 border-l-4 ${card.accent} p-4 md:p-5 shadow-[0_8px_24px_rgba(26,26,26,0.04)]`}>
            <p className="text-[10px] md:text-[11px] text-[#8B6B78]">{card.label}</p>
            <p className="text-xl md:text-3xl font-semibold mt-3">{card.value}</p>
            <p className="text-xs text-[#8B6B78] mt-2">{card.note}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[16px] bg-white border border-[#F2A8C8]/40 p-5 md:p-6 shadow-[0_10px_30px_rgba(26,26,26,0.03)]">
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Захиалгын төлөв</p>
          <h3 className="text-lg md:text-2xl font-semibold mt-1">Төлөвийн задаргаа</h3>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={orderChartData}>
              <CartesianGrid vertical={false} stroke="#F2A8C8" opacity={0.25} />
              <XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fill: '#8B6B78', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8B6B78', fontSize: 11 }} />
              <Tooltip contentStyle={{ border: '1px solid rgba(242,168,200,.45)', background: '#fff', borderRadius: 0 }} />
              <Bar dataKey="count" fill="#FFB7D5" barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-[16px] bg-white border border-[#F2A8C8]/40 shadow-[0_10px_30px_rgba(26,26,26,0.03)] overflow-hidden">
        <div className="p-5 md:p-6 border-b border-[#F2A8C8]/40">
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B78]">Бүтээгдэхүүн</p>
          <h3 className="text-lg md:text-2xl font-semibold mt-1">Бүтээгдэхүүний үзүүлэлт</h3>
        </div>

        <div className="md:hidden space-y-3 bg-[#FFF8FB] p-3">
          {productTable.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#8B6B78]">Мэдээлэл алга</p>
          ) : paginatedProductTable.map(product => (
            <div key={product.id} className="rounded-[14px] border border-[#F2A8C8]/35 bg-white p-4 shadow-[0_8px_24px_rgba(26,26,26,0.04)]">
              <p className="font-medium">{product.name}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-[#8B6B78]">Үзэлт</p><p>{product.views}</p></div>
                <div><p className="text-xs text-[#8B6B78]">Зарагдсан</p><p>{product.ordered}</p></div>
                <div><p className="text-xs text-[#8B6B78]">Хөрвөлт</p><p>{product.conversion}%</p></div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FFF8FB] text-[11px] tracking-[0.14em] uppercase text-[#8B6B78]">
              <tr>
                <th className="px-5 py-4 font-medium">Бараа</th>
                <th className="px-5 py-4 font-medium text-right">Үзэлт</th>
                <th className="px-5 py-4 font-medium text-right">Зарагдсан</th>
                <th className="px-5 py-4 font-medium text-right">Хөрвөлт</th>
                <th className="px-5 py-4 font-medium text-right">Нөөц</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2A8C8]/30">
              {productTable.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-[#8B6B78]">Мэдээлэл алга</td></tr>
              ) : paginatedProductTable.map(product => (
                <tr key={product.id} className="hover:bg-[#FFF8FB]">
                  <td className="px-5 py-4 font-medium">{product.name}</td>
                  <td className="px-5 py-4 text-right">{product.views}</td>
                  <td className="px-5 py-4 text-right">{product.ordered}</td>
                  <td className="px-5 py-4 text-right">{product.conversion}%</td>
                  <td className="px-5 py-4 text-right">{product.stockQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={productPage} totalItems={productTable.length} onPageChange={setProductPage} />
      </section>
    </div>
  );
}
