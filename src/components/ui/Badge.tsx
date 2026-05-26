'use client';

import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'discount' | 'new' | 'stock-warning' | 'free-shipping' | 'custom';
  children: ReactNode;
  pulse?: boolean;
  className?: string;
}

const VARIANT_STYLES = {
  discount: {
    bg: '#D93F55',
    color: '#FFFFFF',
    border: 'rgba(217,63,85,0)',
  },
  new: {
    bg: 'linear-gradient(135deg, #E91E8C, #C2185B)',
    color: '#FFFFFF',
    border: 'rgba(233,30,140,0)',
  },
  'stock-warning': {
    bg: '#FFF3E0',
    color: '#92520C',
    border: 'rgba(146,82,12,0.2)',
  },
  'free-shipping': {
    bg: '#E8F8EC',
    color: '#2D7040',
    border: 'rgba(45,112,64,0.2)',
  },
  custom: {
    bg: 'var(--color-soft-pink)',
    color: 'var(--color-primary)',
    border: 'rgba(233,30,140,0.2)',
  },
};

export default function Badge({ variant = 'custom', children, pulse = false, className = '' }: BadgeProps) {
  const s = VARIANT_STYLES[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-none tracking-[0.06em] ${className}`}
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        letterSpacing: '0.06em',
        animation: pulse ? 'pulseSoft 2s ease-in-out infinite' : undefined,
      }}
    >
      {children}
    </span>
  );
}
