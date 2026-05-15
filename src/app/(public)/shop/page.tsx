'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAllProducts } from '@/lib/services/firestoreService';
import { formatPrice, Product, Category } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { Suspense } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeCategory = searchParams.get('category') || 'all';
  const activeSort = searchParams.get('sort') || 'newest';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const displayCategories = [
    { id: 'all', name_mn: 'Бүгд', slug: 'all' },
    ...categories,
  ];

  const sortOptions = [
    { value: 'newest', label: 'Шинэ' },
    { value: 'price_asc', label: 'Үнэ өсөх' },
    { value: 'price_desc', label: 'Үнэ буурах' },
  ];

  useEffect(() => {
    setLoading(true);
    setError(false);
    getAllProducts({ published: true })
      .then(data => setProducts(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getDocs(query(collection(db, 'categories'), orderBy('order', 'asc')))
      .then(snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category))))
      .catch(() => setCategories([]));
  }, []);

  const maxProductPrice = useMemo(() => {
    return products.reduce((max, product) => {
      const price = product?.salePrice ?? product?.price ?? 0;
      return Math.max(max, price);
    }, 0);
  }, [products]);

  useEffect(() => {
    if (maxProductPrice > 0) {
      setPriceRange([0, maxProductPrice]);
    }
  }, [maxProductPrice]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Price filter
    const upperPrice = priceRange[1] || maxProductPrice;
    result = result.filter(p => {
      const price = p?.salePrice ?? p?.price ?? 0;
      return upperPrice <= 0 || (price >= priceRange[0] && price <= upperPrice);
    });

    // Sort
    switch (activeSort) {
      case 'price_asc':
        result.sort((a, b) => (a?.salePrice ?? a?.price ?? 0) - (b?.salePrice ?? b?.price ?? 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b?.salePrice ?? b?.price ?? 0) - (a?.salePrice ?? a?.price ?? 0));
        break;
      case 'newest':
      default:
        break;
    }

    return result;
  }, [products, activeCategory, activeSort, priceRange, maxProductPrice]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === 'newest') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeCategoryName = displayCategories.find(cat => cat.slug === activeCategory)?.name_mn || activeCategory;

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-28 pb-20 text-center">
        <p className="text-sm text-status-cancelled-text mb-4">Мэдээлэл ачаалахад алдаа гарлаа. Дахин оролдоно уу.</p>
        <button onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-light bg-white px-6 text-sm font-semibold text-charcoal transition-colors hover:bg-blush">Дахин оролдох</button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-28 md:pt-32 pb-8">
      {/* Page Header */}
      <div className="mb-6 md:mb-16">
        <h1 className="text-[28px] md:text-display font-semibold md:font-light text-charcoal leading-tight">
          Бүтээгдэхүүн
        </h1>
        <p className="text-[11px] tracking-[0.16em] uppercase text-text-subtle mt-2 md:mt-4 font-medium">
          {loading ? '...' : `${filteredProducts.length} бүтээгдэхүүн`}
          {activeCategory !== 'all' && ` · ${activeCategoryName}`}
        </p>
      </div>

      <div className="lg:hidden sticky top-16 z-30 -mx-4 mb-5 border-y border-black/[0.04] bg-white/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-[12px] border border-border-light bg-white px-4 text-sm font-medium text-charcoal"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 6h16M4 12h10M4 18h6" />
            </svg>
            Шүүлтүүр
          </button>
          <button
            type="button"
            onClick={() => setIsSortOpen(prev => !prev)}
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-[12px] border border-border-light bg-white px-4 text-sm font-medium text-charcoal"
          >
            {sortOptions.find(option => option.value === activeSort)?.label || 'Шинэ'}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        </div>
        {isSortOpen && (
          <div className="absolute right-4 top-[54px] z-40 w-[180px] overflow-hidden rounded-xl border border-border-light bg-white shadow-brand-lg">
            {sortOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  updateFilters('sort', option.value);
                  setIsSortOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-sm transition-colors ${
                  activeSort === option.value
                    ? 'text-charcoal bg-blush font-medium'
                    : 'text-text-subtle hover:text-charcoal hover:bg-sand'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-10 lg:gap-18">

        {/* Sidebar */}
        <aside className={`
          ${isSidebarOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto lg:static lg:z-auto lg:p-0' : 'hidden'}
          lg:block lg:w-[190px] lg:flex-shrink-0
        `}>
          {/* Mobile close */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-5 right-5 w-10 h-10 rounded-full border border-border-light bg-sand flex items-center justify-center text-charcoal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </button>

          {/* Categories */}
          <div className="mb-8 lg:mb-12 pt-14 lg:pt-0">
            <h3 className="text-[11px] tracking-[0.16em] uppercase text-text-subtle mb-4 lg:mb-5 font-semibold">
              Ангилал
            </h3>
            <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-1.5">
              {displayCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    updateFilters('category', cat.slug);
                    setIsSidebarOpen(false);
                  }}
                  className={`min-h-10 rounded-[12px] border px-3.5 text-left text-sm transition-all lg:min-h-0 lg:rounded-lg lg:border-0 lg:px-2 lg:py-1.5 ${
                    activeCategory === cat.slug
                      ? 'border-dusty-rose bg-blush text-charcoal font-medium lg:bg-blush'
                      : 'border-border-light bg-white text-text-subtle hover:text-charcoal lg:bg-transparent lg:hover:bg-sand'
                  }`}
                >
                  {cat.name_mn}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="border-t border-border-light pt-6 lg:pt-8">
            <h3 className="text-[11px] tracking-[0.16em] uppercase text-text-subtle mb-4 lg:mb-5 font-semibold">
              Үнийн хүрээ
            </h3>
            <input
              type="range"
              min={0}
              max={Math.max(maxProductPrice, 1)}
              step={5000}
              value={priceRange[1] || maxProductPrice || 1}
              onChange={e => setPriceRange([0, parseInt(e.target.value)])}
              disabled={maxProductPrice <= 0}
              className="w-full accent-charcoal"
            />
            <div className="flex justify-between mt-3 text-[10px] tracking-wider uppercase text-text-subtle">
              <span>0₮</span>
              <span>{formatPrice(priceRange[1] || maxProductPrice)}</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="mt-8 min-h-12 w-full rounded-[12px] bg-charcoal text-sm font-semibold text-white lg:hidden">
              Харах
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Sort */}
          <div className="hidden lg:flex justify-end mb-8">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(prev => !prev)}
                className="flex min-w-[150px] items-center justify-between gap-4 rounded-[12px] border border-border-light bg-white px-4 py-2.5 text-left text-xs uppercase tracking-[0.16em] text-charcoal transition-colors hover:bg-sand"
              >
                {sortOptions.find(option => option.value === activeSort)?.label || 'Шинэ'}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 min-w-[150px] overflow-hidden rounded-xl border border-border-light bg-white shadow-brand-lg">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        updateFilters('sort', option.value);
                        setIsSortOpen(false);
                      }}
                      className={`block w-full px-4 py-3 text-left text-xs uppercase tracking-[0.16em] transition-colors ${
                        activeSort === option.value
                          ? 'text-charcoal bg-blush font-medium'
                          : 'text-text-subtle hover:text-charcoal hover:bg-sand'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-8 md:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] rounded-2xl bg-sand-dark mb-4" />
                  <div className="h-3 rounded bg-sand-dark w-16 mb-2" />
                  <div className="h-4 rounded bg-sand-dark w-full mb-2" />
                  <div className="h-4 rounded bg-sand-dark w-20" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-8 md:gap-8">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-text-muted text-sm">
                Бүтээгдэхүүн олдсонгүй
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 md:py-20">
        <div className="animate-pulse">
          <div className="h-10 bg-cream-dark w-64 mb-4" />
          <div className="h-4 bg-cream-dark w-32" />
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
