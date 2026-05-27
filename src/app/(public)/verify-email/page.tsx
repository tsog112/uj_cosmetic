'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        setState(res.ok ? 'success' : 'error');
      } catch {
        setState('error');
      }
    }
    void verify();
  }, [token]);

  return (
    <main className="min-h-screen bg-[#FFF8FB] px-4 py-16">
      <section className="mx-auto max-w-md rounded-2xl border border-[#F4C0D1] bg-white p-8 text-center">
        <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl ${state === 'success' ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-[#FBEAF0] text-[#993556]'}`}>
          {state === 'loading' ? '...' : state === 'success' ? '✓' : '!'}
        </div>
        <h1 className="text-2xl font-semibold text-[#993556]">
          {state === 'success' ? 'И-мэйл баталгаажлаа' : state === 'error' ? 'Линк хүчингүй байна' : 'Шалгаж байна'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {state === 'success'
            ? 'И-мэйл амжилттай баталгаажлаа. Нэвтэрнэ үү.'
            : state === 'error'
              ? 'Баталгаажуулах линк хугацаа дууссан эсвэл буруу байна.'
              : 'Түр хүлээнэ үү.'}
        </p>
        <Link href="/auth" className="mt-6 inline-flex rounded-[30px] bg-[#D4537E] px-6 py-3 text-sm font-semibold text-white">
          Нэвтрэх
        </Link>
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF8FB]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
