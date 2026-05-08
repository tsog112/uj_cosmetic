import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden" id="hero">
      <Image
        src="/images/brand/hero.png"
        alt="UJ Cosmetic"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-black/55" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-6xl md:text-8xl lg:text-[9rem] font-normal text-white tracking-[0.08em] mb-8 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          UJ
        </h1>
        <p className="text-white text-2xl md:text-4xl lg:text-[2.75rem] font-light tracking-[0.02em] leading-tight mb-12 max-w-[720px] opacity-0 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
          Арьсны тусламж. Хүний хүч.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center border border-white/80 px-10 py-4 text-white text-xs tracking-[0.22em] uppercase hover:bg-white hover:text-[#1A1A1A] transition-colors duration-300 opacity-0 animate-fadeInUp"
          style={{ animationDelay: '0.8s' }}
          id="hero-cta"
        >
          Бүтээгдэхүүн үзэх
        </Link>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-3 text-white/80">
        <span className="text-[10px] tracking-[0.22em] uppercase">Scroll</span>
        <span className="block h-10 w-px bg-white/60" />
      </div>
    </section>
  );
}
