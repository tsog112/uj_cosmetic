'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings } from '@/types';
import { Camera, Globe, Mail, Phone } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Нүүр' },
  { href: '/shop', label: 'Дэлгүүр' },
  { href: '/about', label: 'Бидний тухай' },
  { href: '/cart', label: 'Сагс' },
];

const HELP_LINKS = [
  { href: '/account', label: 'Миний захиалга' },
  { href: '/checkout', label: 'Захиалга' },
  { href: '/about', label: 'Брэндийн тухай' },
];

function cleanSetting(value: string, fallback: string) {
  if (!value || value.includes('?')) return fallback;
  return value;
}

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getSiteSettings()
      .then(s => { if (s) setSettings(s); })
      .catch(() => { });
  }, []);

  const instagramHandle = settings.instagramUrl.split('/').filter(Boolean).pop() || 'uj_cosmetic';
  const displayPhone = cleanSetting(settings.phone, '+976 9900-0000');
  const displayEmail = cleanSetting(settings.email, 'info@ujcosmetic.mn');

  const socialLinks = [
    { Icon: Camera, href: settings.instagramUrl, label: 'Instagram' },
    { Icon: Globe, href: settings.facebookUrl || '#', label: 'Facebook' },
    { Icon: Mail, href: `mailto:${displayEmail}`, label: 'Имэйл' },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/5 bg-charcoal text-white">
      <div className="max-content relative py-20 md:py-28 lg:py-32">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8 lg:gap-12">

          {/* ── Brand column ─────────────────────────────────────────────── */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex flex-col">
              <span className="font-serif text-4xl font-light uppercase tracking-[0.2em] md:text-5xl">UJ</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-dusty-rose">
                Beauty &amp; Wellness
              </span>
            </Link>

            <p className="mt-8 max-w-[320px] text-[15px] leading-relaxed text-white/50">
              Солонгосын дээд зэрэглэлийн гоо сайхан, арьс арчилгаа болон эрүүл мэндийн
              бүтээгдэхүүнийг Монгол хэрэглэгчдэдээ хамгийн найдвартайгаар хүргэнэ.
            </p>

            <div className="mt-10 flex gap-4">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-all hover:border-dusty-rose hover:bg-dusty-rose hover:text-white"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* ── Navigation column ────────────────────────────────────────── */}
          <div className="md:col-span-2">
            <h2 className="mb-8 text-[13px] font-bold uppercase tracking-[0.2em] text-dusty-rose">Цэс</h2>
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[15px] text-white/50 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* ── Help column ──────────────────────────────────────────────── */}
          <div className="md:col-span-2">
            <h4 className="mb-8 text-[13px] font-bold uppercase tracking-[0.2em] text-dusty-rose">Тусламж</h4>
            <nav className="flex flex-col gap-4 text-[15px] text-white/50">
              {HELP_LINKS.map(link => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* ── Contact column ───────────────────────────────────────────── */}
          <div className="md:col-span-4">
            <h4 className="mb-8 text-[13px] font-bold uppercase tracking-[0.2em] text-dusty-rose">Холбоо барих</h4>
            <div className="flex flex-col gap-5 text-[15px] text-white/50">

              <a
                href={`tel:${displayPhone.replace(/[\s-]/g, '')}`}
                className="group flex items-center gap-3 transition-colors hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/30 transition-colors group-hover:bg-dusty-rose/20 group-hover:text-dusty-rose">
                  <Phone size={14} />
                </span>
                <span>{displayPhone}</span>
              </a>

              <a
                href={`mailto:${displayEmail}`}
                className="group flex items-center gap-3 break-all transition-colors hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/30 transition-colors group-hover:bg-dusty-rose/20 group-hover:text-dusty-rose">
                  <Mail size={14} />
                </span>
                <span>{displayEmail}</span>
              </a>

              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 transition-colors hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/30 transition-colors group-hover:bg-dusty-rose/20 group-hover:text-dusty-rose">
                  <Camera size={14} />
                </span>
                <span>@{instagramHandle}</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────────────── */}
        <div className="mt-20 border-t border-white/5 pt-10 md:mt-28 md:flex md:items-center md:justify-between">
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/20">
            © {new Date().getFullYear()} UJ Cosmetic. Premium Standards.
          </p>
          <p className="mt-4 text-[13px] italic text-white/20 md:mt-0">
            &ldquo;Өөртөө анхаарах мөч бүрийг илүү гоё болгоё&rdquo;
          </p>
        </div>
      </div>
    </footer>
  );
}
