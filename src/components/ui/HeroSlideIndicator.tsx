'use client';

type HeroSlideIndicatorProps = {
  current: number;
  total: number;
};

export default function HeroSlideIndicator({ current, total }: HeroSlideIndicatorProps) {
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;
  const label = `${String(current + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <div className="pointer-events-none absolute bottom-6 right-5 z-20 md:bottom-8 md:right-8">
      <div className="pointer-events-auto min-w-[92px]">
        <p className="text-right font-mono text-[11px] font-medium tracking-[0.2em] text-white/90">{label}</p>
        <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
