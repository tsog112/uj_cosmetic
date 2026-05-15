'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const highlights = [
  'Солонгосоос сонгосон',
  'Гоо сайхан',
  'Wellness нэмэлт',
  'Монголд хүргэлттэй',
];

const features = [
  {
    num:   '01',
    title: 'Зөөлөн боловч итгэлтэй сонголт',
    text:  'Арьсанд хүрэх зүйлээ яаран биш, найрлага хэрэглээг нь харж сонгоход тань тусална.',
  },
  {
    num:   '02',
    title: 'Гоо сайхан ба wellness хамтдаа',
    text:  'Арьс арчилгаа, body care, supplement гээд өдөр тутмын routine-д хэрэгтэй зүйлс.',
  },
  {
    num:   '03',
    title: 'Танд ойлгомжтой, ойрхон',
    text:  'Бүтээгдэхүүн бүрийг энгийнээр тайлбарлаж, захиалгыг Монголд хүргэнэ.',
  },
];

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-charcoal" id="hero">
      {/* ── Full-bleed hero image ──────────────────────────────────────────── */}
      <div className="relative min-h-[75svh] md:min-h-[85svh]">
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <Image
            src="/images/brand/hero.jpg"
            alt="Солонгосын гоо сайхан болон эрүүл мэндийн бүтээгдэхүүн"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          {/* Stronger cinematic overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/85 via-charcoal/55 to-charcoal/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-charcoal/30" />
        </motion.div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="relative z-10 flex min-h-[75svh] md:min-h-[85svh] items-end md:items-center pt-[100px]">
          <div className="max-content w-full pb-16 pt-8 md:pb-28 md:pt-0">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-[680px]"
            >
              {/* Accent label */}
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-dusty-rose" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-dusty-rose">
                  Korean Beauty &amp; Wellness
                </p>
              </div>

              {/* Main heading — responsive sizes that never break layout */}
              <h1 className="mt-5 font-serif text-[2.4rem] leading-[1.12] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[5.2rem]">
                Солонгосын<br className="md:hidden" /> арчилгааг<br /> илүү ойр
              </h1>

              <p className="mt-6 max-w-lg text-[15px] leading-7 text-white/70 md:mt-7 md:text-base md:leading-8">
                Арьс арчилгаа, гоо сайхан, эрүүл мэндийн нэмэлт бүтээгдэхүүнийг
                нэг дороос сонгон Монголд хүргэнэ.
              </p>

              {/* CTAs */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center md:mt-10">
                <Link
                  href="/shop"
                  className="btn-premium min-h-[52px] border-white !bg-white px-10 !text-charcoal hover:!border-dusty-rose hover:!bg-dusty-rose hover:!text-white"
                >
                  Дэлгүүр үзэх
                </Link>
                <Link
                  href="/about"
                  className="btn-premium-outline !border-white/40 !text-white hover:!bg-white hover:!text-charcoal min-h-[52px] px-8"
                >
                  Бидний сонголт
                </Link>
              </div>

              {/* Tags */}
              <div className="mt-8 flex flex-wrap gap-2 md:mt-10">
                {highlights.map(item => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[10px] font-medium tracking-wider text-white/60 backdrop-blur-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Feature cards ──────────────────────────────────────────────────── */}
      <div className="relative z-20 bg-sand">
        <div className="max-content py-[32px] md:py-[48px]">
          <div className="grid grid-cols-1 gap-[24px] md:grid-cols-3 md:gap-[32px]">
            {features.map(({ num, title, text }) => (
              <div key={num} className="rounded-[12px] border border-border-faint bg-white p-6 shadow-brand-sm md:p-8">
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-blush text-[10px] font-bold tracking-[0.18em] text-dusty-rose">
                    {num}
                  </span>
                  <div>
                    <h3 className="font-serif text-xl leading-tight text-charcoal md:text-[1.65rem]">{title}</h3>
                    <p className="mt-3 max-w-sm text-sm leading-7 text-text-muted">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
