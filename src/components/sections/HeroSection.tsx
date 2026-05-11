'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const highlights = [
  'Солонгосоос сонгосон',
  'Гоо сайхан',
  'Эрүүл мэндийн нэмэлт',
  'Монголд хүргэлттэй',
];

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#FFF8FB]" id="hero">
      <div className="relative min-h-[92svh]">
        <motion.div
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.8, ease: 'easeOut' as const }}
          className="absolute inset-0"
        >
          <Image
            src="/images/brand/hero.png"
            alt="Солонгосын гоо сайхан болон эрүүл мэндийн бүтээгдэхүүн"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(36,24,32,0.76)_0%,rgba(91,46,67,0.54)_45%,rgba(217,148,181,0.20)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#FFF8FB] via-[#FFF8FB]/72 to-transparent" />
        </motion.div>

        <div className="relative z-10 min-h-[92svh] max-content flex items-center pt-28 pb-24">
          <motion.div
            initial={{ y: 36, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.25, ease: 'easeOut' as const }}
            className="max-w-[760px] text-white"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/76">
              Korean beauty & wellness for Mongolia
            </p>
            <h1 className="mt-6 font-serif text-[3.1rem] leading-[1.02] md:text-7xl lg:text-[7.4rem]">
              Солонгосын арчилгааг илүү ойр
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/88 md:text-xl md:leading-9">
              Өөртөө өдөр бүр тавих жижигхэн анхааралд тань зориулж Солонгосын
              гоо сайхан, арьс арчилгаа, эрүүл мэндийн нэмэлт бүтээгдэхүүнийг
              нэг дороос сонгон хүргэнэ.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="btn-premium min-h-12 min-w-[220px] bg-white text-charcoal border-white">
                Дэлгүүр үзэх
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-12 min-w-[200px] items-center justify-center border border-white/45 px-8 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-charcoal"
              >
                Бидний сонголт
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-2">
              {highlights.map(item => (
                <span key={item} className="border border-white/24 bg-white/10 px-3 py-2 text-[11px] font-medium tracking-[0.08em] backdrop-blur">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-20 max-content -mt-14 pb-10">
        <div className="grid gap-3 bg-white/94 p-3 shadow-[0_24px_70px_rgba(91,46,67,0.14)] backdrop-blur md:grid-cols-3 md:p-5">
          {[
            ['01', 'Зөөлөн боловч итгэлтэй сонголт', 'Арьсанд хүрэх зүйлээ яаран биш, найрлага хэрэглээг нь харж сонгоход тань тусална.'],
            ['02', 'Гоо сайхан ба wellness хамтдаа', 'Арьс арчилгаа, body care, supplement гээд өдөр тутмын routine-д хэрэгтэй зүйлс.'],
            ['03', 'Танд ойлгомжтой, ойрхон', 'Бүтээгдэхүүн бүрийг энгийнээр тайлбарлаж, захиалгыг Монголд хүргэнэ.'],
          ].map(([num, title, text]) => (
            <div key={num} className="border border-[#F2C7D8] bg-[#FFF8FB] p-5">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#D8A15D]">{num}</p>
              <h3 className="mt-3 font-serif text-2xl text-[#241820]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#7E6472]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
