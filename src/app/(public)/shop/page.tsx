'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/ui/ProductCard';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { db } from '@/lib/firebase';
import { getAllProducts, getCategories } from '@/lib/services/firestoreService';
import { formatPrice, type Product } from '@/types';

const categoryMeta: Record<string, { label: string; emoji: string }> = {
  all:       { label: 'Бүгд',       emoji: '✦' },
  serum:     { label: 'Серум',      emoji: '💧' },
  toner:     { label: 'Тонер',      emoji: '🌊' },
  oil:       { label: 'Тос',        emoji: '✨' },
  cream:     { label: 'Крем',       emoji: '🌸' },
  sunscreen: { label: 'Нарны тос',  emoji: '☀️' },
  cleanser:  { label: 'Цэвэрлэгч', emoji: '🫧' },
  mask:      { label: 'Маск',       emoji: '🌿' },
  other:     { label: 'Бусад',      emoji: '💫' },
};

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className="rounded-[28px] px-6 py-16 text-center"
      style={{ background: '#FFFFFF', boxShadow: '0 4px 24px rgba(233,30,140,0.06)' }}
    >
      {/* SVG illustration */}
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'var(--color-soft-pink)' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
          <path d="M8 11h6M11 8v6" opacity="0.5"/>
        </svg>
      </div>
      <p className="text-[18px] font-bold" style={{ color: 'var(--color-text-dark)', fontFamily: '"Playfair Display", serif' }}>
        Бүтээгдэхүүн олдсонгүй
      </p>
      <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--color-text-medium)' }}>
        Хайлт, ангилал эсвэл үнийн шүүлтүүрээ өөрчлөөд дахин үзээрэй.
      </p>
      <button
        onClick={onReset}
        className="mt-6 h-11 rounded-full px-7 text-[13px] font-bold text-white transition-all hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #E91E8C 0%, #C2185B 100%)',
          boxShadow: '0 8px 24px rgba(233,30,140,0.28)',
          fontFamily: '"Montserrat", sans-serif',
          letterSpacing: '0.04em',
        }}
      >
        Шүүлтүүр цэвэрлэх
      </button>
    </motion.div>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeCategory = searchParams.get('category') || 'all';
  const activeSort = searchParams.get('sort') || 'newest';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [search, setSearch] = useState('');

  const displayCategories = [
    { id: 'all', name_mn: 'Бүгд', slug: 'all' },
    ...categories,
  ];

  const sortOptions = [
    { value: 'newest',     label: 'Шинэ эхэндээ' },
    { value: 'price_asc',  label: 'Үнэ ↑ өсөх' },
    { value: 'price_desc', label: 'Үнэ ↓ буурах' },
  ];

  useEffect(() => {
    setLoading(true);
    setError(false);
    getAllProducts({ published: true })
      .then((data) => setProducts(data || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const maxProductPrice = useMemo(
    () => products.reduce((max, p) => Math.max(max, p.salePrice ?? p.price ?? 0), 0),
    [products]
  );

  useEffect(() => {
    if (maxProductPrice > 0) setPriceRange([0, maxProductPrice]);
  }, [maxProductPrice]);

  const filteredProducts = useMemo(() => {
    const upperPrice = priceRange[1] || maxProductPrice;
    const q = search.trim().toLowerCase();
    const result = products
      .filter((p) => activeCategory === 'all' || p.category === activeCategory)
      .filter((p) => {
        if (!q) return true;
        return [p.name_mn, p.name_en, p.slug, p.description_mn]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      })
      .filter((p) => {
        const price = p.salePrice ?? p.price ?? 0;
        return upperPrice <= 0 || (price >= priceRange[0] && price <= upperPrice);
      });

    if (activeSort === 'price_asc') result.sort((a, b) => (a.salePrice ?? a.price ?? 0) - (b.salePrice ?? b.price ?? 0));
    if (activeSort === 'price_desc') result.sort((a, b) => (b.salePrice ?? b.price ?? 0) - (a.salePrice ?? a.price ?? 0));

    return result;
  }, [activeCategory, activeSort, maxProductPrice, priceRange, products, search]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === 'newest') params.delete(key);
    else params.set(key, value);
    router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  if (error) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-[14px] font-medium" style={{ color: 'var(--color-brand-danger)' }}>
          Бүтээгдэхүүн ачаалахад алдаа гарлаа.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 h-11 rounded-full px-7 text-[13px] font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #E91E8C 0%, #C2185B 100%)' }}
        >
          Дахин оролдох
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl pb-[96px] md:pb-16">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="px-4 pb-4 md:px-8">
        <p
          className="text-label"
          style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}
        >
          Shop
        </p>
        <h1
          className="mt-1 leading-tight"
          style={{
            fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
            fontSize: 34,
            fontWeight: 500,
            color: 'var(--color-text-dark)',
            letterSpacing: '-0.01em',
          }}
        >
          Бүтээгдэхүүн
        </h1>
        <p className="mt-1 text-[12.5px]" style={{ color: 'var(--color-text-medium)' }}>
          {loading ? 'Ачаалж байна…' : `${filteredProducts.length} бүтээгдэхүүн`}
        </p>

        {/* Search bar & Filter toggle */}
        <div className="mt-4 flex items-center gap-2.5">
          <div
            className="flex h-[50px] flex-1 items-center gap-2.5 rounded-[16px] px-4 transition-all"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid rgba(233,30,140,0.12)',
              boxShadow: '0 2px 12px rgba(233,30,140,0.05)',
            }}
            onFocusCapture={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-primary)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(233,30,140,0.10)';
            }}
            onBlurCapture={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(233,30,140,0.12)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(233,30,140,0.05)';
            }}
          >
            <Search size={17} style={{ color: 'var(--color-primary)', flexShrink: 0 }} strokeWidth={2} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Нэр, брэнд, хэрэгцээгээр хайх…"
              className="min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none"
              style={{ color: 'var(--color-text-dark)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Хайлт цэвэрлэх">
                <X size={15} style={{ color: 'var(--color-text-medium)' }} />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="flex h-[50px] shrink-0 items-center justify-center gap-2 rounded-[16px] px-4 transition-all"
            style={{
              background: isFilterOpen ? 'var(--color-primary)' : '#FFFFFF',
              border: isFilterOpen ? '1.5px solid var(--color-primary)' : '1.5px solid rgba(233,30,140,0.12)',
              color: isFilterOpen ? '#FFFFFF' : 'var(--color-text-dark)',
              boxShadow: isFilterOpen ? '0 4px 16px rgba(233,30,140,0.25)' : '0 2px 12px rgba(233,30,140,0.05)',
            }}
          >
            <SlidersHorizontal size={18} strokeWidth={2.5} />
            <span className="hidden text-[13px] font-bold md:block" style={{ fontFamily: '"Montserrat", sans-serif' }}>
              Шүүлтүүр
            </span>
          </button>
        </div>
      </div>

      {/* ── Filter panel ─────────────────────────────────────── */}
      <div className="px-4 md:px-8">
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-[20px] p-5" style={{ background: '#FFFFFF', boxShadow: '0 4px 24px rgba(233,30,140,0.08)' }}>
                
                {/* Categories */}
                <div className="mb-5">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-medium)', fontFamily: '"Montserrat", sans-serif' }}>
                    Ангилал
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {displayCategories.map((cat) => {
                      const isActive = activeCategory === cat.slug;
                      const meta = categoryMeta[cat.slug];
                      return (
                        <button
                          key={cat.id}
                          onClick={() => updateFilters('category', cat.slug)}
                          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-all duration-200"
                          style={{
                            background: isActive ? 'linear-gradient(135deg, #E91E8C 0%, #C2185B 100%)' : 'var(--color-soft-pink)',
                            color: isActive ? '#ffffff' : 'var(--color-text-dark)',
                            boxShadow: isActive ? '0 4px 16px rgba(233,30,140,0.30)' : 'none',
                          }}
                        >
                          {meta?.emoji && <span style={{ fontSize: 14 }}>{meta.emoji}</span>}
                          {meta?.label ?? cat.name_mn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort */}
                <div className="mb-5">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-medium)', fontFamily: '"Montserrat", sans-serif' }}>
                    Эрэмбэлэх
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateFilters('sort', opt.value)}
                        className="rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-all"
                        style={{
                          background: activeSort === opt.value
                            ? 'linear-gradient(135deg, #E91E8C 0%, #C2185B 100%)'
                            : 'var(--color-soft-pink)',
                          color: activeSort === opt.value ? 'white' : 'var(--color-text-dark)',
                          boxShadow: activeSort === opt.value ? '0 4px 12px rgba(233,30,140,0.25)' : 'none',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-medium)', fontFamily: '"Montserrat", sans-serif' }}>
                      Дээд үнэ
                    </p>
                    <span className="text-[13px] font-bold tabular-nums" style={{ color: 'var(--color-primary)' }}>
                      {formatPrice(priceRange[1] || maxProductPrice)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(maxProductPrice, 1)}
                    step={5000}
                    value={priceRange[1] || maxProductPrice || 1}
                    onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                    className="w-full"
                    style={{ accentColor: 'var(--color-primary)' }}
                    disabled={maxProductPrice <= 0}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Product grid ──────────────────────────────────────────────── */}
      <div className="px-4 pt-5 md:px-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-shimmer rounded-[24px]" style={{ height: 300 }} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product, i) => (
              <ScrollReveal key={product.id} delay={Math.min(i * 40, 200)}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <EmptyState
            onReset={() => {
              setSearch('');
              setPriceRange([0, maxProductPrice]);
              updateFilters('category', 'all');
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 pt-4">
          <div className="animate-shimmer h-20 rounded-[18px]" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-shimmer rounded-[24px]" style={{ height: 280 }} />
            ))}
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
