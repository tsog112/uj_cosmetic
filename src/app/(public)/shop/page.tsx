'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAllProducts } from '@/lib/services/firestoreService';
import { CATEGORIES, getCategoryName, formatPrice, Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { Suspense } from 'react';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeCategory = searchParams.get('category') || 'all';
  const activeSort = searchParams.get('sort') || 'newest';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);

  const displayCategories = [
    { id: 'all', name_mn: 'Бүгд', slug: 'all', image: '' },
    ...CATEGORIES,
  ];

  useEffect(() => {
    setLoading(true);
    setError(false);
    getAllProducts({ published: true })
      .then(data => setProducts(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Price filter
    result = result.filter(p => {
      const price = p.salePrice ?? p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    switch (activeSort) {
      case 'price_asc':
        result.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
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

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 text-center">
        <p className="text-sm text-red-500 mb-4">Мэдээлэл ачаалахад алдаа гарлаа. Дахин оролдоно уу.</p>
        <button onClick={() => window.location.reload()} className="btn-outline">Дахин оролдох</button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 md:py-20">
      {/* Page Header */}
      <div className="mb-12 md:mb-16">
        <h1 className="section-heading text-4xl md:text-5xl">Бүтээгдэхүүн</h1>
        <p className="text-sm text-text-muted mt-3">
          {loading ? '...' : `${filteredProducts.length} бүтээгдэхүүн`}
          {activeCategory !== 'all' && ` · ${getCategoryName(activeCategory)}`}
        </p>
      </div>

      <div className="flex gap-10 lg:gap-14">
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
          lg:block lg:w-[220px] lg:flex-shrink-0
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
          <div className="mb-10">
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-text-muted mb-5">
              Ангилал
            </h3>
            <div className="space-y-2.5">
              {displayCategories.map(cat => (
                <label
                  key={cat.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={activeCategory === cat.slug}
                    onChange={() => {
                      updateFilters('category', cat.slug);
                      setIsSidebarOpen(false);
                    }}
                    className="sr-only"
                  />
                  <span className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                    activeCategory === cat.slug
                      ? 'border-accent bg-accent'
                      : 'border-border-dark group-hover:border-text-muted'
                  }`}>
                    {activeCategory === cat.slug && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5">
                        <path d="M2 5l2 2 4-4" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-sm transition-colors ${
                    activeCategory === cat.slug
                      ? 'text-text-primary font-medium'
                      : 'text-text-muted group-hover:text-text-primary'
                  }`}>
                    {cat.name_mn}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-text-muted mb-5">
              Үнийн хүрээ
            </h3>
            <input
              type="range"
              min={0}
              max={200000}
              step={5000}
              value={priceRange[1]}
              onChange={e => setPriceRange([0, parseInt(e.target.value)])}
              className="w-full accent-accent"
            />
            <div className="flex justify-between mt-2 text-xs text-text-muted">
              <span>0₮</span>
              <span>{formatPrice(priceRange[1])}</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Sort */}
          <div className="flex justify-end mb-8">
            <select
              value={activeSort}
              onChange={e => updateFilters('sort', e.target.value)}
              className="bg-transparent border border-border px-4 py-2.5 text-sm text-text-primary appearance-none cursor-pointer pr-10 bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%20fill%3d%22none%22%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%3e%3cpath%20d%3d%22M3%204.5L6%207.5L9%204.5%22%20stroke%3d%22%236B6560%22%20stroke-width%3d%221.5%22%2f%3e%3c%2fsvg%3e')] bg-no-repeat bg-[center_right_12px]"
              id="sort-select"
            >
              <option value="newest">Шинэ</option>
              <option value="price_asc">Үнэ өсөхөөр</option>
              <option value="price_desc">Үнэ буурахаар</option>
            </select>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-4-5 bg-cream-dark mb-4" />
                  <div className="h-3 bg-cream-dark w-16 mb-2" />
                  <div className="h-4 bg-cream-dark w-full mb-2" />
                  <div className="h-4 bg-cream-dark w-20" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
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
