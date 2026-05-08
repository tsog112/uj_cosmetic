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

  const productTable = useMemo(() => {
    return products.map(p => {
      const views = p.views || Math.floor(Math.random() * 500) + 50; 
      const cartAdds = p.cartAdds || Math.floor(views * 0.1);
      const ordered = p.orderCount || Math.floor(cartAdds * 0.4);
      const conversion = views > 0 ? ((ordered / views) * 100).toFixed(1) : '0.0';
      return { id: p.id || p._id, name: p.name_mn, views, cartAdds, ordered, conversion };
    }).sort((a, b) => b.ordered - a.ordered);
  }, [products]);

  const userMetrics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    let newUsersThisMonth = 0;
    let repeatCustomers = 0;
    
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

  const orderMetrics = useMemo(() => {
    let totalRevenue = 0;
    const statusCounts: Record<string, number> = {};
    const dayCounts = [0,0,0,0,0,0,0];

    orders.forEach(o => {
      const statusKey = o.status === 'pending' ? 'Хүлээгдэж байна' :
                        o.status === 'confirmed' ? 'Баталгаажсан' :
                        o.status === 'shipped' ? 'Хүргэлтэнд гарсан' :
                        o.status === 'delivered' ? 'Хүргэгдсэн' :
                        o.status === 'cancelled' ? 'Цуцлагдсан' : o.status;

      if (statusKey !== 'Цуцлагдсан') {
        totalRevenue += (o.total || 0);
      }
      statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
      
      if (o.createdTime) {
        const day = new Date(o.createdTime).getDay();
        dayCounts[day]++;
      }
    });

    const avgOrder = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
    
    const totalCartAdds = productTable.reduce((acc, p) => acc + p.cartAdds, 0);
    const abandonedCartPct = totalCartAdds > 0 ? (((totalCartAdds - orders.length) / totalCartAdds) * 100).toFixed(1) : '0.0';

    const COLORS: Record<string, string> = {
      'Хүлээгдэж байна': '#E5E1DA',
      'Баталгаажсан': '#E8D5D0',
      'Хүргэлтэнд гарсан': '#525252',
      'Хүргэгдсэн': '#1A1A1A',
      'Цуцлагдсан': '#FEE2E2'
    };

    const pieData = Object.keys(statusCounts).map(k => ({
      name: k,
      value: statusCounts[k],
      color: COLORS[k] || '#E5E1DA'
    }));

    const daysOfWeek = ['Ням', 'Дав', 'Мяг', 'Лха', 'Пүр', 'Баа', 'Бям'];
    const barData = daysOfWeek.map((day, idx) => ({ day, count: dayCounts[idx] }));

    return { avgOrder, abandonedCartPct, pieData, barData };
  }, [orders, productTable]);

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-8 h-8 border border-charcoal border-t-transparent rounded-full animate-spin"/></div>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-sand border border-border p-4 shadow-sm text-sm">
          <p className="font-serif italic text-charcoal mb-1">{label}</p>
          <p className="text-charcoal font-medium">Тоо: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-6">
        <h2 className="font-serif text-3xl text-charcoal tracking-wide">Аналитик</h2>
      </div>

      {/* 1. PRODUCT METRICS */}
      <section>
        <h3 className="font-serif text-xl text-charcoal tracking-wide mb-6">Бүтээгдэхүүний тайлан</h3>
        <div className="bg-sand border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-sand-dark border-b border-border">
                <tr>
                  <th className="px-8 py-4 editorial-label text-charcoal">Барааны нэр</th>
                  <th className="px-8 py-4 editorial-label text-charcoal text-right">Үзэлт</th>
                  <th className="px-8 py-4 editorial-label text-charcoal text-right">Сагсанд нэмсэн</th>
                  <th className="px-8 py-4 editorial-label text-charcoal text-right">Захиалсан</th>
                  <th className="px-8 py-4 editorial-label text-charcoal text-right">Хөрвөлт</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productTable.map((p, i) => (
                  <tr key={p.id} className="hover:bg-sand-dark transition-colors">
                    <td className="px-8 py-5 text-charcoal font-serif text-base tracking-wide">{i+1}. {p.name}</td>
                    <td className="px-8 py-5 text-right font-sans text-sm text-neutral-600">{p.views}</td>
                    <td className="px-8 py-5 text-right font-sans text-sm text-neutral-600">{p.cartAdds}</td>
                    <td className="px-8 py-5 text-right font-sans text-sm text-charcoal font-medium">{p.ordered}</td>
                    <td className="px-8 py-5 text-right">
                      <span className="editorial-label border-b border-charcoal text-charcoal pb-0.5">{p.conversion}%</span>
                    </td>
                  </tr>
                ))}
                {productTable.length === 0 && (
                  <tr><td colSpan={5} className="px-8 py-12 text-center editorial-label text-neutral-400">Мэдээлэл алга</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* 2. CUSTOMER METRICS */}
        <section>
          <h3 className="font-serif text-xl text-charcoal tracking-wide mb-6">Хэрэглэгчийн тайлан</h3>
          <div className="bg-sand border border-border p-8 space-y-10">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-sand border border-border p-6 text-center">
                <p className="editorial-label mb-2">Нийт</p>
                <p className="font-serif text-3xl text-charcoal">{userMetrics.total}</p>
              </div>
              <div className="bg-sand border border-border p-6 text-center">
                <p className="editorial-label mb-2">Шинэ (Сар)</p>
                <p className="font-serif text-3xl text-charcoal">{userMetrics.newThisMonth}</p>
              </div>
              <div className="bg-sand border border-border p-6 text-center">
                <p className="editorial-label mb-2">Дахин захиалсан</p>
                <p className="font-serif text-3xl text-charcoal">{userMetrics.repeat}</p>
              </div>
            </div>

            <div>
              <p className="editorial-label text-charcoal mb-6 border-b border-border pb-2">Өсөлт (6 сар)</p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userMetrics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E1DA" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10, fontFamily: 'var(--font-inter)', letterSpacing: '0.1em'}} dy={10} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#F9F8F6'}} />
                    <Bar dataKey="count" fill="#1A1A1A" radius={[2,2,0,0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* 3. ORDER METRICS */}
        <section>
          <h3 className="font-serif text-xl text-charcoal tracking-wide mb-6">Захиалгын тайлан</h3>
          <div className="bg-sand border border-border p-8 space-y-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-sand border border-border p-6">
                <p className="editorial-label mb-2">Дундаж захиалгын дүн</p>
                <p className="font-serif text-3xl text-charcoal">{formatPrice(orderMetrics.avgOrder)}</p>
              </div>
              <div className="bg-sand border border-border p-6">
                <p className="editorial-label mb-2">Хаягдсан сагс</p>
                <p className="font-serif text-3xl text-neutral-500 italic">{orderMetrics.abandonedCartPct}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div>
                <p className="editorial-label text-charcoal mb-6 border-b border-border pb-2 text-center">Захиалгын төлөв</p>
                <div className="h-48 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={orderMetrics.pieData} innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                        {orderMetrics.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 mt-4 items-center">
                  {orderMetrics.pieData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 editorial-label text-neutral-600">
                      <div className="w-2.5 h-2.5 border border-border" style={{backgroundColor: entry.color}}/>
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="editorial-label text-charcoal mb-6 border-b border-border pb-2 text-center">Идэвхтэй өдрүүд</p>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderMetrics.barData} layout="vertical" margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="day" type="category" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10, fontFamily: 'var(--font-inter)', letterSpacing: '0.1em'}} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: '#F9F8F6'}} />
                      <Bar dataKey="count" fill="#E8D5D0" radius={[0,2,2,0]} barSize={16} />
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
