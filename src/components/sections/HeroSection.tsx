'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative w-full h-[100vh] min-h-[700px] overflow-hidden bg-sand" id="hero">
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
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Soft elegant overlay */}
        <div className="absolute inset-0 bg-black/10" />
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 h-full max-content flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" as const }}
          className="max-w-[800px]"
        >
          <h2 className="editorial-label text-white/80 mb-6 block tracking-[0.4em]">
            Арьс арчилгааны хэв маяг
          </h2>
          <h1 className="editorial-heading text-6xl md:text-8xl lg:text-[10rem] text-white mb-12">
            Цэвэр тунгалаг
          </h1>
          <p className="font-serif text-lg md:text-2xl text-white/90 font-light tracking-wide mb-16 italic opacity-80">
            "Хамгийн энгийн нь хамгийн төгс."
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <Link
              href="/shop"
              className="btn-premium min-w-[200px]"
            >
              Дэлгүүр үзэх
            </Link>
            <Link
              href="/about"
              className="editorial-label text-white border-b border-white/30 pb-1 hover:border-white transition-colors"
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
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
      >
        <span className="editorial-label text-[9px] text-white/60 tracking-[0.3em]">Доошлуулах</span>
        <div className="w-[1px] h-12 bg-sand/20 relative overflow-hidden">
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
