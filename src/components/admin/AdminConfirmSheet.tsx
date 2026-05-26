'use client';

import { TriangleAlert } from 'lucide-react';
import AdminSheet from '@/components/admin/AdminSheet';

type AdminConfirmSheetProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function AdminConfirmSheet({
  open,
  title,
  body,
  confirmLabel = 'Батлах',
  cancelLabel = 'Буцах',
  loading = false,
  destructive = false,
  onConfirm,
  onClose,
}: AdminConfirmSheetProps) {
  return (
    <AdminSheet open={open} onClose={onClose}>
      <div className="text-center">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${destructive ? 'bg-[var(--status-error-bg)] text-[var(--status-error)]' : 'bg-[var(--color-brand-secondary)] text-[var(--color-brand-accent)]'}`}>
          <TriangleAlert size={24} />
        </div>
        <h3 className="mt-4 text-[20px] font-extrabold leading-tight text-[var(--color-brand-text)]">{title}</h3>
        <p className="mt-2 text-[14px] leading-6 text-[var(--color-brand-muted)]">{body}</p>
        <div className="mt-6 grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex h-12 w-full items-center justify-center rounded-full text-sm font-extrabold text-white disabled:opacity-60 ${destructive ? 'bg-[var(--status-error)]' : 'bg-[var(--color-brand-accent)]'}`}
          >
            {loading ? 'Түр хүлээнэ үү...' : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-sm font-extrabold text-[var(--color-brand-text)] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </AdminSheet>
  );
}
