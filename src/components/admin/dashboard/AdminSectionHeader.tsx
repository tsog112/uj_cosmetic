'use client';

import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function AdminSectionHeader({ eyebrow, title, description, action }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="admin-eyebrow">{eyebrow}</p> : null}
        <h2 className={`font-serif text-[20px] leading-tight text-[var(--color-text-primary)] md:text-[22px] ${eyebrow ? 'mt-1' : ''}`}>{title}</h2>
        {description ? <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[var(--color-text-muted)]">{description}</p> : null}
      </div>
      {action ? <div className="flex w-full min-w-0 shrink-0 flex-wrap gap-2 sm:w-auto">{action}</div> : null}
    </div>
  );
}
