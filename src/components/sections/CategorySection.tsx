'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';

type CategoryItem = {
  id:        string;
  name_mn:   string;
  slug:      string;
  imageUrl?: string;
  order:     number;
  tag?:      string;   // e.g. 'korean care', 'wellness'
};

const fallbackCategories: CategoryItem[] = [
  { id: 'skincare',  name_mn: 'Арьс арчилгаа',    slug: 'serum',     imageUrl: '/images/categories/serum.png',     order: 1, tag: 'korean care' },
  { id: 'sun',       name_mn: 'Нарны хамгаалалт', slug: 'sunscreen', imageUrl: '/images/categories/sunscreen.png', order: 2, tag: 'korean care' },
  { id: 'wellness',  name_mn: 'Wellness нэмэлт',  slug: 'other',     imageUrl: '/images/brand/about_hero.jpg',     order: 3, tag: 'wellness'    },
];

function cleanCategoryName(value: string) {
  if (!value || value.includes('?')) return 'Сонголт';
  return value;
}

export default function CategorySection() {
  const [categories, setCategories] = useState<CategoryItem[]>(fallbackCategories);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    async function loadCategories() {
      const snap   = await getDocs(query(collection(db, 'categories'), orderBy('order', 'asc')));
      const loaded = snap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id:       data.id || docSnap.id,
          name_mn:  cleanCategoryName(data.name_mn || ''),
          slug:     data.slug || docSnap.id,
          imageUrl: data.imageUrl || '',
          order:    Number(data.order ?? 0),
          tag:      data.tag || 'korean care',
        };
      });
      if (loaded.length > 0) setCategories(loaded);
      setLoading(false);
    }
    loadCategories().catch(() => setLoading(false));
  }, []);

  const displayed = (loading ? fallbackCategories : categories).slice(0, 6);

  return (
    <section className="bg-sand py-16 md:py-24" id="categories">
      <div className="max-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut' as const }}
          className="mb-9 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <span className="editorial-label mb-4 block text-dusty-rose">Ангиллаар харах</span>
            <h2 className="max-w-2xl font-serif text-4xl leading-tight text-charcoal md:text-6xl">
              Өөртөө хэрэгтэйгээ амархан олоорой
            </h2>
          </div>
          <Link
            href="/shop"
            className="btn-ghost border border-border-light text-charcoal"
          >
            Бүгдийг үзэх
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {displayed.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.06, ease: 'easeOut' as const }}
            >
              <Link
                href={`/shop?category=${encodeURIComponent(category.slug)}`}
                className="group relative block aspect-[5/4] overflow-hidden rounded-[14px] bg-sand shadow-brand-md"
              >
                {category.imageUrl && (
                  <img
                    src={category.imageUrl}
                    alt={category.name_mn}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/72 via-charcoal/18 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/68">
                    {category.tag || 'korean care'}
                  </p>
                  <h3 className="mt-2 font-serif text-3xl leading-tight">{category.name_mn}</h3>
                  <span className="mt-4 inline-flex border-b border-white/45 pb-1 text-xs font-semibold uppercase tracking-[0.12em]">
                    Сонгох
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
