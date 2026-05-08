'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings } from '@/types';

const navLinks = [
  { href: '/', label: 'Нүүр' },
  { href: '/shop', label: 'Бүтээгдэхүүн' },
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
    <footer className="bg-[#1A1A1A] text-white mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-20 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-14 lg:gap-20">
          <div>
            <Link href="/" className="inline-block">
              <span className="font-serif text-4xl font-light tracking-[0.08em] text-white">
                UJ
              </span>
            </Link>
            <p className="mt-8 text-sm leading-8 text-white/60 max-w-[300px]">
              Монгол арьсанд зориулсан<br />
              Солонгос гоо сайхны арчилгаа
            </p>
          </div>

          <div>
            <h4 className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#FFB7D5] mb-6">
              Дэлгүүр
            </h4>
            <nav className="space-y-4">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-white/60 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#FFB7D5] mb-6">
              Холбоо барих
            </h4>
            <div className="space-y-4 text-sm text-white/60">
              <p>
                <a href={`tel:${settings.phone.replace(/[\s-]/g, '')}`} className="hover:text-white transition-colors">
                  {settings.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">
                  {settings.email}
                </a>
              </p>
              <p>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  @{instagramHandle}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-18 pt-8 border-t border-white/10">
          <p className="text-xs text-white/40 tracking-[0.08em]">
            © 2025 UJ Cosmetic. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </div>
    </footer>
  );
}
