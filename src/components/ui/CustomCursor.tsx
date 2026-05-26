'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only on pointer-capable (non-touch) devices
    if (window.matchMedia('(hover: none)').matches) return;

    const dot = dotRef.current;
    if (!dot) return;

    let x = -100, y = -100;
    let rafId: number;

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    const render = () => {
      if (dot) {
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
      }
      rafId = requestAnimationFrame(render);
    };

    const handleEnter = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.matches('a, button, [role="button"], input, select, textarea, label, [tabindex]')
        || target.closest('a, button, [role="button"]')
      ) {
        dot?.classList.add('hovered');
      }
    };

    const handleLeave = () => dot?.classList.remove('hovered');

    window.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseover', handleEnter, { passive: true });
    document.addEventListener('mouseout', handleLeave, { passive: true });
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', handleEnter);
      document.removeEventListener('mouseout', handleLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      className="cursor-dot"
      aria-hidden="true"
    />
  );
}
