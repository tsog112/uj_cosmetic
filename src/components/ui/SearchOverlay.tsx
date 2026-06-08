'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Sparkles, TrendingUp } from 'lucide-react';
import { searchProducts as firestoreSearch } from '@/lib/services/firestoreService';
import { formatPrice, Product } from '@/types';

interface SearchOverlayProps {
  onClose: () => void;
}

const RECOMMENDATIONS = ['Серум', 'Тонер', 'Крем', 'Нарны тос', 'Маск'];

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const normalized = query.trim();
    if (!normalized) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      firestoreSearch(normalized)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 260);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 backdrop-blur-sm p-0 md:items-center md:p-4"
      onClick={onClose}
    >
      <div 
        className="relative flex h-[100dvh] md:h-auto md:max-h-[82vh] w-full max-w-[430px] md:max-w-[620px] flex-col bg-[var(--color-brand-bg)]/98 md:bg-white/95 px-4 md:p-6 pt-[calc(36px+env(safe-area-inset-top)+8px)] md:pt-6 pb-[calc(env(safe-area-inset-bottom)+16px)] md:pb-6 backdrop-blur-2xl md:rounded-[32px] md:shadow-[0_24px_64px_rgba(166,66,112,0.18)] md:border md:border-white/40"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-12 flex-1 items-center gap-2 rounded-full bg-white px-4 shadow-[var(--shadow-mobile-card)] border border-[#fbe5f0]">
              <Search size={18} className="shrink-0 text-[var(--color-brand-accent)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Бүтээгдэхүүн хайх..."
                className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-[var(--color-brand-text)] outline-none placeholder:text-[var(--color-brand-muted)]"
                id="search-input"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-[var(--color-brand-muted)]" aria-label="Цэвэрлэх">
                  <X size={16} />
                </button>
              )}
            </div>
            <button onClick={onClose} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-brand-text)] shadow-[var(--shadow-mobile-card)] border border-[#fbe5f0] hover:bg-[var(--color-brand-secondary)] active:scale-95 transition-all" aria-label="Хаах">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto hide-scrollbar">
          {!query.trim() && (
            <div className="space-y-4">
              <div className="rounded-[26px] bg-white p-5 shadow-[var(--shadow-mobile-card)] border border-[#fdf2f7]">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">
                  <TrendingUp size={14} />
                  Санал болгох хайлт
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {RECOMMENDATIONS.map((keyword) => (
                    <button key={keyword} onClick={() => setQuery(keyword)} className="min-h-10 rounded-full bg-[var(--color-brand-secondary)] px-4 py-2 text-[12px] font-extrabold leading-tight text-[var(--color-brand-text)] hover:bg-[#fbd3e5] active:scale-95 transition-all">
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[22px] bg-white p-4 text-[13px] leading-relaxed text-[var(--color-brand-muted)] shadow-[var(--shadow-mobile-card)] border border-[#fdf2f7]">
                <Sparkles size={18} className="mt-0.5 shrink-0 text-[var(--color-brand-accent)]" />
                Нэр, брэнд, ангиллаар хайж болно. Үр дүн дээр дарвал бүтээгдэхүүний дэлгэрэнгүй рүү орно.
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-[24px] bg-white p-3 shadow-[var(--shadow-mobile-card)] border border-[#fdf2f7]">
                  <div className="h-16 w-14 rounded-[16px] animate-shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded-full animate-shimmer" />
                    <div className="h-3 w-1/3 rounded-full animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div className="rounded-[28px] bg-white px-6 py-12 text-center shadow-[var(--shadow-mobile-card)] border border-[#fdf2f7]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[var(--color-brand-accent)]">
                <Search size={24} />
              </div>
              <p className="mt-4 text-[15px] font-extrabold text-[var(--color-brand-text)]">Илэрц олдсонгүй</p>
              <p className="mt-1 text-[12px] text-[var(--color-brand-muted)]">Өөр түлхүүр үгээр дахин хайгаарай.</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-muted)]">Илэрц ({results.length})</p>
              {results.map((product) => (
                <Link key={product.id} href={`/shop/${product.slug}`} onClick={onClose} className="flex min-h-[88px] items-center gap-3 rounded-[22px] bg-white p-3 shadow-[var(--shadow-mobile-card)] border border-[#fdf2f7] hover:shadow-brand-md transition-all active:scale-[0.99]">
                  <div className="relative h-18 w-16 shrink-0 overflow-hidden rounded-[18px] bg-[var(--color-brand-secondary)]">
                    <Image src={product.images?.[0] || '/placeholder-product.svg'} alt={product.name_mn} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-accent)]">UJ Cosmetic</p>
                    <p className="mt-1 truncate text-[14px] font-extrabold text-[var(--color-brand-text)]">{product.name_mn}</p>
                    <p className="mt-1 text-[13px] font-bold text-[var(--color-brand-text)]">{formatPrice(product.salePrice ?? product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
