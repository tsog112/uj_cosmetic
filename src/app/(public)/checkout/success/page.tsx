'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
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
    <main className="luxury-shell space-y-4 pb-[104px]">
      <section className="luxury-card px-6 py-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF3DE] text-[#3B6D11] status-badge">
          <Check size={30} strokeWidth={2.4} />
        </div>
        <p className="luxury-eyebrow mt-6">Order confirmed</p>
        <h1 className="luxury-title mt-2">Захиалга амжилттай</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
          Таны захиалга бүртгэгдлээ. Захиалгын дугаар:
          <strong className="ml-1 font-semibold text-[var(--color-text-primary)]">{orderId || 'үүсэж байна'}</strong>
        </p>
      </section>

      {payment === 'qpay' ? (
        <section className="luxury-card p-5">
          <p className="luxury-eyebrow">Payment</p>
          <h2 className="mt-1 font-serif text-[22px] font-semibold text-[var(--color-text-primary)]">QPay төлбөр баталгаажлаа</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Бид таны захиалгыг шалгаад бэлтгэл рүү шилжүүлнэ. Төлөвийн өөрчлөлт бүрийг профайл хэсгээс хянах боломжтой.
          </p>
        </section>
      ) : (
        <section className="luxury-card p-5">
          <p className="luxury-eyebrow">Bank transfer</p>
          <h2 className="mt-1 font-serif text-[22px] font-semibold text-[var(--color-text-primary)]">{settings.bankName}</h2>
          <div className="mt-4 space-y-2">
            <InfoRow label="Данс" value={settings.bankAccount} action={<button type="button" onClick={copyAccount} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F3F5] text-[var(--color-brand)]">{copied ? <Check size={15} /> : <Copy size={15} />}</button>} />
            <InfoRow label="Хүлээн авагч" value={settings.bankAccountName} />
            <InfoRow label="Гүйлгээний утга" value={orderId || 'Захиалгын дугаар'} />
          </div>
        </section>
      )}

      <section className="luxury-card p-5">
        <p className="luxury-eyebrow">Next step</p>
        <h2 className="mt-1 font-serif text-[22px] font-semibold text-[var(--color-text-primary)]">Захиалгаа хянах</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          Төлбөр баталгаажих, бүтээгдэхүүн бэлтгэгдэх, хүргэлтэд гарах үе шатыг миний захиалгууд хэсгээс хараарай.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Link href="/shop" className="flex h-12 items-center justify-center rounded-full border border-[#F0E8ED] bg-white text-sm font-semibold text-[var(--color-text-primary)]">
          Дэлгүүр үзэх
        </Link>
        <Link href="/profile/orders" className="flex h-12 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-semibold text-white">
          Захиалгаа харах
        </Link>
      </div>
    </main>
  );
}

function InfoRow({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 rounded-[18px] border border-[#F0E8ED] bg-[#F7F3F5] px-4 py-3">
      <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
      <span className="flex items-center gap-2 text-right text-sm font-semibold text-[var(--color-text-primary)]">
        {value}
        {action}
      </span>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<main className="luxury-shell pb-[104px]"><div className="h-60 rounded-[28px] animate-shimmer" /></main>}>
      <SuccessContent />
    </Suspense>
  );
}
