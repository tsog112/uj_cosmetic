'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';

type CategoryItem = {
  id: string;
  name_mn: string;
  slug: string;
  imageUrl?: string;
  order: number;
};

export default function CategorySection() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      const snap = await getDocs(query(collection(db, 'categories'), orderBy('order', 'asc')));
      setCategories(
        snap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: data.id || docSnap.id,
            name_mn: data.name_mn || '',
            slug: data.slug || docSnap.id,
            imageUrl: data.imageUrl || '',
            order: Number(data.order ?? 0),
          };
        })
      );
      setLoading(false);
    }
    loadCategories().catch(() => setLoading(false));
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  return (
    <section className="py-32 md:py-48 bg-sand" id="categories">
      <div className="max-content">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" as const }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8"
        >
          <div>
            <span className="editorial-label block mb-6">Ангилал</span>
            <h2 className="editorial-heading text-4xl md:text-5xl text-charcoal">Бүтээгдэхүүний ангилал</h2>
          </div>
          <Link href="/shop" className="editorial-label border-b border-charcoal/20 pb-1 hover:border-charcoal transition-colors">
            Бүгдийг үзэх
          </Link>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12"
        >
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[16/10] bg-sand-dark animate-pulse" />
            ))
          ) : (
            categories.map((category) => (
              <motion.div key={category.id} variants={item}>
                <Link
                  href={`/shop?category=${encodeURIComponent(category.slug)}`}
                  className="group relative block aspect-[16/10] overflow-hidden bg-[#F9F8F6]"
                >
                  {category.imageUrl && (
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 1.2, ease: "easeOut" as const }}
                      className="absolute inset-0"
                    >
                      <img 
                        src={category.imageUrl} 
                        alt={category.name_mn}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-700" />
                  
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <h3 className="font-serif text-3xl md:text-4xl font-light text-white tracking-[0.2em] text-center uppercase">
                      {category.name_mn}
                    </h3>
                  </div>
                  
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0">
                    <span className="editorial-label text-[10px] text-white border-b border-white pb-1">
                      Үзэх
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </section>
  );
}
