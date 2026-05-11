'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings } from '@/types';

const navLinks = [
  { href: '/', label: 'Нүүр' },
  { href: '/shop', label: 'Дэлгүүр' },
  { href: '/about', label: 'Бидний тухай' },
  { href: '/cart', label: 'Сагс' },
];

function cleanSetting(value: string, fallback: string) {
  if (!value || value.includes('?')) return fallback;
  return value;
}

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getSiteSettings()
      .then(siteSettings => {
        if (siteSettings) setSettings(siteSettings);
      })
      .catch(() => {});
  }, []);

  const instagramHandle = settings.instagramUrl.split('/').filter(Boolean).pop() || 'uj_cosmetic';
  const displayPhone = cleanSetting(settings.phone, '+976 9900-0000');
  const displayEmail = cleanSetting(settings.email, 'info@ujcosmetic.mn');

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-[#F2C7D8] bg-[#241820] text-white">
      <div className="max-content relative py-12 md:py-18 lg:py-22">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12 lg:gap-16">
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex flex-col">
              <span className="font-serif text-4xl font-light uppercase tracking-[0.18em] md:text-5xl">UJ</span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D994B5]">
                Beauty & Wellness
              </span>
            </Link>

            <p className="mt-6 max-w-[390px] text-sm leading-8 text-white/70">
              Солонгосын гоо сайхан, арьс арчилгаа болон эрүүл мэндийн нэмэлт
              бүтээгдэхүүнийг Монгол хэрэглэгчдэд илүү ойр хүргэнэ.
            </p>

            <Link href="/shop" className="mt-7 inline-flex min-h-11 items-center justify-center border border-white/28 px-5 text-sm font-semibold text-white transition-colors hover:border-[#D994B5] hover:bg-[#D994B5]">
              Дэлгүүр үзэх
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-4">
            <div>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D994B5]">Цэс</h4>
              <nav className="space-y-3">
                {navLinks.map(link => (
                  <Link key={link.href} href={link.href} className="block text-sm text-white/70 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D994B5]">Тусламж</h4>
              <nav className="space-y-3">
                <Link href="/account" className="block text-sm text-white/70 transition-colors hover:text-white">Миний захиалга</Link>
                <Link href="/checkout" className="block text-sm text-white/70 transition-colors hover:text-white">Захиалга</Link>
                <Link href="/about" className="block text-sm text-white/70 transition-colors hover:text-white">Брэндийн тухай</Link>
              </nav>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D994B5]">Холбоо барих</h4>
            <div className="space-y-3 text-sm text-white/70">
              <a href={`tel:${displayPhone.replace(/[\s-]/g, '')}`} className="block transition-colors hover:text-white">{displayPhone}</a>
              <a href={`mailto:${displayEmail}`} className="block break-all transition-colors hover:text-white">{displayEmail}</a>
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="block transition-colors hover:text-white">@{instagramHandle}</a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/12 pb-20 pt-5 md:mt-14 md:flex md:items-center md:justify-between md:pb-0">
          <p className="text-[11px] font-medium leading-6 tracking-[0.08em] text-white/48">
            © {new Date().getFullYear()} UJ Cosmetic. Korean beauty & wellness for Mongolia.
          </p>
          <p className="mt-4 text-[12px] text-white/48 md:mt-0">
            Өөртөө анхаарах мөч бүрийг илүү гоё болгоё.
          </p>
        </div>
      </div>
    </footer>
  );
}
