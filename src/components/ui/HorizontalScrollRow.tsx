'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type HorizontalScrollRowProps = {
  children: ReactNode;
  className?: string;
  autoScroll?: boolean;
  autoScrollMs?: number;
};

export default function HorizontalScrollRow({
  children,
  className = '',
  autoScroll = false,
  autoScrollMs = 4500,
}: HorizontalScrollRowProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const refreshScrollState = () => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < maxScroll - 8);
  };

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.82));
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  useEffect(() => {
    refreshScrollState();
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => refreshScrollState();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', refreshScrollState);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', refreshScrollState);
    };
  }, [children]);

  useEffect(() => {
    if (!autoScroll) return;
    const el = trackRef.current;
    if (!el) return;

    const timer = window.setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      if (el.scrollLeft >= maxScroll - 8) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollByAmount('right');
      }
    }, autoScrollMs);

    return () => window.clearInterval(timer);
  }, [autoScroll, autoScrollMs, children]);

  return (
    <div className={`relative ${className}`}>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount('left')}
          className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#f0e8ed] bg-white/95 text-[var(--color-text-primary)] shadow-md transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] md:left-0 md:h-11 md:w-11"
          aria-label="Өмнөх"
        >
          <ChevronLeft size={18} strokeWidth={1.8} />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount('right')}
          className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#f0e8ed] bg-white/95 text-[var(--color-text-primary)] shadow-md transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] md:right-0 md:h-11 md:w-11"
          aria-label="Дараах"
        >
          <ChevronRight size={18} strokeWidth={1.8} />
        </button>
      )}
      <div
        ref={trackRef}
        className="scroll-row items-stretch gap-3 scroll-smooth pe-6 snap-x snap-mandatory [scroll-padding-inline:1rem] md:gap-4 md:pe-8"
      >
        {children}
      </div>
    </div>
  );
}
