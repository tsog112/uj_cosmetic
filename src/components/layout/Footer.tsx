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
  const displayPhone = settings.phone?.includes('ТАНЫ_') ? '+976 9900-0000' : settings.phone;
  const displayEmail = settings.email?.includes('ТАНЫ_') ? 'info@ujcosmetic.mn' : settings.email;

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-[#F2A8C8]/35 bg-[#FFF8FB] text-[#1A1A1A]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFB7D5] to-transparent" aria-hidden="true" />

      <div className="max-content relative py-12 md:py-18 lg:py-22">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12 lg:gap-16">
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex flex-col">
              <span className="font-serif text-4xl font-light uppercase tracking-[0.18em] text-[#1A1A1A] md:text-5xl">
                UJ
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.36em] text-[#8B6B78]">
                Cosmetic
              </span>
            </Link>

            <p className="mt-5 max-w-[340px] text-sm leading-8 text-[#8B6B78] md:mt-7">
              Монгол арьсанд тохирох Солонгос арчилгааг зөөлөн, минимал, өдөр тутам хэрэглэхэд амар байдлаар хүргэнэ.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex min-h-11 items-center justify-center border border-[#1A1A1A] px-5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-white"
            >
              Дэлгүүр үзэх
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-4">
            <div>
              <h4 className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8B6B78]">
                Цэс
              </h4>
              <nav className="space-y-3">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-[#1A1A1A]/75 transition-colors hover:text-[#1A1A1A]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <h4 className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8B6B78]">
                Тусламж
              </h4>
              <nav className="space-y-3">
                <Link href="/account" className="block text-sm text-[#1A1A1A]/75 transition-colors hover:text-[#1A1A1A]">
                  Бүртгэл
                </Link>
                <Link href="/checkout" className="block text-sm text-[#1A1A1A]/75 transition-colors hover:text-[#1A1A1A]">
                  Захиалга
                </Link>
                <Link href="/privacy" className="block text-sm text-[#1A1A1A]/75 transition-colors hover:text-[#1A1A1A]">
                  Нууцлал
                </Link>
              </nav>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8B6B78]">
              Холбоо барих
            </h4>
            <div className="space-y-3 text-sm text-[#1A1A1A]/75">
              <a href={`tel:${displayPhone.replace(/[\s-]/g, '')}`} className="block transition-colors hover:text-[#1A1A1A]">
                {displayPhone}
              </a>
              <a href={`mailto:${displayEmail}`} className="block break-all transition-colors hover:text-[#1A1A1A]">
                {displayEmail}
              </a>
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="block transition-colors hover:text-[#1A1A1A]">
                @{instagramHandle}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[#F2A8C8]/35 pb-20 pt-5 md:mt-14 md:flex md:items-center md:justify-between md:pb-0">
          <p className="text-[11px] font-medium leading-6 tracking-[0.08em] text-[#8B6B78]">
            © {new Date().getFullYear()} UJ Cosmetic. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <div className="mt-4 flex flex-wrap gap-5 md:mt-0">
            <Link href="/privacy" className="text-[12px] font-medium tracking-[0.08em] text-[#6F5962] transition-colors hover:text-[#1A1A1A]">
              Нууцлал
            </Link>
            <Link href="/terms" className="text-[12px] font-medium tracking-[0.08em] text-[#6F5962] transition-colors hover:text-[#1A1A1A]">
              Нөхцөл
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
