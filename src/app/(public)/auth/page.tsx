'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { COUNTRIES, formatPhoneNumber, validatePhoneNumber } from '@/lib/phoneUtils';
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

function PasswordInput({
  value,
  onChange,
  label,
  right,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  right?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-[#993556]">{label}</label>
        {right}
      </div>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[30px] border border-[#F4C0D1] bg-white px-5 py-3 pr-12 text-sm outline-none transition focus:border-[#D4537E]"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#993556]"
          aria-label={visible ? 'Нууц үг нуух' : 'Нууц үг харуулах'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function StrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  return (
    <div className="mt-3 space-y-3">
      <div className="h-2 overflow-hidden rounded-full bg-[#FBEAF0]">
        <div className={`h-full ${strength.color} transition-all`} style={{ width: `${strength.percent}%` }} />
      </div>
      <div className="grid gap-2 text-xs text-gray-600">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <div key={rule.key} className={passed ? 'text-[#3B6D11]' : 'text-gray-500'}>
              {passed ? '✓' : '○'} {rule.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';
  const { signInWithEmail, signUp, signInWithGoogle, user } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+976');
  const [phoneInput, setPhoneInput] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [waitingEmail, setWaitingEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    if (user && !waitingEmail) router.replace(redirectUrl);
  }, [user, waitingEmail, redirectUrl, router]);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      toast('Google-р амжилттай нэвтэрлээ', 'success');
      router.replace(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Google-р нэвтрэхэд алдаа гарлаа.');
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

    const cleanPhone = phoneInput.replace(/\D/g, '');
    let phone: any = null;
    if (cleanPhone) {
      const validation = validatePhoneNumber(phoneCountry, cleanPhone);
      if (!validation.isValid) {
        setError(validation.error || 'Утасны дугаар буруу байна.');
        return;
      }
      phone = { countryCode: phoneCountry, localNumber: cleanPhone, purpose: 'delivery_only' };
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await signUp(cleanEmail, password, name.trim(), phone);
      setWaitingEmail(cleanEmail);
    } catch (err: any) {
      setError(err.message || 'Бүртгэл үүсгэхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!email.trim() && !waitingEmail) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: (waitingEmail || email).trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Дахин илгээхэд алдаа гарлаа.');
      toast('Баталгаажуулах линк дахин илгээгдлээ.', 'success');
    } catch (err: any) {
      setError(err.message || 'Дахин илгээхэд алдаа гарлаа.');
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
      toast(data.message, data.googleOnly ? 'info' : 'success');
      setForgotOpen(false);
    } catch {
      toast('Хэрэв тухайн и-мэйл бүртгэлтэй бол нууц үг сэргээх линк илгээгдэнэ.', 'success');
      setForgotOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (waitingEmail) {
    return (
      <main className="min-h-screen bg-[#FFF8FB] px-4 py-16">
        <section className="mx-auto max-w-md rounded-2xl border border-[#F4C0D1] bg-white p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF3DE] text-2xl text-[#3B6D11]">✓</div>
          <h1 className="text-2xl font-semibold text-[#993556]">И-мэйл баталгаажуулах</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {waitingEmail} хаяг руу баталгаажуулах линк илгээлээ. И-мэйлээ шалгана уу.
          </p>
          <button
            type="button"
            onClick={resendVerification}
            disabled={loading}
            className="mt-6 w-full rounded-[30px] bg-[#D4537E] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Илгээж байна...' : 'Дахин илгээх'}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF8FB] px-4 py-12">
      <section className="mx-auto max-w-md rounded-2xl border border-[#F4C0D1] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 text-4xl font-serif tracking-[0.2em] text-[#993556]">UJ</div>
          <h1 className="text-2xl font-semibold text-[#993556]">{mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}</h1>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-[30px] border border-[#ddd] bg-white px-5 py-3 text-sm font-semibold text-[#3c4043] transition hover:bg-gray-50 disabled:opacity-60"
        >
          <GoogleLogo />
          {mode === 'login' ? 'Google-р нэвтрэх' : 'Google-р бүртгүүлэх'}
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
          <span className="h-px flex-1 bg-[#F4C0D1]" />
          <span>{mode === 'login' ? 'эсвэл' : 'эсвэл и-мэйлээр'}</span>
          <span className="h-px flex-1 bg-[#F4C0D1]" />
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-[#FCEBEB] bg-[#FCEBEB] p-4 text-sm text-[#A32D2D]">
            {error}
            {error.includes('баталгаажаагүй') && (
              <button type="button" onClick={resendVerification} className="ml-2 font-semibold underline">
                Дахин илгээх
              </button>
            )}
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#993556]">Нэр</label>
              <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-[30px] border border-[#F4C0D1] px-5 py-3 text-sm outline-none focus:border-[#D4537E]" required />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#993556]">И-мэйл хаяг</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-[30px] border border-[#F4C0D1] px-5 py-3 text-sm outline-none focus:border-[#D4537E]" required />
            {mode === 'register' && <p className="mt-2 text-xs text-gray-500">Баталгаажуулах линк и-мэйлд илгээнэ</p>}
          </div>

          <PasswordInput
            label="Нууц үг"
            value={password}
            onChange={setPassword}
            right={mode === 'login' ? (
              <button type="button" onClick={() => setForgotOpen(true)} className="text-xs font-semibold text-[#D4537E]">
                Нууц үгээ мартсан уу?
              </button>
            ) : null}
          />

          {mode === 'register' && (
            <>
              <StrengthMeter password={password} />
              <PasswordInput label="Нууц үг давтах" value={confirmPassword} onChange={setConfirmPassword} />
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#993556]">
                  Утасны дугаар <span className="font-normal text-gray-400">(заавал биш)</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={phoneCountry}
                    onChange={(event) => {
                      setPhoneCountry(event.target.value);
                      setPhoneInput('');
                    }}
                    className="w-28 rounded-[30px] border border-[#F4C0D1] bg-white px-3 py-3 text-sm outline-none focus:border-[#D4537E]"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    value={phoneInput}
                    onChange={(event) => setPhoneInput(formatPhoneNumber(phoneCountry, event.target.value))}
                    className="min-w-0 flex-1 rounded-[30px] border border-[#F4C0D1] px-5 py-3 text-sm outline-none focus:border-[#D4537E]"
                    placeholder={COUNTRIES.find((country) => country.code === phoneCountry)?.placeholder}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Хүргэлтийн зорилгоор ашиглана. Баталгаажуулалт шаардахгүй.</p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'register' && (!strength.isValid || password !== confirmPassword))}
            className="flex w-full items-center justify-center rounded-[30px] bg-[#D4537E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#993556] disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {mode === 'login' ? 'Бүртгэлгүй юу?' : 'Бүртгэлтэй юу?'}{' '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="font-semibold text-[#D4537E]">
            {mode === 'login' ? 'Бүртгүүлэх' : 'Нэвтрэх'}
          </button>
        </p>
      </section>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <form onSubmit={submitForgot} className="w-full max-w-sm rounded-2xl border border-[#F4C0D1] bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-[#993556]">Нууц үг сэргээх</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">Бүртгэлтэй и-мэйлээ оруулна уу. Линк и-мэйлээр илгээгдэнэ.</p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              className="mt-5 w-full rounded-[30px] border border-[#F4C0D1] px-5 py-3 text-sm outline-none focus:border-[#D4537E]"
              placeholder="example@gmail.com"
              required
            />
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setForgotOpen(false)} className="flex-1 rounded-[30px] border border-[#F4C0D1] px-5 py-3 text-sm font-semibold text-[#993556]">
                Болих
              </button>
              <button type="submit" disabled={loading} className="flex-1 rounded-[30px] bg-[#D4537E] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                Линк илгээх
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF8FB]" />}>
      <AuthContent />
    </Suspense>
  );
}
