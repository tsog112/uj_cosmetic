'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, Check, Edit2, Loader2, PackageOpen, Plus, Search, Sparkles, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import Pagination from '@/components/admin/Pagination';
import { useToast } from '@/components/admin/Toast';
import { ADMIN_ALL_FILTER_VALUE, LOW_STOCK_THRESHOLD } from '@/lib/constants/admin';
import { useAdminCategories, useAdminProducts } from '@/lib/hooks/useAdmin';
import { formatMNT } from '@/lib/utils/format';

function parseImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(ADMIN_ALL_FILTER_VALUE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingStockId, setEditingStockId] = useState('');
  const [stockDraft, setStockDraft] = useState('');
  const [savingStockId, setSavingStockId] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkStocks, setBulkStocks] = useState<Record<string, string>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const longPressRef = useRef<number | null>(null);
  const [searchTimeoutRef] = useState(() => ({ current: null as NodeJS.Timeout | null }));
  const [page, setPage] = useState(1);
  const { showToast } = useToast();
  const { data: categories } = useAdminCategories();
  const { data: productsData, isLoading, mutate } = useAdminProducts({
    search: debouncedSearch,
    category: selectedCategory !== ADMIN_ALL_FILTER_VALUE ? selectedCategory : undefined,
    page,
    limit: 20,
  });

  // Reset page when search or category changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory]);

  const products = productsData?.products || [];
  const allSelected = products.length > 0 && products.every((product: any) => selectedIds.has(product.id));

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(products.map((product: any) => product.id)));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleVisibility = async (id: string, currentVisible: boolean) => {
    const nextVisible = !currentVisible;
    mutate(
      (prev: any) =>
        prev
          ? { ...prev, products: prev.products.map((product: any) => (product.id === id ? { ...product, isVisible: nextVisible } : product)) }
          : prev,
      false,
    );
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: nextVisible }),
      });
      mutate();
    } catch {
      mutate();
    }
  };

  const startStockEdit = (id: string, stock: number) => {
    setEditingStockId(id);
    setStockDraft(String(stock));
  };

  const updateStock = async (id: string, stock: number) => {
    const previous = products.find((product: any) => product.id === id)?.stock || 0;
    setSavingStockId(id);
    mutate(
      (prev: any) =>
        prev
          ? { ...prev, products: prev.products.map((product: any) => (product.id === id ? { ...product, stock } : product)) }
          : prev,
      false,
    );
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock }),
      });
      if (!response.ok) throw new Error();
      mutate();
      navigator.vibrate?.(8);
      showToast('Нөөц шинэчлэгдлээ ✓');
    } catch {
      mutate(
        (prev: any) =>
          prev
            ? { ...prev, products: prev.products.map((product: any) => (product.id === id ? { ...product, stock: previous } : product)) }
            : prev,
        false,
      );
      showToast('Нөөц шинэчлэхэд алдаа гарлаа', 'error');
    } finally {
      setSavingStockId('');
      setEditingStockId('');
    }
  };

  const enterBulkMode = () => {
    setBulkStocks(Object.fromEntries(products.map((product: any) => [product.id, String(product.stock || 0)])));
    setBulkMode(true);
    navigator.vibrate?.(12);
  };

  const saveBulkStock = async () => {
    const changed = products.filter((product: any) => String(product.stock || 0) !== String(bulkStocks[product.id] ?? product.stock));
    setSavingStockId('bulk');
    try {
      await Promise.all(
        changed.map((product: any) =>
          fetch(`/api/admin/products/${product.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: Math.max(0, Number(bulkStocks[product.id] || 0)) }),
          }),
        ),
      );
      mutate();
      setBulkMode(false);
      showToast('Нөөцүүд хадгалагдлаа ✓');
    } catch {
      mutate();
      showToast('Bulk нөөц хадгалахад алдаа гарлаа', 'error');
    } finally {
      setSavingStockId('');
    }
  };

  const categoryLabel = useMemo(() => {
    if (selectedCategory === ADMIN_ALL_FILTER_VALUE) return 'Бүгд';
    return categories?.find((category: any) => category.id === selectedCategory)?.name || '';
  }, [categories, selectedCategory]);

  return (
    <div className="space-y-4 p-4 pb-[104px]">
      <AdminPageHeader
        eyebrow="Барааны удирдлага"
        title="Бүтээгдэхүүн"
        action={
          <div className="flex shrink-0 gap-2">
            <Link
              href="/admin/products/promote"
              className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] px-4 text-[12px] font-extrabold text-white"
            >
              <Sparkles size={15} /> Promote
            </Link>
            <Link
              href="/admin/products/new"
              className="hidden h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-text)] px-4 text-[12px] font-extrabold text-white sm:flex"
            >
              <Plus size={15} /> Бараа нэмэх
            </Link>
          </div>
        }
      />

      <section className="rounded-[24px] bg-white p-3 shadow-[var(--shadow-mobile-card)]">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" />
            <input
              type="text"
              placeholder="Бүтээгдэхүүн хайх..."
              value={search}
              onChange={handleSearchChange}
              className="h-11 w-full rounded-full bg-[var(--color-brand-bg)] pl-10 pr-4 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[#f3b8cf]"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 transition-all"
            style={{
              background: isFilterOpen ? 'var(--color-brand-accent)' : 'var(--color-brand-bg)',
              border: isFilterOpen ? '1px solid var(--color-brand-accent)' : '1px solid #f8dbe8',
              color: isFilterOpen ? '#FFFFFF' : 'var(--color-brand-text)',
            }}
          >
            <SlidersHorizontal size={16} strokeWidth={2.5} />
          </button>
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-[20px] p-4 bg-[var(--color-brand-bg)] border border-[#f8dbe8]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">
                    Ангиллаар шүүх
                  </p>
                  <label className="flex items-center gap-2 text-[11px] font-extrabold text-[var(--color-brand-text)]">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded accent-[var(--color-brand-accent)]" />
                    Бүгдийг сонгох
                  </label>
                </div>
                <div className="mobile-chip-grid">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(ADMIN_ALL_FILTER_VALUE)}
                    className={`mobile-chip ${selectedCategory === ADMIN_ALL_FILTER_VALUE ? 'bg-[var(--color-brand-accent)] text-white' : 'bg-white border border-[#f8dbe8] text-[var(--color-brand-text)] hover:bg-[#f8dbe8]/30'}`}
                  >
                    Бүгд
                  </button>
                  {categories?.map((category: any) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`mobile-chip ${selectedCategory === category.id ? 'bg-[var(--color-brand-accent)] text-white' : 'bg-white border border-[#f8dbe8] text-[var(--color-brand-text)] hover:bg-[#f8dbe8]/30'}`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {!isLoading && products.some((product: any) => product.stock > 0 && product.stock < LOW_STOCK_THRESHOLD) && (
        <div className="flex gap-3 rounded-[22px] bg-[var(--status-warning-bg)] p-4 text-[var(--status-warning)]">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <p className="text-[13px] font-bold leading-6">5-аас бага нөөцтэй бараа байна. Дуусахаас өмнө татан авалтаа шалгаарай.</p>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-72 rounded-[22px] animate-shimmer" />)
        ) : products.length ? (
          products.map((product: any) => {
            const image = parseImages(product.images)[0] || '/placeholder-product.svg';
            const isLowStock = product.stock <= LOW_STOCK_THRESHOLD && product.stock > 0;
            const isOutOfStock = product.stock === 0;
            return (
              <article key={product.id} className="overflow-hidden rounded-[22px] bg-white shadow-[var(--shadow-mobile-card)]">
                <div
                  className="relative aspect-[4/5] bg-[var(--color-brand-secondary)]"
                  onPointerDown={() => {
                    longPressRef.current = window.setTimeout(enterBulkMode, 500);
                  }}
                  onPointerUp={() => {
                    if (longPressRef.current) window.clearTimeout(longPressRef.current);
                  }}
                  onPointerLeave={() => {
                    if (longPressRef.current) window.clearTimeout(longPressRef.current);
                  }}
                >
                  <Image src={image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                  {bulkMode ? (
                    <input
                      value={bulkStocks[product.id] ?? product.stock}
                      onChange={(event) => setBulkStocks((prev) => ({ ...prev, [product.id]: event.target.value }))}
                      className="absolute left-2 top-2 h-9 w-20 rounded-md bg-white/95 px-2 text-center text-[12px] font-extrabold text-[var(--color-brand-text)] outline-none ring-2 ring-[var(--color-brand-accent)]"
                      inputMode="numeric"
                    />
                  ) : editingStockId === product.id ? (
                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-white/95 p-1">
                      <input
                        autoFocus
                        value={stockDraft}
                        onChange={(event) => setStockDraft(event.target.value)}
                        className="h-8 w-14 rounded bg-[var(--color-brand-bg)] px-1 text-center text-[12px] font-extrabold outline-none"
                        inputMode="numeric"
                        disabled={savingStockId === product.id}
                      />
                      <button type="button" onClick={() => updateStock(product.id, Math.max(0, Number(stockDraft || 0)))} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)]" aria-label="Нөөц хадгалах">
                        {savingStockId === product.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                      </button>
                      <button type="button" onClick={() => setEditingStockId('')} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-bg)] text-[var(--color-brand-muted)]" aria-label="Болих">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" role="button" aria-label="Нөөц засах" onClick={() => startStockEdit(product.id, product.stock)} className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-1 text-[9px] font-extrabold text-[var(--color-brand-text)]">
                      НӨӨЦ: {product.stock}
                    </button>
                  )}
                  <label className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-white/95">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="h-4 w-4 rounded accent-[var(--color-brand-accent)]"
                    />
                  </label>
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">
                      {product.category?.name || 'Ангилалгүй'}
                    </p>
                    <Link href={`/admin/products/${product.id}/edit`} className="shrink-0 text-[var(--color-brand-muted)]" aria-label="Засах">
                      <Edit2 size={14} />
                    </Link>
                  </div>
                  <h2 className="mt-1 min-h-[34px] text-[13px] font-extrabold leading-tight text-[var(--color-brand-text)] line-clamp-2">{product.name}</h2>
                  <p className="mt-2 text-[14px] font-extrabold text-[var(--color-brand-text)]">{formatMNT(product.salePrice || product.price)}</p>
                  <p
                    className={`mt-1 text-[10px] font-extrabold ${isOutOfStock ? 'text-[var(--status-error)]' : isLowStock ? 'text-[var(--status-warning)]' : 'text-[var(--status-success)]'}`}
                  >
                    {isOutOfStock ? 'Дууссан' : isLowStock ? 'Нөөц багатай' : 'Боломжтой'}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f8dbe8] pt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-brand-muted)]">Боломжтой</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={product.isVisible}
                      onClick={() => handleToggleVisibility(product.id, product.isVisible)}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${product.isVisible ? 'bg-[var(--color-brand-text)]' : 'bg-[#e8d2dc]'}`}
                      style={{ minHeight: 'unset' }}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${product.isVisible ? 'left-[22px]' : 'left-0.5'}`}
                      />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full">
            <AdminEmptyState icon={PackageOpen} title="Бараа олдсонгүй" body="Хайлт эсвэл ангиллын шүүлтүүрээ өөрчлөөд дахин үзээрэй." />
          </div>
        )}
      </section>

      {!isLoading && productsData?.totalCount > 20 && (
        <Pagination page={page} totalItems={productsData.totalCount} pageSize={20} onPageChange={setPage} />
      )}

      {bulkMode && (
        <div className="fixed inset-x-4 bottom-[88px] z-50 mx-auto flex max-w-[398px] gap-2 rounded-[22px] bg-white p-3 shadow-[0_18px_40px_rgba(37,21,28,0.18)]">
          <button onClick={() => { setBulkMode(false); setBulkStocks({}); }} className="h-12 flex-1 rounded-full bg-[var(--color-brand-secondary)] text-sm font-extrabold text-[var(--color-brand-text)]">
            Болих
          </button>
          <button onClick={saveBulkStock} disabled={savingStockId === 'bulk'} className="h-12 flex-1 rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white disabled:opacity-60">
            {savingStockId === 'bulk' ? 'Хадгалж...' : 'Хадгалах'}
          </button>
        </div>
      )}

      <Link
        href="/admin/products/new"
        className="fixed bottom-[92px] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-white shadow-[0_14px_34px_rgba(228,95,154,0.34)] ring-4 ring-white active:scale-95 sm:hidden"
        aria-label="Бараа нэмэх"
      >
        <Plus size={26} />
      </Link>
    </div>
  );
}
