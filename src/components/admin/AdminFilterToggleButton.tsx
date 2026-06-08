'use client';

import { ChevronDown, SlidersHorizontal } from 'lucide-react';

type AdminFilterToggleButtonProps = {
  open: boolean;
  onToggle: () => void;
  activeCount?: number;
  controlsId?: string;
};

/** Бүтээгдэхүүн/хэрэглэгчид/захиалга — «Шүүлтүүр» зөвхөн md+ дэлгэц дээр. */
export default function AdminFilterToggleButton({
  open,
  onToggle,
  activeCount = 0,
  controlsId = 'admin-filter-panel',
}: AdminFilterToggleButtonProps) {
  const isActive = open || activeCount > 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controlsId}
      className={`admin-chip h-[2.875rem] shrink-0 gap-1.5 px-3 md:px-4 ${isActive ? 'admin-chip-active' : 'admin-chip-idle'}`}
    >
      <SlidersHorizontal size={14} strokeWidth={2.5} />
      <span className="hidden md:inline">Шүүлтүүр</span>
      <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      {activeCount > 0 ? (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-[10px] font-bold">
          {activeCount}
        </span>
      ) : null}
    </button>
  );
}
