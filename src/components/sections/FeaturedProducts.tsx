'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import { getFeaturedProducts } from '@/lib/services/firestoreService';
import { motion } from 'framer-motion';
import type { Product } from '@/types';

const FEATURED_LIMIT = 4;

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  useEffect(() => {
    getFeaturedProducts()
      .then(data => setProducts(data.slice(0, FEATURED_LIMIT)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (error) return null;

  return (
    <section className="bg-sand py-14 md:py-20" id="featured-products">
      <div className="max-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut' as const }}
          className="mb-8 grid gap-5 md:mb-10 md:grid-cols-[minmax(0,1fr)_minmax(320px,430px)] md:items-end md:gap-10"
        >
          <div>
            <span className="editorial-label mb-4 block text-dusty-rose">Санал болгох бүтээгдэхүүн</span>
            <h2 className="max-w-[760px] font-serif text-4xl leading-[1.08] text-charcoal md:text-[3.35rem]">
              Өдөр тутамдаа хайртай болох жижиг арчилгаанууд
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-text-muted md:justify-self-end md:pb-1">
            Зарим өдөр арьсандаа чийг хэрэгтэй, зарим өдөр биеэ дотроос нь дэмжмээр санагддаг.
            Тийм өдөр бүрт ойр байх Солонгос бүтээгдэхүүнүүдийг эндээс сонгоорой.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {[...Array(FEATURED_LIMIT)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-blush" />
                <div className="mt-5 h-4 w-3/4 bg-blush" />
                <div className="mt-3 h-3 w-1/2 bg-blush" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              show:   { opacity: 1, transition: { staggerChildren: 0.12 } },
            }}
            className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-10"
          >
            {products.map(product => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
                }}
                className="h-full"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-10 flex justify-center md:mt-12">
          <Link href="/shop" className="btn-premium-outline min-h-11 w-full px-6 md:w-auto">
            Бүх бүтээгдэхүүн үзэх
          </Link>
        </div>
      </div>
    </section>
  );
}
