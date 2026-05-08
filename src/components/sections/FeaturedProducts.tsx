'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import { getFeaturedProducts } from '@/lib/services/firestoreService';
import { useFadeIn } from '@/hooks/useFadeIn';
import type { Product } from '@/types';

export default function FeaturedProducts() {
  const ref = useFadeIn();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getFeaturedProducts()
      .then(data => setProducts(data.slice(0, 4)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <section ref={ref} className="section-padding fade-in-section px-6 lg:px-10 bg-[#FFF0F6]" id="featured-products">
        <div className="max-w-[1400px] mx-auto text-center">
          <p className="text-sm text-red-500">Мэдээлэл ачаалахад алдаа гарлаа. Дахин оролдоно уу.</p>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="section-padding fade-in-section px-6 lg:px-10 bg-[#FFF0F6]" id="featured-products">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <p className="label-eyebrow mb-4">Онцлох бүтээгдэхүүн</p>
          <h2 className="font-serif text-heading md:text-display-sm font-normal text-[#1A1A1A]">
            Шилдэг бүтээгдэхүүнүүд
          </h2>
          <div className="w-16 h-px bg-[#F2A8C8] mx-auto mt-8" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-[#FFD6E8] mb-4" />
                <div className="h-3 bg-[#FFD6E8] w-20 mb-3" />
                <div className="h-4 bg-[#FFD6E8] w-full mb-2" />
                <div className="h-4 bg-[#FFD6E8] w-24" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-sm text-[#8B6B78]">Онцлох бүтээгдэхүүн олдсонгүй</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="opacity-0 animate-fadeInUp"
                style={{ animationDelay: `${index * 0.12}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-14 md:mt-18 text-center">
          <Link
            href="/shop"
            className="inline-flex text-xs tracking-[0.2em] uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 hover:text-[#8B6B78] hover:border-[#8B6B78] transition-colors"
          >
            Бүх бүтээгдэхүүн үзэх →
          </Link>
        </div>
      </div>
    </section>
  );
}
