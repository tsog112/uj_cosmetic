import Image from 'next/image';
import Link from 'next/link';
import { CATEGORIES } from '@/types';

const displayCategories = CATEGORIES.filter(c =>
  ['serum', 'toner', 'oil', 'cream', 'sunscreen'].includes(c.id)
);

export default function CategorySection() {
  return (
    <section className="py-20 md:py-28 border-thin-t" id="categories">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label">Ангилалаар үзэх</p>
          <h2 className="section-heading">Бүтээгдэхүүний ангилал</h2>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {displayCategories.map(category => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group relative aspect-[3/4] overflow-hidden bg-cream-dark border border-transparent hover:border-accent transition-colors duration-300 block"
              id={`category-${category.slug}`}
            >
              <Image
                src={category.image}
                alt={category.name_mn}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              />
              {/* Existing gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Slight pink hover overlay */}
              <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/30 transition-colors duration-500" />

              <div className="absolute bottom-0 left-0 right-0 p-5 relative z-10">
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
