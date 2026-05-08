'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { formatPrice } from '@/types';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

type Period = 'Өнөөдөр' | '7 хоног' | '30 хоног' | 'Энэ сар';
const PAID_STATUSES = ['confirmed', 'shipped', 'delivered', 'Баталгаажсан', 'Хүргэлтэнд гарсан', 'Хүргэгдсэн'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7 хоног');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let oList: any[] = [];
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
          const ordersSnap = await getDocs(collection(db, "orders"));
          ordersSnap.forEach(doc => {
            const data = doc.data();
            let orderTime = 0;
            if (data.createdAt?.toMillis) orderTime = data.createdAt.toMillis();
            else if (data.createdAt) orderTime = new Date(data.createdAt).getTime();
            oList.push({ id: doc.id, ...data, orderTime });
          });
        } else {
          const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
          oList = mockOrders.map((o: any) => ({
            ...o,
            orderTime: new Date(o.createdAt).getTime()
          }));
        }

        let tOrders = 0;
        let pOrders = 0;
        let tRev = 0;
        let todayO = 0;
        
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        oList.forEach(o => {
          tOrders++;
          if (o.status === 'pending' || o.status === 'Хүлээгдэж байна') pOrders++;
          if (PAID_STATUSES.includes(o.status)) tRev += (o.total || 0);
          if (o.orderTime >= startOfToday) todayO++;
        });

        setStats({
          totalOrders: tOrders,
          todayOrders: todayO,
          pendingOrders: pOrders,
          totalRevenue: tRev
        });

        oList.sort((a, b) => b.orderTime - a.orderTime);
        setAllOrders(oList);
        setRecentOrders(oList.slice(0, 10));

        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
          const usersQ = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
          const usersSnap = await getDocs(usersQ);
          const uList: any[] = [];
          usersSnap.forEach(doc => {
            uList.push({ id: doc.id, ...doc.data() });
          });
          setRecentUsers(uList);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': case 'Хүлээгдэж байна': return 'bg-sand text-neutral-600 border-border';
      case 'confirmed': case 'Баталгаажсан': return 'bg-[#E8D5D0]/20 text-charcoal border-[#E8D5D0]';
      case 'shipped': case 'Хүргэлтэнд гарсан': return 'bg-charcoal/5 text-charcoal border-charcoal/20';
      case 'delivered': case 'Хүргэгдсэн': return 'bg-sand text-charcoal border-charcoal';
      case 'cancelled': case 'Цуцлагдсан': return 'bg-red-50 text-red-800 border-red-200';
      default: return 'bg-sand text-neutral-600 border-border';
    }
  };

  const formatDateStr = (date: any) => {
    if (!date) return '-';
    if (date.toDate) return date.toDate().toLocaleString('mn-MN');
    if (typeof date === 'string') return new Date(date).toLocaleString('mn-MN');
    if (typeof date === 'number') return new Date(date).toLocaleString('mn-MN');
    return '-';
  };

  const filterOrdersByPeriod = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    return allOrders.filter(o => {
      if (!PAID_STATUSES.includes(o.status)) return false;
      const t = o.orderTime;
      if (period === 'Өнөөдөр') return t >= startOfToday;
      if (period === '7 хоног') return t >= (now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (period === '30 хоног') return t >= (now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (period === 'Энэ сар') return t >= new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return true;
    });
  };

  const periodOrders = useMemo(() => filterOrdersByPeriod(), [allOrders, period]);

  const { chartData, tableData, topProducts } = useMemo(() => {
    const dailyMap: Record<string, { dateStr: string, timestamp: number, total: number, count: number }> = {};
    const productMap: Record<string, { id: string, name: string, image: string, units: number, revenue: number }> = {};

    periodOrders.forEach(o => {
      const d = new Date(o.orderTime);
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { dateStr: dateKey, timestamp: new Date(dateKey).getTime(), total: 0, count: 0 };
      }
      dailyMap[dateKey].total += (o.total || 0);
      dailyMap[dateKey].count += 1;

      if (o.items) {
        o.items.forEach((item: any) => {
          const productId = item.productId || item.id;
          if (!productMap[productId]) {
            productMap[productId] = {
              id: productId,
              name: item.name_mn || item.name,
              image: item.imageUrl || item.image || '',
              units: 0,
              revenue: 0
            };
          }
          productMap[productId].units += (item.quantity || 1);
          productMap[productId].revenue += ((item.price || 0) * (item.quantity || 1));
        });
      }
    });

    const cData = Object.values(dailyMap).sort((a, b) => a.timestamp - b.timestamp);
    const tData = [...cData].reverse(); 

    const topProds = Object.values(productMap).sort((a, b) => b.units - a.units).slice(0, 5);

    return { chartData: cData, tableData: tData, topProducts: topProds };
  }, [periodOrders]);

  const totalPeriodRevenue = tableData.reduce((acc, row) => acc + row.total, 0);
  const totalPeriodOrders = tableData.reduce((acc, row) => acc + row.count, 0);

  const downloadExcel = () => {
    const worksheetData = [
      ['Date', 'Orders', 'Revenue', 'Avg. Order'],
      ...tableData.map(row => [
        row.dateStr,
        row.count,
        row.total,
        Math.round(row.total / row.count)
      ]),
      ['Total', totalPeriodOrders, totalPeriodRevenue, totalPeriodOrders ? Math.round(totalPeriodRevenue / totalPeriodOrders) : 0]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Revenue");
    XLSX.writeFile(wb, `Revenue_${period}.xlsx`);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-sand border border-border p-6 shadow-sm text-sm">
          <p className="font-serif italic text-charcoal mb-2">{label}</p>
          <p className="text-charcoal font-medium mb-1 tracking-wide">
            Орлого: {formatPrice(payload[0].value)}
          </p>
          <p className="text-neutral-500 text-xs uppercase tracking-widest mt-2">
            Захиалгууд: {payload[0].payload.count}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-8 h-8 border border-charcoal border-t-transparent rounded-full animate-spin"/></div>;
  }

  return (
    <div className="space-y-12">
      <div>
        <h2 className="font-serif text-3xl text-charcoal mb-8 tracking-wide">Ерөнхий мэдээлэл</h2>
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-sand p-8 border border-border flex flex-col justify-center">
            <p className="editorial-label mb-4">Нийт захиалга</p>
            <p className="text-4xl font-serif text-charcoal">{stats.totalOrders}</p>
          </div>
          <div className="bg-sand p-8 border border-border flex flex-col justify-center">
            <p className="editorial-label mb-4">Өнөөдрийн захиалга</p>
            <p className="text-4xl font-serif text-charcoal">{stats.todayOrders}</p>
          </div>
          <div className="bg-sand p-8 border border-border flex flex-col justify-center">
            <p className="editorial-label mb-4">Хүлээгдэж буй захиалга</p>
            <p className="text-4xl font-serif text-neutral-500 italic">{stats.pendingOrders}</p>
          </div>
          <div className="bg-sand p-8 border border-border flex flex-col justify-center">
            <p className="editorial-label mb-4">Нийт орлого</p>
            <p className="text-4xl font-serif text-charcoal">{formatPrice(stats.totalRevenue)}</p>
            <p className="text-[9px] text-neutral-400 mt-4 uppercase tracking-widest">(Баталгаажсан)</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-sand border border-border p-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6 border-b border-border pb-6">
          <h3 className="font-serif text-2xl text-charcoal tracking-wide">Орлогын өсөлт</h3>
          <div className="flex gap-6">
            {(['Өнөөдөр', '7 хоног', '30 хоног', 'Энэ сар'] as Period[]).map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)}
                className={`editorial-label transition-colors border-b pb-1 ${
                  period === p ? 'text-charcoal border-charcoal' : 'text-neutral-400 border-transparent hover:text-charcoal hover:border-charcoal/30'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[400px] w-full mb-16">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center editorial-label text-neutral-400">Мэдээлэл алга</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E1DA" />
                <XAxis dataKey="dateStr" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10, fontFamily: 'var(--font-inter)', letterSpacing: '0.1em'}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10, fontFamily: 'var(--font-inter)', letterSpacing: '0.1em'}} dx={-15} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E8D5D0', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Line type="monotone" dataKey="total" stroke="#1A1A1A" strokeWidth={1.5} dot={{r: 3, strokeWidth: 1, fill: '#F7F2EB', stroke: '#1A1A1A'}} activeDot={{r: 5, fill: '#1A1A1A', stroke: '#F7F2EB'}} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Table & Top Products */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
          
          {/* Table */}
          <div>
            <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
              <h4 className="font-serif text-xl text-charcoal">Дэлгэрэнгүй тайлан</h4>
              <button onClick={downloadExcel} className="editorial-label text-charcoal border-b border-transparent hover:border-charcoal pb-1 transition-all flex items-center gap-2">
                CSV татах
              </button>
            </div>
            <div className="overflow-hidden border border-border">
              <table className="w-full text-sm text-left">
                <thead className="bg-sand-dark">
                  <tr>
                    <th className="px-6 py-4 editorial-label text-charcoal">Огноо</th>
                    <th className="px-6 py-4 editorial-label text-charcoal text-center">Захиалгууд</th>
                    <th className="px-6 py-4 editorial-label text-charcoal text-right">Орлого</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-sand">
                  {tableData.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-12 text-center editorial-label text-neutral-400">Мэдээлэл олдсонгүй</td></tr>
                  ) : tableData.map(row => (
                    <tr key={row.dateStr} className="hover:bg-sand-dark transition-colors">
                      <td className="px-6 py-4 font-sans text-sm text-charcoal tracking-wide">{row.dateStr}</td>
                      <td className="px-6 py-4 text-center text-neutral-600">{row.count}</td>
                      <td className="px-6 py-4 text-right font-sans text-sm text-charcoal tracking-wide">{formatPrice(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
                {tableData.length > 0 && (
                  <tfoot className="bg-sand-dark border-t border-border">
                    <tr>
                      <td className="px-6 py-6 editorial-label text-charcoal">Нийт</td>
                      <td className="px-6 py-6 text-center font-sans text-sm text-charcoal">{totalPeriodOrders}</td>
                      <td className="px-6 py-6 text-right font-sans text-sm text-charcoal tracking-wide">{formatPrice(totalPeriodRevenue)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div>
            <h4 className="font-serif text-xl text-charcoal mb-8 border-b border-border pb-4">Шилдэг бүтээгдэхүүнүүд ({period})</h4>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <div className="p-12 border border-border text-center editorial-label text-neutral-400">Мэдээлэл алга</div>
              ) : topProducts.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-6 p-4 border border-border hover:bg-sand-dark transition-colors bg-sand">
                  <div className="w-8 text-center editorial-label text-neutral-400">{idx + 1}</div>
                  <div className="w-16 h-20 bg-sand-dark overflow-hidden flex-shrink-0">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover grayscale opacity-80" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center editorial-label text-neutral-300">Img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg text-charcoal truncate tracking-wide">{p.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2">{p.units} Ширхэг зарагдсан</p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-sm text-charcoal tracking-wide">{formatPrice(p.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-sand border border-border overflow-hidden">
          <div className="px-8 py-6 border-b border-border flex justify-between items-center">
            <h3 className="font-serif text-xl text-charcoal">Сүүлийн гүйлгээнүүд</h3>
            <Link href="/admin/orders" className="editorial-label text-charcoal border-b border-transparent hover:border-charcoal pb-1 transition-all">Бүгдийг үзэх</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-sand-dark">
                <tr>
                  <th className="px-8 py-4 editorial-label text-charcoal">Дугаар</th>
                  <th className="px-8 py-4 editorial-label text-charcoal">Харилцагч</th>
                  <th className="px-8 py-4 editorial-label text-charcoal">Огноо</th>
                  <th className="px-8 py-4 editorial-label text-charcoal text-right">Дүн</th>
                  <th className="px-8 py-4 editorial-label text-charcoal text-center">Төлөв</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-12 text-center editorial-label text-neutral-400">Мэдээлэл олдсонгүй</td></tr>
                ) : recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-sand-dark transition-colors">
                    <td className="px-8 py-4 font-sans text-xs text-neutral-500 tracking-wider uppercase">{order.id.slice(0,8)}</td>
                    <td className="px-8 py-4 font-serif text-base text-charcoal">{order.customerName}</td>
                    <td className="px-8 py-4 font-sans text-xs text-neutral-500 tracking-wide">{formatDateStr(order.createdAt)}</td>
                    <td className="px-8 py-4 text-right font-sans text-sm text-charcoal tracking-wide">{formatPrice(order.total)}</td>
                    <td className="px-8 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 text-[9px] uppercase tracking-[0.2em] border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-sand border border-border rounded-sm shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-border flex justify-between items-center">
            <h3 className="font-serif text-xl text-charcoal">Шинэ харилцагчид</h3>
            <Link href="/admin/users" className="editorial-label text-charcoal border-b border-transparent hover:border-charcoal pb-1 transition-all">Бүгд</Link>
          </div>
          <div className="p-4 flex-1">
            {recentUsers.length === 0 ? (
              <div className="p-12 text-center editorial-label text-neutral-400">Мэдээлэл олдсонгүй</div>
            ) : recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-6 p-4 hover:bg-sand-dark transition-colors">
                <div className="w-12 h-12 bg-sand-dark text-charcoal flex items-center justify-center font-serif text-xl overflow-hidden flex-shrink-0 border border-border">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt="User" className="w-full h-full object-cover grayscale opacity-80" />
                  ) : (
                    (u.displayName || u.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg text-charcoal truncate tracking-wide">{u.displayName || 'Нэргүй харилцагч'}</p>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1 truncate">{u.email}</p>
                </div>
                {u.role === 'admin' && (
                  <span className="editorial-label text-[9px] border-b border-charcoal text-charcoal">
                    Админ
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
