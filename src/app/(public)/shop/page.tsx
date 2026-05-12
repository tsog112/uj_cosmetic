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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
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

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Price filter
    result = result.filter(p => {
      const price = p?.salePrice ?? p?.price ?? 0;
      return price >= priceRange[0] && price <= priceRange[1];
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
  }, [products, activeCategory, activeSort, priceRange]);

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
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 text-center">
        <p className="text-sm text-red-500 mb-4">Мэдээлэл ачаалахад алдаа гарлаа. Дахин оролдоно уу.</p>
        <button onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center justify-center rounded-[11px] border border-[#F2C7D8] bg-white px-5 text-sm font-semibold text-[#241820] transition-colors hover:bg-[#FFF0F6]">Дахин оролдох</button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-24 pb-8 md:py-22">
      {/* Page Header */}
      <div className="mb-6 md:mb-18">
        <h1 className="text-[30px] md:font-serif md:text-display font-semibold md:font-normal text-[#1A1A1A] leading-tight">
          Бүтээгдэхүүн
        </h1>
        <p className="text-[11px] md:text-[0.6875rem] tracking-[0.14em] md:tracking-[0.18em] uppercase text-[#8B6B78] mt-2 md:mt-4 font-medium">
          {loading ? '...' : `${filteredProducts.length} бүтээгдэхүүн`}
          {activeCategory !== 'all' && ` · ${activeCategoryName}`}
        </p>
      </div>

      <div className="lg:hidden sticky top-[60px] z-30 -mx-4 mb-5 border-y border-[#F2A8C8]/50 bg-sand/95 px-4 py-3 backdrop-blur-md">
        <div className="flex gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="min-h-11 flex-1 rounded-[12px] border border-[#F2A8C8] bg-white/70 px-4 text-sm font-medium text-[#1A1A1A] flex items-center justify-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 6h16M4 12h10M4 18h6" />
            </svg>
            Шүүлтүүр
          </button>
          <button
            type="button"
            onClick={() => setIsSortOpen(prev => !prev)}
            className="min-h-11 flex-1 rounded-[12px] border border-[#F2A8C8] bg-white/70 px-4 text-sm font-medium text-[#1A1A1A] flex items-center justify-center gap-2"
          >
            {sortOptions.find(option => option.value === activeSort)?.label || 'Шинэ'}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="#8B6B78" strokeWidth="1.3" />
            </svg>
          </button>
        </div>
        {isSortOpen && (
          <div className="absolute right-4 top-[58px] z-40 w-[180px] rounded-[14px] border border-[#F2A8C8] bg-sand shadow-[0_10px_30px_rgba(26,26,26,0.08)] overflow-hidden">
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
                    ? 'text-[#1A1A1A] bg-[#FFF0F6]'
                    : 'text-[#8B6B78] hover:text-[#1A1A1A] hover:bg-[#FFF0F6]'
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
          ${isSidebarOpen ? 'fixed inset-0 z-50 bg-sand p-5 overflow-y-auto lg:static lg:z-auto lg:p-0' : 'hidden'}
          lg:block lg:w-[190px] lg:flex-shrink-0
        `}>
          {/* Mobile close */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-5 right-5 w-11 h-11 rounded-[12px] border border-border bg-white/70 flex items-center justify-center text-text-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </button>

          {/* Categories */}
          <div className="mb-8 lg:mb-12 pt-14 lg:pt-0">
            <h3 className="text-[11px] tracking-[0.14em] lg:tracking-[0.18em] uppercase text-[#8B6B78] mb-4 lg:mb-5 font-medium">
              Ангилал
            </h3>
            <div className="grid grid-cols-2 gap-2 lg:block lg:space-y-3">
              {displayCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    updateFilters('category', cat.slug);
                    setIsSidebarOpen(false);
                  }}
                  className={`min-h-11 rounded-[12px] border px-3 text-left text-sm leading-6 transition-colors lg:min-h-0 lg:rounded-none lg:border-0 lg:px-0 ${
                    activeCategory === cat.slug
                      ? 'border-[#FFB7D5] bg-[#FFF0F6] text-[#1A1A1A] lg:bg-transparent lg:underline lg:underline-offset-4 lg:decoration-[#1A1A1A]'
                      : 'border-[#F2A8C8]/50 bg-white/60 text-[#8B6B78] hover:text-[#1A1A1A] lg:bg-transparent'
                  }`}
                >
                  {cat.name_mn}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="border-t border-[#F2A8C8]/70 pt-6 lg:pt-8">
            <h3 className="text-[11px] tracking-[0.14em] lg:tracking-[0.18em] uppercase text-[#8B6B78] mb-4 lg:mb-5 font-medium">
              Үнийн хүрээ
            </h3>
            <input
              type="range"
              min={0}
              max={200000}
              step={5000}
              value={priceRange[1]}
              onChange={e => setPriceRange([0, parseInt(e.target.value)])}
              className="w-full accent-[#1A1A1A]"
            />
            <div className="flex justify-between mt-3 text-[11px] tracking-[0.08em] uppercase text-[#8B6B78]">
              <span>0₮</span>
              <span>{formatPrice(priceRange[1])}</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden mt-8 w-full min-h-12 rounded-[12px] bg-[#1A1A1A] text-white text-sm font-medium">
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
                className="min-w-[150px] border border-[#F2A8C8] bg-transparent px-4 py-2.5 text-left text-xs uppercase tracking-[0.16em] text-[#1A1A1A] flex items-center justify-between gap-4"
              >
                {sortOptions.find(option => option.value === activeSort)?.label || 'Шинэ'}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="#8B6B78" strokeWidth="1.3" />
                </svg>
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[150px] border border-[#F2A8C8] bg-sand shadow-[0_10px_30px_rgba(26,26,26,0.08)]">
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
                          ? 'text-[#1A1A1A] bg-[#FFF0F6]'
                          : 'text-[#8B6B78] hover:text-[#1A1A1A] hover:bg-[#FFF0F6]'
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
                  <div className="aspect-[4/5] rounded-[14px] md:rounded-none bg-cream-dark mb-4" />
                  <div className="h-3 bg-cream-dark w-16 mb-2" />
                  <div className="h-4 bg-cream-dark w-full mb-2" />
                  <div className="h-4 bg-cream-dark w-20" />
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
