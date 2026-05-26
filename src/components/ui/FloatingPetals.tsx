'use client';

// SVG Sakura petal path
const PETAL_PATH =
  'M10,1 C6,-1 0,5 0,10 C0,14 4,18 10,20 C16,18 20,14 20,10 C20,5 14,-1 10,1 Z';

const PETALS = [
  { delay: '0s',   duration: '7s',  x: '10%',  size: 18, opacity: 0.45, rotate: 0 },
  { delay: '1.2s', duration: '9s',  x: '25%',  size: 14, opacity: 0.35, rotate: 45 },
  { delay: '2.5s', duration: '6s',  x: '45%',  size: 22, opacity: 0.50, rotate: 90 },
  { delay: '0.8s', duration: '11s', x: '60%',  size: 16, opacity: 0.30, rotate: 135 },
  { delay: '3.1s', duration: '8s',  x: '75%',  size: 20, opacity: 0.42, rotate: 30 },
  { delay: '1.8s', duration: '10s', x: '85%',  size: 12, opacity: 0.38, rotate: 70 },
  { delay: '4.0s', duration: '7.5s',x: '35%',  size: 19, opacity: 0.40, rotate: 160 },
];

interface FloatingPetalsProps {
  count?: number;
  className?: string;
}

export default function FloatingPetals({ count = 7, className = '' }: FloatingPetalsProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {PETALS.slice(0, count).map((petal, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '-40px',
            left: petal.x,
            animation: `petalFloat ${petal.duration} ${petal.delay} ease-in-out infinite, petalSway ${parseFloat(petal.duration) * 0.7}s ${petal.delay} ease-in-out infinite alternate`,
            opacity: petal.opacity,
          }}
        >
          <svg
            width={petal.size}
            height={petal.size}
            viewBox="0 0 20 20"
            style={{
              transform: `rotate(${petal.rotate}deg)`,
              filter: 'drop-shadow(0 2px 4px rgba(233,30,140,0.2))',
            }}
          >
            <defs>
              <linearGradient id={`petal-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB6D9" />
                <stop offset="100%" stopColor="#E91E8C" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path d={PETAL_PATH} fill={`url(#petal-grad-${i})`} />
            {/* Inner vein */}
            <path d="M10,2 C10,8 10,14 10,19" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      ))}
    </div>
  );
}
