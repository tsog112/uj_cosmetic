import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative w-full h-[85vh] min-h-[600px] max-h-[900px] overflow-hidden" id="hero">
      {/* Background Image */}
      <Image
        src="/images/brand/hero.png"
        alt="UJ Cosmetic"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white tracking-[0.08em] mb-6">
          UJ
        </h1>
        <p className="text-white/90 text-lg md:text-xl font-light tracking-[0.05em] mb-10 max-w-[400px]">
          Арьсны тусламж. Хүний хүч.
        </p>
        <Link
          href="/shop"
          className="btn-gold px-10 py-4 text-sm"
          id="hero-cta"
        >
          Бүтээгдэхүүн үзэх
        </Link>
      </div>
    </section>
  );
}
