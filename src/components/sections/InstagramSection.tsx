import Image from 'next/image';

const instagramImages = [
  '/images/instagram/insta_1.png',
  '/images/products/serum.png',
  '/images/products/toner.png',
  '/images/brand/about.png',
  '/images/products/cream.png',
  '/images/products/oil.png',
];

export default function InstagramSection() {
  return (
    <section className="py-20 md:py-28 border-thin-t bg-white" id="instagram">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label">Биднийг дагаарай</p>
          <h2 className="section-heading">
            <a
              href="https://instagram.com/uj_cosmetic"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              @uj_cosmetic
            </a>
          </h2>
        </div>

        {/* Instagram Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {instagramImages.map((src, index) => (
            <a
              key={index}
              href="https://instagram.com/uj_cosmetic"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden bg-cream-dark group"
            >
              <Image
                src={src}
                alt={`UJ Cosmetic Instagram ${index + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 33vw, 16vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
