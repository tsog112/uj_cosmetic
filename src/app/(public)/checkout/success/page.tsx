'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Camera, Check, Copy, Home, ShoppingBag } from 'lucide-react';
import { DEFAULT_SETTINGS, type SiteSettings } from '@/types';
import { getSiteSettings } from '@/lib/services/firestoreService';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const payment = searchParams.get('payment');
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getSiteSettings().then((siteSettings) => siteSettings && setSettings(siteSettings)).catch(() => {});
  }, []);

  const copyAccount = async () => {
    await navigator.clipboard.writeText(settings.bankAccount);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="px-4 pb-[104px]">
      <section className="rounded-[28px] bg-white p-6 text-center shadow-[var(--shadow-mobile-card)]">
        <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[var(--color-brand-accent)]">
          <Check size={34} strokeWidth={2.4} />
        </div>
        <h1 className="mt-5 text-[25px] font-extrabold text-[var(--color-brand-text)]">Захиалга амжилттай</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-brand-muted)]">
          Таны захиалга бүртгэгдлээ. Захиалгын дугаар:
          <strong className="ml-1 text-[var(--color-brand-text)]">{orderId || 'үүсэж байна'}</strong>
        </p>
      </section>

      {payment === 'qpay' ? (
        <section className="mt-4 rounded-[24px] bg-white p-5 shadow-[var(--shadow-mobile-card)]">
          <h2 className="text-[17px] font-extrabold text-[var(--color-brand-text)]">QPay төлбөр баталгаажлаа</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-brand-muted)]">Бид захиалгыг шалгаад хүргэлтийн мэдээллийг тантай холбогдон баталгаажуулна.</p>
        </section>
      ) : (
        <section className="mt-4 rounded-[24px] bg-white p-5 shadow-[var(--shadow-mobile-card)]">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--color-brand-accent)]">Дансны мэдээлэл</p>
          <h2 className="mt-2 text-[18px] font-extrabold text-[var(--color-brand-text)]">{settings.bankName}</h2>
          <div className="mt-4 space-y-3 text-[13px]">
            <InfoRow label="Данс" value={settings.bankAccount} action={<button onClick={copyAccount} className="rounded-full bg-[var(--color-brand-secondary)] p-2 text-[var(--color-brand-accent)]">{copied ? <Check size={15} /> : <Copy size={15} />}</button>} />
            <InfoRow label="Хүлээн авагч" value={settings.bankAccountName} />
            <InfoRow label="Гүйлгээний утга" value={orderId || 'захиалгын дугаар'} />
          </div>
        </section>
      )}

      <section className="mt-4 rounded-[24px] bg-white p-5 text-center shadow-[var(--shadow-mobile-card)]">
        <p className="text-[13px] leading-relaxed text-[var(--color-brand-muted)]">Асуух зүйл байвал Instagram-аар захиалгын дугаараа илгээгээрэй.</p>
        <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand-secondary)] px-5 text-[13px] font-extrabold text-[var(--color-brand-text)]">
          <Camera size={16} /> @{settings.instagramUrl.split('/').filter(Boolean).pop() || 'uj_cosmetic'}
        </a>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link href="/shop" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-accent)] text-[13px] font-extrabold text-white"><ShoppingBag size={16} /> Дэлгүүр</Link>
        <Link href="/" className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-[13px] font-extrabold text-[var(--color-brand-text)] shadow-[var(--shadow-mobile-card)]"><Home size={16} /> Нүүр</Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[var(--color-brand-bg)] p-3">
      <span className="text-[var(--color-brand-muted)]">{label}</span>
      <span className="flex items-center gap-2 text-right font-extrabold text-[var(--color-brand-text)]">{value}{action}</span>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-4"><div className="h-56 rounded-[28px] animate-shimmer" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
