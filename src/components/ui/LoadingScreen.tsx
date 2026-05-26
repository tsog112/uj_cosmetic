'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'draw' | 'type' | 'reveal' | 'done'>('draw');
  const [typedChars, setTypedChars] = useState(0);

  const tagline = 'Тансаг арьс арчилгааг өдөр бүртээ';

  useEffect(() => {
    // Only show on first session load
    const seen = sessionStorage.getItem('uj-intro-seen');
    if (seen) return;
    sessionStorage.setItem('uj-intro-seen', '1');
    setVisible(true);

    // Phase 1: SVG draw (1.2s)
    const t1 = setTimeout(() => setPhase('type'), 1200);
    // Phase 2: Typeout (tagline.length * 45ms)
    const t2 = setTimeout(() => setPhase('reveal'), 1200 + tagline.length * 45 + 300);
    // Phase 3: Radial reveal exit (0.8s)
    const t3 = setTimeout(() => { setPhase('done'); setVisible(false); }, 1200 + tagline.length * 45 + 300 + 900);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Typeout effect
  useEffect(() => {
    if (phase !== 'type') return;
    if (typedChars >= tagline.length) return;
    const t = setTimeout(() => setTypedChars((n) => n + 1), 45);
    return () => clearTimeout(t);
  }, [phase, typedChars, tagline.length]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #E91E8C 0%, #C2185B 50%, #8B0037 100%)',
        animation: phase === 'reveal' ? 'radialRevealOut 0.85s cubic-bezier(0.16,1,0.3,1) forwards' : undefined,
      }}
    >
      {/* Blob decorations */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 340,
          height: 340,
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          background: 'rgba(255,255,255,0.07)',
          top: '10%',
          right: '-10%',
          animation: 'blobMorph 8s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: 200,
          height: 200,
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
          background: 'rgba(255,255,255,0.05)',
          bottom: '15%',
          left: '-5%',
          animation: 'blobMorph 10s ease-in-out infinite reverse',
        }}
      />

      {/* Logo SVG — stroke draw animation */}
      <svg
        width="120"
        height="80"
        viewBox="0 0 120 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-6"
      >
        {/* U */}
        <path
          d="M8 12 L8 48 Q8 64 24 64 Q40 64 40 48 L40 12"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="200"
          strokeDashoffset="200"
          style={{
            animation: 'drawStroke 1.0s cubic-bezier(0.16,1,0.3,1) 0.1s forwards',
          }}
        />
        {/* J */}
        <path
          d="M72 12 L72 52 Q72 68 56 68 Q50 68 46 64"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="200"
          strokeDashoffset="200"
          style={{
            animation: 'drawStroke 1.0s cubic-bezier(0.16,1,0.3,1) 0.3s forwards',
          }}
        />
        {/* Decorative dot */}
        <circle
          cx="100"
          cy="18"
          r="6"
          fill="rgba(255,255,255,0.6)"
          style={{
            opacity: 0,
            animation: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.9s forwards',
          }}
        />
        {/* Sparkle lines */}
        <line x1="94" y1="12" x2="106" y2="24" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"
          style={{ opacity: 0, animation: 'fadeIn 0.3s ease 1.1s forwards' }} />
        <line x1="106" y1="12" x2="94" y2="24" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"
          style={{ opacity: 0, animation: 'fadeIn 0.3s ease 1.1s forwards' }} />
      </svg>

      {/* Brand name */}
      <div
        className="text-center"
        style={{
          opacity: 0,
          animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.6s forwards',
        }}
      >
        <p
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.32em',
            color: 'rgba(255,255,255,0.70)',
            textTransform: 'uppercase',
          }}
        >
          Beauty &amp; Wellness
        </p>
      </div>

      {/* Tagline typeout */}
      <div
        className="mt-6 px-8 text-center"
        style={{ minHeight: 48 }}
      >
        {phase !== 'draw' && (
          <p
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: 20,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.90)',
              letterSpacing: '0.02em',
              lineHeight: 1.5,
            }}
          >
            {tagline.slice(0, typedChars)}
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                background: 'rgba(255,255,255,0.8)',
                marginLeft: 2,
                verticalAlign: 'middle',
                animation: 'cursorBlink 0.7s ease infinite',
              }}
            />
          </p>
        )}
      </div>

      {/* Shimmer progress bar */}
      <div
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        style={{ width: 80, height: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}
      >
        <div
          style={{
            height: '100%',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: 4,
            animation: `toastProgress ${1200 + tagline.length * 45 + 600}ms linear forwards`,
            transformOrigin: 'left',
          }}
        />
      </div>

      <style>{`
        @keyframes radialRevealOut {
          from { clip-path: circle(150% at 50% 50%); }
          to   { clip-path: circle(0% at 50% 50%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
