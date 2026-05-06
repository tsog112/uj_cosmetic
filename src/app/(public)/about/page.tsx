'use client';

import { useState } from 'react';
import Image from 'next/image';

const values = [
  {
    title: 'Байгалийн найрлага',
    description: 'Бид зөвхөн байгалийн гаралтай, арьсанд ээлтэй найрлага ашиглан бүтээгдэхүүнээ бүтээдэг.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M12 22c-4-3-8-6-8-10a4 4 0 018 0 4 4 0 018 0c0 4-4 7-8 10z" />
      </svg>
    ),
  },
  {
    title: 'Солонгос технологи',
    description: 'Солонгосын дэвшилтэт арьс арчилгааны технологийг Монголд хүргэн ажилладаг.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15 15 0 010 20M12 2a15 15 0 000 20M2 12h20" />
      </svg>
    ),
  },
  {
    title: 'Монгол арьсанд зориулсан',
    description: 'Монгол орны хуурай, хүйтэн уур амьсгалд тохирсон тусгай найрлагатай бүтээгдэхүүн.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 3000);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden">
        <Image
          src="/images/brand/about_hero.png"
          alt="UJ Cosmetic бидний тухай"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <p className="text-white/70 text-xs tracking-[0.2em] uppercase mb-4">Бидний тухай</p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white">
            UJ Cosmetic
          </h1>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-20 md:py-28 px-6 lg:px-10">
        <div className="max-w-[800px] mx-auto text-center">
          <p className="section-label">Бидний түүх</p>
          <h2 className="section-heading mb-10">
            Арьсны тусламж.<br />Хүний хүч.
          </h2>
          <div className="space-y-6 text-sm text-text-muted leading-relaxed">
            <p>
              UJ Cosmetic нь 2022 онд Улаанбаатар хотод үүсгэн байгуулагдсан Солонгос гоо сайхны брэнд юм. Бид Солонгосын дэвшилтэт арьс арчилгааны технологийг Монгол эмэгтэйчүүдийн арьсны онцлогт тохируулан бүтээгдэхүүн бүтээж байна.
            </p>
            <p>
              Манай бүтээгдэхүүн бүр нь байгалийн гаралтай найрлагыг шинжлэх ухааны судалгаатай хослуулж, аюулгүй, үр дүнтэй, чанартай байхыг баталгаажуулдаг. Бүх бүтээгдэхүүн Солонгосоос шууд импортолсон.
            </p>
            <p>
              Бидний зорилго бол Монгол эмэгтэйчүүд бүрд гоо сайхны итгэл үнэмшил, эрүүл арьс бэлэглэх явдал юм.
            </p>
          </div>
        </div>
      </section>

      {/* Story Image Section */}
      <section className="border-thin-t">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative aspect-[4/3] overflow-hidden bg-cream-dark">
              <Image
                src="/images/brand/about.png"
                alt="UJ Cosmetic laboratory"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <p className="section-label">Манай философи</p>
              <h2 className="section-heading text-3xl mb-6">Цэвэр, энгийн, үр дүнтэй</h2>
              <div className="space-y-5 text-sm text-text-muted leading-relaxed max-w-[480px]">
                <p>
                  Бид арьс арчилгааны энгийн, ойлгомжтой, үр дүнтэй арга барилыг дэмждэг. Хэрэггүй нэмэлт найрлагагүй, зөвхөн таны арьсанд хэрэгтэй зүйлсийг агуулсан бүтээгдэхүүн.
                </p>
                <p>
                  Бүтээгдэхүүн тус бүрийг Солонгосын тэргүүлэх лабораторид хийсэн арьсны судалгаанд тулгуурлан боловсруулсан бөгөөд Монгол орны уур амьсгалын онцлогийг харгалзан тусгайлан тохируулсан.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 border-thin-t px-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <p className="section-label">Бидний үнэт зүйлс</p>
            <h2 className="section-heading">Юугаараа онцлог вэ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 text-accent">
                  {value.icon}
                </div>
                <h3 className="font-serif text-xl mb-4 text-text-primary">
                  {value.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed max-w-[320px] mx-auto">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 md:py-28 border-thin-t px-6 lg:px-10" id="contact">
        <div className="max-w-[600px] mx-auto">
          <div className="text-center mb-12">
            <p className="section-label">Холбоо барих</p>
            <h2 className="section-heading">Бидэнтэй холбогдох</h2>
          </div>

          {formSubmitted ? (
            <div className="text-center py-12 animate-fade-in">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4 text-accent">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <p className="text-lg font-serif text-text-primary mb-2">Баярлалаа!</p>
              <p className="text-sm text-text-muted">Таны мессежийг хүлээн авлаа. Бид удахгүй хариу өгөх болно.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-xs tracking-wider uppercase text-text-muted mb-2">
                  Нэр
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full bg-transparent border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent focus:outline-none transition-colors"
                  placeholder="Таны нэр"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs tracking-wider uppercase text-text-muted mb-2">
                  Имэйл
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full bg-transparent border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent focus:outline-none transition-colors"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs tracking-wider uppercase text-text-muted mb-2">
                  Мессеж
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="w-full bg-transparent border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent focus:outline-none transition-colors resize-none"
                  placeholder="Таны мессеж..."
                />
              </div>

              <button type="submit" className="btn-gold w-full py-4">
                Илгээх
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
