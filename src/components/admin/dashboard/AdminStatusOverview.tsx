'use client';

import Link from 'next/link';
import { ORDER_STATUSES } from '@/lib/constants/admin';

type StatusRow = { status: string; count: number };

type Props = {
  rows: StatusRow[];
  hrefBase?: string;
};

export default function AdminStatusOverview({ rows, hrefBase = '/admin/orders' }: Props) {
  const total = rows.reduce((sum, row) => sum + (row.count || 0), 0) || 1;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {ORDER_STATUSES.map((status) => {
        const row = rows.find((entry) => entry.status === status.value);
        const count = row?.count || 0;
        const pct = Math.round((count / total) * 100);
        return (
          <Link
            key={status.value}
            href={`${hrefBase}?status=${status.value}`}
            className="admin-status-pill"
            style={{ textDecoration: 'none' }}
          >
            <span className="admin-status-pill-dot" style={{ background: status.bg }} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-bold text-[var(--color-text-muted)]">{status.label}</span>
              <span className="mt-0.5 block text-[18px] font-extrabold leading-none text-[var(--color-text-primary)]">{count}</span>
            </span>
            <span className="text-[10px] font-extrabold text-[var(--color-text-muted)]">{pct}%</span>
          </Link>
        );
      })}
    </div>
  );
}
