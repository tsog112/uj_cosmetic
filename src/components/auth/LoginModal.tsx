'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.4 0 6.4 1.2 8.8 3.4l6.6-6.6C35.4 2.6 30.1.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.7 6C12.1 13.8 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-2.8-.4-4.1H24v8.3h13c-.3 2.1-1.7 5.4-4.8 7.6l7.4 5.7c4.3-4 7-9.9 7-17.5z" />
      <path fill="#FBBC05" d="M10.3 28.2c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.7-6C1 16.1.1 19.7.1 23.5s.9 7.4 2.5 10.7l7.7-6z" />
      <path fill="#34A853" d="M24 46.5c6.1 0 11.2-2 15-5.5l-7.4-5.7c-2 1.4-4.6 2.3-7.6 2.3-6.4 0-11.9-4.3-13.7-10.2l-7.7 6C6.5 41.1 14.6 46.5 24 46.5z" />
    </svg>
  );
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google-р нэвтрэхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label="Хаах" />
      <div className="relative w-full max-w-md rounded-2xl border border-[#F4C0D1] bg-white p-8 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 text-[#993556]" aria-label="Хаах">
          <X size={20} />
        </button>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 text-4xl font-serif tracking-[0.2em] text-[#993556]">UJ</div>
          <h2 className="text-2xl font-semibold text-[#993556]">Нэвтрэх</h2>
        </div>
        {error && <div className="mb-4 rounded-2xl bg-[#FCEBEB] p-4 text-sm text-[#A32D2D]">{error}</div>}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-[30px] border border-[#ddd] bg-white px-5 py-3 text-sm font-semibold text-[#3c4043] disabled:opacity-60"
        >
          <GoogleLogo />
          Google-р нэвтрэх
        </button>
        <Link href="/auth" onClick={onClose} className="mt-4 flex w-full items-center justify-center rounded-[30px] bg-[#D4537E] px-5 py-3 text-sm font-semibold text-white">
          И-мэйлээр нэвтрэх
        </Link>
      </div>
    </div>
  );
}
