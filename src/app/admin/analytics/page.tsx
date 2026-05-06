'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { formatPrice } from '@/types';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
          const pSnap = await getDocs(query(collection(db, "products")));
          const pList: any[] = [];
          pSnap.forEach(d => pList.push({ id: d.id, ...d.data() }));
          setProducts(pList);

          const uSnap = await getDocs(query(collection(db, "users")));
          const uList: any[] = [];
          uSnap.forEach(d => {
            const data = d.data();
            const created = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt ? new Date(data.createdAt).getTime() : 0);
            uList.push({ id: d.id, ...data, createdTime: created });
          });
          setUsers(uList);

          const oSnap = await getDocs(query(collection(db, "orders")));
          const oList: any[] = [];
          oSnap.forEach(d => {
            const data = d.data();
            const created = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt ? new Date(data.createdAt).getTime() : 0);
            oList.push({ id: d.id, ...data, createdTime: created });
          });
          setOrders(oList);
        } else {
          // Mock data
          setProducts(JSON.parse(localStorage.getItem('mock_products') || '[]'));
          setUsers(JSON.parse(localStorage.getItem('mock_users') || '[]'));
          setOrders(JSON.parse(localStorage.getItem('mock_orders') || '[]'));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // 1. PRODUCT METRICS
  const productTable = useMemo(() => {
    return products.map(p => {
      const views = p.views || Math.floor(Math.random() * 500) + 50; // mock if undefined
      const cartAdds = p.cartAdds || Math.floor(views * 0.1);
      const ordered = p.orderCount || Math.floor(cartAdds * 0.4);
      const conversion = views > 0 ? ((ordered / views) * 100).toFixed(1) : '0.0';
      return { id: p.id || p._id, name: p.name_mn, views, cartAdds, ordered, conversion };
    }).sort((a, b) => b.ordered - a.ordered);
  }, [products]);

  // 2. USER METRICS
  const userMetrics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    let newUsersThisMonth = 0;
    let repeatCustomers = 0;
    
    // Bar chart: registrations by month (last 6 months)
    const monthCounts: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('mn-MN', { month: 'short' });
      monthCounts[label] = 0;
    }

    users.forEach(u => {
      if (u.createdTime >= startOfMonth) newUsersThisMonth++;
      if ((u.orderCount || 0) > 1) repeatCustomers++;
      
      if (u.createdTime) {
        const d = new Date(u.createdTime);
        const label = d.toLocaleString('mn-MN', { month: 'short' });
        if (monthCounts[label] !== undefined) {
          monthCounts[label]++;
        }
      }
    });

    const chartData = Object.keys(monthCounts).map(k => ({ month: k, count: monthCounts[k] }));

    return {
      total: users.length,
      newThisMonth: newUsersThisMonth,
      repeat: repeatCustomers,
      chartData
    };
  }, [users]);

  // 3. ORDER METRICS
  const orderMetrics = useMemo(() => {
    let totalRevenue = 0;
    const statusCounts: Record<string, number> = {};
    const dayCounts = [0,0,0,0,0,0,0]; // Sun-Sat

    orders.forEach(o => {
      if (o.status !== 'Цуцлагдсан') {
        totalRevenue += (o.total || 0);
      }
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      
      if (o.createdTime) {
        const day = new Date(o.createdTime).getDay();
        dayCounts[day]++;
      }
    });

    const avgOrder = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
    
    // Calculate total cart adds across all products to mock abandoned cart
    const totalCartAdds = productTable.reduce((acc, p) => acc + p.cartAdds, 0);
    const abandonedCartPct = totalCartAdds > 0 ? (((totalCartAdds - orders.length) / totalCartAdds) * 100).toFixed(1) : '0.0';

    const COLORS: Record<string, string> = {
      'Хүлээгдэж байна': '#FBBF24',
      'Баталгаажсан': '#3B82F6',
      'Хүргэлтэнд гарсан': '#8B5CF6',
      'Хүргэгдсэн': '#10B981',
      'Цуцлагдсан': '#EF4444'
    };

    const pieData = Object.keys(statusCounts).map(k => ({
      name: k,
      value: statusCounts[k],
      color: COLORS[k] || '#9CA3AF'
    }));

    const daysOfWeek = ['Дав', 'Мяг', 'Лха', 'Пүр', 'Баа', 'Бям', 'Ням'];
    const barData = daysOfWeek.map((day, idx) => ({ day, count: dayCounts[idx] }));

    return { avgOrder, abandonedCartPct, pieData, barData };
  }, [orders, productTable]);

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-12 h-12 border-4 border-gray-200 border-t-accent rounded-full animate-spin"/></div>;
  }

  return (
    <div className="space-y-10 pb-24 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">Аналитик</h2>

      {/* 1. БАРАА БҮТЭЭГДЭХҮҮНИЙ ТАЙЛАН */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Бараа бүтээгдэхүүний тайлан</h3>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Барааны нэр</th>
                  <th className="px-6 py-4 font-medium text-right">Үзсэн тоо</th>
                  <th className="px-6 py-4 font-medium text-right">Сагсанд нэмсэн</th>
                  <th className="px-6 py-4 font-medium text-right">Захиалсан</th>
                  <th className="px-6 py-4 font-medium text-right">Хөрвөлт %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productTable.map((p, i) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-900 font-medium">{i+1}. {p.name}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{p.views}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{p.cartAdds}</td>
                    <td className="px-6 py-3 text-right text-gray-900 font-bold">{p.ordered}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-bold">{p.conversion}%</span>
                    </td>
                  </tr>
                ))}
                {productTable.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Мэдээлэл олдсонгүй</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* 2. ХАРИЛЦАГЧИЙН ТАЙЛАН */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Харилцагчийн тайлан</h3>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Нийт хэрэглэгч</p>
                <p className="text-2xl font-bold text-gray-900">{userMetrics.total}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-xs text-blue-600 uppercase font-bold mb-1">Шинэ (сар)</p>
                <p className="text-2xl font-bold text-blue-900">{userMetrics.newThisMonth}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-xs text-green-600 uppercase font-bold mb-1">Дахин захиалсан</p>
                <p className="text-2xl font-bold text-green-900">{userMetrics.repeat}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-600 mb-4">Өсөлт (Сүүлийн 6 сар)</p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userMetrics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                    <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* 3. ЗАХИАЛГЫН ТАЙЛАН */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Захиалгын тайлан</h3>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Дундаж захиалгын дүн</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(orderMetrics.avgOrder)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-xs text-red-600 uppercase font-bold mb-1">Хаягдсан сагс</p>
                <p className="text-2xl font-bold text-red-900">{orderMetrics.abandonedCartPct}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-bold text-gray-600 mb-4 text-center">Захиалгын төлөв</p>
                <div className="h-40 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={orderMetrics.pieData} innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                        {orderMetrics.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {orderMetrics.pieData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1 text-[10px] text-gray-600">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: entry.color}}/>
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-600 mb-4 text-center">Идэвхтэй өдрүүд</p>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderMetrics.barData} layout="vertical" margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="day" type="category" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} />
                      <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="count" fill="#FFB7D5" radius={[0,4,4,0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
