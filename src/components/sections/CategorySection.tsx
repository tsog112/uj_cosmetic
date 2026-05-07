'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type CategoryItem = {
  id: string;
  name_mn: string;
  slug: string;
  imageUrl?: string;
  order: number;
};

const SKELETON_COUNT = 5;

export default function CategorySection() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      const snap = await getDocs(query(collection(db, 'categories'), orderBy('order', 'asc')));
      if (!mounted) return;

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

    loadCategories().catch(() => {
      if (!mounted) return;
      setCategories([]);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="py-20 md:py-28 border-thin-t" id="categories">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-14">
          <p className="section-label">Ангилал</p>
          <h2 className="section-heading">Бүтээгдэхүүний ангилал</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <div
                  key={`category-skeleton-${index}`}
                  className="aspect-[3/4] bg-gray-200 animate-pulse"
                />
              ))
            : categories.map(category => (
                <Link
                  key={category.id}
                  href={`/shop?category=${encodeURIComponent(category.slug)}`}
                  className="group relative aspect-[3/4] overflow-hidden bg-[#FFD6E8] border border-transparent hover:border-accent transition-colors duration-300 block"
                  id={`category-${category.slug}`}
                  style={
                    category.imageUrl
                      ? {
                          backgroundImage: `url(${category.imageUrl})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                        }
                      : undefined
                  }
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                  <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/25 transition-colors duration-500" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <p className="text-white text-sm font-medium tracking-wider uppercase drop-shadow-md">
                      {category.name_mn}
                    </p>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
