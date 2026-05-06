'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings } from '@/types';

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getSiteSettings().then(s => {
      if (s) setSettings(s);
    }).catch(() => {});
  }, []);

  return (
    <footer className="bg-[#1A1A1A] text-[#FFD6E8] mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Logo & Tagline */}
          <div>
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl tracking-[0.05em] text-[#FFB7D5]">
                UJ
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed max-w-[260px] opacity-90">
              Солонгос гоо сайхны шилдэг бүтээгдэхүүнийг Монголд хүргэж буй брэнд.
            </p>
            <p className="mt-3 text-xs opacity-70">
              Арьсны тусламж. Хүний хүч.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-medium tracking-[0.15em] uppercase text-[#8B6B78] mb-5">
              Цэс
            </h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-sm hover:text-[#FFB7D5] transition-colors">Нүүр</Link></li>
              <li><Link href="/shop" className="text-sm hover:text-[#FFB7D5] transition-colors">Дэлгүүр</Link></li>
              <li><Link href="/about" className="text-sm hover:text-[#FFB7D5] transition-colors">Бидний тухай</Link></li>
              <li><Link href="/cart" className="text-sm hover:text-[#FFB7D5] transition-colors">Сагс</Link></li>
            </ul>
          </div>

          {/* Contact — from Firestore */}
          <div>
            <h4 className="text-xs font-medium tracking-[0.15em] uppercase text-[#8B6B78] mb-5">
              Холбоо барих
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={`mailto:${settings.email}`} className="hover:text-[#FFB7D5] transition-colors">
                  {settings.email}
                </a>
              </li>
              <li>
                <a href={`tel:${settings.phone.replace(/[\s-]/g, '')}`} className="hover:text-[#FFB7D5] transition-colors">
                  {settings.phone}
                </a>
              </li>
              <li className="opacity-70 text-xs leading-relaxed">
                Улаанбаатар хот, Монгол
              </li>
            </ul>
          </div>

          {/* Instagram — from Firestore */}
          <div>
            <h4 className="text-xs font-medium tracking-[0.15em] uppercase text-[#8B6B78] mb-5">
              Биднийг дагаарай
            </h4>
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm hover:text-[#FFB7D5] transition-colors group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
              @{settings.instagramUrl.split('/').pop() || 'uj_cosmetic'}
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-6 border-t border-[#F2A8C8]/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-70">
            © {new Date().getFullYear()} UJ Cosmetic. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <p className="text-xs opacity-70">
            Бүтээгдэхүүн бүр Солонгосоос шууд импортолсон.
          </p>
        </div>
      </div>
    </footer>
  );
}
