'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, X } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    async function verify() {
      if (!token) {
        setState('error');
        return;
      }
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        setState(response.ok ? 'success' : 'error');
      } catch {
        setState('error');
      }
    }

    void verify();
  }, [token]);

  const icon = state === 'loading' ? <Loader2 className="animate-spin" size={26} /> : state === 'success' ? <Check size={28} /> : <X size={28} />;

  return (
    <main className="luxury-shell flex min-h-[calc(100svh-140px)] items-center pb-[104px]">
      <section className="luxury-card w-full px-6 py-10 text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${state === 'success' ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-[#FCEBEB] text-[#A32D2D]'}`}>
          {icon}
        </div>
        <p className="luxury-eyebrow mt-6">Email verification</p>
        <h1 className="luxury-title mt-2">
          {state === 'success' ? 'И-мэйл баталгаажлаа' : state === 'error' ? 'Линк хүчингүй байна' : 'Шалгаж байна'}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
          {state === 'success'
            ? 'Таны и-мэйл амжилттай баталгаажлаа. Одоо нэвтэрч захиалгаа үргэлжлүүлэх боломжтой.'
            : state === 'error'
              ? 'Баталгаажуулах линк хугацаа дууссан эсвэл буруу байна. Нэвтрэх хуудсаас линкээ дахин илгээнэ үү.'
              : 'Түр хүлээнэ үү, таны баталгаажуулах линкийг шалгаж байна.'}
        </p>
        <Link href="/auth" className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-brand)] px-7 text-sm font-semibold text-white">
          Нэвтрэх
        </Link>
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="luxury-shell min-h-[60svh]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
