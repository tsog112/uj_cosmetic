'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { getPasswordStrength, PASSWORD_RULES } from '@/lib/passwordUtils';
import { useToast } from '@/components/ui/Toast';

function PasswordField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#993556]">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[30px] border border-[#F4C0D1] px-5 py-3 pr-12 text-sm outline-none focus:border-[#D4537E]"
          required
        />
        <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#993556]">
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
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
      const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
      setValid(res.ok);
    }
    void validate();
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!strength.isValid || password !== confirm) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Нууц үг шинэчлэхэд алдаа гарлаа.');
      toast('Нууц үг амжилттай шинэчлэгдлээ', 'success');
      router.replace('/auth');
    } catch (err: any) {
      setError(err.message || 'Нууц үг шинэчлэхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) {
    return <main className="min-h-screen bg-[#FFF8FB]" />;
  }

  if (!valid) {
    return (
      <main className="min-h-screen bg-[#FFF8FB] px-4 py-16">
        <section className="mx-auto max-w-md rounded-2xl border border-[#F4C0D1] bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-[#993556]">Линк хүчингүй байна</h1>
          <p className="mt-3 text-sm text-gray-600">Нууц үг сэргээх линк хугацаа дууссан эсвэл буруу байна.</p>
          <Link href="/auth" className="mt-6 inline-flex rounded-[30px] bg-[#D4537E] px-6 py-3 text-sm font-semibold text-white">
            Дахин хүсэлт илгээх
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF8FB] px-4 py-16">
      <form onSubmit={submit} className="mx-auto max-w-md rounded-2xl border border-[#F4C0D1] bg-white p-8">
        <h1 className="text-2xl font-semibold text-[#993556]">Нууц үг шинэчлэх</h1>
        {error && <div className="mt-4 rounded-2xl bg-[#FCEBEB] p-4 text-sm text-[#A32D2D]">{error}</div>}
        <div className="mt-6 space-y-4">
          <PasswordField label="Шинэ нууц үг" value={password} onChange={setPassword} />
          <div className="space-y-2 text-xs text-gray-600">
            <div className="h-2 overflow-hidden rounded-full bg-[#FBEAF0]">
              <div className={`${strength.color} h-full transition-all`} style={{ width: `${strength.percent}%` }} />
            </div>
            {PASSWORD_RULES.map((rule) => <div key={rule.key}>{rule.test(password) ? '✓' : '○'} {rule.label}</div>)}
          </div>
          <PasswordField label="Нууц үг давтах" value={confirm} onChange={setConfirm} />
        </div>
        <button disabled={loading || !strength.isValid || password !== confirm} className="mt-6 flex w-full items-center justify-center rounded-[30px] bg-[#D4537E] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Нууц үг шинэчлэх'}
        </button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF8FB]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
