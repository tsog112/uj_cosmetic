'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[100svh] overflow-hidden bg-[#FFF0F6]" id="hero">
      {/* Background Image/Video Container */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.5, ease: "easeOut" as const }}
        className="absolute inset-0"
      >
        <Image
          src="/images/brand/hero.png"
          alt="UJ Cosmetic Editorial"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Soft elegant overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A]/20 via-[#8B6B78]/10 to-[#1A1A1A]/35 md:from-[#1A1A1A]/12 md:via-[#FFB7D5]/10 md:to-[#1A1A1A]/20" />
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 min-h-[100svh] max-content flex flex-col items-center justify-center text-center pt-24 pb-28">
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" as const }}
          className="max-w-[800px] w-full"
        >
          <h2 className="editorial-label text-white/80 mb-4 md:mb-6 block tracking-[0.24em] md:tracking-[0.4em] text-[10px]">
            Арьс арчилгааны хэв маяг
          </h2>
          <h1 className="editorial-heading text-[3.25rem] leading-[0.95] md:text-7xl lg:text-[8rem] xl:text-[9rem] text-white mb-8 md:mb-10">
            Цэвэр тунгалаг
          </h1>
          <p className="font-serif text-base md:text-xl lg:text-2xl text-white/90 font-light tracking-wide mb-10 md:mb-12 italic opacity-90">
            "Хамгийн энгийн нь хамгийн төгс."
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <Link
              href="/shop"
              className="btn-premium min-w-[220px] min-h-12"
            >
              Дэлгүүр үзэх
            </Link>
            <Link
              href="/about"
              className="min-h-11 inline-flex items-center justify-center editorial-label text-white border-b border-white/30 pb-1 hover:border-white transition-colors"
            >
              Бидний тухай
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-20 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 md:gap-4"
      >
        <span className="editorial-label text-[8px] md:text-[9px] text-white/60 tracking-[0.24em] md:tracking-[0.3em]">Доошлуулах</span>
        <div className="w-[1px] h-8 md:h-12 bg-sand/20 relative overflow-hidden">
          <motion.div 
            animate={{ y: [0, 48, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-full h-4 bg-sand/60"
          />
        </div>
      </motion.div>
    </section>
  );
}
