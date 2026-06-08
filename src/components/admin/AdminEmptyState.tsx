'use client';

import type { LucideIcon } from 'lucide-react';

type AdminEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
};

export default function AdminEmptyState({ icon: Icon, title, body, action }: AdminEmptyStateProps) {
  return (
    <div className="admin-card admin-card-pad text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)]">
        <Icon size={24} />
      </div>
      <h3 className="mt-4 text-[18px] font-extrabold leading-tight text-[var(--color-text-primary)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[280px] text-[14px] leading-6 text-[var(--color-text-muted)]">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
