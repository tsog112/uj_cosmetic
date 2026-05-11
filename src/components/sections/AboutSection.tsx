'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const pillars = [
  ['Сонголт', 'Солонгосоос авч үзэх үнэ цэнтэй бүтээгдэхүүнийг түүж оруулна.'],
  ['Тайлбар', 'Хэрэглэхэд ойлгомжтой, хэт сүртэй биш, хэрэгтэй мэдээлэл өгнө.'],
  ['Хүргэлт', 'Захиалгаа өгөөд төлөвөө харж, Монголдоо хүлээж авна.'],
];

export default function AboutSection() {
  return (
    <section className="overflow-hidden bg-[#FFF0F6] py-16 md:py-28 lg:py-32" id="about-section">
      <div className="max-content">
        <div className="grid grid-cols-1 items-center gap-9 lg:grid-cols-12 lg:gap-16 xl:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: 'easeOut' as const }}
            className="lg:col-span-5"
          >
            <span className="editorial-label mb-4 block text-[#D994B5]">UJ-ийн тухай</span>
            <h2 className="font-serif text-4xl leading-tight text-[#241820] md:text-6xl">
              Гоё харагдахаас гадна өөртөө зөөлөн хандах тухай
            </h2>
            <div className="mt-7 max-w-xl space-y-5 text-sm leading-8 text-[#7E6472] md:text-base">
              <p>
                UJ Cosmetic бол Солонгосын гоо сайхан, арьс арчилгаа, эрүүл мэндийн
                нэмэлт бүтээгдэхүүнийг Монгол хэрэглэгчдэд илүү ойр болгох жижигхэн дэлгүүр.
              </p>
              <p>
                Бид таны routine-г төвөгтэй болгохыг хүсдэггүй. Харин өөртөө анхаарах
                мөчийг арай илүү тухтай, итгэлтэй, гоё мэдрэмжтэй болгохыг хүсдэг.
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              {pillars.map(([label, text]) => (
                <div key={label} className="flex items-start gap-4 border-t border-[#E8BFD0] py-4">
                  <span className="w-24 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D8A15D]">{label}</span>
                  <span className="text-sm leading-6 text-[#5F4A55]">{text}</span>
                </div>
              ))}
            </div>

            <Link href="/about" className="mt-8 inline-flex min-h-12 w-full items-center justify-center bg-[#241820] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#D994B5] md:w-auto">
              Дэлгэрэнгүй унших
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.15, ease: 'easeOut' as const }}
            className="relative lg:col-span-7"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-[#FFF8FB] md:aspect-[6/5]">
              <Image
                src="/images/brand/about.png"
                alt="UJ Cosmetic-ийн сонгосон Солонгос бүтээгдэхүүн"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#5B2E43]/34 via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-5 left-5 right-5 bg-white/94 p-5 text-[#241820] shadow-[0_22px_60px_rgba(91,46,67,0.16)] backdrop-blur md:bottom-8 md:left-8 md:right-auto md:max-w-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D994B5]">UJ mood</p>
              <p className="mt-3 font-serif text-2xl leading-snug">
                Өөртөө анхаарах жижигхэн мөч бүр гоё байг.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
