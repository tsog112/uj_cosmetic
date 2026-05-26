'use client';

import { Suspense, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

// ── Floating label input ─────────────────────────────────────────────────
function FloatingField({
  icon,
  type: initialType,
  label,
  value,
  onChange,
  error,
}: {
  icon: ReactNode;
  type: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [type, setType] = useState(initialType);
  const isPassword = initialType === 'password';
  const floated = isFocused || value.length > 0;

  return (
    <div
      className="relative"
      style={{
        borderRadius: 16,
        border: `1.5px solid ${error ? 'var(--color-brand-danger)' : isFocused ? 'var(--color-primary)' : 'rgba(233,30,140,0.15)'}`,
        background: isFocused ? '#FFFFFF' : 'rgba(248,244,246,0.8)',
        boxShadow: isFocused ? '0 0 0 3px rgba(233,30,140,0.10)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
        animation: error ? 'shake 0.4s both' : undefined,
      }}
    >
      {/* Icon */}
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2"
        style={{ color: isFocused ? 'var(--color-primary)' : 'var(--color-text-medium)', transition: 'color 0.2s' }}
      >
        {icon}
      </div>

      {/* Floating label */}
      <label
        style={{
          position: 'absolute',
          left: 46,
          top: floated ? 10 : '50%',
          transform: floated ? 'translateY(0)' : 'translateY(-50%)',
          fontSize: floated ? 10 : 14,
          fontWeight: floated ? 700 : 500,
          color: floated && isFocused ? 'var(--color-primary)' : 'var(--color-text-medium)',
          letterSpacing: floated ? '0.06em' : 0,
          transition: 'all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
          pointerEvents: 'none',
          fontFamily: floated ? '"Montserrat", sans-serif' : 'inherit',
        }}
      >
        {label}
      </label>

      {/* Input */}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        required
        placeholder=""
        style={{
          width: '100%',
          minHeight: 56,
          paddingTop: floated ? 22 : 14,
          paddingBottom: 8,
          paddingLeft: 46,
          paddingRight: isPassword ? 44 : 16,
          background: 'transparent',
          outline: 'none',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--color-text-dark)',
          borderRadius: 16,
        }}
      />

      {/* Password toggle */}
      {isPassword && (
        <button
          type="button"
          onClick={() => setType((t) => (t === 'password' ? 'text' : 'password'))}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full transition-all"
          style={{ color: 'var(--color-text-medium)', background: 'transparent', minHeight: 'auto' }}
          aria-label={type === 'password' ? 'Нууц үг харуулах' : 'Нууц үг нуух'}
        >
          {type === 'password' ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      )}
    </div>
  );
}

function AuthContent() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';
  const { signInWithEmail, signUp, signInWithGoogle, signInWithFacebook, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) router.push(redirectUrl);
  }, [user, router, redirectUrl]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      toast('Амжилттай нэвтэрлээ!', 'success');
    } catch (err: any) {
      setError(err.message || 'Нэвтрэхэд алдаа гарлаа');
      setFieldError(true);
      setTimeout(() => setFieldError(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Нууц үг хоорондоо таарахгүй байна');
      setFieldError(true);
      setTimeout(() => setFieldError(false), 500);
      return;
    }
    setIsSubmitting(true);
    try {
      await signUp(email, password, name);
      toast('Бүртгэл амжилттай!', 'success');
    } catch (err: any) {
      setError(err.message || 'Бүртгүүлэхэд алдаа гарлаа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submit = tab === 'login' ? handleLogin : handleRegister;

  return (
    <main
      className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-[104px] pt-8"
      style={{
        background: 'linear-gradient(135deg, #E91E8C 0%, #C2185B 40%, #8B0037 80%, #1A0A12 100%)',
      }}
    >
      {/* Blob decorations */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 280, height: 280, top: '5%', right: '-10%',
          background: 'rgba(255,255,255,0.06)',
          animation: 'blobMorph 10s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: 200, height: 200, bottom: '10%', left: '-8%',
          background: 'rgba(255,255,255,0.04)',
          animation: 'blobMorph 8s ease-in-out infinite reverse',
        }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 text-center"
      >
        <Link href="/" className="inline-flex flex-col items-center">
          <span
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 600,
              fontSize: 48,
              lineHeight: 1,
              letterSpacing: '0.12em',
              color: 'white',
            }}
          >
            UJ
          </span>
          <span
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(255,182,217,0.85)',
              marginTop: 4,
            }}
          >
            Beauty &amp; Wellness
          </span>
        </Link>
      </motion.div>

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] rounded-[28px] p-6"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          boxShadow: '0 24px 80px rgba(26,10,18,0.28), 0 4px 16px rgba(233,30,140,0.12)',
          border: '1px solid rgba(255,255,255,0.6)',
        }}
      >
        {/* Tab switcher */}
        <div
          className="relative mb-6 grid grid-cols-2 rounded-full p-1"
          style={{ background: 'var(--color-soft-pink)' }}
        >
          {/* Sliding indicator */}
          <motion.div
            className="absolute inset-y-1 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #E91E8C, #C2185B)',
              boxShadow: '0 4px 16px rgba(233,30,140,0.28)',
            }}
            animate={{ left: tab === 'login' ? 4 : '50%', width: 'calc(50% - 4px)' }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          />
          <button
            onClick={() => setTab('login')}
            className="relative z-10 h-11 rounded-full text-[13px] font-bold transition-colors"
            style={{ color: tab === 'login' ? 'white' : 'var(--color-text-medium)' }}
          >
            Нэвтрэх
          </button>
          <button
            onClick={() => setTab('register')}
            className="relative z-10 h-11 rounded-full text-[13px] font-bold transition-colors"
            style={{ color: tab === 'register' ? 'white' : 'var(--color-text-medium)' }}
          >
            Бүртгүүлэх
          </button>
        </div>

        {/* Title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mb-5 text-center"
          >
            <h1
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 22,
                fontWeight: 500,
                color: 'var(--color-text-dark)',
              }}
            >
              {tab === 'login' ? 'Тавтай морил' : 'Шинэ бүртгэл'}
            </h1>
            <p className="mt-1 text-[12px]" style={{ color: 'var(--color-text-medium)' }}>
              {tab === 'login'
                ? 'Бүртгэлтэй дансаараа нэвтэрнэ үү'
                : 'Бүртгэл үүсгэж давуу эрх аваарай'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-[14px] p-3 text-[12px] font-bold overflow-hidden"
              style={{ background: 'var(--status-error-bg)', color: 'var(--status-error)' }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={submit} className="space-y-3">
          <AnimatePresence>
            {tab === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FloatingField
                  icon={<User size={17} strokeWidth={1.8} />}
                  type="text"
                  label="Нэр"
                  value={name}
                  onChange={setName}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <FloatingField
            icon={<Mail size={17} strokeWidth={1.8} />}
            type="email"
            label="Имэйл хаяг"
            value={email}
            onChange={setEmail}
            error={fieldError}
          />
          <FloatingField
            icon={<Lock size={17} strokeWidth={1.8} />}
            type="password"
            label="Нууц үг"
            value={password}
            onChange={setPassword}
            error={fieldError}
          />

          <AnimatePresence>
            {tab === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FloatingField
                  icon={<Lock size={17} strokeWidth={1.8} />}
                  type="password"
                  label="Нууц үг давтах"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={fieldError}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {tab === 'login' && (
            <button
              type="button"
              className="block w-full text-right text-[12px] font-bold"
              style={{ color: 'var(--color-primary)' }}
            >
              Нууц үгээ мартсан уу?
            </button>
          )}

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.97 }}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #E91E8C 0%, #C2185B 100%)',
              boxShadow: '0 8px 24px rgba(233,30,140,0.32)',
              fontFamily: '"Montserrat", sans-serif',
              letterSpacing: '0.06em',
              minHeight: 52,
            }}
          >
            {isSubmitting && <Loader2 size={17} className="animate-spin" />}
            {tab === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'rgba(233,30,140,0.15)' }} />
          <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-medium)' }}>эсвэл</span>
          <div className="h-px flex-1" style={{ background: 'rgba(233,30,140,0.15)' }} />
        </div>

        {/* Social logins */}
        <div className="space-y-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => signInWithGoogle().catch((err: any) => setError(err.message))}
            type="button"
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border text-sm font-bold transition-all hover:scale-[1.01]"
            style={{
              border: '1.5px solid rgba(233,30,140,0.15)',
              background: 'white',
              color: 'var(--color-text-dark)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google-ээр нэвтрэх
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => signInWithFacebook().catch((err: any) => setError(err.message))}
            type="button"
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full text-sm font-bold text-white transition-all hover:scale-[1.01]"
            style={{ background: '#1877F2', boxShadow: '0 4px 12px rgba(24,119,242,0.28)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook-ээр нэвтрэх
          </motion.button>
        </div>
      </motion.div>

      {/* Back to home */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <Link href="/" className="text-[12px] font-bold" style={{ color: 'rgba(255,182,217,0.80)' }}>
          ← Нүүр хуудас руу буцах
        </Link>
      </motion.div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
