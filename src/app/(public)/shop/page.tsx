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
        <button onClick={() => window.location.reload()} className="btn-outline">Дахин оролдох</button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-14 md:py-22">
      {/* Page Header */}
      <div className="mb-12 md:mb-18">
        <h1 className="font-serif text-display-sm md:text-display font-normal text-[#1A1A1A]">
          Бүтээгдэхүүн
        </h1>
        <p className="label-eyebrow mt-4">
          {loading ? '...' : `${filteredProducts.length} бүтээгдэхүүн`}
          {activeCategory !== 'all' && ` · ${activeCategoryName}`}
        </p>
      </div>

      <div className="flex gap-10 lg:gap-18">
        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 btn-outline bg-cream shadow-lg px-6 py-3 text-xs"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-2 inline-block">
            <path d="M4 6h16M4 12h10M4 18h6" />
          </svg>
          Шүүлтүүр
        </button>

        {/* Sidebar */}
        <aside className={`
          ${isSidebarOpen ? 'fixed inset-0 z-50 bg-cream p-6 overflow-y-auto lg:static lg:z-auto lg:p-0' : 'hidden'}
          lg:block lg:w-[190px] lg:flex-shrink-0
        `}>
          {/* Mobile close */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-6 right-6 text-text-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </button>

          {/* Categories */}
          <div className="mb-12">
            <h3 className="label-eyebrow mb-5">
              Ангилал
            </h3>
            <div className="space-y-3">
              {displayCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    updateFilters('category', cat.slug);
                    setIsSidebarOpen(false);
                  }}
                  className={`block text-left text-sm leading-6 transition-colors ${
                    activeCategory === cat.slug
                      ? 'text-[#1A1A1A] underline underline-offset-4 decoration-[#1A1A1A]'
                      : 'text-[#8B6B78] hover:text-[#1A1A1A]'
                  }`}
                >
                  {cat.name_mn}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="border-t border-[#F2A8C8]/70 pt-8">
            <h3 className="label-eyebrow mb-5">
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
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Sort */}
          <div className="flex justify-end mb-8">
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
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[150px] border border-[#F2A8C8] bg-white shadow-[0_10px_30px_rgba(26,26,26,0.08)]">
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-cream-dark mb-4" />
                  <div className="h-3 bg-cream-dark w-16 mb-2" />
                  <div className="h-4 bg-cream-dark w-full mb-2" />
                  <div className="h-4 bg-cream-dark w-20" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
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
