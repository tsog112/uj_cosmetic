'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { getPasswordStrength, PASSWORD_RULES } from '@/lib/passwordUtils';

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.4 0 6.4 1.2 8.8 3.4l6.6-6.6C35.4 2.6 30.1.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.7 6C12.1 13.8 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-2.8-.4-4.1H24v8.3h13c-.3 2.1-1.7 5.4-4.8 7.6l7.4 5.7c4.3-4 7-9.9 7-17.5z" />
      <path fill="#FBBC05" d="M10.3 28.2c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.7-6C1 16.1.1 19.7.1 23.5s.9 7.4 2.5 10.7l7.7-6z" />
      <path fill="#34A853" d="M24 46.5c6.1 0 11.2-2 15-5.5l-7.4-5.7c-2 1.4-4.6 2.3-7.6 2.3-6.4 0-11.9-4.3-13.7-10.2l-7.7 6C6.5 41.1 14.6 46.5 24 46.5z" />
    </svg>
  );
}

function KakaoLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#3C1E1E" d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.33 4.68 6.78l-1.2 4.42 4.82-3.18C11.13 18.93 11.56 19 12 19c5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
  );
}

function PasswordInput({ value, onChange, label, right }: { value: string; onChange: (value: string) => void; label: string; right?: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-[12px] font-bold text-[var(--color-brand-dark)]">{label}</label>
        {right}
      </div>
      <div className="luxury-input px-4">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent py-3 text-[13px] outline-none"
          required
        />
        <button type="button" onClick={() => setVisible((current) => !current)} className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-brand-dark)]" aria-label={visible ? 'Нууц үг нуух' : 'Нууц үг харах'}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function StrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  return (
    <div className="mt-3 space-y-3">
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-brand-light)]">
        <div className={strength.color} style={{ width: `${strength.percent}%`, height: '100%', transition: 'width 240ms ease' }} />
      </div>
      <div className="grid gap-2 text-[12px] text-[var(--color-text-muted)]">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          return <div key={rule.key} className={passed ? 'font-semibold text-[var(--color-status-done-text)]' : ''}>{passed ? '✓' : '•'} {rule.label}</div>;
        })}
      </div>
    </div>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/profile';
  const { signInWithEmail, signUp, signInWithGoogle, signInWithKakao, user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [waitingEmail, setWaitingEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    if (user && !waitingEmail) router.replace(redirectUrl);
  }, [redirectUrl, router, user, waitingEmail]);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      toast('Google-р амжилттай нэвтэрлээ.', 'success');
      router.replace(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Google-р нэвтрэхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleKakao = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithKakao();
      toast('KakaoTalk-р амжилттай нэвтэрлээ.', 'success');
      router.replace(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'KakaoTalk-р нэвтрэхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
      router.replace(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'И-мэйл эсвэл нууц үг буруу байна');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !strength.isValid || password !== confirmPassword) {
      setError('Мэдээллээ бүрэн, зөв оруулна уу.');
      return;
    }
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await signUp(cleanEmail, password, name.trim(), null);
      setWaitingEmail(cleanEmail);
    } catch (err: any) {
      setError(err.message || 'Бүртгэл үүсгэхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      toast(data.message || 'Хэрэв тухайн и-мэйл бүртгэлтэй бол линк илгээгдэнэ.', data.googleOnly ? 'info' : 'success');
      setForgotOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (waitingEmail) {
    return (
      <main className="luxury-shell min-h-screen px-4 py-16">
        <section className="luxury-card mx-auto max-w-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-status-done-bg)] text-[22px] font-bold text-[var(--color-status-done-text)]">✓</div>
          <h1 className="luxury-title mt-6 text-[28px]">И-мэйл баталгаажуулах</h1>
          <p className="mt-3 text-[13px] leading-6 text-[var(--color-text-muted)]">{waitingEmail} хаяг руу баталгаажуулах линк илгээлээ.</p>
          <button type="button" onClick={() => setWaitingEmail('')} className="mt-6 h-12 w-full rounded-full bg-[var(--color-brand)] text-[13px] font-bold text-white">Нэвтрэх рүү буцах</button>
        </section>
      </main>
    );
  }

  return (
    <main className="luxury-shell min-h-screen px-4 py-10">
      <section className="luxury-card mx-auto max-w-md p-6 sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto text-[42px] font-semibold leading-none text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-serif)' }}>UJ</div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">Beauty & Wellness</p>
          <h1 className="luxury-title mt-5 text-[30px]">{mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}</h1>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[var(--color-border)] bg-white text-[13px] font-semibold text-[#3c4043] transition hover:bg-[#FAFAFA] active:scale-[0.99] disabled:opacity-60"
          >
            <GoogleLogo />
            {mode === 'login' ? 'Google' : 'Google-р бүртгүүлэх'}
          </button>

          {process.env.NEXT_PUBLIC_KAKAO_JS_KEY && (
            <button
              type="button"
              onClick={handleKakao}
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#FEE500] text-[13px] font-semibold text-[#191600] transition hover:brightness-[0.98] active:scale-[0.99] disabled:opacity-60"
            >
              <KakaoLogo />
              KakaoTalk
            </button>
          )}
        </div>

        <div className="my-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          эсвэл
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-2 block text-[12px] font-bold text-[var(--color-brand-dark)]">Нэр</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="luxury-input w-full px-5 text-[13px] outline-none" style={{ display: 'block' }} required />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-[12px] font-bold text-[var(--color-brand-dark)]">И-мэйл хаяг</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="luxury-input w-full px-5 text-[13px] outline-none" style={{ display: 'block' }} required />
          </label>
          <PasswordInput
            label="Нууц үг"
            value={password}
            onChange={setPassword}
            right={mode === 'login' ? <button type="button" onClick={() => setForgotOpen(true)} className="text-[12px] font-bold text-[var(--color-brand)]">Нууц үгээ мартсан уу?</button> : null}
          />
          {mode === 'register' && (
            <>
              <PasswordInput label="Нууц үг давтах" value={confirmPassword} onChange={setConfirmPassword} />
              <StrengthMeter password={password} />
            </>
          )}
          {error && <p className="rounded-[14px] bg-[var(--color-status-cancel-bg)] px-4 py-3 text-[12px] font-semibold text-[var(--color-status-cancel-text)]">{error}</p>}
          <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-brand)] text-[13px] font-bold text-white disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[var(--color-text-muted)]">
          {mode === 'login' ? 'Бүртгэлгүй юу?' : 'Бүртгэлтэй юу?'}{' '}
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-bold text-[var(--color-brand)]">
            {mode === 'login' ? 'Бүртгүүлэх' : 'Нэвтрэх'}
          </button>
        </p>
      </section>

      {forgotOpen && (
        <div className="fixed inset-0 z-[80]">
          <button className="absolute inset-0 bg-black uj-sheet-overlay" onClick={() => setForgotOpen(false)} aria-label="Хаах" />
          <form onSubmit={submitForgot} className="uj-bottom-sheet luxury-bottom-bar absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white p-6">
            <div className="mx-auto h-1 w-10 rounded-full bg-[var(--color-border)]" />
            <h2 className="luxury-title mt-6 text-[26px]">Нууц үг сэргээх</h2>
            <p className="mt-2 text-[13px] leading-6 text-[var(--color-text-muted)]">Хэрэв тухайн и-мэйл бүртгэлтэй бол сэргээх линк илгээгдэнэ.</p>
            <input type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} className="luxury-input mt-5 w-full px-5 text-[13px] outline-none" placeholder="И-мэйл хаяг" required />
            <button disabled={loading} className="mt-4 h-12 w-full rounded-full bg-[var(--color-brand)] text-[13px] font-bold text-white">Линк илгээх</button>
          </form>
        </div>
      )}
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<main className="px-4 py-12"><div className="h-80 rounded-[24px] uj-shimmer" /></main>}>
      <AuthContent />
    </Suspense>
  );
}
