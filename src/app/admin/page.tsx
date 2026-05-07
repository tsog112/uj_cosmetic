'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { formatPrice } from '@/types';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

type Period = 'Өнөөдөр' | '7 хоног' | '30 хоног' | 'Энэ сар';
const PAID_STATUSES = ['confirmed', 'shipped', 'delivered'];

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
          if (o.status === 'pending') pOrders++;
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
      case 'Хүлээгдэж байна': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Баталгаажсан': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Хүргэлтэнд гарсан': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Хүргэгдсэн': return 'bg-green-100 text-green-800 border-green-200';
      case 'Цуцлагдсан': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
    const tData = [...cData].reverse(); // newest first for table

    const topProds = Object.values(productMap).sort((a, b) => b.units - a.units).slice(0, 5);

    return { chartData: cData, tableData: tData, topProducts: topProds };
  }, [periodOrders]);

  const totalPeriodRevenue = tableData.reduce((acc, row) => acc + row.total, 0);
  const totalPeriodOrders = tableData.reduce((acc, row) => acc + row.count, 0);

  const downloadExcel = () => {
    const worksheetData = [
      ['Огноо', 'Захиалгын тоо', 'Нийт орлого', 'Дундаж захиалга'],
      ...tableData.map(row => [
        row.dateStr,
        row.count,
        row.total,
        Math.round(row.total / row.count)
      ]),
      ['Нийт', totalPeriodOrders, totalPeriodRevenue, totalPeriodOrders ? Math.round(totalPeriodRevenue / totalPeriodOrders) : 0]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Орлого");
    XLSX.writeFile(wb, `Revenue_${period}.xlsx`);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-lg text-sm">
          <p className="font-bold text-gray-800 mb-2">{label}</p>
          <p className="text-accent font-medium mb-1">
            Нийт дүн: {formatPrice(payload[0].value)}
          </p>
          <p className="text-gray-500">
            Захиалга: {payload[0].payload.count} ширхэг
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-12 h-12 border-4 border-gray-200 border-t-accent rounded-full animate-spin"/></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Ерөнхий мэдээлэл</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Нийт захиалга</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Өнөөдрийн захиалга</p>
          <p className="text-3xl font-bold text-gray-900">{stats.todayOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Хүлээгдэж буй</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Баталгаажсан орлого</p>
          <p className="text-3xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-2">(цуцлагдсан захиалга оруулаагүй)</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h3 className="text-lg font-bold text-gray-900">Орлогын динамик</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['Өнөөдөр', '7 хоног', '30 хоног', 'Энэ сар'] as Period[]).map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
                  period === p ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px] w-full mb-8">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">Мэдээлэл байхгүй байна</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="dateStr" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="#FFB7D5" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6, fill: '#FFB7D5'}} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Table & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Table */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-800">Дэлгэрэнгүй хуулга</h4>
              <button onClick={downloadExcel} className="text-sm text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-md hover:bg-green-100 transition-colors flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Excel татах
              </button>
            </div>
            <div className="overflow-hidden border border-gray-100 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Огноо</th>
                    <th className="px-4 py-3 font-medium text-center">Захиалга</th>
                    <th className="px-4 py-3 font-medium text-right">Орлого</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tableData.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Мэдээлэл олдсонгүй</td></tr>
                  ) : tableData.map(row => (
                    <tr key={row.dateStr} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{row.dateStr}</td>
                      <td className="px-4 py-3 text-center">{row.count}</td>
                      <td className="px-4 py-3 text-right text-accent font-bold">{formatPrice(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
                {tableData.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td className="px-4 py-4 text-gray-800">Нийт</td>
                      <td className="px-4 py-4 text-center text-gray-800">{totalPeriodOrders}</td>
                      <td className="px-4 py-4 text-right text-accent">{formatPrice(totalPeriodRevenue)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div>
            <h4 className="font-bold text-gray-800 mb-4">Шилдэг борлуулалттай ({period})</h4>
            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <div className="p-6 border border-gray-100 rounded-xl text-center text-gray-400 text-sm">Мэдээлэл олдсонгүй</div>
              ) : topProducts.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow bg-gray-50/50">
                  <div className="w-6 text-center font-bold text-gray-400">#{idx + 1}</div>
                  <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">Img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.units} ширхэг зарагдсан</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">{formatPrice(p.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Сүүлийн захиалгууд</h3>
            <Link href="/admin/orders" className="text-sm text-accent hover:underline font-bold">Бүгдийг харах</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Харилцагч</th>
                  <th className="px-6 py-3 font-medium">Огноо</th>
                  <th className="px-6 py-3 font-medium text-right">Дүн</th>
                  <th className="px-6 py-3 font-medium text-center">Төлөв</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Мэдээлэл олдсонгүй</td></tr>
                ) : recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-bold text-gray-900">{order.id.slice(0,8)}...</td>
                    <td className="px-6 py-3">{order.customerName}</td>
                    <td className="px-6 py-3">{formatDateStr(order.createdAt)}</td>
                    <td className="px-6 py-3 text-right font-bold">{formatPrice(order.total)}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wider ${getStatusColor(order.status)}`}>
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Шинэ хэрэглэгчид</h3>
            <Link href="/admin/users" className="text-sm text-accent hover:underline font-bold">Бүгд</Link>
          </div>
          <div className="p-2 flex-1">
            {recentUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">Мэдээлэл олдсонгүй</div>
            ) : recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#FFF0F6] text-[#FFB7D5] flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    (u.displayName || u.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{u.displayName || 'Нэргүй хэрэглэгч'}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                {u.role === 'admin' && (
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                    Admin
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
