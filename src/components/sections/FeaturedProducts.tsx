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

  if (error) return null;

  return (
    <section className="bg-[#FFF8FB] py-16 md:py-28" id="featured-products">
      <div className="max-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut' as const }}
          className="mb-10 grid gap-8 md:mb-16 md:grid-cols-[1.1fr_0.9fr] md:items-end"
        >
          <div>
            <span className="editorial-label block mb-4 text-[#D994B5]">Санал болгох бүтээгдэхүүн</span>
            <h2 className="max-w-3xl font-serif text-4xl leading-tight text-[#241820] md:text-6xl">
              Өдөр тутамдаа хайртай болох жижиг арчилгаанууд
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#7E6472] md:justify-self-end">
            Зарим өдөр арьсандаа чийг хэрэгтэй, зарим өдөр биеэ дотроос нь дэмжмээр санагддаг.
            Тийм өдөр бүрт ойр байх Солонгос бүтээгдэхүүнүүдийг эндээс сонгоорой.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-white" />
                <div className="mt-5 h-4 w-3/4 bg-white" />
                <div className="mt-3 h-3 w-1/2 bg-white" />
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
              show: { opacity: 1, transition: { staggerChildren: 0.12 } },
            }}
            className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-4 md:gap-x-8 md:gap-y-14"
          >
            {products.map(product => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
                }}
                className="h-full"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-12 flex justify-center md:mt-18">
          <Link href="/shop" className="btn-premium-outline min-h-12 w-full md:w-auto md:min-w-[260px]">
            Бүх бүтээгдэхүүн үзэх
          </Link>
        </div>
      </div>
    </section>
  );
}
