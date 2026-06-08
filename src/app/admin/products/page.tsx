'use client';

import { authFetch } from '@/lib/auth/clientFetch';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, Check, Edit2, Eye, EyeOff, Loader2, PackageOpen, Percent, Plus, Sparkles, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminFilterToggleButton from '@/components/admin/AdminFilterToggleButton';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminSearchField from '@/components/admin/AdminSearchField';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminBulkSelectionBar from '@/components/admin/AdminBulkSelectionBar';
import AdminSelectionSheet from '@/components/admin/AdminSelectionSheet';
import AdminSheet from '@/components/admin/AdminSheet';
import Pagination from '@/components/admin/Pagination';
import { useToast } from '@/components/admin/Toast';
import {
  ADMIN_ALL_FILTER_VALUE,
  PRODUCT_SORT_FILTERS,
  PRODUCT_STOCK_FILTERS,
  PRODUCT_VISIBILITY_FILTERS,
  STOCK_DISPLAY_THRESHOLD,
  productSortFilterKey,
} from '@/lib/constants/admin';
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

function stockBadgeClass(stock: number) {
  if (stock === 0) return 'bg-white text-[var(--status-error)] ring-1 ring-[var(--status-error)]/20';
  if (stock < STOCK_DISPLAY_THRESHOLD) return 'bg-white text-[var(--status-error)] ring-1 ring-[var(--status-error)]/20';
  return 'bg-white text-[var(--status-success)] ring-1 ring-[var(--status-success)]/20';
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(ADMIN_ALL_FILTER_VALUE);
  const [stockFilter, setStockFilter] = useState<string>(ADMIN_ALL_FILTER_VALUE);
  const [visibilityFilter, setVisibilityFilter] = useState<string>(ADMIN_ALL_FILTER_VALUE);
  const [sortKey, setSortKey] = useState(productSortFilterKey(PRODUCT_SORT_FILTERS[0]));
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingStockId, setEditingStockId] = useState('');
  const [stockDraft, setStockDraft] = useState('');
  const [savingStockId, setSavingStockId] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [bulkSheet, setBulkSheet] = useState<'stock' | 'category' | 'discount' | null>(null);
  const [bulkStockValue, setBulkStockValue] = useState('');
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkDiscount, setBulkDiscount] = useState('');
  const [searchTimeoutRef] = useState(() => ({ current: null as NodeJS.Timeout | null }));
  const [page, setPage] = useState(1);
  const { showToast } = useToast();
  const { data: categories } = useAdminCategories();
  const activeSort =
    PRODUCT_SORT_FILTERS.find((filter) => productSortFilterKey(filter) === sortKey) ?? PRODUCT_SORT_FILTERS[0];

  const { data: productsData, isLoading, mutate } = useAdminProducts({
    search: debouncedSearch,
    category: selectedCategory !== ADMIN_ALL_FILTER_VALUE ? selectedCategory : undefined,
    inStock: stockFilter !== ADMIN_ALL_FILTER_VALUE ? stockFilter : undefined,
    visibility: visibilityFilter !== ADMIN_ALL_FILTER_VALUE ? visibilityFilter : undefined,
    sortBy: activeSort.value,
    sortDir: activeSort.sortDir,
    page,
    limit: 20,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, stockFilter, visibilityFilter, sortKey]);

  const products = productsData?.products || [];
  const allSelected = products.length > 0 && products.every((product: any) => selectedIds.has(product.id));
  const selectedCount = selectedIds.size;

  useEffect(() => {
    if (selectedCount === 0) setIsBulkActionsOpen(false);
  }, [selectedCount]);

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

  const clearSelection = () => {
    setSelectedIds(new Set());
    setIsBulkActionsOpen(false);
  };

  const runBulkAction = async (action: string, extra: Record<string, unknown> = {}) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkLoading(true);
    try {
      const response = await authFetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action, ...extra }),
      });
      if (!response.ok) throw new Error();
      mutate();
      clearSelection();
      setBulkSheet(null);
      showToast('Амжилттай шинэчлэгдлээ ✓');
    } catch {
      showToast('Шинэчлэхэд алдаа гарлаа', 'error');
    } finally {
      setBulkLoading(false);
    }
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
      await authFetch(`/api/admin/products/${id}`, {
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
      const response = await authFetch(`/api/admin/products/${id}`, {
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== ADMIN_ALL_FILTER_VALUE) count += 1;
    if (stockFilter !== ADMIN_ALL_FILTER_VALUE) count += 1;
    if (visibilityFilter !== ADMIN_ALL_FILTER_VALUE) count += 1;
    if (sortKey !== productSortFilterKey(PRODUCT_SORT_FILTERS[0])) count += 1;
    return count;
  }, [selectedCategory, stockFilter, visibilityFilter, sortKey]);

  return (
    <AdminPageShell className="">
      <AdminBulkSelectionBar
        count={selectedCount}
        unitLabel="бараа"
        onClear={clearSelection}
        onAction={() => setIsBulkActionsOpen(true)}
      />

      <AdminPageHeader
        action={
          <div className="flex shrink-0 gap-2">
            <Link href="/admin/products/promote" className="admin-btn-secondary">
              <Sparkles size={15} /> Онцлох
            </Link>
            <Link href="/admin/products/new" className="admin-btn-primary hidden sm:inline-flex">
              <Plus size={15} /> Бараа нэмэх
            </Link>
          </div>
        }
      />

      <section className="admin-toolbar space-y-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <AdminSearchField
              value={search}
              onChange={(value) => handleSearchChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
              placeholder="Бүтээгдэхүүн хайх..."
            />
          </div>
          <AdminFilterToggleButton
            open={isFilterOpen}
            onToggle={() => setIsFilterOpen((prev) => !prev)}
            activeCount={activeFilterCount}
          />
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              id="admin-filter-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3">
                <div className="admin-card admin-card-pad">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Харагдах төлөв</p>
                  <div className="mobile-chip-grid">
                    {PRODUCT_VISIBILITY_FILTERS.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setVisibilityFilter(filter.value)}
                        className={`mobile-chip ${visibilityFilter === filter.value ? 'bg-[var(--color-brand)] text-white' : 'admin-chip admin-chip-idle'}`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-card admin-card-pad">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Нөөцөөр шүүх</p>
                    <label className="flex items-center gap-2 text-[11px] font-extrabold text-[var(--color-brand-text)]">
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded accent-[var(--color-brand-accent)]" />
                      Бүгдийг сонгох
                    </label>
                  </div>
                  <div className="mobile-chip-grid">
                    {PRODUCT_STOCK_FILTERS.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setStockFilter(filter.value)}
                        className={`mobile-chip ${stockFilter === filter.value ? 'bg-[var(--color-brand-accent)] text-white' : 'admin-chip admin-chip-idle'}`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-card admin-card-pad">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Эрэмбэлэх</p>
                  <div className="mobile-chip-grid">
                    {PRODUCT_SORT_FILTERS.map((filter) => {
                      const key = productSortFilterKey(filter);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSortKey(key)}
                          className={`mobile-chip ${sortKey === key ? 'bg-[var(--color-brand-accent)] text-white' : 'admin-chip admin-chip-idle'}`}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="admin-card admin-card-pad">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Ангиллаар шүүх</p>
                  <div className="mobile-chip-grid">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(ADMIN_ALL_FILTER_VALUE)}
                      className={`mobile-chip ${selectedCategory === ADMIN_ALL_FILTER_VALUE ? 'bg-[var(--color-brand-accent)] text-white' : 'admin-chip admin-chip-idle'}`}
                    >
                      Бүгд
                    </button>
                    {categories?.map((category: any) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`mobile-chip ${selectedCategory === category.id ? 'bg-[var(--color-brand-accent)] text-white' : 'admin-chip admin-chip-idle'}`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {!isLoading && products.some((product: any) => product.stock > 0 && product.stock < STOCK_DISPLAY_THRESHOLD) && (
        <div className="flex gap-3 rounded-[22px] bg-[var(--status-warning-bg)] p-4 text-[var(--status-warning)]">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <p className="text-[13px] font-bold leading-6">{STOCK_DISPLAY_THRESHOLD}-аас бага нөөцтэй бараа байна. Дуусахаас өмнө татан авалтаа шалгаарай.</p>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-72 rounded-[22px] animate-shimmer" />)
        ) : products.length ? (
          products.map((product: any) => {
            const image = parseImages(product.images)[0] || '/placeholder-product.svg';
            const stock = Number(product.stock || 0);
            const isOutOfStock = stock === 0;
            const isLowStock = stock > 0 && stock < STOCK_DISPLAY_THRESHOLD;
            return (
              <article key={product.id} className="admin-card-soft overflow-hidden admin-card-tap">
                <div className="relative aspect-[4/5] bg-[var(--color-brand-secondary)]">
                  <Image src={image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                  {editingStockId === product.id ? (
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
                    <button
                      type="button"
                      aria-label="Нөөц засах"
                      onClick={() => startStockEdit(product.id, stock)}
                      className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[9px] font-extrabold ${stockBadgeClass(stock)}`}
                    >
                      НӨӨЦ: {stock}
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
                    className={`mt-1 text-[10px] font-extrabold ${isOutOfStock ? 'text-[var(--status-error)]' : isLowStock ? 'text-[var(--status-error)]' : 'text-[var(--status-success)]'}`}
                  >
                    {isOutOfStock ? 'Дууссан' : isLowStock ? 'Нөөц бага' : 'Боломжтой'}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 admin-divider pt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-brand-muted)]">
                      {product.isVisible ? 'Харагдаж байна' : 'Нуугдсан'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={product.isVisible}
                      onClick={() => handleToggleVisibility(product.id, product.isVisible)}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${product.isVisible ? 'bg-[var(--color-brand-accent)]' : 'bg-[#e8d2dc]'}`}
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
            <AdminEmptyState icon={PackageOpen} title="Бараа олдсонгүй" body="Хайлт эсвэл шүүлтүүрээ өөрчлөөд дахин үзээрэй." />
          </div>
        )}
      </section>

      {!isLoading && productsData?.totalCount > 20 && (
        <Pagination page={page} totalItems={productsData.totalCount} pageSize={20} onPageChange={setPage} />
      )}

      <AdminSelectionSheet
        open={isBulkActionsOpen}
        count={selectedCount}
        unitLabel="бараа"
        onClose={() => setIsBulkActionsOpen(false)}
        onClear={clearSelection}
      >
        <button
          type="button"
          disabled={bulkLoading}
          onClick={() => runBulkAction('show')}
          className="admin-selection-action admin-selection-action--secondary"
        >
          <Eye size={20} /> Харуулах
        </button>
        <button
          type="button"
          disabled={bulkLoading}
          onClick={() => runBulkAction('hide')}
          className="admin-selection-action admin-selection-action--secondary"
        >
          <EyeOff size={20} /> Нуух
        </button>
        <button
          type="button"
          disabled={bulkLoading}
          onClick={() => {
            setIsBulkActionsOpen(false);
            setBulkStockValue('');
            setBulkSheet('stock');
          }}
          className="admin-selection-action admin-selection-action--primary"
        >
          <PackageOpen size={20} /> Нөөц өөрчлөх
        </button>
        <button
          type="button"
          disabled={bulkLoading}
          onClick={() => {
            setIsBulkActionsOpen(false);
            setBulkCategoryId('');
            setBulkSheet('category');
          }}
          className="admin-selection-action admin-selection-action--secondary"
        >
          <Tag size={20} /> Ангилал солих
        </button>
        <button
          type="button"
          disabled={bulkLoading}
          onClick={() => {
            setIsBulkActionsOpen(false);
            setBulkDiscount('');
            setBulkSheet('discount');
          }}
          className="admin-selection-action admin-selection-action--secondary sm:col-span-2"
        >
          <Percent size={20} /> Хямдрал тохируулах
        </button>
      </AdminSelectionSheet>

      <AdminSheet open={bulkSheet === 'stock'} onClose={() => setBulkSheet(null)}>
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-accent)]">Олон сонголт</p>
        <h3 className="mt-1 text-[22px] font-extrabold text-[var(--color-brand-text)]">Нөөц өөрчлөх</h3>
        <p className="mt-1 text-[13px] text-[var(--color-brand-muted)]">{selectedCount} бараанд нэгэн зэрэг тоо онооно.</p>
        <input
          value={bulkStockValue}
          onChange={(e) => setBulkStockValue(e.target.value)}
          placeholder="Жишээ: 50"
          inputMode="numeric"
          className="mt-4 h-12 w-full rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/30"
        />
        <button
          type="button"
          disabled={bulkLoading || bulkStockValue === ''}
          onClick={() => runBulkAction('stock', { stock: Math.max(0, Number(bulkStockValue) || 0) })}
          className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-[15px] font-extrabold text-white disabled:opacity-60"
        >
          Хадгалах
        </button>
      </AdminSheet>

      <AdminSheet open={bulkSheet === 'category'} onClose={() => setBulkSheet(null)}>
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-accent)]">Олон сонголт</p>
        <h3 className="mt-1 text-[22px] font-extrabold text-[var(--color-brand-text)]">Ангилал солих</h3>
        <p className="mt-1 text-[13px] text-[var(--color-brand-muted)]">{selectedCount} барааг шинэ ангилалд оруулна.</p>
        <select
          value={bulkCategoryId}
          onChange={(e) => setBulkCategoryId(e.target.value)}
          className="mt-4 h-12 w-full rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/30"
        >
          <option value="">Ангилал сонгох...</option>
          {categories?.map((category: any) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={bulkLoading || !bulkCategoryId}
          onClick={() => runBulkAction('category', { categoryId: bulkCategoryId })}
          className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-[15px] font-extrabold text-white disabled:opacity-60"
        >
          Хадгалах
        </button>
      </AdminSheet>

      <AdminSheet open={bulkSheet === 'discount'} onClose={() => setBulkSheet(null)}>
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-accent)]">Олон сонголт</p>
        <h3 className="mt-1 text-[22px] font-extrabold text-[var(--color-brand-text)]">Хямдрал үзүүлэх</h3>
        <p className="mt-1 text-[13px] text-[var(--color-brand-muted)]">{selectedCount} бараанд хувь хямдрал тооцно.</p>
        <input
          value={bulkDiscount}
          onChange={(e) => setBulkDiscount(e.target.value)}
          placeholder="Жишээ: 15"
          inputMode="numeric"
          className="mt-4 h-12 w-full rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/30"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={bulkLoading || bulkDiscount === ''}
            onClick={() => runBulkAction('discount', { discountPercent: Number(bulkDiscount) || 0 })}
            className="flex h-14 items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-[15px] font-extrabold text-white disabled:opacity-60"
          >
            Хямдрал оноох
          </button>
          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => runBulkAction('clearDiscount')}
            className="flex h-14 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[15px] font-extrabold text-[var(--color-brand-text)] disabled:opacity-60"
          >
            Хямдрал арилгах
          </button>
        </div>
      </AdminSheet>

      <Link
        href="/admin/products/new"
        className="fixed bottom-[92px] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-white shadow-[0_14px_34px_rgba(228,95,154,0.34)] ring-4 ring-white active:scale-95 sm:hidden"
        aria-label="Бараа нэмэх"
      >
        <Plus size={26} />
      </Link>
    </AdminPageShell>
  );
}
