'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/services/firestoreService';
import { DEFAULT_SETTINGS, SiteSettings } from '@/types';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order') || 'ORD-123456';
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getSiteSettings().then(s => {
      if (s) setSettings(s);
    }).catch(() => {});
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(settings.bankAccount);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[600px] mx-auto px-6 lg:px-10 py-20 text-center">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-accent text-text-primary rounded-full flex items-center justify-center mx-auto mb-8">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <h1 className="section-heading text-3xl mb-4">Захиалга амжилттай!</h1>
      <p className="text-text-muted mb-8">
        Таны захиалгын дугаар: <strong className="text-text-primary">{orderId}</strong>
      </p>

      {/* Bank Details Box — from Firestore */}
      <div className="bg-cream border-2 border-accent p-8 mb-8 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-accent text-text-primary text-[10px] font-bold px-3 py-1 uppercase tracking-wider">
          Төлбөр төлөх
        </div>
        
        <h3 className="font-medium text-text-primary mb-4 text-sm uppercase tracking-widest">
          {settings.bankName}
        </h3>
        
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center border-thin-b pb-3 border-[#F2A8C8]/50">
            <span className="text-text-muted">Дансны дугаар:</span>
            <div className="flex items-center gap-3">
              <strong className="text-text-primary text-base">{settings.bankAccount}</strong>
              <button 
                onClick={handleCopy}
                className="text-accent hover:text-text-primary transition-colors p-1"
                title="Хуулах"
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center border-thin-b pb-3 border-[#F2A8C8]/50">
            <span className="text-text-muted">Хүлээн авагч:</span>
            <strong className="text-text-primary">{settings.bankAccountName}</strong>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Гүйлгээний утга:</span>
            <strong className="text-accent bg-accent/10 px-2 py-0.5">{orderId}</strong>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <p className="text-sm text-text-primary font-medium mb-6">
          Гүйлгээ хийсний дараа манай Instagram-д дугаараа илгээнэ үү.
        </p>
        <a 
          href={settings.instagramUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-outline w-full md:w-auto inline-flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          @{settings.instagramUrl.split('/').pop() || 'uj_cosmetic'}
        </a>
      </div>

      <Link href="/" className="text-sm text-text-muted hover:text-accent underline underline-offset-4 transition-colors">
        Нүүр хуудас руу буцах
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[600px] mx-auto px-6 py-20 text-center animate-pulse">
        <div className="w-20 h-20 bg-cream-dark rounded-full mx-auto mb-8" />
        <div className="h-8 bg-cream-dark w-64 mx-auto mb-4" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
