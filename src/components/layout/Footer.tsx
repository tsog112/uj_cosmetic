'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings } from '@/types';
import { motion } from 'framer-motion';

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
    <footer className="bg-[#FFF0F6] text-[#1A1A1A] mt-auto border-t border-[#F2A8C8]/40">
      <div className="max-content py-16 md:py-28 lg:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 lg:gap-24">
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex flex-col">
              <span className="font-serif text-4xl md:text-5xl font-light tracking-[0.2em] text-[#1A1A1A] uppercase">
                UJ
              </span>
              <span className="editorial-label text-[10px] tracking-[0.4em] -mt-1 text-[#8B6B78]">
                Cosmetic
              </span>
            </Link>
            <p className="mt-6 md:mt-12 font-serif italic text-base md:text-lg text-[#8B6B78] max-w-[300px] leading-relaxed">
              Орчин үеийн минималист хэв маягт нийцсэн өдөр тутмын арчилгаа.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="editorial-label text-[#8B6B78] mb-4 md:mb-8 border-b border-[#F2A8C8]/50 pb-4">
              Бүтээгдэхүүн
            </h4>
            <nav className="grid grid-cols-2 gap-3 md:block md:space-y-6">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="min-h-11 md:min-h-0 flex md:block items-center font-sans text-sm text-[#1A1A1A]/75 hover:text-[#1A1A1A] transition-colors tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="md:col-span-4">
            <h4 className="editorial-label text-[#8B6B78] mb-4 md:mb-8 border-b border-[#F2A8C8]/50 pb-4">
              Холбоо барих
            </h4>
            <div className="space-y-4 md:space-y-6 font-sans text-sm text-[#1A1A1A]/75 tracking-wide">
              <p>
                <a href={`tel:${settings.phone.replace(/[\s-]/g, '')}`} className="hover:text-[#1A1A1A] transition-colors">
                  {settings.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${settings.email}`} className="hover:text-[#1A1A1A] transition-colors">
                  {settings.email}
                </a>
              </p>
              <p>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1A1A1A] transition-colors"
                >
                  @{instagramHandle}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 md:mt-24 pt-8 border-t border-[#F2A8C8]/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <p className="editorial-label text-[9px] text-[#8B6B78] leading-5">
            © {new Date().getFullYear()} UJ Cosmetic. Бүх эрх хуулиар хамгаалагдсан.
          </p>
           <div className="flex flex-wrap gap-4 md:gap-6">
             <Link href="/privacy" className="editorial-label text-[9px] text-[#8B6B78] hover:text-[#1A1A1A] transition-colors">Нууцлалын бодлого</Link>
             <Link href="/terms" className="editorial-label text-[9px] text-[#8B6B78] hover:text-[#1A1A1A] transition-colors">Үйлчилгээний нөхцөл</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
