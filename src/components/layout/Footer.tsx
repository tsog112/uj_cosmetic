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
    <footer className="relative mt-auto overflow-hidden border-t border-white/10 bg-charcoal text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-dusty-rose/70 to-transparent" />
      <div className="max-content relative py-8 md:py-10">

        {/* ── Main grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4">
            <Link href="/" className="inline-flex flex-col">
              <span className="font-serif text-3xl font-light uppercase tracking-[0.2em] md:text-4xl">UJ</span>
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.3em] text-dusty-rose">
                Beauty &amp; Wellness
              </span>
            </Link>

            <p className="mt-6 max-w-[320px] text-sm leading-7 text-white/65">
              Солонгосын гоо сайхан, арьс арчилгаа болон эрүүл мэндийн
              бүтээгдэхүүнийг Монгол хэрэглэгчдэдээ хүргэнэ.
            </p>

            <div className="mt-8 flex gap-3">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/65 transition-all hover:border-dusty-rose/60 hover:bg-dusty-rose/15 hover:text-dusty-rose"
                >
                  <Icon size={16} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-2">
            <h4 className="mb-5 text-base font-semibold uppercase tracking-[0.14em] text-white/60">Цэс</h4>
            <nav className="flex flex-col gap-3.5">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/70 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Help */}
          <div className="lg:col-span-2">
            <h4 className="mb-5 text-base font-semibold uppercase tracking-[0.14em] text-white/60">Тусламж</h4>
            <nav className="flex flex-col gap-3.5 text-sm text-white/70">
              {HELP_LINKS.map(link => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="sm:col-span-2 lg:col-span-4">
            <h4 className="mb-5 text-base font-semibold uppercase tracking-[0.14em] text-white/60">Холбоо барих</h4>
            <div className="flex flex-col gap-4 text-sm text-white/70">
              <a
                href={`tel:${displayPhone.replace(/[\s-]/g, '')}`}
                className="group flex items-center gap-3 transition-colors hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/60 transition-colors group-hover:bg-dusty-rose/20 group-hover:text-dusty-rose">
                  <Phone size={14} />
                </span>
                <span>{displayPhone}</span>
              </a>

              <a
                href={`mailto:${displayEmail}`}
                className="group flex items-center gap-3 transition-colors hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/60 transition-colors group-hover:bg-dusty-rose/20 group-hover:text-dusty-rose">
                  <Mail size={14} />
                </span>
                <span className="break-all">{displayEmail}</span>
              </a>

              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 transition-colors hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/60 transition-colors group-hover:bg-dusty-rose/20 group-hover:text-dusty-rose">
                  <Camera size={14} />
                </span>
                <span>@{instagramHandle}</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom ─────────────────────────────────────────────────────── */}
        <div className="mt-8 border-t border-white/10 pt-5 md:flex md:items-center md:justify-between">
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/35">
            © {new Date().getFullYear()} UJ Cosmetic. Premium Standards.
          </p>
          <p className="mt-3 text-[12px] italic text-white/35 md:mt-0">
            &ldquo;Өөртөө анхаарах мөч бүрийг илүү гоё болгоё&rdquo;
          </p>
        </div>
      </div>
    </footer>
  );
}
