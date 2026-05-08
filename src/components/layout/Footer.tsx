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
    <footer className="bg-charcoal text-white mt-auto">
      <div className="max-content py-32 md:py-48">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24">
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex flex-col">
              <span className="font-serif text-5xl font-light tracking-[0.2em] text-white uppercase">
                UJ
              </span>
              <span className="editorial-label text-[10px] tracking-[0.4em] -mt-1 opacity-60 text-white">
                Cosmetic
              </span>
            </Link>
            <p className="mt-12 font-serif italic text-lg text-white/60 max-w-[300px] leading-relaxed">
              Орчин үеийн минималист хэв маягт нийцсэн өдөр тутмын арчилгаа.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="editorial-label text-white/40 mb-8 border-b border-white/10 pb-4">
              Бүтээгдэхүүн
            </h4>
            <nav className="space-y-6">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block font-sans text-sm text-white/80 hover:text-white transition-colors tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="md:col-span-4">
            <h4 className="editorial-label text-white/40 mb-8 border-b border-white/10 pb-4">
              Холбоо барих
            </h4>
            <div className="space-y-6 font-sans text-sm text-white/80 tracking-wide">
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

        <div className="mt-32 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="editorial-label text-[9px] text-white/40">
            © {new Date().getFullYear()} UJ Cosmetic. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <div className="flex gap-6">
             <Link href="/privacy" className="editorial-label text-[9px] text-white/40 hover:text-white transition-colors">Нууцлалын бодлого</Link>
             <Link href="/terms" className="editorial-label text-[9px] text-white/40 hover:text-white transition-colors">Үйлчилгээний нөхцөл</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
