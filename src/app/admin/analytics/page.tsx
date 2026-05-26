'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, BarChart3, Download, Package, Plus, ReceiptText, TrendingUp, Users, WalletCards } from 'lucide-react';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import Pagination, { paginate } from '@/components/admin/Pagination';
import { ORDER_STATUSES } from '@/lib/constants/admin';
import { useAdminAnalytics } from '@/lib/hooks/useAdmin';
import { formatMNT } from '@/lib/utils/format';

const PERF_PAGE_SIZE = 10;
const statusLabels: Record<string, string> = {
  pending: 'Хүлээж',
  confirmed: 'Батлагдсан',
  paid: 'Төлсөн',
  processing: 'Бэлтгэж',
  shipped: 'Илгээсэн',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
};

function LoadingBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-shimmer rounded-[22px] ${className}`} />;
}

export default function AnalyticsPage() {
  const { data, isLoading, mutate } = useAdminAnalytics();
  const [perfPage, setPerfPage] = useState(1);
  const [searchPerf, setSearchPerf] = useState('');
  const [editingStockId, setEditingStockId] = useState('');
  const [stockDraft, setStockDraft] = useState('');
  const [savingStockId, setSavingStockId] = useState('');

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'Үйл ажиллагаа', date: new Date().toISOString().split('T')[0] });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingExpense(true);
    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseForm({ title: '', amount: '', category: 'Үйл ажиллагаа', date: new Date().toISOString().split('T')[0] });
        mutate();
      }
    } finally {
      setIsAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Энэ зарлагыг устгах уу?')) return;
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) mutate();
    } catch {}
  };

  const reportUrl = `/api/admin/reports/monthly?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`;

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <LoadingBlock className="h-24" />
        <div className="grid grid-cols-2 gap-3">
          <LoadingBlock className="h-28" />
          <LoadingBlock className="h-28" />
        </div>
        <LoadingBlock className="h-72" />
      </div>
    );
  }

  const summary = data?.summary || {};
  const cards = [
    { label: 'Энэ сарын орлого', value: formatMNT(summary.monthRevenue || 0), note: 'Баталгаажсан захиалга', icon: TrendingUp },
    { label: 'Төлбөр хүлээгдэж буй', value: formatMNT(summary.pendingPaymentAmount || 0), note: `${summary.pendingPaymentCount || 0} захиалга`, icon: ReceiptText },
    { label: 'Дундаж захиалга', value: formatMNT(summary.averageOrder || 0), note: 'AOV', icon: BarChart3 },
    { label: 'Давтан хэрэглэгч', value: summary.repeatCustomers || 0, note: `Дундаж үнэ цэнэ ${formatMNT(summary.customerValue || 0)}`, icon: Users },
  ];

  const statusData = (data?.statusBreakdown || []).map((item: any) => {
    const status = ORDER_STATUSES.find((entry) => entry.value === item.status);
    return { ...item, label: status?.label || item.status };
  });

  const allPerformance = data?.productPerformance || [];

  const filteredPerformance = allPerformance.filter((row: any) => 
    !searchPerf || row.name.toLowerCase().includes(searchPerf.toLowerCase())
  );

  const pagedPerformance = paginate(filteredPerformance, perfPage, PERF_PAGE_SIZE);

  const updateStock = async (id: string, stock: number) => {
    const previous = allPerformance.find((p: any) => p.id === id)?.stock || 0;
    setSavingStockId(id);
    // Optimistic update
    mutate((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        productPerformance: prev.productPerformance.map((p: any) => p.id === id ? { ...p, stock } : p),
      };
    }, false);
    
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock }),
      });
      if (!response.ok) throw new Error();
      mutate();
      navigator.vibrate?.(8);
    } catch {
      mutate((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          productPerformance: prev.productPerformance.map((p: any) => p.id === id ? { ...p, stock: previous } : p),
        };
      }, false);
    } finally {
      setSavingStockId('');
      setEditingStockId('');
    }
  };

  return (
    <div className="space-y-5 p-4 pb-[104px]">
      <AdminPageHeader eyebrow="Борлуулалтын тайлан" title="Аналитик" />

      <a
        href={reportUrl}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-[13px] font-extrabold text-white"
      >
        <Download size={17} /> Энэ сарын CSV тайлан татах
      </a>

      {!summary.expenseTracked && (
        <div className="flex gap-3 rounded-[22px] border border-[#f3b8cf] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
          <AlertCircle className="mt-0.5 shrink-0 text-[var(--color-brand-accent)]" size={19} />
          <p className="text-[12px] leading-relaxed text-[var(--color-brand-muted)]">
            Зарлагын model database-д хараахан байхгүй. Зарлага, маркетингийн зардал нэмэгдсэний дараа ашиг/алдагдлын тайлан автоматаар гарна.
          </p>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-[22px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[var(--color-brand-accent)]">
                <Icon size={18} />
              </div>
              <p className="mt-4 text-[11px] font-bold leading-tight text-[var(--color-brand-muted)]">{card.label}</p>
              <p className="mt-1 truncate text-[20px] font-extrabold text-[var(--color-brand-text)]">{card.value}</p>
              <p className="mt-1 text-[10px] leading-tight text-[var(--color-brand-muted)]">{card.note}</p>
            </div>
          );
        })}
      </section>

      <section>
        <AdminPageHeader eyebrow="Бүтээгдэхүүн" title="Бүтээгдэхүүний үзүүлэлт" />
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Хайх..."
            value={searchPerf}
            onChange={(e) => setSearchPerf(e.target.value)}
            className="h-10 w-full rounded-full bg-[var(--color-brand-bg)] px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]"
          />
        </div>
        <div className="mt-3 space-y-3 md:hidden">
          {pagedPerformance.length ? (
            pagedPerformance.map((row: any, index: number) => (
              <div key={row.id} className="rounded-[22px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[12px] font-extrabold text-[var(--color-brand-accent)]">{(perfPage - 1) * PERF_PAGE_SIZE + index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-extrabold text-[var(--color-brand-text)]">{row.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--color-brand-muted)]">
                      <span>{row.orders || 0} захиалга</span>
                      <span>·</span>
                      {editingStockId === row.id ? (
                        <input
                          autoFocus
                          type="number"
                          value={stockDraft}
                          onChange={(e) => setStockDraft(e.target.value)}
                          onBlur={() => updateStock(row.id, Math.max(0, parseInt(stockDraft || '0', 10)))}
                          onKeyDown={(e) => e.key === 'Enter' && updateStock(row.id, Math.max(0, parseInt(stockDraft || '0', 10)))}
                          className="h-6 w-16 rounded border text-center text-xs outline-none"
                          disabled={savingStockId === row.id}
                        />
                      ) : (
                        <span onClick={() => { setEditingStockId(row.id); setStockDraft(String(row.stock || 0)); }} className="cursor-pointer text-blue-500 underline">
                          үлдэгдэл {row.stock || 0}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <AdminEmptyState icon={Package} title="Дата алга" body="Бүтээгдэхүүний борлуулалтын мэдээлэл хараахан бүрдээгүй байна." />
          )}
          <Pagination page={perfPage} totalItems={filteredPerformance.length} pageSize={PERF_PAGE_SIZE} onPageChange={setPerfPage} />
        </div>
        <div className="mt-3 hidden md:block">
          <AdminDataTable
            minWidth="680px"
            rows={pagedPerformance}
            rowKey={(row: any) => row.id}
            emptyMessage="Бүтээгдэхүүний дата алга"
            columns={[
              {
                key: 'name',
                header: 'Бараа',
                minWidth: '200px',
                render: (row: any) => <span className="block max-w-[220px] font-extrabold leading-snug">{row.name}</span>,
              },
              {
                key: 'views',
                header: 'Үзэлт',
                minWidth: '70px',
                render: (row: any) => <span>{row.views || '—'}</span>,
              },
              {
                key: 'orders',
                header: 'Захиалга',
                minWidth: '80px',
                render: (row: any) => <span className="font-extrabold">{row.orders}</span>,
              },
              {
                key: 'conversion',
                header: 'Хөрвөлт',
                minWidth: '80px',
                render: (row: any) => (
                  <span>{row.views > 0 ? `${row.conversion}%` : row.orders > 0 ? '—' : '0%'}</span>
                ),
              },
              {
                key: 'stock',
                header: 'Үлдэгдэл',
                minWidth: '80px',
                render: (row: any) => (
                  editingStockId === row.id ? (
                    <input
                      autoFocus
                      type="number"
                      value={stockDraft}
                      onChange={(e) => setStockDraft(e.target.value)}
                      onBlur={() => updateStock(row.id, Math.max(0, parseInt(stockDraft || '0', 10)))}
                      onKeyDown={(e) => e.key === 'Enter' && updateStock(row.id, Math.max(0, parseInt(stockDraft || '0', 10)))}
                      className="h-6 w-16 rounded border px-1 text-center font-extrabold outline-none"
                      disabled={savingStockId === row.id}
                    />
                  ) : (
                    <span onClick={() => { setEditingStockId(row.id); setStockDraft(String(row.stock || 0)); }} className="cursor-pointer font-extrabold text-[var(--color-brand-accent)] underline underline-offset-2">
                      {row.stock}
                    </span>
                  )
                ),
              },
            ]}
          />
          <Pagination
            page={perfPage}
            totalItems={filteredPerformance.length}
            pageSize={PERF_PAGE_SIZE}
            onPageChange={setPerfPage}
          />
        </div>
      </section>

      <section className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-accent)]">Expenses</p>
            <h2 className="mt-1 text-[18px] font-extrabold text-[var(--color-brand-text)]">Зарлага ба ашиг</h2>
          </div>
          <button onClick={() => setShowExpenseModal(true)} className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[var(--color-brand-accent)] transition-colors hover:bg-[var(--color-brand-accent)] hover:text-white" aria-label="Зарлага нэмэх">
            <Plus size={20} />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[20px] bg-[var(--color-brand-bg)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Цэвэр ашиг</p>
            <p className="mt-2 text-[20px] font-extrabold text-[var(--color-brand-success)]">{formatMNT(summary.netProfit || summary.monthRevenue || 0)}</p>
          </div>
          <div className="rounded-[20px] bg-[var(--color-brand-bg)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Нийт зарлага</p>
            <p className="mt-2 text-[20px] font-extrabold text-[var(--color-brand-danger)]">{formatMNT(summary.totalExpenses || 0)}</p>
          </div>
        </div>
        <div className="mt-4">
          {data?.expenses?.length ? (
            <div className="space-y-2">
              {data.expenses.map((expense: any) => (
                <div key={expense.id} className="flex items-center justify-between gap-2 rounded-[16px] border border-[#f3b8cf]/30 p-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-brand-text)]">{expense.title}</p>
                    <p className="text-[11px] text-[var(--color-brand-muted)]">{expense.category} · {new Date(expense.date).toLocaleDateString('mn-MN')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-extrabold text-[var(--color-brand-danger)]">-{formatMNT(expense.amount)}</span>
                    <button onClick={() => handleDeleteExpense(expense.id)} className="text-[var(--color-brand-muted)] hover:text-red-500">
                      <AlertCircle size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState icon={WalletCards} title="Зарлага бүртгээгүй" body="Энэ сард зарлага бүртгэгдээгүй байна." />
          )}
        </div>
      </section>

      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-[var(--color-brand-text)]">Зарлага нэмэх</h3>
            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-brand-muted)]">Зарлагын нэр</label>
                <input required value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} className="field" placeholder="Жишээ: Facebook Ads" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-brand-muted)]">Мөнгөн дүн (₮)</label>
                <input required type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="field" placeholder="50000" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-brand-muted)]">Ангилал</label>
                <select required value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="field">
                  <option value="Маркетинг">Маркетинг</option>
                  <option value="Үйл ажиллагаа">Үйл ажиллагаа</option>
                  <option value="Түрээс">Түрээс</option>
                  <option value="Цалин">Цалин</option>
                  <option value="Бусад">Бусад</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-brand-muted)]">Огноо</label>
                <input required type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="field" />
              </div>
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="h-12 flex-1 rounded-full bg-[var(--color-brand-secondary)] text-sm font-bold text-[var(--color-brand-text)]">Болих</button>
                <button type="submit" disabled={isAddingExpense} className="h-12 flex-1 rounded-full bg-[var(--color-brand-accent)] text-sm font-bold text-white disabled:opacity-50">{isAddingExpense ? 'Нэмж байна...' : 'Хадгалах'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
        <h2 className="text-[17px] font-extrabold text-[var(--color-brand-text)]">7 хоногийн орлого</h2>
        <div className="mt-4 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.revenueByDay || []} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#F6CFE0" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#9B7787', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9B7787', fontSize: 10 }} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
              <Tooltip formatter={(value: any) => formatMNT(Number(value))} contentStyle={{ border: '1px solid #F6CFE0', borderRadius: 16 }} />
              <Line type="monotone" dataKey="revenue" stroke="#E45F9A" strokeWidth={3} dot={{ r: 3, fill: '#E45F9A' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
        <h2 className="text-[17px] font-extrabold text-[var(--color-brand-text)]">Захиалгын төлөв</h2>
        <div className="mt-4 h-[230px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ left: -22, right: 4, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#F6CFE0" />
              <XAxis
                dataKey="status"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9B7787', fontSize: 10 }}
                interval={0}
                angle={-32}
                textAnchor="end"
                height={56}
                tickFormatter={(value) => statusLabels[String(value)] || String(value)}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#9B7787', fontSize: 10 }} />
              <Tooltip contentStyle={{ border: '1px solid #F6CFE0', borderRadius: 16 }} />
              <Bar dataKey="count" fill="#E45F9A" radius={[10, 10, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold text-[var(--color-brand-text)]">Топ бараа</h2>
          <Package className="text-[var(--color-brand-accent)]" size={21} />
        </div>
        <div className="space-y-3">
          {data?.topProducts?.length ? (
            data.topProducts.map((product: any, index: number) => (
              <div key={product.id} className="flex items-center gap-3 rounded-[18px] bg-[var(--color-brand-bg)] p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-extrabold text-[var(--color-brand-accent)]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[var(--color-brand-text)]">{product.name}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--color-brand-muted)]">
                    {product.quantity} ширхэг · {product.category}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] font-extrabold text-[var(--color-brand-text)]">{formatMNT(product.revenue)}</span>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-[var(--color-brand-muted)]">Борлуулалтын дата хараахан алга.</p>
          )}
        </div>
      </section>
    </div>
  );
}
