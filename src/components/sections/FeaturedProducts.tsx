'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import { getFeaturedProducts } from '@/lib/services/firestoreService';
import { motion } from 'framer-motion';
import type { Product } from '@/types';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getFeaturedProducts()
      .then(data => setProducts(data.slice(0, 4)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  if (error) return null;

  return (
    <section className="py-16 md:py-28 lg:py-36 bg-[#FFF8FB]" id="featured-products">
      <div className="max-content">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" as const }}
          className="text-left md:text-center mb-10 md:mb-20"
        >
          <span className="editorial-label block mb-3 md:mb-6">Онцлох бүтээгдэхүүн</span>
          <h2 className="text-[28px] md:font-serif md:text-5xl lg:text-6xl font-semibold md:font-light md:tracking-[0.08em] lg:tracking-[0.14em] md:uppercase text-charcoal leading-tight md:leading-[1.1]">
            Шилдэг бүтээгдэхүүнүүд
          </h2>
          <div className="w-14 h-[1px] bg-[#F2A8C8] mt-6 md:mx-auto md:mt-8" />
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-[#F9F8F6] mb-6" />
                <div className="h-4 bg-[#F9F8F6] w-3/4 mx-auto mb-3" />
                <div className="h-3 bg-[#F9F8F6] w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-12 md:gap-y-16"
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={item} className="h-full">
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 1, ease: "easeOut" as const }}
          className="mt-10 md:mt-20 text-center"
        >
          <Link
            href="/shop"
            className="btn-premium-outline min-w-full md:min-w-[220px] min-h-12"
          >
            Бүх бүтээгдэхүүн үзэх
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
