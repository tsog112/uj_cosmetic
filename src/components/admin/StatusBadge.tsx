'use client';

import { ORDER_STATUSES } from '@/lib/constants/admin';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const s = ORDER_STATUSES.find((x) => x.value === status);
  if (!s) return null;
  return (
    <span
      className={`inline-block rounded-full font-extrabold uppercase whitespace-nowrap ${
        size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'
      }`}
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}
