'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function AuthContent() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  
  const { signInWithEmail, signUp, signInWithGoogle, signInWithFacebook, user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      // user effect will redirect
    } catch (err: any) {
      setError(err.message || 'Нэвтрэхэд алдаа гарлаа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Нууц үг хоорондоо таарахгүй байна');
      return;
    }
    setIsSubmitting(true);
    try {
      await signUp(email, password, name);
      // user effect will redirect
    } catch (err: any) {
      setError(err.message || 'Бүртгүүлэхэд алдаа гарлаа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFacebook = async () => {
    try {
      await signInWithFacebook();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream px-6 py-12">
      <div className="w-full max-w-[420px] bg-sand p-8 md:p-10 border border-border shadow-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-serif text-4xl tracking-[0.05em] text-accent">
              UJ
            </span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-8">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 pb-3 text-sm font-medium tracking-wide uppercase transition-colors ${
              tab === 'login' ? 'text-text-primary border-b-2 border-accent' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Нэвтрэх
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 pb-3 text-sm font-medium tracking-wide uppercase transition-colors ${
              tab === 'register' ? 'text-text-primary border-b-2 border-accent' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Бүртгүүлэх
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 mb-6 border border-red-100">
            {error}
          </div>
        )}

        {/* Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Имэйл хаяг"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-border p-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Нууц үг"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-border p-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div className="text-right">
              <button type="button" className="text-xs text-text-muted hover:text-accent underline underline-offset-2">
                Нууц үгээ мартсан уу?
              </button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent-hover text-text-primary font-medium uppercase tracking-wider py-3.5 text-sm transition-colors disabled:opacity-70 flex justify-center items-center h-[52px]"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-text-primary/30 border-t-text-primary rounded-full animate-spin" />
              ) : (
                'Нэвтрэх'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Нэр"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-border p-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Имэйл хаяг"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-border p-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Нууц үг"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-border p-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Нууц үг давтах"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-border p-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent-hover text-text-primary font-medium uppercase tracking-wider py-3.5 text-sm transition-colors mt-2 disabled:opacity-70 flex justify-center items-center h-[52px]"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-text-primary/30 border-t-text-primary rounded-full animate-spin" />
              ) : (
                'Бүртгүүлэх'
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-sand text-text-muted">эсвэл</span>
          </div>
        </div>

        {/* Social Auth */}
        <div className="space-y-3">
          <button
            onClick={handleGoogle}
            type="button"
            className="w-full bg-sand border border-[#E0E0E0] hover:bg-gray-50 text-[#333] font-medium py-3 text-sm flex items-center justify-center gap-3 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google-ээр нэвтрэх
          </button>
          
          <button
            onClick={handleFacebook}
            type="button"
            className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium py-3 text-sm flex items-center justify-center gap-3 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook-ээр нэвтрэх
          </button>
        </div>

      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center bg-cream">
        <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
