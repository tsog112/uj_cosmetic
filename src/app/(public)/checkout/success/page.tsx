'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings } from '@/types';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order') || 'ORD-123456';
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getSiteSettings()
      .then((siteSettings) => {
        if (siteSettings) setSettings(siteSettings);
      })
      .catch(() => {});
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(settings.bankAccount);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[600px] mx-auto px-6 lg:px-10 py-20 text-center">
      <div className="w-20 h-20 bg-accent text-text-primary rounded-full flex items-center justify-center mx-auto mb-8">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="section-heading text-3xl mb-4">Захиалга амжилттай!</h1>
      <p className="text-text-muted mb-8">
        Баярлалаа. Таны захиалгын дугаар: <strong className="text-text-primary">{orderId}</strong>
      </p>

      <div className="relative mb-8 overflow-hidden rounded-[18px] border border-[#F2C7D8] bg-[#FFF8FB] p-8 text-left shadow-[0_18px_50px_rgba(91,46,67,0.08)]">
        <div className="absolute right-0 top-0 rounded-bl-[12px] bg-[#D994B5] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Банкны шилжүүлэг
        </div>

        <h3 className="font-medium text-text-primary mb-4 text-sm uppercase tracking-widest">
          {settings.bankName}
        </h3>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center border-thin-b pb-3 border-[#F2A8C8]/50">
            <span className="text-text-muted">Дансны дугаар:</span>
            <div className="flex items-center gap-3">
              <strong className="text-text-primary text-base">{settings.bankAccount}</strong>
              <button
                onClick={handleCopy}
                className="rounded-[8px] border border-[#F2C7D8] bg-white p-2 text-[#D994B5] transition-colors hover:bg-[#FFF0F6] hover:text-[#241820]"
                title={copied ? 'Хуулагдлаа!' : 'Хуулах'}
                aria-label={copied ? 'Хуулагдлаа!' : 'Хуулах'}
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center border-thin-b pb-3 border-[#F2A8C8]/50">
            <span className="text-text-muted">Хүлээн авагч:</span>
            <strong className="text-text-primary">{settings.bankAccountName}</strong>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-text-muted">Гүйлгээний утга:</span>
            <strong className="rounded-[8px] bg-white px-2 py-1 text-[#D994B5]">{orderId}</strong>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <p className="text-sm text-text-primary font-medium mb-6">
          Имэйлээ шалгана уу. Шилжүүлэг хийсний дараа захиалгын дугаараа манай Instagram руу илгээнэ үү.
        </p>
        <a
          href={settings.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-[12px] border border-[#F2C7D8] bg-white px-6 text-sm font-semibold text-[#241820] transition-colors hover:bg-[#FFF0F6] md:w-auto"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          @{settings.instagramUrl.split('/').filter(Boolean).pop() || 'uj_cosmetic'}
        </a>
      </div>

      <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-[11px] bg-[#241820] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#D994B5]">
        Дэлгүүр рүү буцах
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[600px] mx-auto px-6 py-20 text-center animate-pulse">
          <div className="w-20 h-20 bg-cream-dark rounded-full mx-auto mb-8" />
          <div className="h-8 bg-cream-dark w-64 mx-auto mb-4" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
