'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AboutSection() {
  return (
    <section className="py-32 md:py-48 bg-sand overflow-hidden" id="about-section">
      <div className="max-content">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-32 items-center">
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" as const }}
            className="lg:col-span-5 order-2 lg:order-1"
          >
            <span className="editorial-label block mb-6">Бидний тухай</span>
            <h2 className="editorial-heading text-5xl md:text-6xl text-charcoal mb-12">
              Зөөлөн арчилгаа, <br />
              Гэрэлтсэн арьс.
            </h2>

            <div className="space-y-8 font-sans text-sm text-neutral-600 leading-relaxed max-w-lg">
              <p>
                UJ Cosmetic нь Монгол орны уур амьсгал, орчин үеийн минималист хэв маягт нийцсэн Солонгосын шилдэг арьс арчилгааны бүтээгдэхүүнүүдийг сонгон хүргэж байна.
              </p>
              <p>
                Бид үр дүнтэй найрлага, өдөр тутмын тууштай арчилгааны хүчинд итгэдэг. Таны арьс, илүү гэрэлтэнэ.
              </p>
            </div>

            <div className="mt-16">
              <Link
                href="/about"
                className="btn-premium min-w-[200px]"
              >
                Бидний түүхийг унших
              </Link>
            </div>
          </motion.div>

          {/* Image Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.8, delay: 0.2, ease: "easeOut" as const }}
            className="lg:col-span-7 order-1 lg:order-2 relative aspect-[4/5] lg:aspect-[6/5] bg-[#F9F8F6] overflow-hidden"
          >
            <Image
              src="/images/brand/about.png"
              alt="UJ Cosmetic brand story"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
