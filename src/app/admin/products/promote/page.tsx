'use client';

import { authFetch } from '@/lib/auth/clientFetch';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BadgePlus, CalendarDays, Check, Search, Sparkles, Trash2 } from 'lucide-react';
import AdminConfirmSheet from '@/components/admin/AdminConfirmSheet';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminSheet from '@/components/admin/AdminSheet';
import { useToast } from '@/components/admin/Toast';
import { useAdminProducts } from '@/lib/hooks/useAdmin';

type PromoteProduct = {
  id: string;
  name: string;
  category?: { name?: string };
  images?: string[];
  stock?: number;
  orderCount?: number;
  isFeatured?: boolean;
  featuredSince?: string | Date | null;
  featuredUntil?: string | Date | null;
  featuredPosition?: 'home' | 'category' | 'both';
  showFeaturedBadge?: boolean;
};

const positionLabels = {
  home: 'Нүүр хуудасны дээд',
  category: 'Ангиллын баннер',
  both: 'Хоёуланд нь',
} as const;

function defaultFeaturedRange() {
  const since = new Date();
  const until = new Date();
  until.setDate(until.getDate() + 30);
  return { since: since.toISOString().slice(0, 10), until: until.toISOString().slice(0, 10) };
}

function toInputDate(value?: string | Date | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatDateRange(since?: string | Date | null, until?: string | Date | null) {
  const from = toInputDate(since);
  const to = toInputDate(until);
  if (!from && !to) return 'Хугацаа сонгоогүй';
  if (from && to) {
    const fmt = (iso: string) => {
      const d = new Date(iso);
      return d.toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    return `${fmt(from)} – ${fmt(to)}`;
  }
  return from ? `${from} – …` : `… – ${to}`;
}

function imageOf(product: PromoteProduct) {
  return product.images?.[0] || '/placeholder-product.svg';
}

export default function PromoteProductsPage() {
  const { data, isLoading, mutate } = useAdminProducts({ limit: 200 });
  const { showToast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState('');
  const [removeProduct, setRemoveProduct] = useState<PromoteProduct | null>(null);
  const [position, setPosition] = useState<'home' | 'category' | 'both'>('home');
  const [maxFeatured, setMaxFeatured] = useState(3);
  const [showBadge, setShowBadge] = useState(true);
  const defaults = defaultFeaturedRange();
  const [featuredSince, setFeaturedSince] = useState(defaults.since);
  const [featuredUntil, setFeaturedUntil] = useState(defaults.until);
  const [dateEditProduct, setDateEditProduct] = useState<PromoteProduct | null>(null);
  const [editSince, setEditSince] = useState('');
  const [editUntil, setEditUntil] = useState('');

  const products = (data?.products || []) as PromoteProduct[];
  const featured = products.filter((product) => product.isFeatured);
  const suggested = useMemo(
    () => [...products].filter((product) => !product.isFeatured).sort((a, b) => Number(b.orderCount || 0) - Number(a.orderCount || 0)).slice(0, 3),
    [products],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => [product.name, product.category?.name].filter(Boolean).some((value) => String(value).toLowerCase().includes(term)));
  }, [products, search]);

  const openDateEditor = (product: PromoteProduct) => {
    setDateEditProduct(product);
    setEditSince(toInputDate(product.featuredSince) || defaultFeaturedRange().since);
    setEditUntil(toInputDate(product.featuredUntil) || defaultFeaturedRange().until);
  };

  const updateFeatured = async (
    product: PromoteProduct,
    isFeatured: boolean,
    options?: { since?: string; until?: string },
  ) => {
    if (isFeatured && (!options?.since || !options?.until)) {
      showToast('Эхлэх болон дуусах огноо сонгоно уу', 'error');
      return;
    }
    if (isFeatured && options?.since && options?.until && options.since > options.until) {
      showToast('Дуусах огноо эхлэхээс хойш байх ёстой', 'error');
      return;
    }

    setBusyId(product.id);
    const sinceIso = options?.since ? new Date(options.since).toISOString() : null;
    const untilIso = options?.until ? new Date(options.until).toISOString() : null;

    mutate(
      (prev: { products?: PromoteProduct[] } | undefined) =>
        prev
          ? {
              ...prev,
              products: prev.products?.map((item) =>
                item.id === product.id
                  ? {
                      ...item,
                      isFeatured,
                      featuredSince: isFeatured ? sinceIso : null,
                      featuredUntil: isFeatured ? untilIso : null,
                      featuredPosition: position,
                      showFeaturedBadge: showBadge,
                    }
                  : item,
              ),
            }
          : prev,
      false,
    );
    try {
      const response = await authFetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isFeatured,
          featuredSince: sinceIso,
          featuredUntil: untilIso,
          featuredPosition: position,
          showFeaturedBadge: showBadge,
        }),
      });
      if (!response.ok) throw new Error();
      mutate();
      navigator.vibrate?.(8);
      showToast(isFeatured ? 'Бараа онцлогдлоо' : 'Онцлолоос хаслаа');
      setDateEditProduct(null);
      setSheetOpen(false);
    } catch {
      mutate();
      showToast('Онцлох тохиргоо хадгалахад алдаа гарлаа', 'error');
    } finally {
      setBusyId('');
      setRemoveProduct(null);
    }
  };

  const saveDateRange = async () => {
    if (!dateEditProduct) return;
    if (!editSince || !editUntil) {
      showToast('Эхлэх болон дуусах огноо сонгоно уу', 'error');
      return;
    }
    if (editSince > editUntil) {
      showToast('Дуусах огноо эхлэхээс хойш байх ёстой', 'error');
      return;
    }
    await updateFeatured(dateEditProduct, true, { since: editSince, until: editUntil });
  };

  return (
    <AdminPageShell className="gap-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Link href="/admin/products" className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-[var(--shadow-mobile-card)]" aria-label="Буцах">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">Онцлох</p>
            <h1 className="mt-1 text-[28px] font-extrabold leading-tight text-[var(--color-brand-text)]">Бараа онцлох</h1>
            <p className="mt-1 text-[13px] leading-5 text-[var(--color-brand-muted)]">Нүүр болон ангиллын хэсэгт харуулах бараа, хугацааг сонгоно</p>
          </div>
        </div>
        <button onClick={() => setSheetOpen(true)} className="flex h-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-accent)] px-4 text-[12px] font-extrabold text-white">
          Нэмэх
        </button>
      </header>

      <section className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-[96px] rounded-[22px] animate-shimmer" />)
        ) : featured.length ? (
          featured.map((product) => (
            <article key={product.id} className="flex min-h-[96px] items-center gap-3 rounded-[22px] bg-white p-3 shadow-[var(--shadow-mobile-card)]">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-[var(--color-brand-secondary)]">
                <Image src={imageOf(product)} alt={product.name} fill className="object-cover" sizes="64px" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-[15px] font-extrabold text-[var(--color-brand-text)]">{product.name}</h2>
                  <span className="rounded-full bg-[var(--color-brand-accent)] px-2 py-0.5 text-[9px] font-extrabold text-white">Онцолсон</span>
                </div>
                <p className="mt-1 truncate text-[12px] text-[var(--color-brand-muted)]">{product.category?.name || 'Ангилалгүй'}</p>
                <button
                  type="button"
                  onClick={() => openDateEditor(product)}
                  className="mt-2 flex w-full items-center gap-1.5 rounded-[12px] bg-[var(--color-brand-bg)] px-2.5 py-2 text-left text-[11px] font-bold text-[var(--color-brand-text)] transition-colors hover:bg-[var(--color-brand-secondary)]"
                >
                  <CalendarDays size={14} className="shrink-0 text-[var(--color-brand-accent)]" />
                  <span className="truncate">{formatDateRange(product.featuredSince, product.featuredUntil)}</span>
                </button>
              </div>
              <button onClick={() => setRemoveProduct(product)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--status-error-bg)] text-[var(--status-error)]" aria-label="Онцлолоос хасах">
                <Trash2 size={17} />
              </button>
            </article>
          ))
        ) : (
          <AdminEmptyState
            icon={Sparkles}
            title="Онцолсон бараа алга"
            body="Нүүр хуудас болон ангиллын хэсэгт харуулах бараа нэмээрэй."
            action={
              <button onClick={() => setSheetOpen(true)} className="h-12 rounded-full bg-[var(--color-brand-accent)] px-5 text-sm font-extrabold text-white">
                Бараа нэмэх
              </button>
            }
          />
        )}
      </section>

      <AdminSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-accent)]">Онцлох</p>
            <h2 className="mt-1 text-[22px] font-extrabold text-[var(--color-brand-text)]">Бараа сонгох</h2>
          </div>

          <section className="space-y-3 rounded-[22px] bg-white p-4 shadow-[var(--shadow-mobile-card)]">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Урамшууллын хугацаа</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-brand-muted)]">Эхлэх огноо *</span>
                <input
                  type="date"
                  value={featuredSince}
                  onChange={(e) => setFeaturedSince(e.target.value)}
                  className="h-12 w-full rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/30"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-brand-muted)]">Дуусах огноо *</span>
                <input
                  type="date"
                  value={featuredUntil}
                  onChange={(e) => setFeaturedUntil(e.target.value)}
                  className="h-12 w-full rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/30"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[22px] bg-[var(--color-brand-bg)] p-3">
            <p className="mb-3 text-[12px] font-extrabold text-[var(--color-brand-text)]">Их зарагдсанаар санал болгох</p>
            <div className="space-y-2">
              {suggested.map((product) => (
                <button
                  key={product.id}
                  onClick={() => updateFeatured(product, true, { since: featuredSince, until: featuredUntil })}
                  disabled={busyId === product.id}
                  className="flex min-h-[62px] w-full items-center gap-3 rounded-[18px] bg-white p-2 text-left"
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[14px] bg-[var(--color-brand-secondary)]">
                    <Image src={imageOf(product)} alt={product.name} fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-extrabold">{product.name}</span>
                    <span className="text-[11px] text-[var(--color-brand-muted)]">{product.orderCount || 0} удаа зарагдсан</span>
                  </span>
                  <span className="rounded-full bg-[var(--color-brand-accent)] px-3 py-2 text-[11px] font-extrabold text-white">Онцлох</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-[22px] bg-white p-3 shadow-[var(--shadow-mobile-card)]">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Харуулах байрлал</p>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(positionLabels) as Array<'home' | 'category' | 'both'>).map((value) => (
                <label key={value} className="flex min-h-12 items-center gap-3 rounded-[16px] bg-[var(--color-brand-bg)] px-4">
                  <input type="radio" checked={position === value} onChange={() => setPosition(value)} className="accent-[var(--color-brand-accent)]" />
                  <span className="text-sm font-bold">{positionLabels[value]}</span>
                </label>
              ))}
            </div>
            <label className="block">
              <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">Хамгийн их онцлох тоо</span>
              <input type="number" min={1} max={12} value={maxFeatured} onChange={(event) => setMaxFeatured(Number(event.target.value))} className="h-12 w-full rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none" />
            </label>
            <label className="flex min-h-12 items-center justify-between rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold">
              «Онцолсон» тэмдэг харуулах
              <input type="checkbox" checked={showBadge} onChange={(event) => setShowBadge(event.target.checked)} className="accent-[var(--color-brand-accent)]" />
            </label>
          </section>

          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Бараа хайх..." className="h-12 w-full rounded-full bg-[var(--color-brand-bg)] pl-11 pr-4 text-sm font-bold outline-none" />
          </div>

          <section className="space-y-2">
            {filtered.slice(0, maxFeatured * 8).map((product) => (
              <button
                key={product.id}
                onClick={() =>
                  product.isFeatured
                    ? updateFeatured(product, false)
                    : updateFeatured(product, true, { since: featuredSince, until: featuredUntil })
                }
                disabled={busyId === product.id}
                className="flex min-h-[70px] w-full items-center gap-3 rounded-[18px] bg-white p-3 text-left shadow-[var(--shadow-mobile-card)]"
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[14px] bg-[var(--color-brand-secondary)]">
                  <Image src={imageOf(product)} alt={product.name} fill sizes="48px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-extrabold">{product.name}</span>
                  <span className="text-[11px] text-[var(--color-brand-muted)]">Нөөц {product.stock || 0} · {product.orderCount || 0} зарагдсан</span>
                </span>
                {product.isFeatured ? <Check className="text-[var(--color-brand-accent)]" size={20} /> : <BadgePlus className="text-[var(--color-brand-muted)]" size={20} />}
              </button>
            ))}
          </section>
        </div>
      </AdminSheet>

      <AdminSheet open={Boolean(dateEditProduct)} onClose={() => setDateEditProduct(null)}>
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-accent)]">Хугацаа засах</p>
        <h3 className="mt-1 text-[22px] font-extrabold text-[var(--color-brand-text)]">{dateEditProduct?.name}</h3>
        <p className="mt-2 text-[14px] text-[var(--color-brand-muted)]">Онцлох эхлэх, дуусах өдрийг сонгоно уу.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-brand-muted)]">Эхлэх огноо *</span>
            <input
              type="date"
              value={editSince}
              onChange={(e) => setEditSince(e.target.value)}
              className="h-12 w-full rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/30"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-brand-muted)]">Дуусах огноо *</span>
            <input
              type="date"
              value={editUntil}
              onChange={(e) => setEditUntil(e.target.value)}
              className="h-12 w-full rounded-[16px] bg-[var(--color-brand-bg)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/30"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={Boolean(busyId)}
          onClick={() => void saveDateRange()}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-[15px] font-extrabold text-white disabled:opacity-60"
        >
          Хадгалах
        </button>
      </AdminSheet>

      <AdminConfirmSheet
        open={Boolean(removeProduct)}
        title="Онцлолоос хасах уу?"
        body="Энэ бараа онцлох жагсаалтаас хасагдана. Дараа нь дахин нэмэх боломжтой."
        confirmLabel="Хасах"
        destructive
        loading={Boolean(busyId)}
        onClose={() => setRemoveProduct(null)}
        onConfirm={() => {
          if (removeProduct) void updateFeatured(removeProduct, false);
        }}
      />
    </AdminPageShell>
  );
}
