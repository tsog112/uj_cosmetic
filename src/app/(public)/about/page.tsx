'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { resolveAboutPage } from '@/lib/resolveSiteContent';
import type { AboutPageSettings, SiteSettings } from '@/types';

export default function AboutPage() {
  const [about, setAbout] = useState<AboutPageSettings>(() => resolveAboutPage());
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : {}) as Promise<SiteSettings>)
      .then((data) => {
        setAbout(resolveAboutPage(data?.aboutPage));
      })
      .catch(() => setAbout(resolveAboutPage()));
  }, []);

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Зурвас илгээхэд алдаа гарлаа.');
      setFormSubmitted(true);
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setFormSubmitted(false), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Зурвас илгээхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const heroImage = about.heroImage || '/images/brand/about_hero.jpg';
  const storyImage = about.storyImage || '/images/brand/about.jpg';

  return (
    <div className="pb-16 md:pb-8">
      <section className="relative h-[42vh] min-h-[320px] max-h-[500px] overflow-hidden">
        <Image
          src={heroImage}
          alt={about.heroTitle || 'Бидний тухай'}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-black/60" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          {about.heroEyebrow ? (
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/80" style={{ fontFamily: '"Montserrat", sans-serif' }}>
              {about.heroEyebrow}
            </p>
          ) : null}
          <h1 className="font-serif text-3xl font-light tracking-wide text-white md:text-5xl" style={{ fontFamily: '"Playfair Display", serif' }}>
            {about.heroTitle || 'UJ Cosmetic'}
          </h1>
        </div>
      </section>

      {(about.storyTitle || about.storyParagraphs?.length) ? (
        <section className="mx-auto max-w-3xl px-4 py-16 text-center md:py-24">
          {about.storyEyebrow ? (
            <p className="text-label mb-2" style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}>{about.storyEyebrow}</p>
          ) : null}
          {about.storyTitle ? (
            <h2 className="mb-8 text-2xl font-extrabold md:text-3xl" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: 'var(--color-text-dark)' }}>
              {about.storyTitle}
            </h2>
          ) : null}
          <div className="space-y-6 text-[13.5px] font-medium leading-7 text-[var(--color-text-medium)]">
            {(about.storyParagraphs || []).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {(about.philosophyTitle || about.storyImage) ? (
        <section className="border-t border-[#fbe5f0] bg-white">
          <div className="mx-auto max-w-[1100px] px-4 py-16 md:py-24">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[var(--color-soft-pink)] shadow-[0_12px_36px_rgba(233,30,140,0.06)]">
                <Image src={storyImage} alt={about.philosophyTitle || 'About image'} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
              <div className="lg:pl-6">
                {about.philosophyEyebrow ? (
                  <p className="text-label" style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}>{about.philosophyEyebrow}</p>
                ) : null}
                {about.philosophyTitle ? (
                  <h2 className="mt-1 text-2xl font-extrabold text-[var(--color-text-dark)]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{about.philosophyTitle}</h2>
                ) : null}
                <div className="mt-5 max-w-[480px] space-y-5 text-[13.5px] font-medium leading-7 text-[var(--color-text-medium)]">
                  {(about.philosophyParagraphs || []).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {about.values?.length ? (
        <section className="border-t border-[#fbe5f0] px-4 py-16 md:py-24">
          <div className="mx-auto max-w-[1100px]">
            <div className="mb-12 text-center">
              {about.valuesEyebrow ? (
                <p className="text-label" style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}>{about.valuesEyebrow}</p>
              ) : null}
              {about.valuesTitle ? (
                <h2 className="mt-1 text-2xl font-extrabold text-[var(--color-text-dark)]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{about.valuesTitle}</h2>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {about.values.map((value, index) => {
                const Icon = getCategoryIcon(value.icon);
                return (
                  <div key={index} className="rounded-[24px] border border-[#fdf2f7] bg-white p-6 text-center shadow-[0_4px_24px_rgba(233,30,140,0.04)] transition-transform duration-300 hover:-translate-y-1">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-soft-pink)] text-[var(--color-brand-accent)]">
                      <Icon size={24} strokeWidth={1.2} />
                    </div>
                    <h3 className="mb-3 font-serif text-lg text-[var(--color-brand-text)]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {value.title}
                    </h3>
                    <p className="mx-auto max-w-[280px] text-[12.5px] font-medium leading-relaxed text-[var(--color-text-medium)]">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {about.showContactForm !== false ? (
        <section className="border-t border-[#fbe5f0] px-4 py-16 md:py-24" id="contact">
          <div className="mx-auto max-w-[500px]">
            <div className="mb-10 text-center">
              {about.contactEyebrow ? (
                <p className="text-label" style={{ color: 'var(--color-primary)', fontFamily: '"Montserrat", sans-serif' }}>{about.contactEyebrow}</p>
              ) : null}
              <h2 className="mt-1 text-2xl font-extrabold text-[var(--color-text-dark)]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {about.contactTitle || 'Бидэнтэй холбогдох'}
              </h2>
            </div>

            {formSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[28px] border border-[#e2f9ee] bg-[var(--status-success-bg)]/30 p-6 py-10 text-center shadow-[0_16px_48px_rgba(233,30,140,0.08)]"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#c4f3da] bg-[var(--status-success-bg)] text-[var(--status-success)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-extrabold text-[var(--color-brand-text)]">Амжилттай илгээгдлээ!</h3>
                <p className="mt-2 text-[12.5px] font-medium leading-relaxed text-[var(--color-brand-muted)]">Баярлалаа! Таны зурвасыг илгээлээ. Бид удахгүй эргэн холбогдох болно.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-[#f8dbe8] bg-white p-5 shadow-[0_12px_40px_rgba(233,30,140,0.06)] sm:p-7">
                {error ? (
                  <div className="rounded-xl border border-[#fbe4e8] bg-[var(--status-error-bg)] p-3 text-[12px] font-bold text-[var(--status-error)]">
                    {error}
                  </div>
                ) : null}

                <div>
                  <label htmlFor="name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Нэр</label>
                  <input type="text" id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required disabled={loading} className="w-full rounded-xl border border-[#f8dbe8] bg-[var(--color-brand-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-text)] placeholder:text-gray-400 transition-all focus:border-[var(--color-brand-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f3b8cf]/50" placeholder="Таны нэр" />
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Имэйл</label>
                  <input type="email" id="email" value={form.email} onChange={(e) => update('email', e.target.value)} required disabled={loading} className="w-full rounded-xl border border-[#f8dbe8] bg-[var(--color-brand-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-text)] placeholder:text-gray-400 transition-all focus:border-[var(--color-brand-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f3b8cf]/50" placeholder="name@example.com" />
                </div>

                <div>
                  <label htmlFor="message" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-muted)]">Мессеж</label>
                  <textarea id="message" value={form.message} onChange={(e) => update('message', e.target.value)} required disabled={loading} rows={4} className="w-full resize-none rounded-xl border border-[#f8dbe8] bg-[var(--color-brand-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-text)] placeholder:text-gray-400 transition-all focus:border-[var(--color-brand-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f3b8cf]/50" placeholder="Таны мессеж..." />
                </div>

                <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--color-primary)] px-6 text-sm font-extrabold text-white shadow-md transition-all hover:bg-[var(--color-brand-accent)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-65">
                  {loading ? 'Илгээж байна...' : 'Илгээх'}
                </button>
              </form>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
