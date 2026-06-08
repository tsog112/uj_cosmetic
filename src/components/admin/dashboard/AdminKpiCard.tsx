'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const toneStyles: Record<Tone, { border?: string; iconBg: string; iconColor: string }> = {
  neutral: { iconBg: 'var(--color-brand-light)', iconColor: 'var(--color-brand)' },
  brand: { iconBg: 'var(--color-brand-light)', iconColor: 'var(--color-brand)' },
  success: { border: 'var(--color-status-done-text)', iconBg: 'var(--color-status-done-bg)', iconColor: 'var(--color-status-done-text)' },
  warning: { border: 'var(--color-status-pending-text)', iconBg: 'var(--color-status-pending-bg)', iconColor: 'var(--color-status-pending-text)' },
  danger: { border: 'var(--color-status-cancel-text)', iconBg: 'var(--color-status-cancel-bg)', iconColor: 'var(--color-status-cancel-text)' },
};

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  tone?: Tone;
  loading?: boolean;
};

export default function AdminKpiCard({ label, value, hint, icon: Icon, href, tone = 'neutral', loading }: Props) {
  const styles = toneStyles[tone];
  const inner = (
    <>
      <span className="admin-stat-icon" style={{ background: styles.iconBg, color: styles.iconColor }}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold leading-tight text-[var(--color-text-muted)]">{label}</p>
        {loading ? (
          <div className="mt-2 h-7 w-24 animate-shimmer rounded-lg" />
        ) : (
          <p className="mt-1 truncate text-[22px] font-extrabold leading-none text-[var(--color-text-primary)] md:text-[24px]">{value}</p>
        )}
        {hint ? <p className="mt-1.5 text-[10px] font-semibold leading-tight text-[var(--color-text-muted)]">{hint}</p> : null}
      </div>
    </>
  );

  const className = 'admin-kpi-card admin-card-tap';
  const style = styles.border ? { borderColor: styles.border, textDecoration: 'none' as const } : { textDecoration: 'none' as const };

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      {inner}
    </div>
  );
}
