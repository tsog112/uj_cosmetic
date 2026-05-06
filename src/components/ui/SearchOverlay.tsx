'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { searchProducts as firestoreSearch } from '@/lib/services/firestoreService';
import { formatPrice, Product } from '@/types';

interface SearchOverlayProps {
  onClose: () => void;
}

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
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length > 0) {
      setLoading(true);
      debounceRef.current = setTimeout(() => {
        firestoreSearch(query)
          .then(data => setResults(data))
          .catch(() => setResults([]))
          .finally(() => setLoading(false));
      }, 300);
    } else {
      setResults([]);
      setLoading(false);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-cream/98 backdrop-blur-sm animate-fade-in">
      <div className="max-w-[800px] mx-auto px-6 pt-[120px]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-text-primary hover:text-accent transition-colors"
          aria-label="Хаах"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 6L18 18M18 6L6 18" />
          </svg>
        </button>

        {/* Search Input */}
        <div className="border-b-2 border-text-primary pb-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Бүтээгдэхүүн хайх..."
            className="w-full bg-transparent text-2xl md:text-3xl font-serif text-text-primary placeholder:text-text-muted/50 outline-none"
            id="search-input"
          />
        </div>

        {/* Results */}
        <div className="mt-8 max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-5 py-4 animate-pulse">
                  <div className="w-16 h-16 bg-cream-dark flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-cream-dark w-48 mb-2" />
                    <div className="h-3 bg-cream-dark w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && query.trim().length > 0 && results.length === 0 && (
            <p className="text-text-muted text-sm">
              &ldquo;{query}&rdquo; хайлтаар илэрц олдсонгүй
            </p>
          )}

          {!loading && results.map((product, index) => (
            <Link
              key={product.id}
              href={`/shop/${product.slug}`}
              onClick={onClose}
              className="flex items-center gap-5 py-4 border-thin-b hover:bg-cream-dark/50 transition-colors px-2 -mx-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-16 h-16 relative flex-shrink-0 bg-cream-dark">
                {product.images?.[0] && (
                  <Image
                    src={product.images[0]}
                    alt={product.name_mn}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {product.name_mn}
                </p>
                <p className="text-sm text-text-muted mt-0.5">
                  {formatPrice(product.salePrice ?? product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
