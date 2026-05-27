'use client';

import { useEffect, useState } from 'react';
import { Gem } from 'lucide-react';
import { getSiteSettings } from '@/lib/services/firestoreService';

function normalizeAnnouncement(value: string) {
  if (value && /[逵戟均畇剋奈棘筠]/.test(value)) return '';
  return value?.trim() || '';
}

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [text, setText] = useState('');
  const [active, setActive] = useState(false);

  useEffect(() => {
    getSiteSettings()
      .then((settings) => {
        if (!settings) return;
        const normalizedText = normalizeAnnouncement(settings.announcementText);
        const nextActive = settings.announcementActive && Boolean(normalizedText);
        setText(normalizedText);
        setActive(nextActive);
        window.dispatchEvent(new CustomEvent('announcement-visibility-change', { detail: nextActive }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('announcement-visibility-change', { detail: isVisible && active }));
  }, [active, isVisible]);

  if (!isVisible || !active || !text) return null;

  return (
    <div
      className="fixed inset-x-0 mx-auto top-0 z-[60] w-full max-w-[430px] md:max-w-none overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, #C2185B 0%, #E91E8C 50%, #C2185B 100%)',
        backgroundSize: '200% 100%',
        animation: 'gradientShift 4s ease infinite',
      }}
    >
      {/* Marquee strip — seamless infinite scroll */}
      <div className="flex h-9 items-center overflow-hidden relative">
        {/* Edge fades */}
        <div className="pointer-events-none absolute left-0 z-10 h-full w-10 bg-gradient-to-r from-[#C2185B] to-transparent" />
        <div className="pointer-events-none absolute right-0 z-10 h-full w-10 bg-gradient-to-l from-[#C2185B] to-transparent" />

        {/* Two identical sets for seamless loop: translateX(-50%) covers exactly one set */}
        <div className="animate-marquee-fast flex shrink-0 items-center whitespace-nowrap will-change-transform">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={`a-${i}`} className="flex items-center">
              <Gem size={9} className="mx-3 shrink-0" style={{ color: 'rgba(255,182,217,0.85)' }} />
              <span
                style={{
                  fontFamily: '"Montserrat", sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  color: 'rgba(255,255,255,0.95)',
                  textTransform: 'uppercase',
                }}
              >
                {text}
              </span>
            </span>
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={`b-${i}`} className="flex items-center">
              <Gem size={9} className="mx-3 shrink-0" style={{ color: 'rgba(255,182,217,0.85)' }} />
              <span
                style={{
                  fontFamily: '"Montserrat", sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  color: 'rgba(255,255,255,0.95)',
                  textTransform: 'uppercase',
                }}
              >
                {text}
              </span>
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-0 top-0 z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
        style={{ color: 'rgba(255,255,255,0.80)', lineHeight: 1 }}
        aria-label="Мэдэгдэл хаах"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
