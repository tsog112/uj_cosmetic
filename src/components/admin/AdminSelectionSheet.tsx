'use client';

import type { ReactNode } from 'react';
import AdminSheet from '@/components/admin/AdminSheet';

type AdminSelectionSheetProps = {
  open: boolean;
  count: number;
  unitLabel: string;
  eyebrow?: string;
  onClose: () => void;
  onClear: () => void;
  children: ReactNode;
};

/** Bottom sheet for bulk actions — full-width actions, web-friendly. */
export default function AdminSelectionSheet({
  open,
  count,
  unitLabel,
  eyebrow = 'Олон сонголт',
  onClose,
  onClear,
  children,
}: AdminSelectionSheetProps) {
  return (
    <AdminSheet open={open && count > 0} onClose={onClose}>
      <div className="admin-sheet-body">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-accent)]">{eyebrow}</p>
        <h3 className="mt-1 text-[22px] font-extrabold leading-tight text-[var(--color-brand-text)]">
          {count} {unitLabel} сонгогдсон
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-brand-muted)]">Доорх үйлдлээс нэгийг сонгоно уу.</p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>

        <button
          type="button"
          onClick={onClear}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-extrabold text-[var(--color-brand-text)]"
        >
          Сонголт цуцлах
        </button>
      </div>
    </AdminSheet>
  );
}
