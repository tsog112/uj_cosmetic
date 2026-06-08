'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type RankedItem = {
  id: string;
  title: string;
  subtitle?: string;
  value?: string;
  href?: string;
  badge?: string;
  badgeTone?: 'default' | 'danger' | 'warning';
};

type Props = {
  items: RankedItem[];
  emptyTitle?: string;
  emptyBody?: string;
};

const badgeToneClass = {
  default: 'bg-[var(--color-brand-light)] text-[var(--color-brand)]',
  danger: 'bg-[var(--color-status-cancel-bg)] text-[var(--color-status-cancel-text)]',
  warning: 'bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending-text)]',
};

export default function AdminRankedList({ items, emptyTitle = 'Мэдээлэл алга', emptyBody }: Props) {
  if (!items.length) {
    return (
      <div className="rounded-[18px] bg-[var(--color-bg)] px-4 py-8 text-center">
        <p className="text-sm font-extrabold text-[var(--color-text-primary)]">{emptyTitle}</p>
        {emptyBody ? <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{emptyBody}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const row = (
          <div className="admin-ranked-row">
            <div className="admin-ranked-row__main">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-extrabold text-[var(--color-brand)] shadow-[var(--shadow-xs)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-extrabold text-[var(--color-text-primary)]">{item.title}</p>
                {item.subtitle ? <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">{item.subtitle}</p> : null}
              </div>
            </div>
            <div className="admin-ranked-row__meta">
              {item.badge ? (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${badgeToneClass[item.badgeTone || 'default']}`}>{item.badge}</span>
              ) : null}
              {item.value ? <span className="admin-ranked-row__value">{item.value}</span> : null}
              {item.href ? <ChevronRight size={16} className="shrink-0 text-[var(--color-text-muted)]" aria-hidden /> : null}
            </div>
          </div>
        );

        return item.href ? (
          <Link key={item.id} href={item.href} className="block" style={{ textDecoration: 'none' }}>
            {row}
          </Link>
        ) : (
          <div key={item.id}>{row}</div>
        );
      })}
    </div>
  );
}
