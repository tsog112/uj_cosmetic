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

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-[#F2A8C8]/40 bg-[#FFF8FB] text-[#1A1A1A]">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FFF0F6] to-transparent" aria-hidden="true" />

      <div className="max-content relative py-12 md:py-20 lg:py-24">
        <div className="rounded-[24px] border border-[#F2A8C8]/45 bg-white/70 p-5 shadow-[0_18px_45px_rgba(216,111,160,0.08)] backdrop-blur-sm md:p-8 lg:p-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10 lg:gap-16">
            <div className="md:col-span-5">
              <Link href="/" className="inline-flex flex-col">
                <span className="font-serif text-4xl font-light uppercase tracking-[0.18em] text-[#1A1A1A] md:text-5xl">
                  UJ
                </span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.36em] text-[#8B6B78]">
                  Cosmetic
                </span>
              </Link>

              <p className="mt-5 max-w-[320px] text-sm leading-7 text-[#8B6B78] md:mt-8">
                Монгол арьсанд тохирох Солонгос арчилгааг зөөлөн, минимал, өдөр тутам хэрэглэхэд амар байдлаар хүргэнэ.
              </p>

              <Link
                href="/shop"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#1A1A1A] px-5 text-sm font-medium text-white transition-colors hover:bg-[#FFB7D5] hover:text-[#1A1A1A]"
              >
                Дэлгүүр үзэх
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:col-span-7">
              <div>
                <h4 className="mb-3 border-b border-[#F2A8C8]/45 pb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#8B6B78]">
                  Цэс
                </h4>
                <nav className="grid grid-cols-2 gap-2 sm:block sm:space-y-2">
                  {navLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex min-h-10 items-center rounded-[10px] px-3 text-sm text-[#1A1A1A]/75 transition-colors hover:bg-[#FFF0F6] hover:text-[#1A1A1A] sm:px-0 sm:hover:bg-transparent"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div>
                <h4 className="mb-3 border-b border-[#F2A8C8]/45 pb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#8B6B78]">
                  Холбоо барих
                </h4>
                <div className="space-y-2 text-sm text-[#1A1A1A]/75">
                  <a
                    href={`tel:${settings.phone.replace(/[\s-]/g, '')}`}
                    className="flex min-h-10 items-center rounded-[10px] px-3 transition-colors hover:bg-[#FFF0F6] hover:text-[#1A1A1A] sm:px-0 sm:hover:bg-transparent"
                  >
                    {settings.phone}
                  </a>
                  <a
                    href={`mailto:${settings.email}`}
                    className="flex min-h-10 items-center rounded-[10px] px-3 transition-colors hover:bg-[#FFF0F6] hover:text-[#1A1A1A] sm:px-0 sm:hover:bg-transparent"
                  >
                    {settings.email}
                  </a>
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-10 items-center rounded-[10px] px-3 transition-colors hover:bg-[#FFF0F6] hover:text-[#1A1A1A] sm:px-0 sm:hover:bg-transparent"
                  >
                    @{instagramHandle}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#F2A8C8]/45 pt-5 md:mt-10 md:flex md:items-center md:justify-between">
            <p className="text-[10px] font-medium uppercase leading-5 tracking-[0.14em] text-[#8B6B78]">
              © {new Date().getFullYear()} UJ Cosmetic. Бүх эрх хуулиар хамгаалагдсан.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 md:mt-0">
              <Link href="/privacy" className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8B6B78] transition-colors hover:text-[#1A1A1A]">
                Нууцлал
              </Link>
              <Link href="/terms" className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8B6B78] transition-colors hover:text-[#1A1A1A]">
                Нөхцөл
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
