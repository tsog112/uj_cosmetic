'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import { getFeaturedProducts } from '@/lib/services/firestoreService';
import type { Product } from '@/types';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getFeaturedProducts()
      .then(data => setProducts(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <section className="py-20 md:py-28 px-6 lg:px-10" id="featured-products">
        <div className="max-w-[1400px] mx-auto text-center">
          <p className="text-sm text-red-500">Мэдээлэл ачаалахад алдаа гарлаа. Дахин оролдоно уу.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 px-6 lg:px-10" id="featured-products">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label">Онцлох бүтээгдэхүүн</p>
          <h2 className="section-heading">Шилдэг сонголтууд</h2>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-4-5 bg-cream-dark mb-4" />
                <div className="h-3 bg-cream-dark w-16 mb-2" />
                <div className="h-4 bg-cream-dark w-full mb-2" />
                <div className="h-4 bg-cream-dark w-20" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-sm text-text-muted">Онцлох бүтээгдэхүүн олдсонгүй</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
