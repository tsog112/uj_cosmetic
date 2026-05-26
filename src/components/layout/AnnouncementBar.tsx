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
      className="fixed inset-x-0 mx-auto top-0 z-[60] w-full max-w-[430px] overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, #C2185B 0%, #E91E8C 50%, #C2185B 100%)',
        backgroundSize: '200% 100%',
        animation: 'gradientShift 4s ease infinite',
      }}
    >
      {/* Marquee strip */}
      <div className="flex h-9 items-center overflow-hidden relative">
        {/* Edge fades */}
        <div className="pointer-events-none absolute left-0 z-10 h-full w-10 bg-gradient-to-r from-[#C2185B] to-transparent" />
        <div className="pointer-events-none absolute right-0 z-10 h-full w-10 bg-gradient-to-l from-[#C2185B] to-transparent" />

        <div className="animate-marquee-fast flex shrink-0 items-center whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="flex items-center">
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
        className="absolute right-0 top-0 z-20 flex h-full w-9 items-center justify-center transition-colors"
        style={{ color: 'rgba(255,255,255,0.70)' }}
        aria-label="Мэдэгдэл хаах"
      >
        <span className="text-[16px] font-light leading-none">×</span>
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
