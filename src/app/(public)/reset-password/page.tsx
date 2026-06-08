'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { getPasswordStrength, PASSWORD_RULES } from '@/lib/passwordUtils';

function PasswordField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</span>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="luxury-input pr-12"
          required
          autoComplete="new-password"
        />
        <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-text-muted)]">
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { toast } = useToast();
  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    async function validate() {
      if (!token) {
        setValid(false);
        return;
      }
      const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
      setValid(response.ok);
    }

    void validate();
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!strength.isValid || password !== confirm) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Нууц үг шинэчлэхэд алдаа гарлаа.');
      toast('Нууц үг амжилттай шинэчлэгдлээ', 'success');
      router.replace('/auth');
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : 'Нууц үг шинэчлэхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) {
    return (
      <main className="luxury-shell flex min-h-[60svh] items-center">
        <div className="luxury-card h-64 w-full animate-shimmer" />
      </main>
    );
  }

  if (!valid) {
    return (
      <main className="luxury-shell flex min-h-[calc(100svh-140px)] items-center pb-[104px]">
        <section className="luxury-card w-full px-6 py-10 text-center">
          <p className="luxury-eyebrow">Password reset</p>
          <h1 className="luxury-title mt-2">Линк хүчингүй байна</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
            Нууц үг сэргээх линк хугацаа дууссан эсвэл буруу байна. Дахин сэргээх линк илгээнэ үү.
          </p>
          <Link href="/auth" className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-brand)] px-7 text-sm font-semibold text-white">
            Нэвтрэх хэсэг рүү
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="luxury-shell flex min-h-[calc(100svh-140px)] items-center pb-[104px]">
      <form onSubmit={submit} className="luxury-card w-full p-6">
        <p className="luxury-eyebrow">Password reset</p>
        <h1 className="luxury-title mt-2">Нууц үг шинэчлэх</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          Шинэ нууц үгээ оруулаад бүртгэлээ хамгаалалттайгаар үргэлжлүүлээрэй.
        </p>

        {error && <div className="mt-5 rounded-[18px] border border-[#F4B8B8] bg-[#FCEBEB] p-4 text-sm font-semibold text-[#A32D2D]">{error}</div>}

        <div className="mt-6 space-y-4">
          <PasswordField label="Шинэ нууц үг" value={password} onChange={setPassword} />
          <div className="space-y-3">
            <div className="h-2 overflow-hidden rounded-full bg-[#FBEAF0]">
              <div className={`${strength.color} h-full transition-all duration-300`} style={{ width: `${strength.percent}%` }} />
            </div>
            <div className="grid gap-2 text-xs text-[var(--color-text-muted)]">
              {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(password);
                return (
                  <div key={rule.key} className={`flex items-center gap-2 ${passed ? 'text-[#3B6D11]' : ''}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${passed ? 'border-[#3B6D11] bg-[#EAF3DE]' : 'border-[#F0E8ED]'}`}>
                      {passed && <Check size={11} />}
                    </span>
                    {rule.label}
                  </div>
                );
              })}
            </div>
          </div>
          <PasswordField label="Нууц үг давтах" value={confirm} onChange={setConfirm} />
          {confirm && password !== confirm && <p className="text-xs font-semibold text-[#A32D2D]">Нууц үг таарахгүй байна.</p>}
        </div>

        <button disabled={loading || !strength.isValid || password !== confirm} className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60">
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Нууц үг шинэчлэх'}
        </button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="luxury-shell min-h-[60svh]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
