'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useFadeIn } from '@/hooks/useFadeIn';

const brandStoryText = [
  'UJ Cosmetic нь Монгол эмэгтэйчүүдийн арьсны онцлог, уур амьсгал, өдөр тутмын хэрэглээнд нийцсэн Солонгос арчилгааг сонгон хүргэдэг.',
  'Бид үр дүнтэй найрлага, зөөлөн мэдрэмж, тогтвортой арчилгааг эрхэмлэж, арьсыг тайван, эрүүл, гэрэлтсэн байхад туслах бүтээгдэхүүнүүдийг санал болгодог.',
];

export default function AboutSection() {
  const ref = useFadeIn();

  return (
    <section ref={ref} className="section-padding fade-in-section border-thin-t bg-white" id="about-section">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-3 relative aspect-[4/5] lg:aspect-[5/4] overflow-hidden bg-[#FFD6E8]">
            <Image
              src="/images/brand/about.png"
              alt="UJ Cosmetic brand story"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>

          <div className="lg:col-span-2 lg:pl-8">
            <p className="label-eyebrow mb-5">Бидний тухай</p>
            <h2 className="font-serif text-heading md:text-display-sm font-normal text-[#1A1A1A] mb-8">
              Монгол эмэгтэйд<br />
              зориулсан арчилгаа
            </h2>

            <div className="space-y-5 text-sm md:text-[15px] text-[#8B6B78] leading-8 max-w-[460px]">
              {brandStoryText.map(text => (
                <p key={text}>{text}</p>
              ))}
            </div>

            <Link
              href="/about"
              className="inline-flex mt-10 text-xs tracking-[0.2em] uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 hover:text-[#8B6B78] hover:border-[#8B6B78] transition-colors"
            >
              Дэлгэрэнгүй →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
