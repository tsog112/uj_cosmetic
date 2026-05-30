'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const update = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Зурвас илгээхэд алдаа гарлаа.');
      setFormSubmitted(true);
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setFormSubmitted(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Зурвас илгээхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16 md:pb-8">
      {/* Hero */}
      <section className="relative h-[42vh] min-h-[320px] max-h-[500px] overflow-hidden">
        <Image
          src="/images/brand/about_hero.jpg"
          alt="UJ Cosmetic бидний тухай"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-black/60" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <p className="text-white/80 text-[10px] font-bold tracking-[0.24em] uppercase mb-3" style={{ fontFamily: '"Montserrat", sans-serif' }}>
            Бидний түүх
          </p>
          <h1 className="font-serif text-3xl md:text-5xl text-white font-light tracking-wide" style={{ fontFamily: '"Playfair Display", serif' }}>
            UJ Cosmetic
          </h1>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-16 md:py-24 px-4 max-w-3xl mx-auto text-center">
        <p className="text-label mb-2" style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}>About us</p>
        <h2 className="text-2xl md:text-3xl font-extrabold mb-8" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: 'var(--color-text-dark)' }}>
          Арьсны тусламж. Хүний хүч.
        </h2>
        <div className="space-y-6 text-[13.5px] leading-7 text-[var(--color-text-medium)] font-medium">
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
      </section>

      {/* Story Image Section */}
      <section className="border-t border-[#fbe5f0] bg-white">
        <div className="max-w-[1100px] mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] shadow-[0_12px_36px_rgba(233,30,140,0.06)] bg-[var(--color-soft-pink)]">
              <Image
                src="/images/brand/about.jpg"
                alt="UJ Cosmetic laboratory"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="lg:pl-6">
              <p className="text-label" style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}>Our philosophy</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[var(--color-text-dark)]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Цэвэр, энгийн, үр дүнтэй</h2>
              <div className="mt-5 space-y-5 text-[13.5px] leading-7 text-[var(--color-text-medium)] font-medium max-w-[480px]">
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
      <section className="py-16 md:py-24 border-t border-[#fbe5f0] px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-label" style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}>Our values</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--color-text-dark)]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Юугаараа онцлог вэ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-[24px] shadow-[0_4px_24px_rgba(233,30,140,0.04)] border border-[#fdf2f7] transition-transform duration-300 hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-5 rounded-full bg-[var(--color-soft-pink)] text-[var(--color-brand-accent)]">
                  {value.icon}
                </div>
                <h3 className="font-serif text-lg mb-3 text-[var(--color-brand-text)]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {value.title}
                </h3>
                <p className="text-[12.5px] leading-relaxed text-[var(--color-text-medium)] font-medium max-w-[280px] mx-auto">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 md:py-24 border-t border-[#fbe5f0] px-4" id="contact">
        <div className="max-w-[500px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-label" style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}>Contact</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--color-text-dark)]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Бидэнтэй холбогдох</h2>
          </div>

          {formSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(233,30,140,0.08)] border border-[#e2f9ee] bg-[var(--status-success-bg)]/30"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[#c4f3da]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-[18px] font-extrabold text-[var(--color-brand-text)]">Амжилттай илгээгдлээ!</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--color-brand-muted)] font-medium">Баярлалаа! Таны зурвасыг UJ Cosmetic-ийн албан ёсны имэйл рүү илгээлээ. Бид удахгүй эргэн холбогдох болно.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-[#f8dbe8] bg-white p-5 shadow-[0_12px_40px_rgba(233,30,140,0.06)] sm:p-7">
              {error && (
                <div className="rounded-xl bg-[var(--status-error-bg)] p-3 text-[12px] font-bold text-[var(--status-error)] border border-[#fbe4e8]">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)] mb-1.5">
                  Нэр
                </label>
                <input
                  type="text"
                  id="name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-[#f8dbe8] bg-[var(--color-brand-bg)] px-4 py-3 text-sm text-[var(--color-brand-text)] font-semibold placeholder:text-gray-400 transition-all focus:border-[var(--color-brand-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f3b8cf]/50"
                  placeholder="Таны нэр"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)] mb-1.5">
                  Имэйл
                </label>
                <input
                  type="email"
                  id="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-[#f8dbe8] bg-[var(--color-brand-bg)] px-4 py-3 text-sm text-[var(--color-brand-text)] font-semibold placeholder:text-gray-400 transition-all focus:border-[var(--color-brand-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f3b8cf]/50"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)] mb-1.5">
                  Мессеж
                </label>
                <textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  required
                  disabled={loading}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[#f8dbe8] bg-[var(--color-brand-bg)] px-4 py-3 text-sm text-[var(--color-brand-text)] font-semibold placeholder:text-gray-400 transition-all focus:border-[var(--color-brand-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f3b8cf]/50"
                  placeholder="Таны мессеж..."
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--color-primary)] px-6 text-sm font-extrabold text-white shadow-md transition-all hover:bg-[var(--color-brand-accent)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-65"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Илгээж байна...
                  </span>
                ) : (
                  'Илгээх'
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
