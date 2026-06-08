'use client';

import { authFetch, authDownload } from '@/lib/auth/clientFetch';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AlertCircle,
  BarChart3,
  Download,
  Package,
  Plus,
  ReceiptText,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminKpiCard from '@/components/admin/dashboard/AdminKpiCard';
import AdminSectionHeader from '@/components/admin/dashboard/AdminSectionHeader';
import AdminRankedList from '@/components/admin/dashboard/AdminRankedList';
import AdminStatusOverview from '@/components/admin/dashboard/AdminStatusOverview';
import AdminSearchField from '@/components/admin/AdminSearchField';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminSheet from '@/components/admin/AdminSheet';
import Pagination, { paginate } from '@/components/admin/Pagination';
import { ORDER_STATUSES } from '@/lib/constants/admin';
import { useAdminAnalytics } from '@/lib/hooks/useAdmin';
import { formatMNT } from '@/lib/utils/format';

const PERF_PAGE_SIZE = 10;

const statusLabels: Record<string, string> = {
  pending: 'Хүлээж',
  confirmed: 'Батлагдсан',
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
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'Үйл ажиллагаа',
    date: new Date().toISOString().split('T')[0],
  });

  const reportUrl = `/api/admin/reports/monthly?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`;

  const summary = data?.summary || {};

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingExpense(true);
    try {
      const res = await authFetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm),
      });
      if (res.ok) {
        setExpenseSheetOpen(false);
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
      const res = await authFetch(`/api/admin/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) mutate();
    } catch {
      /* ignore */
    }
  };

  const allPerformance = data?.productPerformance || [];
  const filteredPerformance = allPerformance.filter(
    (row: any) => !searchPerf || row.name.toLowerCase().includes(searchPerf.toLowerCase()),
  );
  const pagedPerformance = paginate(filteredPerformance, perfPage, PERF_PAGE_SIZE);

  const updateStock = async (id: string, stock: number) => {
    const previous = allPerformance.find((p: any) => p.id === id)?.stock || 0;
    setSavingStockId(id);
    mutate(
      (prev: any) =>
        prev
          ? {
              ...prev,
              productPerformance: prev.productPerformance.map((p: any) => (p.id === id ? { ...p, stock } : p)),
            }
          : prev,
      false,
    );
    try {
      const response = await authFetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock }),
      });
      if (!response.ok) throw new Error();
      mutate();
    } catch {
      mutate(
        (prev: any) =>
          prev
            ? {
                ...prev,
                productPerformance: prev.productPerformance.map((p: any) => (p.id === id ? { ...p, stock: previous } : p)),
              }
            : prev,
        false,
      );
    } finally {
      setSavingStockId('');
      setEditingStockId('');
    }
  };

  const topProductItems = useMemo(
    () =>
      (data?.topProducts || []).slice(0, 6).map((product: any) => ({
        id: product.id,
        title: product.name,
        subtitle: `${product.quantity} ширхэг`,
        value: formatMNT(product.revenue),
      })),
    [data?.topProducts],
  );

  const inventoryItems = useMemo(
    () =>
      (data?.inventoryRisk || []).map((product: any) => ({
        id: product.id,
        title: product.name,
        subtitle: product.category,
        badge: `Нөөц ${product.stock}`,
        badgeTone: product.stock === 0 ? ('danger' as const) : ('warning' as const),
        href: `/admin/products/${product.id}/edit`,
      })),
    [data?.inventoryRisk],
  );

  if (isLoading) {
    return (
      <AdminPageShell className="gap-4">
        <LoadingBlock className="h-32" />
        <div className="admin-dashboard-grid admin-dashboard-grid--kpis">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingBlock key={i} className="h-28" />
          ))}
        </div>
        <LoadingBlock className="h-80" />
      </AdminPageShell>
    );
  }

  const kpis = [
    { label: 'Сарын орлого', value: formatMNT(summary.monthRevenue || 0), hint: 'Баталгаажсан захиалга', icon: TrendingUp, tone: 'brand' as const },
    { label: '7 хоногийн орлого', value: formatMNT(summary.weekRevenue || 0), hint: `${summary.paidOrderCount || 0} захиалга`, icon: BarChart3, tone: 'neutral' as const },
    { label: 'Төлбөр хүлээгдэж буй', value: formatMNT(summary.pendingPaymentAmount || 0), hint: `${summary.pendingPaymentCount || 0} захиалга`, icon: ReceiptText, href: '/admin/orders?status=pending', tone: (summary.pendingPaymentCount || 0) > 0 ? 'warning' as const : 'neutral' as const },
    { label: 'Дундаж захиалга', value: formatMNT(summary.averageOrder || 0), hint: 'AOV', icon: ShoppingBag, tone: 'neutral' as const },
    { label: 'Цэвэр ашиг', value: formatMNT(summary.netProfit ?? summary.monthRevenue ?? 0), hint: `Зарлага ${formatMNT(summary.totalExpenses || 0)}`, icon: Wallet, tone: 'success' as const },
    { label: 'Давтан хэрэглэгч', value: summary.repeatCustomers || 0, hint: `Нийт ${summary.totalCustomers || 0}`, icon: Users, href: '/admin/customers', tone: 'neutral' as const },
    { label: 'Бүтээгдэхүүн', value: summary.productCount || 0, hint: `Нөөц бага ${summary.lowStockCount || 0}`, icon: Package, href: '/admin/products', tone: (summary.lowStockCount || 0) > 0 ? 'danger' as const : 'neutral' as const },
    { label: 'Хэрэглэгчийн үнэ цэнэ', value: formatMNT(summary.customerValue || 0), hint: 'Нийт дундаж', icon: Users, tone: 'neutral' as const },
  ];

  const statusData = (data?.statusBreakdown || []).map((item: any) => {
    const status = ORDER_STATUSES.find((entry) => entry.value === item.status);
    return { ...item, label: status?.label || item.status };
  });

  const profitMargin =
    summary.monthRevenue > 0 && summary.netProfit != null
      ? Math.round((Number(summary.netProfit) / Number(summary.monthRevenue)) * 100)
      : 0;

  return (
    <AdminPageShell className="gap-5">
      <section className="admin-dashboard-hero">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="admin-eyebrow">Тайлан</p>
            <h1 className="mt-2 font-serif text-[32px] leading-[1.02] text-[var(--color-text-primary)] md:text-[40px]">Борлуулалтын тайлан</h1>
            <p className="mt-2 text-[14px] text-[var(--color-text-muted)]">
              Орлого, зарлага, бүтээгдэхүүн, захиалгын бүх үзүүлэлт нэг дор.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="admin-btn-primary" onClick={() => authDownload(reportUrl).catch(() => {})}>
              <Download size={16} /> CSV татах
            </button>
            <Link href="/admin" className="admin-btn-secondary" style={{ textDecoration: 'none' }}>
              Самбар руу
            </Link>
          </div>
        </div>
      </section>

      {!summary.expenseTracked && (
        <div className="admin-card-soft admin-card-pad flex gap-3">
          <AlertCircle className="mt-0.5 shrink-0 text-[var(--color-brand)]" size={19} />
          <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
            Зарлагын мэдээлэл бүрэн холбогдоогүй байж болно. Зарлага нэмснээр ашиг/алдагдлын тооцоолол автоматаар шинэчлэгдэнэ.
          </p>
        </div>
      )}

      <section className="admin-dashboard-grid admin-dashboard-grid--kpis">
        {kpis.map((kpi) => (
          <AdminKpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <div className="admin-dashboard-split--charts">
        <section className="admin-card admin-card-pad">
          <AdminSectionHeader eyebrow="График" title="7 хоногийн орлого" description="Өдөр бүрийн баталгаажсан орлого." />
          <div className="mt-5 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.revenueByDay || []} margin={{ left: -8, right: 8, top: 12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="4 4" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                <Tooltip formatter={(value) => formatMNT(Number(value ?? 0))} contentStyle={{ borderRadius: 14, border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 700 }} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-brand)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-brand)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="admin-card admin-card-pad">
          <AdminSectionHeader title="Захиалгын төлөв" description="Энэ сарын төлөв бүрийн тоо." />
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ left: -20, right: 4, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="status"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={48}
                  tickFormatter={(value) => statusLabels[String(value)] || String(value)}
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid var(--color-border)' }} />
                <Bar dataKey="count" fill="var(--color-brand)" radius={[8, 8, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="admin-card admin-card-pad">
        <AdminSectionHeader eyebrow="Захиалга" title="Төлөвийн дэлгэрэнгүй" />
        <div className="mt-4">
          <AdminStatusOverview rows={data?.statusBreakdown || []} />
        </div>
      </section>

      <div className="admin-dashboard-split">
        <section className="admin-card admin-card-pad">
          <AdminSectionHeader title="Топ борлуулалт" description="Орлогоор эрэмбэлсэн." />
          <div className="mt-4">
            <AdminRankedList items={topProductItems} emptyTitle="Борлуулалтын дата алга" />
          </div>
        </section>

        <section className="admin-card admin-card-pad">
          <AdminSectionHeader title="Нөөцийн эрсдэл" description="Нөөц бага эсвэл дууссан бараа." action={<Link href="/admin/products?inStock=low" className="text-[12px] font-extrabold text-[var(--color-brand)]" style={{ textDecoration: 'none' }}>Бүгдийг харах</Link>} />
          <div className="mt-4">
            <AdminRankedList items={inventoryItems} emptyTitle="Эрсдэлтэй бараа алга" emptyBody="Нөөцийн түвшин хэвийн байна." />
          </div>
        </section>
      </div>

      <section className="admin-card admin-card-pad">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <AdminSectionHeader title="Зарлага ба ашиг" description="Сарын орлого, зарлага, цэвэр ашгийн тойм." />
          <button
            type="button"
            onClick={() => setExpenseSheetOpen(true)}
            className="admin-btn-primary shrink-0"
          >
            <Plus size={16} /> Зарлага нэмэх
          </button>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[20px] bg-[var(--color-status-done-bg)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-status-done-text)]">Цэвэр ашиг</p>
            <p className="mt-2 text-[24px] font-extrabold text-[var(--color-status-done-text)]">{formatMNT(summary.netProfit ?? 0)}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[var(--color-status-done-text)]">
              <TrendingUp size={12} /> Марж {profitMargin}%
            </p>
          </div>
          <div className="rounded-[20px] bg-[var(--color-bg)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Сарын орлого</p>
            <p className="mt-2 text-[24px] font-extrabold text-[var(--color-text-primary)]">{formatMNT(summary.monthRevenue || 0)}</p>
          </div>
          <div className="rounded-[20px] bg-[var(--color-status-cancel-bg)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-status-cancel-text)]">Нийт зарлага</p>
            <p className="mt-2 text-[24px] font-extrabold text-[var(--color-status-cancel-text)]">{formatMNT(summary.totalExpenses || 0)}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[var(--color-status-cancel-text)]">
              <TrendingDown size={12} /> Зардал
            </p>
          </div>
        </div>
        <div className="mt-4">
          {data?.expenses?.length ? (
            <div className="space-y-2">
              {data.expenses.map((expense: any) => (
                <div key={expense.id} className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--color-border)]/60 bg-[var(--color-bg)] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[var(--color-text-primary)]">{expense.title}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {expense.category} · {new Date(expense.date).toLocaleDateString('mn-MN')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[13px] font-extrabold text-[var(--color-status-cancel-text)]">-{formatMNT(expense.amount)}</span>
                    <button type="button" onClick={() => handleDeleteExpense(expense.id)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--color-text-muted)] hover:text-[var(--color-status-cancel-text)]" aria-label="Устгах">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState icon={Wallet} title="Зарлага бүртгээгүй" body="Энэ сард зарлага оруулаагүй байна. «Зарлага нэмэх» товчоор бүртгэнэ үү." />
          )}
        </div>
      </section>

      <section className="admin-card admin-card-pad">
        <AdminSectionHeader
          title="Бүтээгдэхүүний гүйцэтгэл"
          description="Үзэлт, захиалга, хөрвөлт, үлдэгдэл — бүгдийг нэг хүснэгтэд."
        />
        <div className="mt-4">
          <AdminSearchField value={searchPerf} onChange={setSearchPerf} placeholder="Бүтээгдэхүүн хайх..." />
        </div>
        <div className="mt-4 space-y-3 md:hidden">
          {pagedPerformance.length ? (
            pagedPerformance.map((row: any, index: number) => (
              <div key={row.id} className="admin-list-item p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-light)] text-[12px] font-extrabold text-[var(--color-brand)]">
                    {(perfPage - 1) * PERF_PAGE_SIZE + index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-extrabold">{row.name}</p>
                    <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
                      {row.orders || 0} захиалга · {row.views || 0} үзэлт · {row.views > 0 ? `${row.conversion}%` : '—'} хөрвөлт
                    </p>
                  </div>
                  {editingStockId === row.id ? (
                    <input
                      autoFocus
                      type="number"
                      value={stockDraft}
                      onChange={(e) => setStockDraft(e.target.value)}
                      onBlur={() => updateStock(row.id, Math.max(0, parseInt(stockDraft || '0', 10)))}
                      onKeyDown={(e) => e.key === 'Enter' && updateStock(row.id, Math.max(0, parseInt(stockDraft || '0', 10)))}
                      className="h-9 w-16 rounded-lg border text-center text-sm font-bold outline-none"
                      disabled={savingStockId === row.id}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStockId(row.id);
                        setStockDraft(String(row.stock || 0));
                      }}
                      className="rounded-full bg-[var(--color-brand-light)] px-3 py-1.5 text-[11px] font-extrabold text-[var(--color-brand)]"
                    >
                      Нөөц {row.stock || 0}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <AdminEmptyState icon={Package} title="Дата алга" body="Бүтээгдэхүүний борлуулалтын мэдээлэл хараахан бүрдээгүй байна." />
          )}
          <Pagination page={perfPage} totalItems={filteredPerformance.length} pageSize={PERF_PAGE_SIZE} onPageChange={setPerfPage} />
        </div>
        <div className="mt-4 hidden md:block">
          <AdminDataTable
            minWidth="720px"
            rows={pagedPerformance}
            rowKey={(row: any) => row.id}
            emptyMessage="Бүтээгдэхүүний дата алга"
            columns={[
              {
                key: 'name',
                header: 'Бараа',
                minWidth: '200px',
                render: (row: any) => <span className="block max-w-[240px] font-extrabold leading-snug">{row.name}</span>,
              },
              { key: 'views', header: 'Үзэлт', minWidth: '70px', render: (row: any) => <span className="tabular-nums">{row.views || 0}</span> },
              { key: 'orders', header: 'Захиалга', minWidth: '80px', render: (row: any) => <span className="font-extrabold tabular-nums">{row.orders}</span> },
              {
                key: 'conversion',
                header: 'Хөрвөлт',
                minWidth: '80px',
                render: (row: any) => <span>{row.views > 0 ? `${row.conversion}%` : row.orders > 0 ? '—' : '0%'}</span>,
              },
              {
                key: 'stock',
                header: 'Үлдэгдэл',
                minWidth: '90px',
                render: (row: any) =>
                  editingStockId === row.id ? (
                    <input
                      autoFocus
                      type="number"
                      value={stockDraft}
                      onChange={(e) => setStockDraft(e.target.value)}
                      onBlur={() => updateStock(row.id, Math.max(0, parseInt(stockDraft || '0', 10)))}
                      onKeyDown={(e) => e.key === 'Enter' && updateStock(row.id, Math.max(0, parseInt(stockDraft || '0', 10)))}
                      className="h-8 w-16 rounded-lg border px-1 text-center font-extrabold outline-none"
                      disabled={savingStockId === row.id}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStockId(row.id);
                        setStockDraft(String(row.stock || 0));
                      }}
                      className="font-extrabold text-[var(--color-brand)] underline underline-offset-2"
                    >
                      {row.stock}
                    </button>
                  ),
              },
            ]}
          />
          <Pagination page={perfPage} totalItems={filteredPerformance.length} pageSize={PERF_PAGE_SIZE} onPageChange={setPerfPage} />
        </div>
      </section>

      <AdminSheet open={expenseSheetOpen} onClose={() => setExpenseSheetOpen(false)}>
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand)]">Зарлага</p>
        <h3 className="mt-1 text-[22px] font-extrabold text-[var(--color-text-primary)]">Шинэ зарлага нэмэх</h3>
        <form onSubmit={handleAddExpense} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Нэр *</span>
            <input required value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} placeholder="Жишээ: Facebook сурталчилгаа" className="admin-input" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Дүн (₮) *</span>
            <input required type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="50000" className="admin-input" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Ангилал *</span>
            <select required value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="admin-input">
              <option value="Маркетинг">Маркетинг</option>
              <option value="Үйл ажиллагаа">Үйл ажиллагаа</option>
              <option value="Түрээс">Түрээс</option>
              <option value="Цалин">Цалин</option>
              <option value="Бусад">Бусад</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Огноо *</span>
            <input required type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} className="admin-input" />
          </label>
          <button type="submit" disabled={isAddingExpense} className="mt-2 flex h-14 w-full items-center justify-center rounded-full bg-[var(--color-brand)] text-[15px] font-extrabold text-white disabled:opacity-60">
            {isAddingExpense ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </form>
      </AdminSheet>
    </AdminPageShell>
  );
}
