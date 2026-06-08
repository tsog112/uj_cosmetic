'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import { getAllProducts, getCategories } from '@/lib/services/firestoreService';
import { formatPrice, type Product } from '@/types';

type Category = { id: string; name_mn: string; name?: string; slug: string };

const SORT_OPTIONS = [
  { value: 'newest', label: '\u0428\u0438\u043d\u044d \u044d\u0445\u044d\u043d\u0434\u044d\u044d' },
  { value: 'price_asc', label: '\u04ae\u043d\u044d \u2191 \u04e9\u0441\u04e9\u0445' },
  { value: 'price_desc', label: '\u04ae\u043d\u044d \u2193 \u0431\u0443\u0443\u0440\u0430\u0445' },
];

function displayCategoryName(category: Category) {
  return category.name_mn || category.name || category.slug;
}

function ShopEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-[24px] border border-[#F0E8ED] bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)]">
        <Search size={24} strokeWidth={1.6} />
      </div>
      <h2 className="mt-5 font-serif text-2xl font-semibold text-[var(--color-text-primary)]">{'\u0411\u04af\u0442\u044d\u044d\u0433\u0434\u044d\u0445\u04af\u04af\u043d \u043e\u043b\u0434\u0441\u043e\u043d\u0433\u04af\u0439'}</h2>
      <p className="mx-auto mt-2 max-w-[260px] text-sm leading-6 text-[var(--color-text-muted)]">
        {'\u0425\u0430\u0439\u043b\u0442, \u0430\u043d\u0433\u0438\u043b\u0430\u043b \u044d\u0441\u0432\u044d\u043b \u04af\u043d\u0438\u0439\u043d \u0448\u04af\u04af\u043b\u0442\u04af\u04af\u0440\u044d\u044d \u04e9\u04e9\u0440\u0447\u043b\u04e9\u04e9\u0434 \u0434\u0430\u0445\u0438\u043d \u04af\u0437\u044d\u044d\u0440\u044d\u0439.'}
      </p>
      <button type="button" onClick={onReset} className="mt-6 h-11 rounded-full bg-[var(--color-brand)] px-7 text-sm font-semibold text-white uj-pressable">
        {'\u0428\u04af\u04af\u043b\u0442\u04af\u04af\u0440 \u0446\u044d\u0432\u044d\u0440\u043b\u044d\u0445'}
      </button>
    </div>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = searchParams.get('category') || 'all';
  const activeSort = searchParams.get('sort') || 'newest';
  const onSaleOnly = searchParams.get('onSale') === 'true';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [priceMax, setPriceMax] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getAllProducts({ published: true })
      .then((data) => setProducts(data || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getCategories().then((data) => setCategories(data || [])).catch(() => setCategories([]));
  }, []);

  const maxProductPrice = useMemo(() => products.reduce((max, product) => Math.max(max, product.salePrice ?? product.price ?? 0), 0), [products]);

  useEffect(() => {
    if (maxProductPrice > 0) setPriceMax(maxProductPrice);
  }, [maxProductPrice]);

  const displayCategories = useMemo(() => [{ id: 'all', name_mn: '\u0411\u04af\u0433\u0434', slug: 'all' }, ...categories], [categories]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const upperPrice = priceMax || maxProductPrice;
    const result = products
      .filter((product) => activeCategory === 'all' || product.category === activeCategory || product.category === (activeCategory as Product['category']))
      .filter((product) => {
        if (!onSaleOnly) return true;
        return product.salePrice !== null && product.salePrice !== undefined && product.salePrice < (product.price ?? 0);
      })
      .filter((product) => {
        if (!keyword) return true;
        return [product.name_mn, product.name_en, product.slug, product.description_mn]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      })
      .filter((product) => {
        const price = product.salePrice ?? product.price ?? 0;
        return !upperPrice || price <= upperPrice;
      });

    if (activeSort === 'price_asc') result.sort((a, b) => (a.salePrice ?? a.price ?? 0) - (b.salePrice ?? b.price ?? 0));
    if (activeSort === 'price_desc') result.sort((a, b) => (b.salePrice ?? b.price ?? 0) - (a.salePrice ?? a.price ?? 0));
    if (activeSort === 'newest') result.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());

    return result;
  }, [activeCategory, activeSort, maxProductPrice, onSaleOnly, priceMax, products, search]);

  const activeFilterCount = [
    activeCategory !== 'all',
    activeSort !== 'newest',
    onSaleOnly,
    search.trim().length > 0,
    Boolean(priceMax && priceMax < maxProductPrice),
  ].filter(Boolean).length;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === 'newest') params.delete(key);
    else params.set(key, value);
    router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  const resetFilters = () => {
    setSearch('');
    setPriceMax(maxProductPrice);
    router.push('/shop', { scroll: false });
  };
  if (error) {
    return (
      <main className="mx-auto max-w-[1180px] px-5 py-20 text-center">
        <p className="text-sm font-semibold text-[#A32D2D]">{'\u0411\u04af\u0442\u044d\u044d\u0433\u0434\u044d\u0445\u04af\u04af\u043d \u0430\u0447\u0430\u0430\u043b\u0430\u0445\u0430\u0434 \u0430\u043b\u0434\u0430\u0430 \u0433\u0430\u0440\u043b\u0430\u0430.'}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-5 h-11 rounded-full bg-[var(--color-brand)] px-7 text-sm font-semibold text-white">
          {'\u0414\u0430\u0445\u0438\u043d \u043e\u0440\u043e\u043b\u0434\u043e\u0445'}
        </button>
      </main>
    );
  }

  return (
    <main className="luxury-shell min-h-screen pb-[104px]">
      <div className="mx-auto w-full max-w-[1180px] px-5 pt-8 md:px-8">
        <section className="mb-6">
          <h1 className="luxury-title text-[40px] text-[#2a1d24] md:text-[52px]">
            {onSaleOnly ? '\u0425\u044f\u043c\u0434\u0440\u0430\u043b\u0442\u0430\u0439 \u0431\u04af\u0442\u044d\u044d\u0433\u0434\u044d\u0445\u04af\u04af\u043d' : '\u0411\u04af\u0442\u044d\u044d\u0433\u0434\u044d\u0445\u04af\u04af\u043d'}
          </h1>
          <p className="mt-2 text-sm text-[#7d6070]">
            {loading ? '\u0410\u0447\u0430\u0430\u043b\u0436 \u0431\u0430\u0439\u043d\u0430...' : `${filteredProducts.length} \u0431\u04af\u0442\u044d\u044d\u0433\u0434\u044d\u0445\u04af\u04af\u043d`}
          </p>
        </section>

        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <label className="luxury-input flex h-13 flex-1 px-4" style={{ boxShadow: 'var(--shadow-xs)' }}>
              <Search size={18} className="shrink-0 text-[#e91e8c]" strokeWidth={1.9} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={'\u041d\u044d\u0440, \u0431\u0440\u044d\u043d\u0434, \u0445\u044d\u0440\u044d\u0433\u043b\u044d\u0433\u0447\u044d\u044d\u0440 \u0445\u0430\u0439\u0445...'}
                className="min-w-0 flex-1 bg-transparent px-3 text-[13px] font-medium outline-none"
                inputMode="search"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label={'\u0425\u0430\u0439\u043b\u0442 \u0446\u044d\u0432\u044d\u0440\u043b\u044d\u0445'} className="flex h-9 w-9 items-center justify-center rounded-full">
                  <X size={15} />
                </button>
              )}
            </label>
            <button
              type="button"
              onClick={() => setIsFilterOpen((current) => !current)}
              className="flex h-13 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[var(--color-brand)] px-4 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-[var(--color-brand-dark)] active:scale-[0.98]"
              style={{ boxShadow: 'var(--shadow-glow)' }}
              aria-expanded={isFilterOpen}
            >
              <SlidersHorizontal size={17} strokeWidth={2} />
              <span className="hidden sm:inline">{'\u0428\u04af\u04af\u043b\u0442\u04af\u04af\u0440'}</span>
              {activeFilterCount > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{activeFilterCount}</span>}
            </button>
          </div>

          {isFilterOpen && (
            <div className="luxury-card rounded-[24px] p-5 md:p-6">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7d405a]">{'\u0410\u043d\u0433\u0438\u043b\u0430\u043b'}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {displayCategories.map((category) => {
                    const isActive = activeCategory === category.slug;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => updateFilter('category', category.slug)}
                        className={`inline-flex h-12 items-center rounded-full px-5 text-sm font-semibold transition ${
                          isActive ? 'bg-[#e91e8c] text-white' : 'bg-[#fde8f1] text-[#2a1d24]'
                        }`}
                        aria-pressed={isActive}
                      >
                        {category.slug === 'all' && <Sparkles size={15} className="mr-2" fill="currentColor" />}
                        {displayCategoryName(category)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-7">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7d405a]">{'\u042d\u0440\u044d\u043c\u0431\u044d\u043b\u044d\u0445'}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {SORT_OPTIONS.map((option) => {
                    const isActive = activeSort === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateFilter('sort', option.value)}
                        className={`inline-flex h-12 items-center rounded-full px-5 text-sm font-semibold transition ${
                          isActive ? 'bg-[#e91e8c] text-white' : 'bg-[#fde8f1] text-[#2a1d24]'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7d405a]">{'\u0414\u044d\u044d\u0434 \u04af\u043d\u044d'}</p>
                  <span className="text-sm font-semibold text-[#e91e8c]">{formatPrice(priceMax || maxProductPrice)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(maxProductPrice, 1)}
                  step={5000}
                  value={priceMax || maxProductPrice || 1}
                  onChange={(event) => setPriceMax(Number(event.target.value))}
                  className="mt-4 w-full"
                  style={{ accentColor: '#e91e8c' }}
                />
              </div>

              <button type="button" onClick={resetFilters} className="mt-6 h-11 rounded-full border border-[#f5b6ce] px-6 text-sm font-semibold text-[#e91e8c]">
                {'\u0411\u04af\u0433\u0434\u0438\u0439\u0433 \u0446\u044d\u0432\u044d\u0440\u043b\u044d\u0445'}
              </button>
            </div>
          )}
        </section>

        <section className="pt-7">
          {loading ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="aspect-[3/4] rounded-[22px] uj-shimmer" />
                  <div className="h-4 w-4/5 rounded-full uj-shimmer" />
                  <div className="h-4 w-1/2 rounded-full uj-shimmer" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length ? (
            <div className="grid grid-cols-2 items-start gap-x-3 gap-y-9 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <ShopEmptyState onReset={resetFilters} />
          )}
        </section>
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<main className="px-4 py-12"><div className="h-80 rounded-[24px] uj-shimmer" /></main>}>
      <ShopContent />
    </Suspense>
  );
}
